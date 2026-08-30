import { describe, it, expect } from 'vitest'
import { validateFormulation } from '../src/engine/validationEngine'
import { calculateAminoAcids } from '../src/engine/aminoAcidEngine'
import { evaluateClaims, scanMarketingText } from '../src/engine/claimEngine'
import { calculateRecipeNutrition } from '../src/engine/nutritionEngine'
import { DEFAULT_INGREDIENTS } from '../src/data/ingredientMaster'
import { DEFAULT_RECIPES } from '../src/data/productRecipes'

describe('Validation Engine', () => {
  it('passes standard Chana Sattu formulation with PASS/WARNING status and high score', () => {
    const chanaRecipe = DEFAULT_RECIPES.find((r) => r.id === 'chana-sattu')
    const result = calculateRecipeNutrition(chanaRecipe, DEFAULT_INGREDIENTS)
    const val = validateFormulation(result)

    expect(val.isValid).toBe(true)
    expect(val.score).toBeGreaterThanOrEqual(80)
    expect(val.checks.some((c) => c.id === 'energy-atwater' && c.status === 'PASS')).toBe(true)
    expect(val.checks.some((c) => c.id === 'mass-balance' && c.status === 'PASS')).toBe(true)
    expect(val.checks.some((c) => c.id === 'carb-sugar-hierarchy' && c.status === 'PASS')).toBe(true)
  })

  it('triggers gluten allergen warning for Barley formulations', () => {
    const barleyRecipe = DEFAULT_RECIPES.find((r) => r.id === 'jau-sattu')
    const result = calculateRecipeNutrition(barleyRecipe, DEFAULT_INGREDIENTS)
    const val = validateFormulation(result)

    const glutenCheck = val.checks.find((c) => c.id === 'allergen-gluten')
    expect(glutenCheck).toBeDefined()
    expect(glutenCheck.status).toBe('WARNING')
    expect(glutenCheck.message).toContain('GLUTEN / BARLEY')
  })

  it('triggers supplier COA advisory for Pea Protein formulations', () => {
    const proteinRecipe = DEFAULT_RECIPES.find((r) => r.id === 'pea-isolate-sattu')
    const result = calculateRecipeNutrition(proteinRecipe, DEFAULT_INGREDIENTS)
    const val = validateFormulation(result)

    const coaCheck = val.checks.find((c) => c.id === 'supplier-coa')
    expect(coaCheck).toBeDefined()
    expect(coaCheck.message).toContain('Supplier COA is required')
  })
})

describe('Amino Acid Engine', () => {
  it('calculates BCAAs and EAAs accurately for High Protein Sattu', () => {
    const proteinRecipe = DEFAULT_RECIPES.find((r) => r.id === 'pea-isolate-sattu')
    const calc = calculateRecipeNutrition(proteinRecipe, DEFAULT_INGREDIENTS)
    const aaResult = calculateAminoAcids(proteinRecipe, DEFAULT_INGREDIENTS, calc.nutrients.protein)

    expect(aaResult.hasData).toBe(true)
    expect(aaResult.totals.totalBcaa).toBeGreaterThan(3.0)
    expect(aaResult.totals.totalEaa).toBeGreaterThan(5.0)
    expect(aaResult.totals.bcaaProteinPct).toBeGreaterThan(10.0)
  })
})

describe('Claim Engine & Marketing Scanner', () => {
  it('correctly awards High Protein claim to High Protein Sattu', () => {
    const proteinRecipe = DEFAULT_RECIPES.find((r) => r.id === 'pea-isolate-sattu')
    const calc = calculateRecipeNutrition(proteinRecipe, DEFAULT_INGREDIENTS)
    const claims = evaluateClaims(calc.nutrients, { isSolid: true })

    const highProteinClaim = claims.allResults.find((c) => c.id === 'high-protein')
    expect(highProteinClaim).toBeDefined()
    expect(highProteinClaim.eligible).toBe(true)
  })

  it('strictly disqualifies "No Added Salt" claim when salt is added', () => {
    const moringaRecipe = DEFAULT_RECIPES.find((r) => r.id === 'moringa-sattu')
    const calc = calculateRecipeNutrition(moringaRecipe, DEFAULT_INGREDIENTS)
    const claims = evaluateClaims(calc.nutrients, {
      isSolid: true,
      hasAddedSalt: calc.metadata.hasAddedSalt,
      addedSaltGrams: calc.metadata.addedSaltGrams,
    })

    const noSaltClaim = claims.allResults.find((c) => c.id === 'no-added-salt')
    expect(noSaltClaim).toBeDefined()
    expect(noSaltClaim.eligible).toBe(false)
    expect(noSaltClaim.reason).toContain('Added salt')
  })

  it('scans and catches illegal therapeutic marketing claims', () => {
    const testText = 'Our magic sattu cures diabetes and cures hypertension!'
    const violations = scanMarketingText(testText)

    expect(violations.length).toBeGreaterThanOrEqual(2)
    expect(violations.some((v) => v.label.includes('Cures Diabetes'))).toBe(true)
  })

  it('passes compliant marketing text', () => {
    const cleanText = 'Traditional roasted gram sattu, rich in natural plant protein and dietary fiber for daily vitality.'
    const violations = scanMarketingText(cleanText)

    expect(violations.length).toBe(0)
  })
})
