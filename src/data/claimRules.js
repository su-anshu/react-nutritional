/**
 * FSSAI Nutrition & Health Claims Catalog (FSSAI Advertising and Claims Regulations)
 * 
 * Defines statutory criteria for nutrient content claims, condition requirements,
 * qualifying thresholds, and mandatory qualifier statements.
 */

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
    nutrient: 'protein',
    check: (nutrients) => {
      if (nutrients.protein == null) return { eligible: false, reason: 'Missing protein data' }
      const eligible = nutrients.protein >= 5.4
      return {
        eligible,
        reason: eligible
          ? `Protein is ${nutrients.protein.toFixed(1)}g/100g (≥ 5.4g/100g threshold, 10% RDA)`
          : `Protein is ${nutrients.protein.toFixed(1)}g/100g (less than 5.4g/100g)`,
        threshold: '≥ 5.4g / 100g',
        actual: `${nutrients.protein.toFixed(1)}g`,
      }
    },
  },
  {
    id: 'high-protein',
    category: CLAIM_CATEGORIES.PROTEIN,
    claimText: 'High Protein / Rich in Protein',
    description: 'Food contains at least 20% of Daily Value (10.8g per 100g solid)',
    nutrient: 'protein',
    check: (nutrients) => {
      if (nutrients.protein == null) return { eligible: false, reason: 'Missing protein data' }
      const eligible = nutrients.protein >= 10.8
      return {
        eligible,
        reason: eligible
          ? `Protein is ${nutrients.protein.toFixed(1)}g/100g (≥ 10.8g/100g threshold, 20% RDA)`
          : `Protein is ${nutrients.protein.toFixed(1)}g/100g (less than 10.8g/100g)`,
        threshold: '≥ 10.8g / 100g',
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
    nutrient: 'dietaryFiber',
    check: (nutrients) => {
      if (nutrients.dietaryFiber == null) return { eligible: false, reason: 'Missing dietary fiber data' }
      const eligible = nutrients.dietaryFiber >= 3.0
      return {
        eligible,
        reason: eligible
          ? `Dietary fiber is ${nutrients.dietaryFiber.toFixed(1)}g/100g (≥ 3.0g/100g)`
          : `Dietary fiber is ${nutrients.dietaryFiber.toFixed(1)}g/100g (less than 3.0g/100g)`,
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
    nutrient: 'dietaryFiber',
    check: (nutrients) => {
      if (nutrients.dietaryFiber == null) return { eligible: false, reason: 'Missing dietary fiber data' }
      const eligible = nutrients.dietaryFiber >= 6.0
      return {
        eligible,
        reason: eligible
          ? `Dietary fiber is ${nutrients.dietaryFiber.toFixed(1)}g/100g (≥ 6.0g/100g)`
          : `Dietary fiber is ${nutrients.dietaryFiber.toFixed(1)}g/100g (less than 6.0g/100g)`,
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
    nutrient: 'totalFat',
    check: (nutrients) => {
      if (nutrients.totalFat == null) return { eligible: false, reason: 'Missing fat data' }
      const eligible = nutrients.totalFat <= 3.0
      return {
        eligible,
        reason: eligible
          ? `Total fat is ${nutrients.totalFat.toFixed(1)}g/100g (≤ 3.0g/100g)`
          : `Total fat is ${nutrients.totalFat.toFixed(1)}g/100g (exceeds 3.0g/100g limit)`,
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
    nutrient: 'totalFat',
    check: (nutrients) => {
      if (nutrients.totalFat == null) return { eligible: false, reason: 'Missing fat data' }
      const eligible = nutrients.totalFat <= 0.5
      return {
        eligible,
        reason: eligible
          ? `Total fat is ${nutrients.totalFat.toFixed(1)}g/100g (≤ 0.5g/100g)`
          : `Total fat is ${nutrients.totalFat.toFixed(1)}g/100g (exceeds 0.5g/100g limit)`,
        threshold: '≤ 0.5g / 100g',
        actual: `${nutrients.totalFat.toFixed(1)}g`,
      }
    },
  },
  {
    id: 'low-sat-fat',
    category: CLAIM_CATEGORIES.FAT,
    claimText: 'Low Saturated Fat',
    description: 'Saturated fat + Trans fat ≤ 1.5g/100g and provides ≤ 10% of total energy',
    nutrient: 'saturatedFat',
    check: (nutrients) => {
      if (nutrients.saturatedFat == null) return { eligible: false, reason: 'Missing saturated fat data' }
      const trans = nutrients.transFat || 0
      const satPlusTrans = nutrients.saturatedFat + trans
      const energy = nutrients.energy || 0
      const satCalPct = energy > 0 ? ((nutrients.saturatedFat * 9) / energy) * 100 : 0
      const eligible = satPlusTrans <= 1.5 && satCalPct <= 10.0
      return {
        eligible,
        reason: eligible
          ? `Saturated + Trans fat is ${satPlusTrans.toFixed(1)}g/100g (≤ 1.5g) and ${satCalPct.toFixed(1)}% of kcal (≤ 10%)`
          : `Sat+Trans: ${satPlusTrans.toFixed(1)}g (limit 1.5g), Sat energy: ${satCalPct.toFixed(1)}% (limit 10%)`,
        threshold: 'Sat+Trans ≤ 1.5g/100g & Sat Kcal ≤ 10%',
        actual: `${satPlusTrans.toFixed(1)}g (${satCalPct.toFixed(1)}% kcal)`,
      }
    },
  },
  {
    id: 'trans-fat-free',
    category: CLAIM_CATEGORIES.FAT,
    claimText: 'Trans Fat Free',
    description: 'Food contains not more than 0.2g trans fat per 100g',
    nutrient: 'transFat',
    check: (nutrients) => {
      if (nutrients.transFat == null) return { eligible: false, reason: 'Missing trans fat data' }
      const eligible = nutrients.transFat <= 0.2
      return {
        eligible,
        reason: eligible
          ? `Trans fat is ${nutrients.transFat.toFixed(2)}g/100g (≤ 0.2g/100g)`
          : `Trans fat is ${nutrients.transFat.toFixed(2)}g/100g (exceeds 0.2g limit)`,
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
    nutrient: 'cholesterol',
    check: (nutrients) => {
      if (nutrients.cholesterol == null) return { eligible: false, reason: 'Missing cholesterol data' }
      const satFat = nutrients.saturatedFat || 0
      const eligible = nutrients.cholesterol <= 5.0 && satFat <= 1.5
      return {
        eligible,
        reason: eligible
          ? `Cholesterol is ${nutrients.cholesterol.toFixed(1)}mg/100g and saturated fat is ${satFat.toFixed(1)}g/100g`
          : `Cholesterol: ${nutrients.cholesterol.toFixed(1)}mg (limit 5mg), Sat Fat: ${satFat.toFixed(1)}g (limit 1.5g)`,
        threshold: 'Cholesterol ≤ 5mg & Sat Fat ≤ 1.5g/100g',
        actual: `${nutrients.cholesterol.toFixed(1)}mg`,
      }
    },
  },

  // ── Sugar ──
  {
    id: 'no-added-sugar',
    category: CLAIM_CATEGORIES.SUGAR,
    claimText: 'No Added Sugar',
    description: 'No added sugars or sweetening ingredients used during processing',
    nutrient: 'addedSugar',
    check: (nutrients, meta = {}) => {
      if (nutrients.addedSugar == null) return { eligible: false, reason: 'Missing added sugar data' }
      const hasAddedSweetener = meta.hasAddedSweeteners === true
      const eligible = nutrients.addedSugar === 0 && !hasAddedSweetener
      const advisory = (nutrients.totalSugar && nutrients.totalSugar > 0)
        ? 'MANDATORY ADVISORY: Contains naturally occurring sugars.'
        : ''
      return {
        eligible,
        reason: eligible
          ? `Added sugars: 0g. ${advisory}`
          : `Added sugars is ${nutrients.addedSugar}g (must be 0g with no added sweeteners)`,
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
    nutrient: 'totalSugar',
    check: (nutrients) => {
      if (nutrients.totalSugar == null) return { eligible: false, reason: 'Missing total sugar data' }
      const eligible = nutrients.totalSugar <= 0.5
      return {
        eligible,
        reason: eligible
          ? `Total sugar is ${nutrients.totalSugar.toFixed(1)}g/100g (≤ 0.5g/100g)`
          : `Total sugar is ${nutrients.totalSugar.toFixed(1)}g/100g (exceeds 0.5g limit)`,
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
    nutrient: 'sodium',
    check: (nutrients) => {
      if (nutrients.sodium == null) return { eligible: false, reason: 'Missing sodium data' }
      const eligible = nutrients.sodium <= 120
      return {
        eligible,
        reason: eligible
          ? `Sodium is ${nutrients.sodium.toFixed(0)}mg/100g (≤ 120mg/100g)`
          : `Sodium is ${nutrients.sodium.toFixed(0)}mg/100g (exceeds 120mg limit)`,
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
    nutrient: 'sodium',
    check: (nutrients) => {
      if (nutrients.sodium == null) return { eligible: false, reason: 'Missing sodium data' }
      const eligible = nutrients.sodium <= 40
      return {
        eligible,
        reason: eligible
          ? `Sodium is ${nutrients.sodium.toFixed(0)}mg/100g (≤ 40mg/100g)`
          : `Sodium is ${nutrients.sodium.toFixed(0)}mg/100g (exceeds 40mg limit)`,
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
    nutrient: 'sodium',
    check: (nutrients) => {
      if (nutrients.sodium == null) return { eligible: false, reason: 'Missing sodium data' }
      const eligible = nutrients.sodium <= 5
      return {
        eligible,
        reason: eligible
          ? `Sodium is ${nutrients.sodium.toFixed(0)}mg/100g (≤ 5mg/100g)`
          : `Sodium is ${nutrients.sodium.toFixed(0)}mg/100g (exceeds 5mg limit)`,
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
    nutrient: 'sodium',
    check: (nutrients, meta = {}) => {
      const hasAddedSalt = meta.hasAddedSalt === true || (meta.addedSaltGrams && meta.addedSaltGrams > 0)
      if (hasAddedSalt) {
        return {
          eligible: false,
          reason: `NOT ELIGIBLE: Added salt/sodium chloride (${meta.addedSaltGrams || 1}g) is present in the formulation.`,
          threshold: '0g added salt ingredients in recipe',
          actual: `Added salt present (${meta.addedSaltGrams || '>0'}g)`,
          mandatoryAdvisory: '',
        }
      }
      const sodium = nutrients.sodium || 0
      const advisory = sodium > 120 ? 'STATUTORY WARNING: Not a low sodium food.' : ''
      return {
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
    nutrient: 'iron',
    check: (nutrients) => {
      if (nutrients.iron == null) return { eligible: false, reason: 'Missing iron data' }
      const eligible = nutrients.iron >= 2.85
      return {
        eligible,
        reason: eligible
          ? `Iron is ${nutrients.iron.toFixed(1)}mg/100g (≥ 2.85mg/100g, 15% RDA)`
          : `Iron is ${nutrients.iron.toFixed(1)}mg/100g (less than 2.85mg/100g)`,
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
    nutrient: 'iron',
    check: (nutrients) => {
      if (nutrients.iron == null) return { eligible: false, reason: 'Missing iron data' }
      const eligible = nutrients.iron >= 5.7
      return {
        eligible,
        reason: eligible
          ? `Iron is ${nutrients.iron.toFixed(1)}mg/100g (≥ 5.7mg/100g, 30% RDA)`
          : `Iron is ${nutrients.iron.toFixed(1)}mg/100g (less than 5.7mg/100g)`,
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
    nutrient: 'calcium',
    check: (nutrients) => {
      if (nutrients.calcium == null) return { eligible: false, reason: 'Missing calcium data' }
      const eligible = nutrients.calcium >= 150
      return {
        eligible,
        reason: eligible
          ? `Calcium is ${nutrients.calcium.toFixed(0)}mg/100g (≥ 150mg/100g, 15% RDA)`
          : `Calcium is ${nutrients.calcium.toFixed(0)}mg/100g (less than 150mg/100g)`,
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
    nutrient: 'calcium',
    check: (nutrients) => {
      if (nutrients.calcium == null) return { eligible: false, reason: 'Missing calcium data' }
      const eligible = nutrients.calcium >= 300
      return {
        eligible,
        reason: eligible
          ? `Calcium is ${nutrients.calcium.toFixed(0)}mg/100g (≥ 300mg/100g, 30% RDA)`
          : `Calcium is ${nutrients.calcium.toFixed(0)}mg/100g (less than 300mg/100g)`,
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
