/**
 * Claim Checker Engine
 * 
 * Evaluates FSSAI nutrient content claims eligibility and scans marketing
 * claims for prohibited medical/therapeutic assertions.
 */

import { FSSAI_CLAIM_RULES, PROHIBITED_CLAIM_PATTERNS } from '../data/claimRules'

/**
 * Evaluates all FSSAI claims against finished product nutrition and formulation metadata.
 * 
 * @param {Object} nutrients - Calculated nutrients per 100g
 * @param {Object} metadata - Recipe formulation metadata (e.g. hasAddedSalt, addedSaltGrams)
 * @returns {Object} Categorized claim eligibility results
 */
export function evaluateClaims(nutrients = {}, metadata = {}) {
  const eligibleClaims = []
  const nonEligibleClaims = []
  const allResults = []

  FSSAI_CLAIM_RULES.forEach((rule) => {
    const res = rule.check(nutrients, metadata)
    const resultObj = {
      id: rule.id,
      category: rule.category,
      claimText: rule.claimText,
      description: rule.description,
      nutrient: rule.nutrient,
      eligible: res.eligible,
      reason: res.reason,
      threshold: res.threshold,
      actual: res.actual,
      mandatoryAdvisory: res.mandatoryAdvisory || '',
    }

    allResults.push(resultObj)
    if (res.eligible) {
      eligibleClaims.push(resultObj)
    } else {
      nonEligibleClaims.push(resultObj)
    }
  })

  return {
    eligibleClaims,
    nonEligibleClaims,
    allResults,
    eligibleCount: eligibleClaims.length,
    totalChecked: FSSAI_CLAIM_RULES.length,
  }
}

/**
 * Scans marketing copy or packaging text for prohibited medical/therapeutic claims.
 * 
 * @param {string} text - Marketing text to evaluate
 * @returns {Array} List of detected violations
 */
export function scanMarketingText(text) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return []
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

  return matches
}
