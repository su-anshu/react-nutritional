import React from 'react'
import { validateFormulation } from '../../engine/validationEngine'

export default function ValidationPanel({ formulationResult }) {
  if (!formulationResult) {
    return <div className="card-panel">No formulation to validate.</div>
  }

  const validation = validateFormulation(formulationResult)
  const { overallStatus, score, passCount, warningCount, failCount, checks } = validation

  return (
    <div className="card-panel validation-panel">
      {/* Top Score Banner */}
      <div className={`validation-score-banner status-${overallStatus.toLowerCase()}`}>
        <div className="score-main">
          <div className="score-badge">
            <span className="score-number">{score}</span>
            <span className="score-max">/100</span>
          </div>
          <div className="score-text">
            <h3>
              Formulation Integrity:{' '}
              {overallStatus === 'PASS'
                ? 'Statutory Compliant'
                : overallStatus === 'WARNING'
                ? 'Review Warnings'
                : 'Formulation Errors Detected'}
            </h3>
            <p>
              {passCount} checks passed, {warningCount} advisories, {failCount} critical errors.
            </p>
          </div>
        </div>

        <div className="score-stats">
          <div className="stat-pill stat-pass">✓ {passCount} Pass</div>
          <div className="stat-pill stat-warn">⚠️ {warningCount} Advisories</div>
          <div className="stat-pill stat-fail">✕ {failCount} Errors</div>
        </div>
      </div>

      {/* Check Cards */}
      <div className="validation-checks-list">
        {checks.map((c) => (
          <div key={c.id} className={`check-card check-${c.status.toLowerCase()}`}>
            <div className="check-icon">
              {c.status === 'PASS' && '✓'}
              {c.status === 'WARNING' && '⚠️'}
              {c.status === 'FAIL' && '✕'}
              {c.status === 'INFO' && 'ℹ️'}
            </div>
            <div className="check-content">
              <div className="check-header">
                <span className="check-name">{c.name}</span>
                <span className="check-category">{c.category}</span>
              </div>
              <div className="check-message">{c.message}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
