/**
 * Nutrition Engine
 * 
 * Computes formulation nutrition from ingredient master records:
 * - Weighted average per 100g
 * - Missing ≠ Zero handling with precise coverage tracking
 * - Ingredient contribution breakdowns
 * - Recipe composite metadata (allergens, salt flags, confidence)
 * - Calculated -> Override -> Final nutrition architecture
 * - Primary (25g), Heavy (50g), and Custom serving size scaling
 * - Nutrient-level confidence aggregation
 * - Safe statutory label transfer with coverage and authority guarding
 */

import { isNumeric } from '../utils'
import { SOURCE_TYPES } from '../data/ingredientMaster'

// Core mandatory FSSAI nutrients to track for coverage
export const CORE_NUTRIENTS = [
  'energy',
  'protein',
  'totalCarb',
  'totalSugar',
  'addedSugar',
  'dietaryFiber',
  'totalFat',
  'saturatedFat',
  'transFat',
  'sodium',
]

export const ALL_NUTRIENTS = [
  'energy',
  'protein',
  'totalCarb',
  'availableCarb',
  'totalSugar',
  'addedSugar',
  'dietaryFiber',
  'totalFat',
  'saturatedFat',
  'transFat',
  'cholesterol',
  'sodium',
  'calcium',
  'iron',
  'potassium',
  'magnesium',
  'folate',
  'vitaminC',
  'moisture',
  'ash',
]

export const OVERRIDE_AUTHORITY = {
  LAB_VERIFIED: 'FINAL_PRODUCT',
  MANUAL_OVERRIDE: 'INTERNAL_ONLY',
  SUPPLIER_COA: 'INGREDIENT_ONLY',
}

/**
 * Pure helper function to compute sodium contribution from added salt in mg per 100g finished formulation.
 * 
 * @param {Object} params
 * @param {number} params.grams - Grams of salt in recipe
 * @param {number} params.sodiumFraction - Decimal fraction of sodium (e.g. 0.393 for refined NaCl)
 * @param {number} params.totalRecipeWeight - Total recipe weight in grams
 * @returns {number} Sodium contribution in mg per 100g
 */
export function calculateSaltSodium({ grams, sodiumFraction, totalRecipeWeight }) {
  if (
    !isNumeric(grams) ||
    !isNumeric(sodiumFraction) ||
    !isNumeric(totalRecipeWeight) ||
    Number(totalRecipeWeight) <= 0
  ) {
    return 0
  }
  return (Number(grams) * Number(sodiumFraction) * 1000 / Number(totalRecipeWeight)) * 100
}

/**
 * Applies overrides to calculated nutrition without mutating the original.
 * 
 * @param {Object} calculatedNutrition - Computed values from recipe
 * @param {Object} overrides - Nutrient overrides { [key]: { value, sourceType, sourceName, sourceDate, notes } }
 * @returns {Object} Final merged nutrition object
 */
export function applyOverrides(calculatedNutrition = {}, overrides = {}) {
  const finalNutrition = { ...calculatedNutrition }
  if (!overrides || typeof overrides !== 'object') return finalNutrition

  Object.entries(overrides).forEach(([key, overrideObj]) => {
    if (!overrideObj) return
    const rawVal = typeof overrideObj === 'object' ? overrideObj.value : overrideObj
    if (rawVal !== undefined && rawVal !== null && rawVal !== '' && isNumeric(rawVal)) {
      finalNutrition[key] = Number(Number(rawVal).toFixed(2))
    } else if (rawVal === null) {
      finalNutrition[key] = null
    }
  })

  return finalNutrition
}

/**
 * Calculates recipe nutrition per 100g, primary serving (25g), heavy serving (50g),
 * and custom serving with override support and coverage guarding.
 * 
 * @param {Object} recipe - Recipe definition with items: [{ ingredientId, grams }]
 * @param {Array} ingredientMaster - Master list of ingredient records
 * @param {Object} overrides - Optional nutrient overrides
 * @returns {Object} Calculated nutrition, final nutrition, coverage, contributions, nutrientMetadata, and metadata
 */
export function calculateRecipeNutrition(recipe, ingredientMaster = [], overrides = {}) {
  if (!recipe || !Array.isArray(recipe.items) || recipe.items.length === 0) {
    return {
      totalWeight: 0,
      nutrients: {},
      calculatedNutrition: {},
      finalNutrition: {},
      coverage: {},
      contributions: {},
      nutrientMetadata: {},
      metadata: { hasAddedSalt: false, hasGluten: false, allergens: [] },
      warnings: ['No recipe items provided'],
    }
  }

  // Create lookup map supporting IDs and aliases
  const ingMap = new Map()
  ingredientMaster.forEach((ing) => {
    ingMap.set(ing.id, ing)
    if (Array.isArray(ing.aliases)) {
      ing.aliases.forEach((alias) => {
        if (typeof alias === 'string') {
          ingMap.set(alias.toLowerCase(), ing)
        }
      })
    }
  })

  // Calculate total recipe weight
  const totalWeight = recipe.items.reduce((sum, item) => sum + (Number(item.grams) || 0), 0)

  if (totalWeight <= 0) {
    return {
      totalWeight: 0,
      nutrients: {},
      calculatedNutrition: {},
      finalNutrition: {},
      coverage: {},
      contributions: {},
      nutrientMetadata: {},
      metadata: { hasAddedSalt: false, hasGluten: false, allergens: [] },
      warnings: ['Total recipe weight must be greater than 0g'],
    }
  }

  const warnings = []
  let addedSaltGrams = 0
  let sodiumFromAddedSaltSum = 0
  let hasUnverifiedSaltFraction = false
  let hasGluten = false
  let requiresSupplierCoa = false
  const allergens = new Set()
  const confidenceScores = []

  // Validate items against master
  const resolvedItems = recipe.items.map((item) => {
    let ing = ingMap.get(item.ingredientId)
    if (!ing && typeof item.ingredientId === 'string') {
      ing = ingMap.get(item.ingredientId.toLowerCase())
    }
    const grams = Number(item.grams) || 0
    const pct = (grams / totalWeight) * 100

    if (!ing) {
      warnings.push(`Ingredient "${item.ingredientId}" not found in Ingredient Master database.`)
      return { item, ing: null, grams, pct }
    }

    // Salt and Sodium calculation
    const isSalt = Boolean(ing.metadata?.isSalt || ing.category === 'salt')
    if (isSalt) {
      addedSaltGrams += grams
      const sodiumFraction = ing.metadata?.sodiumFraction
      if (isNumeric(sodiumFraction)) {
        const itemSodium = calculateSaltSodium({
          grams,
          sodiumFraction: Number(sodiumFraction),
          totalRecipeWeight: totalWeight,
        })
        sodiumFromAddedSaltSum += itemSodium
      } else {
        hasUnverifiedSaltFraction = true
        warnings.push(
          `Specialty salt "${ing.name}" is missing verified sodiumFraction. Supplier sodium composition is required.`
        )
      }
    }

    if (ing.metadata?.isGluten || (ing.metadata?.allergenNotes && /gluten/i.test(ing.metadata.allergenNotes))) {
      hasGluten = true
    }
    if (ing.metadata?.allergenNotes && ing.metadata.allergenNotes.trim()) {
      allergens.add(ing.metadata.allergenNotes.trim())
    }
    if (
      ing.metadata?.requiresSupplierCoa ||
      ing.metadata?.sourceType === SOURCE_TYPES.PROXY_ESTIMATE ||
      (ing.metadata?.confidence && /supplier coa|medium-low|low/i.test(ing.metadata.confidence))
    ) {
      requiresSupplierCoa = true
    }

    // Confidence mapping
    const conf = (ing.metadata?.confidence || 'medium').toLowerCase()
    const score = conf.includes('high') ? 3 : conf.includes('low') || conf.includes('supplier coa') ? 1 : 2
    confidenceScores.push({ score, weight: grams })

    return { item, ing, grams, pct }
  })

  // Calculate nutrients per 100g
  const calculatedNutrition = {}
  const coverage = {}
  const contributions = {}
  const nutrientMetadata = {}

  ALL_NUTRIENTS.forEach((nutKey) => {
    let weightedSum = 0
    let coveredWeight = 0
    let totalNutrientContributed = 0
    const itemContributions = []
    const contributingItems = []

    resolvedItems.forEach(({ ing, grams, pct }) => {
      if (!ing || !ing.nutrients) return

      const val = ing.nutrients[nutKey]
      if (isNumeric(val)) {
        const numVal = Number(val)
        coveredWeight += grams
        // Contribution to final per-100g recipe
        const itemCont = (grams * numVal) / totalWeight
        weightedSum += itemCont
        totalNutrientContributed += itemCont

        const ingNutMeta = ing.metadata?.nutrientMetadata?.[nutKey] || ing.metadata || {}

        itemContributions.push({
          ingredientId: ing.id,
          ingredientName: ing.name,
          grams,
          recipePct: pct,
          ingredientValue: numVal,
          contributionAmount: itemCont,
          sourceType: ingNutMeta.sourceType || SOURCE_TYPES.MISSING,
          confidence: ingNutMeta.confidence || 'Low',
        })

        if (numVal > 0) {
          contributingItems.push({
            ingredientId: ing.id,
            ingredientName: ing.name,
            grams,
            contributionAmount: itemCont,
            sourceType: ingNutMeta.sourceType || SOURCE_TYPES.MISSING,
            confidence: ingNutMeta.confidence || 'Low',
            processingMatch: ingNutMeta.processingMatch || 'UNKNOWN',
            locked: Boolean(ingNutMeta.locked),
          })
        }
      } else {
        itemContributions.push({
          ingredientId: ing.id,
          ingredientName: ing.name,
          grams,
          recipePct: pct,
          ingredientValue: null,
          contributionAmount: null,
          sourceType: SOURCE_TYPES.MISSING,
          confidence: 'Low',
        })
      }
    })

    const covPct = totalWeight > 0 ? (coveredWeight / totalWeight) * 100 : 0
    coverage[nutKey] = {
      coveredWeight,
      totalWeight,
      percentage: Number(covPct.toFixed(1)),
      isComplete: covPct >= 99.9,
      isPartial: covPct > 0 && covPct < 99.9,
      isMissing: covPct === 0,
    }

    if (covPct === 0) {
      calculatedNutrition[nutKey] = null
    } else {
      calculatedNutrition[nutKey] = Number(weightedSum.toFixed(2))
    }

    // Sort contributions by amount descending
    contributions[nutKey] = itemContributions.sort(
      (a, b) => (b.contributionAmount || 0) - (a.contributionAmount || 0)
    )

    // Aggregate nutrient confidence
    let nutConfidence = 'High'
    if (covPct < 99.9) {
      nutConfidence = covPct > 0 ? 'Medium-Low' : 'Low'
    } else if (contributingItems.length === 0) {
      nutConfidence = 'Medium'
    } else {
      for (const cItem of contributingItems) {
        const share = totalNutrientContributed > 0
          ? (cItem.contributionAmount / totalNutrientContributed)
          : (cItem.grams / totalWeight)
        const c = (cItem.confidence || 'Low').toLowerCase()
        const isProxy =
          cItem.sourceType === SOURCE_TYPES.PROXY_ESTIMATE ||
          cItem.sourceType === SOURCE_TYPES.AI_RESEARCH_CANDIDATE ||
          cItem.processingMatch === 'PROXY'

        if (share >= 0.20) {
          if (c.includes('low') || isProxy) {
            nutConfidence = 'Medium-Low'
            if (share >= 0.50 && c === 'low') nutConfidence = 'Low'
            break
          } else if (c.includes('medium')) {
            if (nutConfidence === 'High') nutConfidence = 'Medium'
          }
        }
      }
    }

    nutrientMetadata[nutKey] = {
      confidence: nutConfidence,
      coverage: coverage[nutKey].percentage,
      dominantSources: contributingItems.map((i) => ({
        ingredientName: i.ingredientName,
        sourceType: i.sourceType,
        confidence: i.confidence,
        contributionAmount: Number(i.contributionAmount.toFixed(2)),
      })),
      sourceTypes: Array.from(new Set(contributingItems.map((i) => i.sourceType))),
    }
  })

  // Apply Overrides to produce finalNutrition
  const finalNutrition = applyOverrides(calculatedNutrition, overrides)

  // Overall core nutrient coverage
  const coreCovValues = CORE_NUTRIENTS.map((k) => coverage[k]?.percentage || 0)
  const averageCoreCoverage =
    coreCovValues.reduce((sum, v) => sum + v, 0) / (CORE_NUTRIENTS.length || 1)

  // Composite Confidence
  const totalScoreWeight = confidenceScores.reduce((sum, c) => sum + c.weight, 0)
  const weightedConfScore =
    totalScoreWeight > 0
      ? confidenceScores.reduce((sum, c) => sum + c.score * c.weight, 0) / totalScoreWeight
      : 2

  let compositeConfidence = 'Medium'
  if (weightedConfScore >= 2.6) compositeConfidence = 'High'
  else if (weightedConfScore < 1.7) compositeConfidence = 'Low (Requires Supplier COA)'

  // Serving sizes
  const primaryServingGrams = Number(recipe.primaryServingGrams) || 25
  const heavyServingGrams = Number(recipe.heavyServingGrams) || 50
  const servingGrams = Number(recipe.servingGrams) || primaryServingGrams
  const servingSize = recipe.servingSize || `${servingGrams}g`

  // Salt & Sodium breakdown
  const totalSodium = finalNutrition.sodium
  const sodiumFromAddedSalt = addedSaltGrams > 0
    ? Number(sodiumFromAddedSaltSum.toFixed(1))
    : 0
  const naturalSodium = totalSodium != null ? Math.max(0, totalSodium - sodiumFromAddedSalt) : null

  // Ready nutrients for statutory label transfer (coverage >= 99.9% or overridden)
  const readyNutrientsForLabel = {}
  const blockedNutrientsForLabel = []

  ALL_NUTRIENTS.forEach((k) => {
    const hasOverride = overrides && overrides[k] && isNumeric(overrides[k].value)
    if (coverage[k]?.isComplete || hasOverride) {
      readyNutrientsForLabel[k] = finalNutrition[k]
    } else {
      readyNutrientsForLabel[k] = null
      blockedNutrientsForLabel.push(k)
    }
  })

  return {
    recipeId: recipe.id,
    recipeName: recipe.name,
    totalWeight: Number(totalWeight.toFixed(2)),
    isWithinRounding: totalWeight >= 99.95 && totalWeight <= 100.05,
    servingSize,
    servingGrams,
    primaryServingGrams,
    heavyServingGrams,
    nutrients: finalNutrition, // Default per 100g view uses finalNutrition
    calculatedNutrition,
    finalNutrition,
    overrides,
    per100g: finalNutrition,
    perPrimaryServing: scaleNutrition(finalNutrition, primaryServingGrams),
    perHeavyServing: scaleNutrition(finalNutrition, heavyServingGrams),
    perServing: scaleNutrition(finalNutrition, servingGrams),
    coverage,
    contributions,
    nutrientMetadata,
    readyNutrientsForLabel,
    blockedNutrientsForLabel,
    averageCoreCoverage: Number(averageCoreCoverage.toFixed(1)),
    metadata: {
      hasAddedSalt: addedSaltGrams > 0,
      addedSaltGrams: Number(addedSaltGrams.toFixed(2)),
      addedSaltPct: Number(((addedSaltGrams / totalWeight) * 100).toFixed(2)),
      sodiumFromAddedSalt,
      naturalSodium: naturalSodium != null ? Number(naturalSodium.toFixed(1)) : null,
      hasUnverifiedSaltFraction,
      hasGluten,
      requiresSupplierCoa,
      allergens: Array.from(allergens),
      compositeConfidence,
      confidenceScore: Number(weightedConfScore.toFixed(2)),
      itemsCount: recipe.items.length,
    },
    warnings,
  }
}

/**
 * Scales per-100g nutrient values to a specific serving size.
 * 
 * @param {Object} nutrientsPer100g - Object of nutrient key -> value
 * @param {number} servingGrams - Serving size in grams
 * @returns {Object} Scaled nutrient values per serving
 */
export function scaleNutrition(nutrientsPer100g, servingGrams) {
  if (!nutrientsPer100g || !isNumeric(servingGrams) || servingGrams <= 0) {
    return {}
  }
  const ratio = servingGrams / 100
  const scaled = {}
  Object.entries(nutrientsPer100g).forEach(([key, val]) => {
    if (isNumeric(val)) {
      scaled[key] = Number((Number(val) * ratio).toFixed(2))
    } else {
      scaled[key] = null
    }
  })
  return scaled
}

/**
 * Formats data safely for statutory label transfer with authority checks.
 * Enforces that only nutrients with >=99.9% coverage, LAB_VERIFIED final-product overrides,
 * or explicitly approved MANUAL_OVERRIDE flow into the label.
 * Missing/partial nutrients transfer as null.
 * 
 * @param {Object} recipeNutrition - Output from calculateRecipeNutrition
 * @param {Object} [overrides] - Active overrides
 * @param {string} [originType='RECIPE_ESTIMATE'] - Origin tag
 * @returns {Object} Label transfer payload with clearance breakdown
 */
export function prepareSafeLabelTransfer(recipeNutrition, overrides = {}, originType = 'RECIPE_ESTIMATE') {
  if (!recipeNutrition) return null

  const activeOverrides = overrides && Object.keys(overrides).length > 0
    ? overrides
    : recipeNutrition.overrides || {}

  const { finalNutrition, coverage, servingSize, recipeName } = recipeNutrition
  const labelData = {
    product: recipeName || 'Formulated Sattu',
    servingSize: servingSize || '25g',
    dataOrigin: originType,
  }

  let readyCount = 0
  let totalTracked = 0
  const blockedList = []
  const readyList = []
  const overriddenList = []

  CORE_NUTRIENTS.forEach((key) => {
    totalTracked++
    const overrideObj = activeOverrides[key]
    const hasOverrideVal = overrideObj && isNumeric(typeof overrideObj === 'object' ? overrideObj.value : overrideObj)
    const isComplete = coverage && coverage[key]?.isComplete

    if (hasOverrideVal) {
      const srcType = typeof overrideObj === 'object' ? overrideObj.sourceType : 'MANUAL_OVERRIDE'
      const isApproved = typeof overrideObj === 'object' ? Boolean(overrideObj.approvedForLabel) : true

      if (srcType === 'LAB_VERIFIED') {
        labelData[key] = finalNutrition[key]
        readyCount++
        readyList.push({ field: key, source: 'LAB_VERIFIED', reportNumber: overrideObj.reportNumber || '' })
        overriddenList.push({ field: key, source: 'LAB_VERIFIED', value: finalNutrition[key], reportNumber: overrideObj.reportNumber || '' })
      } else if (srcType === 'MANUAL_OVERRIDE' && isApproved) {
        labelData[key] = finalNutrition[key]
        readyCount++
        readyList.push({ field: key, source: 'MANUAL_OVERRIDE' })
        overriddenList.push({ field: key, source: 'MANUAL_OVERRIDE', value: finalNutrition[key], notes: overrideObj.notes || '' })
      } else {
        labelData[key] = null
        blockedList.push({
          field: key,
          reason: srcType === 'MANUAL_OVERRIDE'
            ? 'Manual override requires explicit statutory approval checkbox'
            : 'Supplier COA applies to raw ingredient, not direct finished product label',
        })
      }
    } else if (isComplete) {
      labelData[key] = finalNutrition[key]
      readyCount++
      readyList.push({ field: key, source: 'RECIPE_CALCULATED' })
    } else {
      labelData[key] = null
      blockedList.push({
        field: key,
        reason: `Incomplete recipe coverage (${coverage?.[key]?.percentage ?? 0}%)`,
      })
    }
  })

  // Optional non-core nutrients
  ;['availableCarb', 'cholesterol', 'calcium', 'iron', 'potassium', 'magnesium', 'folate', 'vitaminC'].forEach((key) => {
    const overrideObj = activeOverrides[key]
    const hasOverrideVal = overrideObj && isNumeric(typeof overrideObj === 'object' ? overrideObj.value : overrideObj)
    const isComplete = coverage && coverage[key]?.isComplete

    if (hasOverrideVal || isComplete) {
      labelData[key] = finalNutrition[key]
    } else {
      labelData[key] = null
    }
  })

  return {
    ...labelData,
    labelData,
    completeness: {
      readyCount,
      totalTracked,
      isFullyComplete: readyCount === totalTracked,
      readyList,
      blockedList,
      overriddenList,
      ready: readyList.map((r) => r.field),
      blocked: blockedList.map((b) => b.field),
    },
  }
}
