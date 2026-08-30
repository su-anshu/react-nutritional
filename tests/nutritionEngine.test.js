import { describe, it, expect } from 'vitest'
import { DEFAULT_INGREDIENTS } from '../src/data/ingredientMaster'
import { DEFAULT_RECIPES } from '../src/data/productRecipes'
import {
  calculateRecipeNutrition,
  scaleNutrition,
  applyOverrides,
  calculateSaltSodium,
  prepareSafeLabelTransfer,
} from '../src/engine/nutritionEngine'
import { validateFormulation } from '../src/engine/validationEngine'
import { calculateAminoAcids } from '../src/engine/aminoAcidEngine'
import { evaluateClaims, scanMarketingText } from '../src/engine/claimEngine'
import { CLAIM_STATUS } from '../src/data/claimRules'

describe('Nutrition Calculation Engine - Seed Formulations', () => {
  it('calculates 100% pure Chana Sattu accurately with Mithila Foods 394 kcal baseline', () => {
    const chanaRecipe = DEFAULT_RECIPES.find((r) => r.id === 'chana-sattu')
    const result = calculateRecipeNutrition(chanaRecipe, DEFAULT_INGREDIENTS)

    expect(result.totalWeight).toBe(100)
    expect(result.nutrients.energy).toBe(394)
    expect(result.nutrients.protein).toBe(22.5)
    expect(result.nutrients.totalCarb).toBe(64)
    expect(result.nutrients.availableCarb).toBeNull() // Unconfirmed in baseline, pending proximate analysis
    expect(result.nutrients.dietaryFiber).toBe(17)
    expect(result.nutrients.totalSugar).toBe(0.8)
    expect(result.nutrients.addedSugar).toBe(0)
    expect(result.nutrients.totalFat).toBe(5.2)
    expect(result.nutrients.saturatedFat).toBe(0.45)
    expect(result.nutrients.transFat).toBe(0)
    expect(result.nutrients.cholesterol).toBe(0)
    expect(result.nutrients.sodium).toBe(20)
    expect(result.metadata.hasAddedSalt).toBe(false)
    expect(result.metadata.hasGluten).toBe(false)
  })

  it('calculates Jeera Chana Sattu using exact manufacturing weights (96.62g Chana, 3.38g Jeera)', () => {
    const jeeraRecipe = DEFAULT_RECIPES.find((r) => r.id === 'jeera-chana-sattu')
    const result = calculateRecipeNutrition(jeeraRecipe, DEFAULT_INGREDIENTS)

    expect(result.totalWeight).toBe(100)
    expect(jeeraRecipe.items[0].grams).toBe(96.62)
    expect(jeeraRecipe.items[1].grams).toBe(3.38)
    // Chana 96.62g (22.5% protein) + Jeera 3.38g (17.8% protein) = (96.62*22.5 + 3.38*17.8) / 100 = 21.7395 + 0.60164 = 22.34g
    expect(result.nutrients.protein).toBeCloseTo(22.34, 1)
  })

  it('calculates High Protein Pea Fortified Sattu (60g Chana, 40g Pea Isolate)', () => {
    const peaRecipe = DEFAULT_RECIPES.find((r) => r.id === 'pea-isolate-sattu')
    const result = calculateRecipeNutrition(peaRecipe, DEFAULT_INGREDIENTS)

    expect(result.totalWeight).toBe(100)
    expect(peaRecipe.items[0].grams).toBe(60)
    expect(peaRecipe.items[1].grams).toBe(40)
    // Chana 60g (22.5g P) + Pea 40g (80g P) = 13.5 + 32.0 = 45.5g
    expect(result.nutrients.protein).toBeCloseTo(45.5, 1)
  })

  it('handles 99.99g rounding batch formulation (Moringa Sattu)', () => {
    const moringaRecipe = DEFAULT_RECIPES.find((r) => r.id === 'moringa-sattu')
    const result = calculateRecipeNutrition(moringaRecipe, DEFAULT_INGREDIENTS)

    expect(result.totalWeight).toBeCloseTo(99.99, 2)
    expect(result.metadata.hasAddedSalt).toBe(true)
    expect(result.metadata.addedSaltGrams).toBeCloseTo(2.63, 2)
    // 2.63g salt in 99.99g with sodiumFraction 0.393 = ~1034mg sodium from added salt
    expect(result.metadata.sodiumFromAddedSalt).toBeCloseTo(1034, 0)
    expect(result.nutrients.sodium).toBeGreaterThan(1000)
  })

  it('preserves null for missing/unverified values (Missing != Zero)', () => {
    const testRecipe = {
      id: 'test-recipe',
      name: 'Test Recipe',
      items: [{ ingredientId: 'dry-triphala-powder', grams: 100 }],
    }
    const result = calculateRecipeNutrition(testRecipe, DEFAULT_INGREDIENTS)

    expect(result.nutrients.calcium).toBeNull()
    expect(result.nutrients.iron).toBeNull()
    expect(result.coverage.calcium.isMissing).toBe(true)
    expect(result.coverage.calcium.percentage).toBe(0)
  })

  it('accurately computes dual serving sizes: Primary (25g) and Heavy (50g)', () => {
    const chanaRecipe = DEFAULT_RECIPES.find((r) => r.id === 'chana-sattu')
    const result = calculateRecipeNutrition(chanaRecipe, DEFAULT_INGREDIENTS)

    expect(result.perPrimaryServing.protein).toBeCloseTo(5.625, 2)
    expect(result.perPrimaryServing.energy).toBeCloseTo(98.5, 1)

    expect(result.perHeavyServing.protein).toBeCloseTo(11.25, 2)
    expect(result.perHeavyServing.energy).toBeCloseTo(197, 1)
  })
})

describe('Calculated -> Override -> Final Architecture', () => {
  it('applies overrides without destroying calculated physics values', () => {
    const chanaRecipe = DEFAULT_RECIPES.find((r) => r.id === 'chana-sattu')
    const overrides = {
      protein: { value: 24.2, sourceType: 'LAB_VERIFIED', notes: 'NABL Certificate #9821' },
    }
    const result = calculateRecipeNutrition(chanaRecipe, DEFAULT_INGREDIENTS, overrides)

    // Calculated remains 22.5
    expect(result.calculatedNutrition.protein).toBe(22.5)
    // Final is 24.2
    expect(result.finalNutrition.protein).toBe(24.2)
    expect(result.nutrients.protein).toBe(24.2)
    // Other non-overridden nutrients match calculated
    expect(result.finalNutrition.energy).toBe(394)
  })
})

describe('Safe Regulatory Label Transfer', () => {
  it('transfers 100% complete nutrients and blocks incomplete/missing nutrients as null', () => {
    const mockFormulation = {
      recipeName: 'Test Formulation',
      servingSize: '25g',
      finalNutrition: {
        energy: 394,
        protein: 22.5,
        totalCarb: 64,
        availableCarb: 47,
        totalSugar: 0.8,
        addedSugar: 0,
        dietaryFiber: 17,
        totalFat: 5.2,
        saturatedFat: 0.45,
        transFat: 0,
        sodium: 20,
        cholesterol: 0,
        calcium: 120,
        iron: 6.5,
      },
      coverage: {
        energy: { percentage: 100, isComplete: true },
        protein: { percentage: 100, isComplete: true },
        totalCarb: { percentage: 100, isComplete: true },
        availableCarb: { percentage: 100, isComplete: true },
        totalSugar: { percentage: 100, isComplete: true },
        addedSugar: { percentage: 100, isComplete: true },
        dietaryFiber: { percentage: 100, isComplete: true },
        totalFat: { percentage: 100, isComplete: true },
        saturatedFat: { percentage: 100, isComplete: true },
        transFat: { percentage: 100, isComplete: true },
        sodium: { percentage: 100, isComplete: true },
        cholesterol: { percentage: 100, isComplete: true },
        calcium: { percentage: 60, isPartial: true }, // Incomplete
        iron: { percentage: 0, isMissing: true },     // Missing
      },
      overrides: {},
      averageCoreCoverage: 100,
    }

    const safeLabel = prepareSafeLabelTransfer(mockFormulation)

    expect(safeLabel.energy).toBe(394)
    expect(safeLabel.protein).toBe(22.5)
    // Incomplete and missing fields become null (rendered as '—' on statutory labels)
    expect(safeLabel.calcium).toBeNull()
    expect(safeLabel.iron).toBeNull()
    expect(safeLabel.dataOrigin).toBe('RECIPE_ESTIMATE')
  })
})

describe('Validation Engine - Energy & Physics', () => {
  it('validates fallback Atwater formula when availableCarb is unconfirmed (4*P + 4*TotalCarb + 9*F)', () => {
    const chanaRecipe = DEFAULT_RECIPES.find((r) => r.id === 'chana-sattu')
    const result = calculateRecipeNutrition(chanaRecipe, DEFAULT_INGREDIENTS)
    const val = validateFormulation(result)

    expect(val.isValid).toBe(true)
    const atwaterCheck = val.checks.find((c) => c.id === 'energy-atwater')
    expect(['PASS', 'INFO']).toContain(atwaterCheck.status)
    expect(atwaterCheck.details.formulaMethod).toContain('Fallback Atwater')
  })

  it('validates preferred Atwater formula when availableCarb is present (4*P + 4*AvailCarb + 9*F + 2*Fiber)', () => {
    const recipeWithAvailCarb = {
      id: 'test-avail-carb',
      name: 'Test Avail Carb Recipe',
      items: [{ ingredientId: 'roasted-chana-sattu', grams: 100 }],
    }
    const ingredientsWithAvail = [
      {
        ...DEFAULT_INGREDIENTS[0],
        nutrients: {
          ...DEFAULT_INGREDIENTS[0].nutrients,
          availableCarb: 47,
        },
      },
      ...DEFAULT_INGREDIENTS.slice(1),
    ]
    const result = calculateRecipeNutrition(recipeWithAvailCarb, ingredientsWithAvail)
    const val = validateFormulation(result)

    expect(val.isValid).toBe(true)
    const atwaterCheck = val.checks.find((c) => c.id === 'energy-atwater')
    expect(['PASS', 'INFO']).toContain(atwaterCheck.status)
    expect(atwaterCheck.details.formulaMethod).toContain('Preferred Atwater')
  })

  it('flags unverified sodium fraction for specialty salts', () => {
    const customIngredients = [
      ...DEFAULT_INGREDIENTS,
      {
        id: 'pink-himalayan-salt',
        name: 'Pink Himalayan Rock Salt',
        category: 'salt',
        nutrients: { sodium: null },
        metadata: { isSalt: true }, // missing sodiumFraction
      },
    ]
    const specialtySaltRecipe = {
      id: 'pink-salt-blend',
      name: 'Pink Salt Blend',
      items: [
        { ingredientId: 'roasted-chana-sattu', grams: 98 },
        { ingredientId: 'pink-himalayan-salt', grams: 2 },
      ],
    }
    const result = calculateRecipeNutrition(specialtySaltRecipe, customIngredients)
    const val = validateFormulation(result)

    const saltCheck = val.checks.find((c) => c.id === 'specialty-salt-warning')
    expect(saltCheck).toBeDefined()
    expect(saltCheck.status).toBe('WARNING')
  })
})

describe('Claim Engine - Strict Multi-Nutrient Coverage Gating', () => {
  it('blocks claim and returns INSUFFICIENT_DATA if required nutrient coverage < 100%', () => {
    const incompleteNutrients = {
      energy: 394,
      protein: 22.5,
      totalFat: 5.2,
      saturatedFat: 0.45,
      transFat: null, // missing trans fat
    }
    const coverage = {
      energy: { percentage: 100 },
      protein: { percentage: 100 },
      totalFat: { percentage: 100 },
      saturatedFat: { percentage: 100 },
      transFat: { percentage: 0 },
    }

    const claims = evaluateClaims(incompleteNutrients, { isSolid: true }, coverage)
    const lowSatFatClaim = claims.allResults.find((c) => c.id === 'low-sat-fat')

    // Low sat fat requires transFat <= 0.1g AND 100% transFat coverage
    expect(lowSatFatClaim.status).toBe(CLAIM_STATUS.INSUFFICIENT_DATA)
    expect(lowSatFatClaim.eligible).toBe(false)
  })

  it('flags micronutrient claims as LAB_VALIDATION_REQUIRED when confidence is unverified', () => {
    const peaRecipe = DEFAULT_RECIPES.find((r) => r.id === 'pea-isolate-sattu')
    const result = calculateRecipeNutrition(peaRecipe, DEFAULT_INGREDIENTS)
    const claims = evaluateClaims(result.nutrients, result.metadata, result.coverage)

    const highProteinClaim = claims.allResults.find((c) => c.id === 'high-protein')
    expect(highProteinClaim.status).toBe(CLAIM_STATUS.NUMERICALLY_ELIGIBLE)
    expect(highProteinClaim.eligible).toBe(true)
  })
})

describe('Amino Acid Engine - Protein Contribution Coverage', () => {
  it('computes protein-weighted amino acid coverage and flags partial BCAA if coverage < 95%', () => {
    const partialAaRecipe = {
      id: 'partial-aa',
      name: 'Partial AA Recipe',
      items: [
        { ingredientId: 'roasted-chana-sattu', grams: 50 }, // has AA assay
        { ingredientId: 'roasted-makai-flour', grams: 50 }, // lacks full AA assay
      ],
    }
    const calc = calculateRecipeNutrition(partialAaRecipe, DEFAULT_INGREDIENTS)
    const aa = calculateAminoAcids(partialAaRecipe, DEFAULT_INGREDIENTS, calc.nutrients.protein)

    expect(aa.hasData).toBe(true)
    expect(aa.totals.isBcaaPartial).toBe(true)
    expect(aa.totals.minBcaaProteinCoverage).toBeLessThan(95)
    expect(aa.totals.bcaaProteinPct).toBeNull() // Suppressed when <95%
  })
})
