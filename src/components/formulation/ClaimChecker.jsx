import React, { useState } from 'react'
import { evaluateClaims, scanMarketingText } from '../../engine/claimEngine'
import { CLAIM_CATEGORIES, CLAIM_STATUS } from '../../data/claimRules'

export default function ClaimChecker({ formulationResult }) {
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [marketingCopy, setMarketingCopy] = useState('')

  if (!formulationResult) {
    return <div className="card-panel">No formulation to check claims for.</div>
  }

  const { nutrients, metadata, coverage, nutrientMetadata } = formulationResult
  const claimEvaluation = evaluateClaims(nutrients, metadata, coverage, nutrientMetadata)
  const scanResult = scanMarketingText(marketingCopy)

  const categories = ['ALL', ...Object.values(CLAIM_CATEGORIES)]

  const filteredClaims =
    activeCategory === 'ALL'
      ? claimEvaluation.allResults
      : claimEvaluation.allResults.filter((c) => c.category === activeCategory)

  const renderStatusBadge = (status) => {
    switch (status) {
      case CLAIM_STATUS.NUMERICALLY_ELIGIBLE:
        return <span className="claim-status-badge badge-success">✓ NUMERICALLY ELIGIBLE</span>
      case CLAIM_STATUS.LAB_VALIDATION_REQUIRED:
        return <span className="claim-status-badge badge-lab">🔬 LAB ASSAY REQUIRED</span>
      case CLAIM_STATUS.INSUFFICIENT_DATA:
        return <span className="claim-status-badge badge-warning">⚠️ INSUFFICIENT DATA</span>
      case CLAIM_STATUS.NOT_ELIGIBLE:
      default:
        return <span className="claim-status-badge badge-danger">✕ NOT ELIGIBLE</span>
    }
  }

  return (
    <div className="card-panel claim-checker-panel">
      {/* Top Banner */}
      <div className="claims-header-row">
        <div>
          <h4>FSSAI Claim Screening</h4>
          <p className="subtext">
            Internal formulation screening against configured FSSAI Advertising & Claims Regulations. Not legal approval.
          </p>
        </div>
        <div className="claims-summary-badge">
          <strong>{claimEvaluation.eligibleCount}</strong> Numerically Qualified · <strong>{claimEvaluation.insufficientCount}</strong> Incomplete
        </div>
      </div>

      {/* Mandatory Statutory Disclaimer Banner */}
      <div className="claims-disclaimer-banner">
        ⚠️ <strong>Statutory Disclaimer:</strong> Claim eligibility displayed here is a formulation-level screening based on database composition. It does NOT constitute formal FSSAI regulatory clearance. Lab assay validation and current Gazette notification review are required prior to commercial label application.
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
            className={`claim-card claim-status-${c.status?.toLowerCase().replace(/_/g, '-')}`}
          >
            <div className="claim-card-top">
              <span className="claim-category-tag">{c.category}</span>
              {renderStatusBadge(c.status)}
            </div>

            <div className="claim-title">{c.claimText}</div>
            <div className="claim-desc">{c.description}</div>

            <div className="claim-metrics-row">
              <div>
                <span className="metric-lbl">Statutory Basis:</span>
                <span className="metric-val">{c.threshold}</span>
              </div>
              <div>
                <span className="metric-lbl">Formulation Value:</span>
                <span className="metric-val font-mono">{c.actual}</span>
              </div>
            </div>

            <div className="claim-reason">{c.reason}</div>

            {c.mandatoryAdvisory && (
              <div className="claim-advisory-box">
                {c.mandatoryAdvisory}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Prohibited Claim Scanner */}
      <div className="marketing-scanner-section">
        <div className="section-title">
          🛡️ Prohibited Medical & Therapeutic Claim Scanner
        </div>
        <p className="subtext">
          Paste proposed front-of-pack or e-commerce marketing copy to scan for non-compliant disease cure, treatment, or drug-like claims prohibited for food products.
        </p>

        <textarea
          rows={3}
          className="text-input"
          placeholder="Paste marketing copy here (e.g. 'Cures diabetes and burns belly fat naturally')..."
          value={marketingCopy}
          onChange={(e) => setMarketingCopy(e.target.value)}
        />

        {marketingCopy.trim() && (
          <div
            className={`scanner-result ${
              scanResult.hasViolations ? 'result-danger' : 'result-safe'
            }`}
          >
            <div className="scanner-result-msg">{scanResult.message}</div>
            {scanResult.matches.map((m, idx) => (
              <div key={idx} className="violation-item">
                <span className="violation-severity font-mono">
                  [{m.severity}]
                </span>{' '}
                <strong>{m.label}:</strong> {m.note}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
