import { describe, it, expect } from 'vitest'
import { DEFAULT_INGREDIENTS } from '../src/data/ingredientMaster'
import { DEFAULT_RECIPES } from '../src/data/productRecipes'
import { calculateRecipeNutrition, scaleNutrition } from '../src/engine/nutritionEngine'
import { validateFormulation } from '../src/engine/validationEngine'
import { calculateAminoAcids } from '../src/engine/aminoAcidEngine'
import { evaluateClaims, scanMarketingText } from '../src/engine/claimEngine'

describe('Nutrition Calculation Engine', () => {
  it('calculates 100% pure Chana Sattu accurately from ingredient master', () => {
    const chanaRecipe = DEFAULT_RECIPES.find((r) => r.id === 'chana-sattu')
    const result = calculateRecipeNutrition(chanaRecipe, DEFAULT_INGREDIENTS)

    expect(result.totalWeight).toBe(100)
    expect(result.nutrients.energy).toBe(388)
    expect(result.nutrients.protein).toBe(22.5)
    expect(result.nutrients.dietaryFiber).toBe(12.5)
    expect(result.nutrients.sodium).toBe(35)
    expect(result.metadata.hasAddedSalt).toBe(false)
    expect(result.metadata.hasGluten).toBe(false)
  })

  it('accurately computes multi-ingredient weighted formulation (Jeera Chana Sattu)', () => {
    const jeeraRecipe = DEFAULT_RECIPES.find((r) => r.id === 'jeera-chana-sattu')
    const result = calculateRecipeNutrition(jeeraRecipe, DEFAULT_INGREDIENTS)

    // Chana 97g (22.5% protein) + Jeera 3g (17.8% protein) = (97*22.5 + 3*17.8) / 100 = 21.825 + 0.534 = 22.359 -> 22.36g
    expect(result.nutrients.protein).toBeCloseTo(22.36, 1)
    expect(result.totalWeight).toBe(100)
  })

  it('preserves null for missing values (Missing != Zero)', () => {
    const testRecipe = {
      id: 'test-recipe',
      name: 'Test Recipe',
      items: [{ ingredientId: 'dry-triphala-powder', grams: 100 }],
    }
    const result = calculateRecipeNutrition(testRecipe, DEFAULT_INGREDIENTS)

    // Triphala has null for calcium and iron
    expect(result.nutrients.calcium).toBeNull()
    expect(result.nutrients.iron).toBeNull()
    expect(result.coverage.calcium.isMissing).toBe(true)
    expect(result.coverage.calcium.percentage).toBe(0)
  })

  it('tracks partial coverage when only some ingredients have nutrient data', () => {
    const partialRecipe = {
      id: 'partial-recipe',
      name: 'Partial Recipe',
      items: [
        { ingredientId: 'roasted-chana-sattu', grams: 50 }, // has folate (180)
        { ingredientId: 'roasted-jeera-powder', grams: 50 }, // folate is null
      ],
    }
    const result = calculateRecipeNutrition(partialRecipe, DEFAULT_INGREDIENTS)

    expect(result.coverage.folate.percentage).toBe(50)
    expect(result.coverage.folate.isPartial).toBe(true)
    // Folate from chana = (50 * 180) / 100 = 90
    expect(result.nutrients.folate).toBe(90)
  })

  it('accurately accounts for added salt and computes sodium balance', () => {
    const moringaRecipe = DEFAULT_RECIPES.find((r) => r.id === 'moringa-sattu')
    const result = calculateRecipeNutrition(moringaRecipe, DEFAULT_INGREDIENTS)

    expect(result.metadata.hasAddedSalt).toBe(true)
    expect(result.metadata.addedSaltGrams).toBe(1)
    // 1g salt provides ~393mg sodium
    expect(result.metadata.sodiumFromAddedSalt).toBeCloseTo(393, 0)
    expect(result.nutrients.sodium).toBeGreaterThanOrEqual(393)
  })

  it('scales nutrients per serving correctly', () => {
    const chanaRecipe = DEFAULT_RECIPES.find((r) => r.id === 'chana-sattu')
    const result = calculateRecipeNutrition(chanaRecipe, DEFAULT_INGREDIENTS)
    const per50g = scaleNutrition(result.nutrients, 50)

    expect(per50g.protein).toBe(11.25)
    expect(per50g.energy).toBe(194)
  })
})

describe('Validation Engine', () => {
  it('passes physical and Atwater checks for valid Sattu formulation', () => {
    const chanaRecipe = DEFAULT_RECIPES.find((r) => r.id === 'chana-sattu')
    const result = calculateRecipeNutrition(chanaRecipe, DEFAULT_INGREDIENTS)
    const validation = validateFormulation(result)

    expect(validation.isValid).toBe(true)
    expect(validation.failCount).toBe(0)
    const atwaterCheck = validation.checks.find((c) => c.id === 'energy-atwater')
    expect(atwaterCheck.status).toBe('PASS')
  })

  it('flags gluten statutory warning for Barley Sattu', () => {
    const jauRecipe = DEFAULT_RECIPES.find((r) => r.id === 'jau-sattu')
    const result = calculateRecipeNutrition(jauRecipe, DEFAULT_INGREDIENTS)
    const validation = validateFormulation(result)

    const allergenCheck = validation.checks.find((c) => c.id === 'allergen-gluten')
    expect(allergenCheck).toBeDefined()
    expect(allergenCheck.status).toBe('WARNING')
  })
})

describe('Amino Acid Engine', () => {
  it('computes BCAA and Essential Amino Acids for Pea Fortified Sattu', () => {
    const peaRecipe = DEFAULT_RECIPES.find((r) => r.id === 'pea-isolate-sattu')
    const result = calculateRecipeNutrition(peaRecipe, DEFAULT_INGREDIENTS)
    const amino = calculateAminoAcids(peaRecipe, DEFAULT_INGREDIENTS, result.nutrients.protein)

    expect(amino.hasData).toBe(true)
    expect(amino.totals.totalBcaa).toBeGreaterThan(0)
    expect(amino.totals.totalEaa).toBeGreaterThan(0)
    expect(amino.totals.bcaaProteinPct).toBeGreaterThan(10)
  })
})

describe('Claim Checker Engine', () => {
  it('rejects "No Added Salt" claim when recipe contains added iodised salt', () => {
    const moringaRecipe = DEFAULT_RECIPES.find((r) => r.id === 'moringa-sattu')
    const result = calculateRecipeNutrition(moringaRecipe, DEFAULT_INGREDIENTS)
    const claims = evaluateClaims(result.nutrients, result.metadata)

    const noSaltClaim = claims.allResults.find((c) => c.id === 'no-added-salt')
    expect(noSaltClaim.eligible).toBe(false)
    expect(noSaltClaim.reason).toContain('NOT ELIGIBLE')
  })

  it('qualifies "High Protein" claim for High Protein Pea Isolate Sattu', () => {
    const peaRecipe = DEFAULT_RECIPES.find((r) => r.id === 'pea-isolate-sattu')
    const result = calculateRecipeNutrition(peaRecipe, DEFAULT_INGREDIENTS)
    const claims = evaluateClaims(result.nutrients, result.metadata)

    const highProteinClaim = claims.allResults.find((c) => c.id === 'high-protein')
    expect(highProteinClaim.eligible).toBe(true)
  })

  it('scans marketing text and detects prohibited disease cure claims', () => {
    const badMarketingText = 'Our magic sattu cures diabetes and prevents cancer!'
    const violations = scanMarketingText(badMarketingText)

    expect(violations.length).toBe(2)
    expect(violations.some((v) => v.label === 'Cures Diabetes')).toBe(true)
    expect(violations.some((v) => v.label === 'Prevents Cancer')).toBe(true)
  })
})
