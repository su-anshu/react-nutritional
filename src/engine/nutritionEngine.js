/**
 * Nutrition Engine
 * 
 * Computes formulation nutrition from ingredient master records:
 * - Weighted average per 100g
 * - Missing ≠ Zero handling with precise coverage tracking
 * - Ingredient contribution breakdowns
 * - Recipe composite metadata (allergens, salt flags, confidence)
 * - Serving size scaling
 */

import { isNumeric } from '../utils'

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

/**
 * Calculates recipe nutrition per 100g and serving size.
 * 
 * @param {Object} recipe - Recipe definition with items: [{ ingredientId, grams }]
 * @param {Array} ingredientMaster - Master list of ingredient records
 * @returns {Object} Calculated nutrition, coverage, contributions, and metadata
 */
export function calculateRecipeNutrition(recipe, ingredientMaster = []) {
  if (!recipe || !Array.isArray(recipe.items) || recipe.items.length === 0) {
    return {
      totalWeight: 0,
      nutrients: {},
      coverage: {},
      contributions: {},
      metadata: { hasAddedSalt: false, hasGluten: false, allergens: [] },
      warnings: ['No recipe items provided'],
    }
  }

  // Create lookup map
  const ingMap = new Map()
  ingredientMaster.forEach((ing) => ingMap.set(ing.id, ing))

  // Calculate total recipe weight
  const totalWeight = recipe.items.reduce((sum, item) => sum + (Number(item.grams) || 0), 0)

  if (totalWeight <= 0) {
    return {
      totalWeight: 0,
      nutrients: {},
      coverage: {},
      contributions: {},
      metadata: { hasAddedSalt: false, hasGluten: false, allergens: [] },
      warnings: ['Total recipe weight must be greater than 0g'],
    }
  }

  const warnings = []
  let addedSaltGrams = 0
  let hasGluten = false
  let requiresSupplierCoa = false
  const allergens = new Set()
  const confidenceScores = []

  // Validate items against master
  const resolvedItems = recipe.items.map((item) => {
    const ing = ingMap.get(item.ingredientId)
    const grams = Number(item.grams) || 0
    const pct = (grams / totalWeight) * 100

    if (!ing) {
      warnings.push(`Ingredient "${item.ingredientId}" not found in Ingredient Master database.`)
      return { item, ing: null, grams, pct }
    }

    if (ing.metadata?.isSalt || ing.category === 'salt') {
      addedSaltGrams += grams
    }
    if (ing.metadata?.isGluten || (ing.metadata?.allergenNotes && /gluten/i.test(ing.metadata.allergenNotes))) {
      hasGluten = true
    }
    if (ing.metadata?.allergenNotes && ing.metadata.allergenNotes.trim()) {
      allergens.add(ing.metadata.allergenNotes.trim())
    }
    if (ing.metadata?.requiresSupplierCoa || (ing.metadata?.confidence && /supplier coa|low/i.test(ing.metadata.confidence))) {
      requiresSupplierCoa = true
    }

    // Confidence mapping
    const conf = (ing.metadata?.confidence || 'medium').toLowerCase()
    const score = conf.includes('high') ? 3 : conf.includes('low') || conf.includes('supplier coa') ? 1 : 2
    confidenceScores.push({ score, weight: grams })

    return { item, ing, grams, pct }
  })

  // Calculate nutrients per 100g
  const nutrients = {}
  const coverage = {}
  const contributions = {}

  ALL_NUTRIENTS.forEach((nutKey) => {
    let weightedSum = 0
    let coveredWeight = 0
    const itemContributions = []

    resolvedItems.forEach(({ ing, grams, pct }) => {
      if (!ing || !ing.nutrients) return

      const val = ing.nutrients[nutKey]
      if (isNumeric(val)) {
        const numVal = Number(val)
        coveredWeight += grams
        // Contribution to final per-100g recipe
        const itemCont = (grams * numVal) / totalWeight
        weightedSum += itemCont

        itemContributions.push({
          ingredientId: ing.id,
          ingredientName: ing.name,
          grams,
          recipePct: pct,
          ingredientValue: numVal,
          contributionAmount: itemCont,
        })
      } else {
        itemContributions.push({
          ingredientId: ing.id,
          ingredientName: ing.name,
          grams,
          recipePct: pct,
          ingredientValue: null,
          contributionAmount: null,
        })
      }
    })

    const covPct = totalWeight > 0 ? (coveredWeight / totalWeight) * 100 : 0
    coverage[nutKey] = {
      coveredWeight,
      totalWeight,
      percentage: Number(covPct.toFixed(1)),
      isComplete: covPct >= 99.99,
      isPartial: covPct > 0 && covPct < 99.99,
      isMissing: covPct === 0,
    }

    if (covPct === 0) {
      nutrients[nutKey] = null
    } else {
      // Round appropriately
      nutrients[nutKey] = Number(weightedSum.toFixed(2))
    }

    // Sort contributions by amount descending
    contributions[nutKey] = itemContributions.sort(
      (a, b) => (b.contributionAmount || 0) - (a.contributionAmount || 0)
    )
  })

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

  // Salt & Sodium breakdown
  // 1g salt (NaCl) provides ~393mg sodium
  const totalSodium = nutrients.sodium
  const sodiumFromAddedSalt = addedSaltGrams > 0
    ? Number(((addedSaltGrams * 39300) / totalWeight).toFixed(1))
    : 0
  const naturalSodium = totalSodium != null ? Math.max(0, totalSodium - sodiumFromAddedSalt) : null

  return {
    recipeId: recipe.id,
    recipeName: recipe.name,
    totalWeight,
    servingSize: recipe.servingSize || '50g',
    servingGrams: Number(recipe.servingGrams) || 50,
    nutrients,
    coverage,
    contributions,
    averageCoreCoverage: Number(averageCoreCoverage.toFixed(1)),
    metadata: {
      hasAddedSalt: addedSaltGrams > 0,
      addedSaltGrams: Number(addedSaltGrams.toFixed(2)),
      addedSaltPct: Number(((addedSaltGrams / totalWeight) * 100).toFixed(2)),
      sodiumFromAddedSalt,
      naturalSodium: naturalSodium != null ? Number(naturalSodium.toFixed(1)) : null,
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
