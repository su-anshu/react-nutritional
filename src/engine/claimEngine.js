/**
 * Claim Checker Engine
 * 
 * Evaluates FSSAI nutrient content claims eligibility with coverage gating
 * and scans marketing claims for prohibited medical/therapeutic assertions.
 */

import { FSSAI_CLAIM_RULES, PROHIBITED_CLAIM_PATTERNS, CLAIM_STATUS } from '../data/claimRules'

/**
 * Evaluates all FSSAI claims against finished product nutrition, coverage, and formulation metadata.
 * 
 * Supports both object parameter `{ nutrients, coverage, metadata, nutrientMetadata }`
 * and positional parameters `(nutrients, metadata, coverage, nutrientMetadata)`.
 * 
 * @param {Object} arg1 - Formulated nutrients per 100g or options object
 * @param {Object} [arg2] - Formulation metadata
 * @param {Object} [arg3] - Recipe coverage object
 * @param {Object} [arg4] - Nutrient metadata
 * @returns {Object} Categorized claim eligibility results with status breakdown
 */
export function evaluateClaims(arg1 = {}, arg2 = {}, arg3 = {}, arg4 = {}) {
  let nutrients = {}
  let metadata = {}
  let coverage = {}
  let nutrientMetadata = {}

  if (arg1 && typeof arg1 === 'object' && ('nutrients' in arg1 || 'coverage' in arg1)) {
    nutrients = arg1.nutrients || {}
    metadata = arg1.metadata || {}
    coverage = arg1.coverage || {}
    nutrientMetadata = arg1.nutrientMetadata || {}
  } else {
    nutrients = arg1 || {}
    metadata = arg2 || {}
    coverage = arg3 || {}
    nutrientMetadata = arg4 || {}
  }

  const eligibleClaims = []
  const nonEligibleClaims = []
  const insufficientDataClaims = []
  const labValidationRequiredClaims = []
  const allResults = []

  FSSAI_CLAIM_RULES.forEach((rule) => {
    const res = rule.check({ nutrients, metadata, coverage, nutrientMetadata })
    const status = res.status || (res.eligible ? CLAIM_STATUS.NUMERICALLY_ELIGIBLE : CLAIM_STATUS.NOT_ELIGIBLE)

    const resultObj = {
      id: rule.id,
      category: rule.category,
      claimText: rule.claimText,
      description: rule.description,
      jurisdiction: rule.jurisdiction || 'India / FSSAI',
      regulationName: rule.regulationName || 'FSSAI Advertising & Claims Regulations',
      basis: rule.basis || 'per 100g solid',
      nutrient: rule.primaryNutrient || rule.nutrient,
      status,
      eligible: status === CLAIM_STATUS.NUMERICALLY_ELIGIBLE || status === CLAIM_STATUS.LAB_VALIDATION_REQUIRED,
      isNumericallyEligible: status === CLAIM_STATUS.NUMERICALLY_ELIGIBLE,
      isInsufficientData: status === CLAIM_STATUS.INSUFFICIENT_DATA,
      isLabRequired: status === CLAIM_STATUS.LAB_VALIDATION_REQUIRED,
      reason: res.reason,
      threshold: res.threshold,
      actual: res.actual,
      mandatoryAdvisory: res.mandatoryAdvisory || '',
    }

    allResults.push(resultObj)

    if (status === CLAIM_STATUS.NUMERICALLY_ELIGIBLE) {
      eligibleClaims.push(resultObj)
    } else if (status === CLAIM_STATUS.LAB_VALIDATION_REQUIRED) {
      labValidationRequiredClaims.push(resultObj)
      eligibleClaims.push(resultObj) // Numerically qualified but needs lab check
    } else if (status === CLAIM_STATUS.INSUFFICIENT_DATA) {
      insufficientDataClaims.push(resultObj)
    } else {
      nonEligibleClaims.push(resultObj)
    }
  })

  return {
    eligibleClaims,
    nonEligibleClaims,
    insufficientDataClaims,
    labValidationRequiredClaims,
    allResults,
    eligibleCount: eligibleClaims.length,
    insufficientCount: insufficientDataClaims.length,
    totalChecked: FSSAI_CLAIM_RULES.length,
  }
}

/**
 * Scans marketing copy or packaging text for prohibited medical/therapeutic claims.
 * 
 * @param {string} text - Marketing text to evaluate
 * @returns {Object} Scan results with violation list and advisory text
 */
export function scanMarketingText(text) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return {
      matches: [],
      hasViolations: false,
      message: 'Enter text to scan for non-compliant therapeutic assertions.',
    }
  }

  const matches = []
  PROHIBITED_CLAIM_PATTERNS.forEach(({ pattern, label, severity, note }) => {
    if (pattern.test(text)) {
      matches.push({
        label,
        severity,
        note,
        matchedPattern: pattern.toString(),
      })
    }
  })

  const hasViolations = matches.length > 0
  const message = hasViolations
    ? `Identified ${matches.length} potentially non-compliant therapeutic or drug claim patterns.`
    : 'No configured prohibited claim patterns detected. This scanner is not exhaustive.'

  return {
    matches,
    hasViolations,
    message,
  }
}
