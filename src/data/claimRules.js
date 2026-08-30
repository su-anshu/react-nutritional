/**
 * FSSAI Nutrition & Health Claims Catalog (FSSAI Advertising and Claims Regulations)
 * 
 * Defines statutory criteria for nutrient content claims, condition requirements,
 * qualifying thresholds, and mandatory qualifier statements under Indian regulations.
 */

export const CLAIM_STATUS = {
  NUMERICALLY_ELIGIBLE: 'NUMERICALLY_ELIGIBLE',
  NOT_ELIGIBLE: 'NOT_ELIGIBLE',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
  LAB_VALIDATION_REQUIRED: 'LAB_VALIDATION_REQUIRED',
  RULE_VERIFICATION_REQUIRED: 'RULE_VERIFICATION_REQUIRED',
}

export const CLAIM_CATEGORIES = {
  PROTEIN: 'Protein Claims',
  FIBER: 'Dietary Fibre Claims',
  FAT: 'Fat & Cholesterol Claims',
  SUGAR: 'Sugar Claims',
  SODIUM: 'Sodium & Salt Claims',
  MICRONUTRIENT: 'Vitamins & Minerals',
}

export const FSSAI_CLAIM_RULES = [
  // ── Protein ──
  {
    id: 'source-of-protein',
    category: CLAIM_CATEGORIES.PROTEIN,
    claimText: 'Source of Protein',
    description: 'Food contains at least 10% of Daily Value (5.4g per 100g solid)',
    jurisdiction: 'India / FSSAI',
    regulationName: 'FSSAI Advertising and Claims Regulations',
    basis: 'per 100g solid',
    primaryNutrient: 'protein',
    dependentNutrients: ['protein'],
    requiresLabValidation: false,
    check: ({ nutrients, coverage = {} }) => {
      const cov = coverage.protein?.percentage ?? 100
      if (cov < 99.9 || nutrients.protein == null) {
        return {
          status: CLAIM_STATUS.INSUFFICIENT_DATA,
          eligible: false,
          reason: `Insufficient protein data (${cov.toFixed(1)}% recipe coverage). 100% complete data required for claim evaluation.`,
          threshold: '≥ 5.4g / 100g (10% RDA)',
          actual: nutrients.protein != null ? `${nutrients.protein.toFixed(1)}g (${cov.toFixed(0)}% cov)` : 'No Data',
        }
      }
      const meets = nutrients.protein >= 5.4
      return {
        status: meets ? CLAIM_STATUS.NUMERICALLY_ELIGIBLE : CLAIM_STATUS.NOT_ELIGIBLE,
        eligible: meets,
        reason: meets
          ? `Protein is ${nutrients.protein.toFixed(1)}g/100g (≥ 5.4g/100g threshold, 10% RDA).`
          : `Protein is ${nutrients.protein.toFixed(1)}g/100g (less than 5.4g/100g threshold).`,
        threshold: '≥ 5.4g / 100g (10% RDA)',
        actual: `${nutrients.protein.toFixed(1)}g`,
      }
    },
  },
  {
    id: 'high-protein',
    category: CLAIM_CATEGORIES.PROTEIN,
    claimText: 'High Protein / Rich in Protein',
    description: 'Food contains at least 20% of Daily Value (10.8g per 100g solid)',
    jurisdiction: 'India / FSSAI',
    regulationName: 'FSSAI Advertising and Claims Regulations',
    basis: 'per 100g solid',
    primaryNutrient: 'protein',
    dependentNutrients: ['protein'],
    requiresLabValidation: false,
    check: ({ nutrients, coverage = {} }) => {
      const cov = coverage.protein?.percentage ?? 100
      if (cov < 99.9 || nutrients.protein == null) {
        return {
          status: CLAIM_STATUS.INSUFFICIENT_DATA,
          eligible: false,
          reason: `Insufficient protein data (${cov.toFixed(1)}% recipe coverage). 100% complete data required.`,
          threshold: '≥ 10.8g / 100g (20% RDA)',
          actual: nutrients.protein != null ? `${nutrients.protein.toFixed(1)}g (${cov.toFixed(0)}% cov)` : 'No Data',
        }
      }
      const meets = nutrients.protein >= 10.8
      return {
        status: meets ? CLAIM_STATUS.NUMERICALLY_ELIGIBLE : CLAIM_STATUS.NOT_ELIGIBLE,
        eligible: meets,
        reason: meets
          ? `Protein is ${nutrients.protein.toFixed(1)}g/100g (≥ 10.8g/100g threshold, 20% RDA).`
          : `Protein is ${nutrients.protein.toFixed(1)}g/100g (less than 10.8g/100g threshold).`,
        threshold: '≥ 10.8g / 100g (20% RDA)',
        actual: `${nutrients.protein.toFixed(1)}g`,
      }
    },
  },

  // ── Dietary Fibre ──
  {
    id: 'source-of-fiber',
    category: CLAIM_CATEGORIES.FIBER,
    claimText: 'Source of Dietary Fibre',
    description: 'Food contains at least 3g dietary fiber per 100g',
    jurisdiction: 'India / FSSAI',
    regulationName: 'FSSAI Advertising and Claims Regulations',
    basis: 'per 100g solid',
    primaryNutrient: 'dietaryFiber',
    dependentNutrients: ['dietaryFiber'],
    requiresLabValidation: false,
    check: ({ nutrients, coverage = {} }) => {
      const cov = coverage.dietaryFiber?.percentage ?? 100
      if (cov < 99.9 || nutrients.dietaryFiber == null) {
        return {
          status: CLAIM_STATUS.INSUFFICIENT_DATA,
          eligible: false,
          reason: `Insufficient dietary fibre data (${cov.toFixed(1)}% recipe coverage). 100% complete data required.`,
          threshold: '≥ 3.0g / 100g',
          actual: nutrients.dietaryFiber != null ? `${nutrients.dietaryFiber.toFixed(1)}g (${cov.toFixed(0)}% cov)` : 'No Data',
        }
      }
      const meets = nutrients.dietaryFiber >= 3.0
      return {
        status: meets ? CLAIM_STATUS.NUMERICALLY_ELIGIBLE : CLAIM_STATUS.NOT_ELIGIBLE,
        eligible: meets,
        reason: meets
          ? `Dietary fibre is ${nutrients.dietaryFiber.toFixed(1)}g/100g (≥ 3.0g/100g threshold).`
          : `Dietary fibre is ${nutrients.dietaryFiber.toFixed(1)}g/100g (less than 3.0g/100g).`,
        threshold: '≥ 3.0g / 100g',
        actual: `${nutrients.dietaryFiber.toFixed(1)}g`,
      }
    },
  },
  {
    id: 'high-fiber',
    category: CLAIM_CATEGORIES.FIBER,
    claimText: 'High in Dietary Fibre',
    description: 'Food contains at least 6g dietary fiber per 100g',
    jurisdiction: 'India / FSSAI',
    regulationName: 'FSSAI Advertising and Claims Regulations',
    basis: 'per 100g solid',
    primaryNutrient: 'dietaryFiber',
    dependentNutrients: ['dietaryFiber'],
    requiresLabValidation: false,
    check: ({ nutrients, coverage = {} }) => {
      const cov = coverage.dietaryFiber?.percentage ?? 100
      if (cov < 99.9 || nutrients.dietaryFiber == null) {
        return {
          status: CLAIM_STATUS.INSUFFICIENT_DATA,
          eligible: false,
          reason: `Insufficient dietary fibre data (${cov.toFixed(1)}% recipe coverage). 100% complete data required.`,
          threshold: '≥ 6.0g / 100g',
          actual: nutrients.dietaryFiber != null ? `${nutrients.dietaryFiber.toFixed(1)}g (${cov.toFixed(0)}% cov)` : 'No Data',
        }
      }
      const meets = nutrients.dietaryFiber >= 6.0
      return {
        status: meets ? CLAIM_STATUS.NUMERICALLY_ELIGIBLE : CLAIM_STATUS.NOT_ELIGIBLE,
        eligible: meets,
        reason: meets
          ? `Dietary fibre is ${nutrients.dietaryFiber.toFixed(1)}g/100g (≥ 6.0g/100g threshold).`
          : `Dietary fibre is ${nutrients.dietaryFiber.toFixed(1)}g/100g (less than 6.0g/100g).`,
        threshold: '≥ 6.0g / 100g',
        actual: `${nutrients.dietaryFiber.toFixed(1)}g`,
      }
    },
  },

  // ── Fat & Cholesterol ──
  {
    id: 'low-fat',
    category: CLAIM_CATEGORIES.FAT,
    claimText: 'Low Fat',
    description: 'Food contains not more than 3g total fat per 100g (solids)',
    jurisdiction: 'India / FSSAI',
    regulationName: 'FSSAI Advertising and Claims Regulations',
    basis: 'per 100g solid',
    primaryNutrient: 'totalFat',
    dependentNutrients: ['totalFat'],
    requiresLabValidation: false,
    check: ({ nutrients, coverage = {} }) => {
      const cov = coverage.totalFat?.percentage ?? 100
      if (cov < 99.9 || nutrients.totalFat == null) {
        return {
          status: CLAIM_STATUS.INSUFFICIENT_DATA,
          eligible: false,
          reason: `Insufficient total fat data (${cov.toFixed(1)}% recipe coverage). 100% complete data required.`,
          threshold: '≤ 3.0g / 100g',
          actual: nutrients.totalFat != null ? `${nutrients.totalFat.toFixed(1)}g (${cov.toFixed(0)}% cov)` : 'No Data',
        }
      }
      const meets = nutrients.totalFat <= 3.0
      return {
        status: meets ? CLAIM_STATUS.NUMERICALLY_ELIGIBLE : CLAIM_STATUS.NOT_ELIGIBLE,
        eligible: meets,
        reason: meets
          ? `Total fat is ${nutrients.totalFat.toFixed(1)}g/100g (≤ 3.0g/100g limit).`
          : `Total fat is ${nutrients.totalFat.toFixed(1)}g/100g (exceeds 3.0g/100g limit).`,
        threshold: '≤ 3.0g / 100g',
        actual: `${nutrients.totalFat.toFixed(1)}g`,
      }
    },
  },
  {
    id: 'fat-free',
    category: CLAIM_CATEGORIES.FAT,
    claimText: 'Fat Free',
    description: 'Food contains not more than 0.5g fat per 100g',
    jurisdiction: 'India / FSSAI',
    regulationName: 'FSSAI Advertising and Claims Regulations',
    basis: 'per 100g solid',
    primaryNutrient: 'totalFat',
    dependentNutrients: ['totalFat'],
    requiresLabValidation: false,
    check: ({ nutrients, coverage = {} }) => {
      const cov = coverage.totalFat?.percentage ?? 100
      if (cov < 99.9 || nutrients.totalFat == null) {
        return {
          status: CLAIM_STATUS.INSUFFICIENT_DATA,
          eligible: false,
          reason: `Insufficient total fat data (${cov.toFixed(1)}% recipe coverage).`,
          threshold: '≤ 0.5g / 100g',
          actual: nutrients.totalFat != null ? `${nutrients.totalFat.toFixed(1)}g` : 'No Data',
        }
      }
      const meets = nutrients.totalFat <= 0.5
      return {
        status: meets ? CLAIM_STATUS.NUMERICALLY_ELIGIBLE : CLAIM_STATUS.NOT_ELIGIBLE,
        eligible: meets,
        reason: meets
          ? `Total fat is ${nutrients.totalFat.toFixed(1)}g/100g (≤ 0.5g/100g limit).`
          : `Total fat is ${nutrients.totalFat.toFixed(1)}g/100g (exceeds 0.5g/100g limit).`,
        threshold: '≤ 0.5g / 100g',
        actual: `${nutrients.totalFat.toFixed(1)}g`,
      }
    },
  },
  {
    id: 'low-sat-fat',
    category: CLAIM_CATEGORIES.FAT,
    claimText: 'Low Saturated Fat',
    description: 'Saturated fat + Trans fat ≤ 1.5g/100g and saturated fat provides ≤ 10% of total energy',
    jurisdiction: 'India / FSSAI',
    regulationName: 'FSSAI Advertising and Claims Regulations',
    basis: 'per 100g solid & % energy',
    primaryNutrient: 'saturatedFat',
    dependentNutrients: ['saturatedFat', 'transFat', 'energy'],
    requiresLabValidation: false,
    check: ({ nutrients, coverage = {} }) => {
      const satCov = coverage.saturatedFat?.percentage ?? 100
      const transCov = coverage.transFat?.percentage ?? 100
      const energyCov = coverage.energy?.percentage ?? 100

      if (
        satCov < 99.9 || transCov < 99.9 || energyCov < 99.9 ||
        nutrients.saturatedFat == null || nutrients.transFat == null || nutrients.energy == null
      ) {
        return {
          status: CLAIM_STATUS.INSUFFICIENT_DATA,
          eligible: false,
          reason: `Insufficient data: Saturated fat, trans fat, and energy must all be 100% complete (missing/partial trans fat or saturated fat cannot be assumed 0g).`,
          threshold: 'Sat+Trans ≤ 1.5g/100g & Sat Kcal ≤ 10%',
          actual: nutrients.saturatedFat != null && nutrients.transFat != null
            ? `${(nutrients.saturatedFat + nutrients.transFat).toFixed(2)}g sat+trans`
            : 'Incomplete Fat Profile',
        }
      }

      const satPlusTrans = nutrients.saturatedFat + nutrients.transFat
      const satCalPct = nutrients.energy > 0 ? ((nutrients.saturatedFat * 9) / nutrients.energy) * 100 : 0
      const meets = satPlusTrans <= 1.5 && satCalPct <= 10.0

      return {
        status: meets ? CLAIM_STATUS.NUMERICALLY_ELIGIBLE : CLAIM_STATUS.NOT_ELIGIBLE,
        eligible: meets,
        reason: meets
          ? `Saturated + Trans fat is ${satPlusTrans.toFixed(2)}g/100g (≤ 1.5g) and provides ${satCalPct.toFixed(1)}% of energy (≤ 10%).`
          : `Sat+Trans is ${satPlusTrans.toFixed(2)}g (limit 1.5g), Sat energy is ${satCalPct.toFixed(1)}% (limit 10%).`,
        threshold: 'Sat+Trans ≤ 1.5g/100g & Sat Kcal ≤ 10%',
        actual: `${satPlusTrans.toFixed(2)}g (${satCalPct.toFixed(1)}% kcal)`,
      }
    },
  },
  {
    id: 'trans-fat-free',
    category: CLAIM_CATEGORIES.FAT,
    claimText: 'Trans Fat Free',
    description: 'Food contains not more than 0.2g trans fat per 100g',
    jurisdiction: 'India / FSSAI',
    regulationName: 'FSSAI Advertising and Claims Regulations',
    basis: 'per 100g solid',
    primaryNutrient: 'transFat',
    dependentNutrients: ['transFat'],
    requiresLabValidation: false,
    check: ({ nutrients, coverage = {} }) => {
      const cov = coverage.transFat?.percentage ?? 100
      if (cov < 99.9 || nutrients.transFat == null) {
        return {
          status: CLAIM_STATUS.INSUFFICIENT_DATA,
          eligible: false,
          reason: `Insufficient trans fat data (${cov.toFixed(1)}% coverage). Missing trans fat cannot be assumed 0g.`,
          threshold: '≤ 0.2g / 100g',
          actual: nutrients.transFat != null ? `${nutrients.transFat.toFixed(2)}g` : 'No Data',
        }
      }
      const meets = nutrients.transFat <= 0.2
      return {
        status: meets ? CLAIM_STATUS.NUMERICALLY_ELIGIBLE : CLAIM_STATUS.NOT_ELIGIBLE,
        eligible: meets,
        reason: meets
          ? `Trans fat is ${nutrients.transFat.toFixed(2)}g/100g (≤ 0.2g/100g limit).`
          : `Trans fat is ${nutrients.transFat.toFixed(2)}g/100g (exceeds 0.2g limit).`,
        threshold: '≤ 0.2g / 100g',
        actual: `${nutrients.transFat.toFixed(2)}g`,
      }
    },
  },
  {
    id: 'cholesterol-free',
    category: CLAIM_CATEGORIES.FAT,
    claimText: 'Cholesterol Free',
    description: 'Cholesterol ≤ 5mg/100g and saturated fat ≤ 1.5g/100g',
    jurisdiction: 'India / FSSAI',
    regulationName: 'FSSAI Advertising and Claims Regulations',
    basis: 'per 100g solid',
    primaryNutrient: 'cholesterol',
    dependentNutrients: ['cholesterol', 'saturatedFat'],
    requiresLabValidation: false,
    check: ({ nutrients, coverage = {} }) => {
      const cholCov = coverage.cholesterol?.percentage ?? 100
      const satCov = coverage.saturatedFat?.percentage ?? 100

      if (cholCov < 99.9 || satCov < 99.9 || nutrients.cholesterol == null || nutrients.saturatedFat == null) {
        return {
          status: CLAIM_STATUS.INSUFFICIENT_DATA,
          eligible: false,
          reason: `Insufficient data: Both cholesterol and saturated fat must be 100% complete for Cholesterol Free claim evaluation.`,
          threshold: 'Cholesterol ≤ 5mg & Sat Fat ≤ 1.5g/100g',
          actual: nutrients.cholesterol != null ? `${nutrients.cholesterol.toFixed(1)}mg` : 'No Data',
        }
      }

      const meets = nutrients.cholesterol <= 5.0 && nutrients.saturatedFat <= 1.5
      return {
        status: meets ? CLAIM_STATUS.NUMERICALLY_ELIGIBLE : CLAIM_STATUS.NOT_ELIGIBLE,
        eligible: meets,
        reason: meets
          ? `Cholesterol is ${nutrients.cholesterol.toFixed(1)}mg/100g (≤ 5mg) and saturated fat is ${nutrients.saturatedFat.toFixed(2)}g/100g (≤ 1.5g).`
          : `Cholesterol: ${nutrients.cholesterol.toFixed(1)}mg (limit 5mg), Saturated Fat: ${nutrients.saturatedFat.toFixed(2)}g (limit 1.5g).`,
        threshold: 'Cholesterol ≤ 5mg & Sat Fat ≤ 1.5g/100g',
        actual: `${nutrients.cholesterol.toFixed(1)}mg (Sat Fat: ${nutrients.saturatedFat.toFixed(2)}g)`,
      }
    },
  },

  // ── Sugar ──
  {
    id: 'no-added-sugar',
    category: CLAIM_CATEGORIES.SUGAR,
    claimText: 'No Added Sugar',
    description: 'No added sugars or sweetening ingredients used during processing',
    jurisdiction: 'India / FSSAI',
    regulationName: 'FSSAI Advertising and Claims Regulations',
    basis: 'formulation composition',
    primaryNutrient: 'addedSugar',
    dependentNutrients: ['addedSugar'],
    requiresLabValidation: false,
    check: ({ nutrients, metadata = {}, coverage = {} }) => {
      const cov = coverage.addedSugar?.percentage ?? 100
      if (cov < 99.9 || nutrients.addedSugar == null) {
        return {
          status: CLAIM_STATUS.INSUFFICIENT_DATA,
          eligible: false,
          reason: `Insufficient added sugar data (${cov.toFixed(1)}% coverage).`,
          threshold: '0g added sugar & 0 added sweeteners',
          actual: nutrients.addedSugar != null ? `${nutrients.addedSugar.toFixed(1)}g` : 'No Data',
        }
      }

      const hasAddedSweetener = metadata.hasAddedSweeteners === true
      const eligible = nutrients.addedSugar === 0 && !hasAddedSweetener
      const advisory = (nutrients.totalSugar && nutrients.totalSugar > 0)
        ? 'MANDATORY ADVISORY: Contains naturally occurring sugars.'
        : ''

      return {
        status: eligible ? CLAIM_STATUS.NUMERICALLY_ELIGIBLE : CLAIM_STATUS.NOT_ELIGIBLE,
        eligible,
        reason: eligible
          ? `Added sugars: 0g. ${advisory}`
          : `Added sugars is ${nutrients.addedSugar}g (must be 0g with no added sweeteners).`,
        threshold: '0g added sugar & 0 added sweeteners',
        actual: `${nutrients.addedSugar.toFixed(1)}g added (${(nutrients.totalSugar || 0).toFixed(1)}g natural)`,
        mandatoryAdvisory: advisory,
      }
    },
  },
  {
    id: 'sugar-free',
    category: CLAIM_CATEGORIES.SUGAR,
    claimText: 'Sugar Free',
    description: 'Total sugars ≤ 0.5g per 100g',
    jurisdiction: 'India / FSSAI',
    regulationName: 'FSSAI Advertising and Claims Regulations',
    basis: 'per 100g solid',
    primaryNutrient: 'totalSugar',
    dependentNutrients: ['totalSugar'],
    requiresLabValidation: false,
    check: ({ nutrients, coverage = {} }) => {
      const cov = coverage.totalSugar?.percentage ?? 100
      if (cov < 99.9 || nutrients.totalSugar == null) {
        return {
          status: CLAIM_STATUS.INSUFFICIENT_DATA,
          eligible: false,
          reason: `Insufficient total sugar data (${cov.toFixed(1)}% coverage).`,
          threshold: '≤ 0.5g / 100g',
          actual: nutrients.totalSugar != null ? `${nutrients.totalSugar.toFixed(1)}g` : 'No Data',
        }
      }
      const meets = nutrients.totalSugar <= 0.5
      return {
        status: meets ? CLAIM_STATUS.NUMERICALLY_ELIGIBLE : CLAIM_STATUS.NOT_ELIGIBLE,
        eligible: meets,
        reason: meets
          ? `Total sugar is ${nutrients.totalSugar.toFixed(1)}g/100g (≤ 0.5g/100g limit).`
          : `Total sugar is ${nutrients.totalSugar.toFixed(1)}g/100g (exceeds 0.5g limit).`,
        threshold: '≤ 0.5g / 100g',
        actual: `${nutrients.totalSugar.toFixed(1)}g`,
      }
    },
  },

  // ── Sodium & Salt ──
  {
    id: 'low-sodium',
    category: CLAIM_CATEGORIES.SODIUM,
    claimText: 'Low Sodium',
    description: 'Sodium ≤ 120mg per 100g (or equivalent salt ≤ 0.3g/100g)',
    jurisdiction: 'India / FSSAI',
    regulationName: 'FSSAI Advertising and Claims Regulations',
    basis: 'per 100g solid',
    primaryNutrient: 'sodium',
    dependentNutrients: ['sodium'],
    requiresLabValidation: false,
    check: ({ nutrients, coverage = {} }) => {
      const cov = coverage.sodium?.percentage ?? 100
      if (cov < 99.9 || nutrients.sodium == null) {
        return {
          status: CLAIM_STATUS.INSUFFICIENT_DATA,
          eligible: false,
          reason: `Insufficient sodium data (${cov.toFixed(1)}% coverage).`,
          threshold: '≤ 120 mg / 100g',
          actual: nutrients.sodium != null ? `${nutrients.sodium.toFixed(0)}mg` : 'No Data',
        }
      }
      const meets = nutrients.sodium <= 120
      return {
        status: meets ? CLAIM_STATUS.NUMERICALLY_ELIGIBLE : CLAIM_STATUS.NOT_ELIGIBLE,
        eligible: meets,
        reason: meets
          ? `Sodium is ${nutrients.sodium.toFixed(0)}mg/100g (≤ 120mg/100g limit).`
          : `Sodium is ${nutrients.sodium.toFixed(0)}mg/100g (exceeds 120mg limit).`,
        threshold: '≤ 120 mg / 100g',
        actual: `${nutrients.sodium.toFixed(0)}mg`,
      }
    },
  },
  {
    id: 'very-low-sodium',
    category: CLAIM_CATEGORIES.SODIUM,
    claimText: 'Very Low Sodium',
    description: 'Sodium ≤ 40mg per 100g',
    jurisdiction: 'India / FSSAI',
    regulationName: 'FSSAI Advertising and Claims Regulations',
    basis: 'per 100g solid',
    primaryNutrient: 'sodium',
    dependentNutrients: ['sodium'],
    requiresLabValidation: false,
    check: ({ nutrients, coverage = {} }) => {
      const cov = coverage.sodium?.percentage ?? 100
      if (cov < 99.9 || nutrients.sodium == null) {
        return {
          status: CLAIM_STATUS.INSUFFICIENT_DATA,
          eligible: false,
          reason: `Insufficient sodium data (${cov.toFixed(1)}% coverage).`,
          threshold: '≤ 40 mg / 100g',
          actual: nutrients.sodium != null ? `${nutrients.sodium.toFixed(0)}mg` : 'No Data',
        }
      }
      const meets = nutrients.sodium <= 40
      return {
        status: meets ? CLAIM_STATUS.NUMERICALLY_ELIGIBLE : CLAIM_STATUS.NOT_ELIGIBLE,
        eligible: meets,
        reason: meets
          ? `Sodium is ${nutrients.sodium.toFixed(0)}mg/100g (≤ 40mg/100g limit).`
          : `Sodium is ${nutrients.sodium.toFixed(0)}mg/100g (exceeds 40mg limit).`,
        threshold: '≤ 40 mg / 100g',
        actual: `${nutrients.sodium.toFixed(0)}mg`,
      }
    },
  },
  {
    id: 'sodium-free',
    category: CLAIM_CATEGORIES.SODIUM,
    claimText: 'Sodium Free / Salt Free',
    description: 'Sodium ≤ 5mg per 100g',
    jurisdiction: 'India / FSSAI',
    regulationName: 'FSSAI Advertising and Claims Regulations',
    basis: 'per 100g solid',
    primaryNutrient: 'sodium',
    dependentNutrients: ['sodium'],
    requiresLabValidation: false,
    check: ({ nutrients, coverage = {} }) => {
      const cov = coverage.sodium?.percentage ?? 100
      if (cov < 99.9 || nutrients.sodium == null) {
        return {
          status: CLAIM_STATUS.INSUFFICIENT_DATA,
          eligible: false,
          reason: `Insufficient sodium data (${cov.toFixed(1)}% coverage).`,
          threshold: '≤ 5 mg / 100g',
          actual: nutrients.sodium != null ? `${nutrients.sodium.toFixed(0)}mg` : 'No Data',
        }
      }
      const meets = nutrients.sodium <= 5
      return {
        status: meets ? CLAIM_STATUS.NUMERICALLY_ELIGIBLE : CLAIM_STATUS.NOT_ELIGIBLE,
        eligible: meets,
        reason: meets
          ? `Sodium is ${nutrients.sodium.toFixed(0)}mg/100g (≤ 5mg/100g limit).`
          : `Sodium is ${nutrients.sodium.toFixed(0)}mg/100g (exceeds 5mg limit).`,
        threshold: '≤ 5 mg / 100g',
        actual: `${nutrients.sodium.toFixed(0)}mg`,
      }
    },
  },
  {
    id: 'no-added-salt',
    category: CLAIM_CATEGORIES.SODIUM,
    claimText: 'No Added Salt',
    description: 'No added sodium chloride or salt ingredients in recipe formulation',
    jurisdiction: 'India / FSSAI',
    regulationName: 'FSSAI Advertising and Claims Regulations',
    basis: 'formulation composition',
    primaryNutrient: 'sodium',
    dependentNutrients: ['sodium'],
    requiresLabValidation: false,
    check: ({ nutrients, metadata = {} }) => {
      const hasAddedSalt = metadata.hasAddedSalt === true || (metadata.addedSaltGrams && metadata.addedSaltGrams > 0)
      if (hasAddedSalt) {
        return {
          status: CLAIM_STATUS.NOT_ELIGIBLE,
          eligible: false,
          reason: `NOT ELIGIBLE: Added salt (${metadata.addedSaltGrams || 1}g) is present in recipe formulation.`,
          threshold: '0g added salt ingredients in recipe',
          actual: `Added salt present (${metadata.addedSaltGrams || '>0'}g)`,
          mandatoryAdvisory: '',
        }
      }
      const sodium = nutrients.sodium || 0
      const advisory = sodium > 120 ? 'STATUTORY ADVISORY: Not a low sodium food.' : ''
      return {
        status: CLAIM_STATUS.NUMERICALLY_ELIGIBLE,
        eligible: true,
        reason: `No salt added in recipe formulation. ${advisory}`,
        threshold: '0g added salt ingredients in recipe',
        actual: `0g added salt (${sodium.toFixed(0)}mg natural sodium)`,
        mandatoryAdvisory: advisory,
      }
    },
  },

  // ── Minerals & Vitamins ──
  {
    id: 'source-of-iron',
    category: CLAIM_CATEGORIES.MICRONUTRIENT,
    claimText: 'Source of Iron',
    description: 'Food contains at least 15% RDA per 100g (≥ 2.85mg / 100g)',
    jurisdiction: 'India / FSSAI',
    regulationName: 'FSSAI Advertising and Claims Regulations',
    basis: 'per 100g solid',
    primaryNutrient: 'iron',
    dependentNutrients: ['iron'],
    requiresLabValidation: true,
    check: ({ nutrients, coverage = {}, nutrientMetadata = {} }) => {
      const cov = coverage.iron?.percentage ?? 100
      if (cov < 99.9 || nutrients.iron == null) {
        return {
          status: CLAIM_STATUS.INSUFFICIENT_DATA,
          eligible: false,
          reason: `Insufficient iron data (${cov.toFixed(1)}% recipe coverage). Complete data required.`,
          threshold: '≥ 2.85 mg / 100g (15% RDA)',
          actual: nutrients.iron != null ? `${nutrients.iron.toFixed(1)}mg (${cov.toFixed(0)}% cov)` : 'No Data',
        }
      }
      const meets = nutrients.iron >= 2.85
      const conf = nutrientMetadata.iron?.confidence || 'Medium'
      const status = meets
        ? (conf === 'Low' || conf === 'Medium-Low' ? CLAIM_STATUS.LAB_VALIDATION_REQUIRED : CLAIM_STATUS.NUMERICALLY_ELIGIBLE)
        : CLAIM_STATUS.NOT_ELIGIBLE

      return {
        status,
        eligible: meets,
        reason: meets
          ? `Iron is ${nutrients.iron.toFixed(1)}mg/100g (≥ 2.85mg/100g, 15% RDA). Finished product lab assay recommended.`
          : `Iron is ${nutrients.iron.toFixed(1)}mg/100g (less than 2.85mg/100g threshold).`,
        threshold: '≥ 2.85 mg / 100g (15% RDA)',
        actual: `${nutrients.iron.toFixed(1)}mg`,
      }
    },
  },
  {
    id: 'high-iron',
    category: CLAIM_CATEGORIES.MICRONUTRIENT,
    claimText: 'High in Iron / Rich in Iron',
    description: 'Food contains at least 30% RDA per 100g (≥ 5.7mg / 100g)',
    jurisdiction: 'India / FSSAI',
    regulationName: 'FSSAI Advertising and Claims Regulations',
    basis: 'per 100g solid',
    primaryNutrient: 'iron',
    dependentNutrients: ['iron'],
    requiresLabValidation: true,
    check: ({ nutrients, coverage = {}, nutrientMetadata = {} }) => {
      const cov = coverage.iron?.percentage ?? 100
      if (cov < 99.9 || nutrients.iron == null) {
        return {
          status: CLAIM_STATUS.INSUFFICIENT_DATA,
          eligible: false,
          reason: `Insufficient iron data (${cov.toFixed(1)}% coverage). Complete data required.`,
          threshold: '≥ 5.7 mg / 100g (30% RDA)',
          actual: nutrients.iron != null ? `${nutrients.iron.toFixed(1)}mg` : 'No Data',
        }
      }
      const meets = nutrients.iron >= 5.7
      const conf = nutrientMetadata.iron?.confidence || 'Medium'
      const status = meets
        ? (conf === 'Low' || conf === 'Medium-Low' ? CLAIM_STATUS.LAB_VALIDATION_REQUIRED : CLAIM_STATUS.NUMERICALLY_ELIGIBLE)
        : CLAIM_STATUS.NOT_ELIGIBLE

      return {
        status,
        eligible: meets,
        reason: meets
          ? `Iron is ${nutrients.iron.toFixed(1)}mg/100g (≥ 5.7mg/100g, 30% RDA). Finished product lab assay recommended.`
          : `Iron is ${nutrients.iron.toFixed(1)}mg/100g (less than 5.7mg/100g threshold).`,
        threshold: '≥ 5.7 mg / 100g (30% RDA)',
        actual: `${nutrients.iron.toFixed(1)}mg`,
      }
    },
  },
  {
    id: 'source-of-calcium',
    category: CLAIM_CATEGORIES.MICRONUTRIENT,
    claimText: 'Source of Calcium',
    description: 'Food contains at least 15% RDA per 100g (≥ 150mg / 100g)',
    jurisdiction: 'India / FSSAI',
    regulationName: 'FSSAI Advertising and Claims Regulations',
    basis: 'per 100g solid',
    primaryNutrient: 'calcium',
    dependentNutrients: ['calcium'],
    requiresLabValidation: true,
    check: ({ nutrients, coverage = {}, nutrientMetadata = {} }) => {
      const cov = coverage.calcium?.percentage ?? 100
      if (cov < 99.9 || nutrients.calcium == null) {
        return {
          status: CLAIM_STATUS.INSUFFICIENT_DATA,
          eligible: false,
          reason: `Insufficient calcium data (${cov.toFixed(1)}% coverage). Complete data required.`,
          threshold: '≥ 150 mg / 100g (15% RDA)',
          actual: nutrients.calcium != null ? `${nutrients.calcium.toFixed(0)}mg` : 'No Data',
        }
      }
      const meets = nutrients.calcium >= 150
      const conf = nutrientMetadata.calcium?.confidence || 'Medium'
      const status = meets
        ? (conf === 'Low' || conf === 'Medium-Low' ? CLAIM_STATUS.LAB_VALIDATION_REQUIRED : CLAIM_STATUS.NUMERICALLY_ELIGIBLE)
        : CLAIM_STATUS.NOT_ELIGIBLE

      return {
        status,
        eligible: meets,
        reason: meets
          ? `Calcium is ${nutrients.calcium.toFixed(0)}mg/100g (≥ 150mg/100g, 15% RDA).`
          : `Calcium is ${nutrients.calcium.toFixed(0)}mg/100g (less than 150mg/100g threshold).`,
        threshold: '≥ 150 mg / 100g (15% RDA)',
        actual: `${nutrients.calcium.toFixed(0)}mg`,
      }
    },
  },
  {
    id: 'high-calcium',
    category: CLAIM_CATEGORIES.MICRONUTRIENT,
    claimText: 'High in Calcium / Rich in Calcium',
    description: 'Food contains at least 30% RDA per 100g (≥ 300mg / 100g)',
    jurisdiction: 'India / FSSAI',
    regulationName: 'FSSAI Advertising and Claims Regulations',
    basis: 'per 100g solid',
    primaryNutrient: 'calcium',
    dependentNutrients: ['calcium'],
    requiresLabValidation: true,
    check: ({ nutrients, coverage = {}, nutrientMetadata = {} }) => {
      const cov = coverage.calcium?.percentage ?? 100
      if (cov < 99.9 || nutrients.calcium == null) {
        return {
          status: CLAIM_STATUS.INSUFFICIENT_DATA,
          eligible: false,
          reason: `Insufficient calcium data (${cov.toFixed(1)}% coverage). Complete data required.`,
          threshold: '≥ 300 mg / 100g (30% RDA)',
          actual: nutrients.calcium != null ? `${nutrients.calcium.toFixed(0)}mg` : 'No Data',
        }
      }
      const meets = nutrients.calcium >= 300
      const conf = nutrientMetadata.calcium?.confidence || 'Medium'
      const status = meets
        ? (conf === 'Low' || conf === 'Medium-Low' ? CLAIM_STATUS.LAB_VALIDATION_REQUIRED : CLAIM_STATUS.NUMERICALLY_ELIGIBLE)
        : CLAIM_STATUS.NOT_ELIGIBLE

      return {
        status,
        eligible: meets,
        reason: meets
          ? `Calcium is ${nutrients.calcium.toFixed(0)}mg/100g (≥ 300mg/100g, 30% RDA).`
          : `Calcium is ${nutrients.calcium.toFixed(0)}mg/100g (less than 300mg/100g threshold).`,
        threshold: '≥ 300 mg / 100g (30% RDA)',
        actual: `${nutrients.calcium.toFixed(0)}mg`,
      }
    },
  },
]

/**
 * List of prohibited medical / therapeutic claim keywords under FSSAI regulations.
 * Food products are NOT drugs and cannot claim to prevent, treat, or cure diseases.
 */
export const PROHIBITED_CLAIM_PATTERNS = [
  { pattern: /\bcures?\s+diabetes\b/i, label: 'Cures Diabetes', severity: 'CRITICAL', note: 'Food products cannot claim disease cure.' },
  { pattern: /\btreats?\s+diabetes\b/i, label: 'Treats Diabetes', severity: 'CRITICAL', note: 'Disease treatment claim prohibited.' },
  { pattern: /\banti-?diabetic\b/i, label: 'Anti-diabetic', severity: 'HIGH', note: 'Pharmacological drug claim.' },
  { pattern: /\bcures?\s+hypertension\b/i, label: 'Cures Hypertension', severity: 'CRITICAL', note: 'Prohibited medical claim.' },
  { pattern: /\bprevents?\s+cancer\b/i, label: 'Prevents Cancer', severity: 'CRITICAL', note: 'Prohibited cancer cure/prevention claim.' },
  { pattern: /\bheals?\s+arthritis\b/i, label: 'Heals Arthritis', severity: 'CRITICAL', note: 'Prohibited medical claim.' },
  { pattern: /\bmedicinal\b/i, label: 'Medicinal Claim', severity: 'MEDIUM', note: 'Food cannot be labelled as medicine.' },
  { pattern: /\btherapeutic\b/i, label: 'Therapeutic Claim', severity: 'MEDIUM', note: 'Therapeutic claims restricted to Ayush/drugs.' },
  { pattern: /\bdetox(ifies|es)?\s+(liver|kidney|organs?|body)\b/i, label: 'Organ Detoxification', severity: 'HIGH', note: 'Unsubstantiated physiological claim.' },
  { pattern: /\bburns?\s+(belly\s+)?fat\b/i, label: 'Fat Burning Claim', severity: 'HIGH', note: 'Weight-loss drug claim.' },
  { pattern: /\bboosts?\s+immunity\s+100%\b/i, label: 'Absolute Immunity Claim', severity: 'HIGH', note: 'Exaggerated/unqualified immunity claim.' },
]
