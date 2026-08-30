/**
 * Validation Engine
 * 
 * Performs automated food science & statutory compliance checks:
 * 1. Energy sanity check (Atwater calculation vs stated energy)
 * 2. Mass-balance proximate sum check (physical feasibility)
 * 3. Carbohydrate & sugar hierarchy consistency
 * 4. Fat & fatty acid hierarchy consistency
 * 5. Salt vs Sodium balance check
 * 6. Missing critical nutrients audit
 * 7. Source quality & Supplier COA warnings
 * 8. Statutory allergen check
 */

import { isNumeric } from '../utils'

export function validateFormulation(formulationResult) {
  if (!formulationResult || !formulationResult.nutrients) {
    return {
      isValid: false,
      overallStatus: 'ERROR',
      checks: [],
      score: 0,
      summary: 'No formulation data to validate',
    }
  }

  const { nutrients, coverage, metadata, totalWeight } = formulationResult
  const checks = []

  // ── 1. Energy Sanity Check (Atwater) ──
  const protein = nutrients.protein
  const fat = nutrients.totalFat
  const carb = nutrients.totalCarb
  const fiber = nutrients.dietaryFiber || 0
  const energy = nutrients.energy

  if (isNumeric(protein) && isNumeric(fat) && isNumeric(carb) && isNumeric(energy)) {
    // Standard Atwater: 4 kcal/g protein, 9 kcal/g fat, 4 kcal/g carb (or 4 for avail carb + 2 for fiber)
    const atwaterStandard = protein * 4 + fat * 9 + carb * 4
    const diff = Math.abs(energy - atwaterStandard)
    const pctDiff = energy > 0 ? (diff / energy) * 100 : 0

    if (pctDiff <= 7.0) {
      checks.push({
        id: 'energy-atwater',
        name: 'Energy Sanity Check (Atwater)',
        category: 'Physics & Feasibility',
        status: 'PASS',
        message: `Stated energy (${energy.toFixed(1)} kcal) matches Atwater calculation (${atwaterStandard.toFixed(1)} kcal) within ${pctDiff.toFixed(1)}% variance.`,
        details: { stated: energy, calculated: Number(atwaterStandard.toFixed(1)), variancePct: Number(pctDiff.toFixed(1)) },
      })
    } else if (pctDiff <= 15.0) {
      checks.push({
        id: 'energy-atwater',
        name: 'Energy Sanity Check (Atwater)',
        category: 'Physics & Feasibility',
        status: 'WARNING',
        message: `Energy variance is ${pctDiff.toFixed(1)}% (Stated: ${energy.toFixed(1)} kcal vs Calculated: ${atwaterStandard.toFixed(1)} kcal). Expected for high-fiber foods.`,
        details: { stated: energy, calculated: Number(atwaterStandard.toFixed(1)), variancePct: Number(pctDiff.toFixed(1)) },
      })
    } else {
      checks.push({
        id: 'energy-atwater',
        name: 'Energy Sanity Check (Atwater)',
        category: 'Physics & Feasibility',
        status: 'FAIL',
        message: `Energy mismatch > 15%! Stated: ${energy.toFixed(1)} kcal vs Atwater: ${atwaterStandard.toFixed(1)} kcal (${pctDiff.toFixed(1)}% diff). Check macro nutrient inputs.`,
        details: { stated: energy, calculated: Number(atwaterStandard.toFixed(1)), variancePct: Number(pctDiff.toFixed(1)) },
      })
    }
  } else {
    checks.push({
      id: 'energy-atwater',
      name: 'Energy Sanity Check (Atwater)',
      category: 'Physics & Feasibility',
      status: 'INFO',
      message: 'Incomplete macronutrient data; unable to perform Atwater sanity check.',
      details: {},
    })
  }

  // ── 2. Mass-Balance Check ──
  const moisture = nutrients.moisture || 0
  const ash = nutrients.ash || 0
  const proximateSum = (protein || 0) + (fat || 0) + (carb || 0) + moisture + ash

  if (proximateSum > 105) {
    checks.push({
      id: 'mass-balance',
      name: 'Physical Mass-Balance Check',
      category: 'Physics & Feasibility',
      status: 'FAIL',
      message: `Physical violation: sum of nutrients exceeds 100g per 100g (${proximateSum.toFixed(1)}g). Check overlapping carbohydrate or moisture values.`,
      details: { proximateSum: Number(proximateSum.toFixed(1)) },
    })
  } else if (proximateSum > 100.5) {
    checks.push({
      id: 'mass-balance',
      name: 'Physical Mass-Balance Check',
      category: 'Physics & Feasibility',
      status: 'WARNING',
      message: `Proximate sum is slightly over 100g (${proximateSum.toFixed(1)}g), within analytical rounding tolerance.`,
      details: { proximateSum: Number(proximateSum.toFixed(1)) },
    })
  } else if (proximateSum >= 85) {
    checks.push({
      id: 'mass-balance',
      name: 'Physical Mass-Balance Check',
      category: 'Physics & Feasibility',
      status: 'PASS',
      message: `Proximate sum is physically sound (${proximateSum.toFixed(1)}g per 100g dry/semi-dry solids).`,
      details: { proximateSum: Number(proximateSum.toFixed(1)) },
    })
  } else {
    checks.push({
      id: 'mass-balance',
      name: 'Physical Mass-Balance Check',
      category: 'Physics & Feasibility',
      status: 'INFO',
      message: `Proximate sum is ${proximateSum.toFixed(1)}g/100g. Moisture/ash data unlisted for one or more ingredients.`,
      details: { proximateSum: Number(proximateSum.toFixed(1)) },
    })
  }

  // ── 3. Carbohydrate Hierarchy Check ──
  const totalSugar = nutrients.totalSugar
  const addedSugar = nutrients.addedSugar

  if (isNumeric(carb) && isNumeric(totalSugar)) {
    if (totalSugar > carb + 0.1) {
      checks.push({
        id: 'carb-sugar-hierarchy',
        name: 'Sugar vs Total Carbohydrate Hierarchy',
        category: 'Nutrient Hierarchy',
        status: 'FAIL',
        message: `Impossible: Total sugars (${totalSugar.toFixed(1)}g) exceeds Total Carbohydrate (${carb.toFixed(1)}g).`,
      })
    } else {
      checks.push({
        id: 'carb-sugar-hierarchy',
        name: 'Sugar vs Total Carbohydrate Hierarchy',
        category: 'Nutrient Hierarchy',
        status: 'PASS',
        message: `Total sugars (${totalSugar.toFixed(1)}g) correctly bounded within Total Carbohydrates (${carb.toFixed(1)}g).`,
      })
    }
  }

  if (isNumeric(totalSugar) && isNumeric(addedSugar)) {
    if (addedSugar > totalSugar + 0.05) {
      checks.push({
        id: 'sugar-hierarchy',
        name: 'Added Sugar vs Total Sugar Hierarchy',
        category: 'Nutrient Hierarchy',
        status: 'FAIL',
        message: `Impossible: Added sugars (${addedSugar.toFixed(1)}g) exceeds Total Sugars (${totalSugar.toFixed(1)}g).`,
      })
    } else {
      checks.push({
        id: 'sugar-hierarchy',
        name: 'Added Sugar vs Total Sugar Hierarchy',
        category: 'Nutrient Hierarchy',
        status: 'PASS',
        message: `Added sugars (${addedSugar.toFixed(1)}g) correctly bounded within Total Sugars (${totalSugar.toFixed(1)}g).`,
      })
    }
  }

  // ── 4. Fat & Fatty Acid Hierarchy Check ──
  const satFat = nutrients.saturatedFat
  const transFat = nutrients.transFat

  if (isNumeric(fat) && isNumeric(satFat)) {
    if (satFat > fat + 0.05) {
      checks.push({
        id: 'fat-hierarchy',
        name: 'Saturated Fat vs Total Fat Hierarchy',
        category: 'Nutrient Hierarchy',
        status: 'FAIL',
        message: `Impossible: Saturated fat (${satFat.toFixed(1)}g) exceeds Total Fat (${fat.toFixed(1)}g).`,
      })
    } else {
      checks.push({
        id: 'fat-hierarchy',
        name: 'Saturated Fat vs Total Fat Hierarchy',
        category: 'Nutrient Hierarchy',
        status: 'PASS',
        message: `Saturated fat (${satFat.toFixed(1)}g) correctly bounded within Total Fat (${fat.toFixed(1)}g).`,
      })
    }
  }

  // ── 5. Salt vs Sodium Verification ──
  const sodium = nutrients.sodium
  const addedSaltGrams = metadata?.addedSaltGrams || 0

  if (addedSaltGrams > 0) {
    const minSodiumFromSalt = (addedSaltGrams / (totalWeight || 100)) * 39300
    if (sodium == null || sodium < minSodiumFromSalt * 0.85) {
      checks.push({
        id: 'salt-sodium-consistency',
        name: 'Salt & Sodium Balance Audit',
        category: 'Formulation Integrity',
        status: 'FAIL',
        message: `Recipe contains ${addedSaltGrams}g added salt (expected min ~${minSodiumFromSalt.toFixed(0)}mg sodium), but finished sodium is only ${sodium != null ? sodium.toFixed(0) : 'null'}mg!`,
      })
    } else {
      checks.push({
        id: 'salt-sodium-consistency',
        name: 'Salt & Sodium Balance Audit',
        category: 'Formulation Integrity',
        status: 'PASS',
        message: `Added salt (${addedSaltGrams}g) properly accounts for ${minSodiumFromSalt.toFixed(0)}mg sodium in recipe.`,
      })
    }
  }

  // ── 6. Data Coverage & Missing Nutrients Audit ──
  const missingCore = []
  const partialCore = []
  if (coverage) {
    Object.entries(coverage).forEach(([k, cov]) => {
      if (cov.isMissing) missingCore.push(k)
      else if (cov.isPartial) partialCore.push({ key: k, pct: cov.percentage })
    })
  }

  if (missingCore.length > 0) {
    checks.push({
      id: 'missing-data',
      name: 'Missing Nutrients Audit',
      category: 'Data Provenance',
      status: 'WARNING',
      message: `${missingCore.length} nutrients have zero data across all ingredients (${missingCore.join(', ')}). Displayed as '—'.`,
      details: { missing: missingCore },
    })
  }

  if (partialCore.length > 0) {
    checks.push({
      id: 'partial-coverage',
      name: 'Partial Nutrient Coverage Warning',
      category: 'Data Provenance',
      status: 'WARNING',
      message: `${partialCore.length} nutrients have partial recipe coverage (<100%): ${partialCore.map((p) => `${p.key} (${p.pct}%)`).join(', ')}.`,
      details: { partial: partialCore },
    })
  }

  // ── 7. Supplier COA & Botanical Advisory ──
  if (metadata?.requiresSupplierCoa || (metadata?.compositeConfidence && metadata.compositeConfidence.includes('Low'))) {
    checks.push({
      id: 'supplier-coa',
      name: 'Supplier COA Verification Advisory',
      category: 'Compliance & Quality',
      status: 'WARNING',
      message: 'One or more ingredients (e.g., Pea Protein Isolate, Triphala) have variable supplier specifications. Batch testing or Supplier COA is required before statutory packaging declaration.',
    })
  }

  // ── 8. Statutory Allergen Declaration ──
  if (metadata?.hasGluten) {
    checks.push({
      id: 'allergen-gluten',
      name: 'Statutory Allergen Declaration: Gluten / Barley',
      category: 'Regulatory Labelling',
      status: 'WARNING',
      message: 'Mandatory FSSAI allergen statement required on packaging: "CONTAINS GLUTEN / BARLEY".',
    })
  }

  // Calculate Overall Status and Score
  const fails = checks.filter((c) => c.status === 'FAIL').length
  const warnings = checks.filter((c) => c.status === 'WARNING').length
  const passes = checks.filter((c) => c.status === 'PASS').length

  let overallStatus = 'PASS'
  if (fails > 0) overallStatus = 'FAIL'
  else if (warnings > 0) overallStatus = 'WARNING'

  const score = Math.max(0, 100 - fails * 30 - warnings * 10)

  return {
    isValid: fails === 0,
    overallStatus,
    score,
    passCount: passes,
    warningCount: warnings,
    failCount: fails,
    checks,
  }
}
