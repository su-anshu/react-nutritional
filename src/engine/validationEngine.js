/**
 * Validation Engine
 * 
 * Performs automated food science & statutory compliance checks:
 * 1. Energy sanity check (Preferred: 4*P + 4*AvailCarb + 9*F + 2*Fiber, Fallback: 4*P + 4*TotalCarb + 9*F)
 * 2. Mass-balance proximate sum check (correct non-overlapping carbohydrate basis)
 * 3. Carbohydrate & sugar hierarchy consistency
 * 4. Fat & fatty acid hierarchy consistency
 * 5. Salt vs Sodium balance & specialty salt fraction audit
 * 6. Missing critical nutrients & coverage audit
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
  const availCarb = nutrients.availableCarb
  const fiber = nutrients.dietaryFiber
  const energy = nutrients.energy

  if (isNumeric(protein) && isNumeric(fat) && isNumeric(energy)) {
    let atwaterCalculated = null
    let formulaMethod = ''
    let isFallback = false

    if (isNumeric(availCarb) && isNumeric(fiber)) {
      // Preferred formula: 4*P + 4*AvailCarb + 9*F + 2*Fiber
      atwaterCalculated = (protein * 4) + (availCarb * 4) + (fat * 9) + (fiber * 2)
      formulaMethod = 'Preferred Atwater formula (4×Protein + 4×Available Carbohydrate + 9×Fat + 2×Dietary Fibre)'
    } else if (isNumeric(carb)) {
      // Fallback formula: 4*P + 4*TotalCarb + 9*F
      atwaterCalculated = (protein * 4) + (carb * 4) + (fat * 9)
      formulaMethod = 'Fallback Atwater check — total carbohydrate basis (4×Protein + 4×Total Carbohydrate + 9×Fat)'
      isFallback = true
    }

    if (atwaterCalculated !== null) {
      const diff = Math.abs(energy - atwaterCalculated)
      const pctDiff = energy > 0 ? (diff / energy) * 100 : 0

      if (pctDiff <= 5.0) {
        checks.push({
          id: 'energy-atwater',
          name: 'Energy Sanity Check (Internal QA)',
          category: 'Physics & Feasibility',
          status: 'PASS',
          message: `Stated energy (${energy.toFixed(1)} kcal) matches Atwater calculation (${atwaterCalculated.toFixed(1)} kcal) within ${pctDiff.toFixed(1)}% variance. ${isFallback ? '(Fallback method)' : ''}`,
          details: { stated: energy, calculated: Number(atwaterCalculated.toFixed(1)), variancePct: Number(pctDiff.toFixed(1)), formulaMethod },
        })
      } else if (pctDiff <= 10.0) {
        checks.push({
          id: 'energy-atwater',
          name: 'Energy Sanity Check (Internal QA)',
          category: 'Physics & Feasibility',
          status: 'INFO',
          message: `Energy variance is ${pctDiff.toFixed(1)}% (Stated: ${energy.toFixed(1)} kcal vs Calculated: ${atwaterCalculated.toFixed(1)} kcal). Acceptable for high-fibre whole legume foods.`,
          details: { stated: energy, calculated: Number(atwaterCalculated.toFixed(1)), variancePct: Number(pctDiff.toFixed(1)), formulaMethod },
        })
      } else {
        checks.push({
          id: 'energy-atwater',
          name: 'Energy Sanity Check (Internal QA)',
          category: 'Physics & Feasibility',
          status: 'WARNING',
          message: `Internal QA Warning: Energy mismatch > 10%! Stated: ${energy.toFixed(1)} kcal vs Atwater: ${atwaterCalculated.toFixed(1)} kcal (${pctDiff.toFixed(1)}% diff). Check macro nutrient inputs.`,
          details: { stated: energy, calculated: Number(atwaterCalculated.toFixed(1)), variancePct: Number(pctDiff.toFixed(1)), formulaMethod },
        })
      }
    } else {
      checks.push({
        id: 'energy-atwater',
        name: 'Energy Sanity Check (Internal QA)',
        category: 'Physics & Feasibility',
        status: 'INFO',
        message: 'Incomplete carbohydrate/macronutrient data; unable to perform Atwater sanity check.',
        details: {},
      })
    }
  } else {
    checks.push({
      id: 'energy-atwater',
      name: 'Energy Sanity Check (Internal QA)',
      category: 'Physics & Feasibility',
      status: 'INFO',
      message: 'Incomplete macronutrient data; unable to perform Atwater sanity check.',
      details: {},
    })
  }

  // ── 2. Mass-Balance Check ──
  const moisture = isNumeric(nutrients.moisture) ? Number(nutrients.moisture) : null
  const ash = isNumeric(nutrients.ash) ? Number(nutrients.ash) : null
  const hasMoistureOrAshMissing = moisture === null || ash === null

  let proximateSum = 0
  let massBalanceMethod = ''

  if (isNumeric(protein) && isNumeric(fat)) {
    if (isNumeric(availCarb) && isNumeric(fiber)) {
      // Available carb + fiber basis
      proximateSum = protein + fat + availCarb + fiber + (moisture || 0) + (ash || 0)
      massBalanceMethod = 'Available Carbohydrate + Fibre basis'
    } else if (isNumeric(carb)) {
      // Total carb basis (do NOT add fiber again)
      proximateSum = protein + fat + carb + (moisture || 0) + (ash || 0)
      massBalanceMethod = 'Total Carbohydrate basis'
    }

    if (proximateSum > 102.0) {
      checks.push({
        id: 'mass-balance',
        name: 'Physical Mass-Balance Check',
        category: 'Physics & Feasibility',
        status: 'FAIL',
        message: `Physical violation: sum of nutrients exceeds 100g per 100g (${proximateSum.toFixed(1)}g). Check overlapping carbohydrate or moisture values.`,
        details: { proximateSum: Number(proximateSum.toFixed(1)), massBalanceMethod },
      })
    } else if (proximateSum > 100.2) {
      checks.push({
        id: 'mass-balance',
        name: 'Physical Mass-Balance Check',
        category: 'Physics & Feasibility',
        status: 'WARNING',
        message: `Proximate sum is slightly over 100g (${proximateSum.toFixed(1)}g), within analytical rounding tolerance.`,
        details: { proximateSum: Number(proximateSum.toFixed(1)), massBalanceMethod },
      })
    } else if (hasMoistureOrAshMissing) {
      checks.push({
        id: 'mass-balance',
        name: 'Physical Mass-Balance Check',
        category: 'Physics & Feasibility',
        status: 'INFO',
        message: `Proximate sum is ${proximateSum.toFixed(1)}g/100g. Moisture or ash data is missing/partial; proximate sum is an incomplete estimate.`,
        details: { proximateSum: Number(proximateSum.toFixed(1)), massBalanceMethod, isPartial: true },
      })
    } else if (proximateSum >= 85.0) {
      checks.push({
        id: 'mass-balance',
        name: 'Physical Mass-Balance Check',
        category: 'Physics & Feasibility',
        status: 'PASS',
        message: `Proximate sum is physically sound (${proximateSum.toFixed(1)}g per 100g dry/semi-dry solids).`,
        details: { proximateSum: Number(proximateSum.toFixed(1)), massBalanceMethod },
      })
    } else {
      checks.push({
        id: 'mass-balance',
        name: 'Physical Mass-Balance Check',
        category: 'Physics & Feasibility',
        status: 'INFO',
        message: `Proximate sum is ${proximateSum.toFixed(1)}g/100g. Partial proximate data available.`,
        details: { proximateSum: Number(proximateSum.toFixed(1)), massBalanceMethod },
      })
    }
  }

  // ── 3. Carbohydrate Hierarchy Check ──
  const totalSugar = nutrients.totalSugar
  const addedSugar = nutrients.addedSugar

  if (isNumeric(carb) && isNumeric(totalSugar)) {
    if (totalSugar > carb + 0.05) {
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

  if (isNumeric(fat) && isNumeric(satFat) && isNumeric(transFat)) {
    if (satFat + transFat > fat + 0.05) {
      checks.push({
        id: 'sat-trans-fat-hierarchy',
        name: 'Saturated + Trans Fat vs Total Fat',
        category: 'Nutrient Hierarchy',
        status: 'FAIL',
        message: `Impossible: Saturated (${satFat.toFixed(1)}g) + Trans fat (${transFat.toFixed(1)}g) exceeds Total Fat (${fat.toFixed(1)}g).`,
      })
    }
  }

  // ── 5. Salt vs Sodium Verification ──
  const sodium = nutrients.sodium
  const addedSaltGrams = metadata?.addedSaltGrams || 0
  const sodiumFromAddedSalt = metadata?.sodiumFromAddedSalt || 0

  if (metadata?.hasUnverifiedSaltFraction) {
    checks.push({
      id: 'specialty-salt-warning',
      name: 'Specialty Salt Sodium Audit',
      category: 'Formulation Integrity',
      status: 'WARNING',
      message: 'One or more specialty salts in this formulation lack verified sodiumFraction. Supplier sodium assay is required.',
    })
  }

  if (addedSaltGrams > 0 && sodiumFromAddedSalt > 0) {
    if (sodium == null || sodium < sodiumFromAddedSalt * 0.85) {
      checks.push({
        id: 'salt-sodium-consistency',
        name: 'Salt & Sodium Balance Audit',
        category: 'Formulation Integrity',
        status: 'FAIL',
        message: `Recipe contains ${addedSaltGrams}g added salt (expected min ~${sodiumFromAddedSalt.toFixed(0)}mg sodium), but finished sodium is only ${sodium != null ? sodium.toFixed(0) : 'null'}mg!`,
      })
    } else {
      checks.push({
        id: 'salt-sodium-consistency',
        name: 'Salt & Sodium Balance Audit',
        category: 'Formulation Integrity',
        status: 'PASS',
        message: `Added salt (${addedSaltGrams}g) properly accounts for ${sodiumFromAddedSalt.toFixed(0)}mg sodium in recipe.`,
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
