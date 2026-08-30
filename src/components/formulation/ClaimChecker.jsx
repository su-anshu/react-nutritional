import React, { useState } from 'react'
import { evaluateClaims, scanMarketingText } from '../../engine/claimEngine'
import { CLAIM_CATEGORIES } from '../../data/claimRules'

export default function ClaimChecker({ formulationResult }) {
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [marketingCopy, setMarketingCopy] = useState('')

  if (!formulationResult) {
    return <div className="card-panel">No formulation to check claims for.</div>
  }

  const { nutrients, metadata } = formulationResult
  const claimEvaluation = evaluateClaims(nutrients, metadata)
  const detectedViolations = scanMarketingText(marketingCopy)

  const categories = ['ALL', ...Object.values(CLAIM_CATEGORIES)]

  const filteredClaims =
    activeCategory === 'ALL'
      ? claimEvaluation.allResults
      : claimEvaluation.allResults.filter((c) => c.category === activeCategory)

  return (
    <div className="card-panel claim-checker-panel">
      {/* Top Banner */}
      <div className="claims-header-row">
        <div>
          <h4>FSSAI Nutritional & Health Claims Evaluator</h4>
          <p className="subtext">
            Automated verification against FSSAI Advertising and Claims Regulations.
          </p>
        </div>
        <div className="claims-summary-badge">
          <strong>{claimEvaluation.eligibleCount}</strong> of {claimEvaluation.totalChecked} Claims Eligible
        </div>
      </div>

      {/* Category Tabs */}
      <div className="claims-filter-tabs">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`tab-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat === 'ALL' ? 'All Claims' : cat}
          </button>
        ))}
      </div>

      {/* Claims Grid */}
      <div className="claims-grid">
        {filteredClaims.map((c) => (
          <div
            key={c.id}
            className={`claim-card ${c.eligible ? 'claim-eligible' : 'claim-ineligible'}`}
          >
            <div className="claim-card-top">
              <span className="claim-category-tag">{c.category}</span>
              <span className={`claim-status-badge ${c.eligible ? 'badge-success' : 'badge-danger'}`}>
                {c.eligible ? '✓ ELIGIBLE' : '✕ NOT ELIGIBLE'}
              </span>
            </div>

            <div className="claim-title">{c.claimText}</div>
            <div className="claim-desc">{c.description}</div>

            <div className="claim-metrics-row">
              <div>
                <span className="metric-lbl">Requirement:</span>
                <span className="metric-val">{c.threshold}</span>
              </div>
              <div>
                <span className="metric-lbl">Product Actual:</span>
                <span className="metric-val font-mono">{c.actual}</span>
              </div>
            </div>

            <div className="claim-reason">{c.reason}</div>

            {c.mandatoryAdvisory && (
              <div className="claim-advisory-box">
                ⚠️ {c.mandatoryAdvisory}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Real-time Marketing Copy Prohibited Claims Scanner */}
      <div className="marketing-scanner-section">
        <div className="scanner-header">
          <h4>🛡️ Prohibited Medical & Therapeutic Claims Scanner</h4>
          <p className="subtext">
            FSSAI rules strictly prohibit food products from claiming disease prevention, treatment, or cures.
            Paste packaging slogans or marketing copy below to scan for non-compliant terms.
          </p>
        </div>

        <textarea
          className="marketing-textarea"
          rows={3}
          placeholder="Paste marketing copy or packaging bullets here (e.g., 'Nutrient-rich roasted sattu drink for daily vitality...')"
          value={marketingCopy}
          onChange={(e) => setMarketingCopy(e.target.value)}
        />

        {marketingCopy.trim() && (
          <div className="scanner-results-area">
            {detectedViolations.length === 0 ? (
              <div className="scanner-clean-msg">
                ✓ No prohibited disease cure or therapeutic claims detected in your copy.
              </div>
            ) : (
              <div className="scanner-violations-list">
                <div className="scanner-alert-title">
                  ⚠️ {detectedViolations.length} Prohibited Claim Pattern(s) Detected:
                </div>
                {detectedViolations.map((v, i) => (
                  <div key={i} className={`violation-item violation-${v.severity.toLowerCase()}`}>
                    <span className="violation-severity">[{v.severity}]</span>
                    <strong>{v.label}:</strong> {v.note}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
