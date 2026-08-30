import React, { useState } from 'react'
import { fmtWithUnit, perServingWithUnit } from '../../utils'
import { ROWS } from '../templates/shared'

const EXTENDED_NUTRIENTS = [
  ...ROWS,
  { name: 'Available Carbohydrate', field: 'availableCarb', unit: 'g' },
  { name: 'Calcium', field: 'calcium', unit: 'mg', dvKey: 'calcium' },
  { name: 'Iron', field: 'iron', unit: 'mg', dvKey: 'iron' },
  { name: 'Potassium', field: 'potassium', unit: 'mg' },
  { name: 'Magnesium', field: 'magnesium', unit: 'mg' },
  { name: 'Folate', field: 'folate', unit: 'mcg' },
  { name: 'Vitamin C', field: 'vitaminC', unit: 'mg' },
  { name: 'Moisture', field: 'moisture', unit: 'g' },
  { name: 'Ash / Minerals', field: 'ash', unit: 'g' },
]

export default function NutritionResults({ formulationResult }) {
  const [filterText, setFilterText] = useState('')

  if (!formulationResult || !formulationResult.nutrients) {
    return <div className="card-panel">No formulation calculated yet.</div>
  }

  const {
    nutrients,
    coverage,
    metadata,
    servingSize,
    servingGrams,
    averageCoreCoverage,
  } = formulationResult

  const filteredRows = EXTENDED_NUTRIENTS.filter((row) =>
    row.name.toLowerCase().includes(filterText.toLowerCase())
  )

  const getCoverageBadge = (field) => {
    const cov = coverage?.[field]
    if (!cov) return <span className="cov-badge cov-missing">0%</span>
    if (cov.isComplete) return <span className="cov-badge cov-100">100% complete</span>
    if (cov.isPartial) return <span className="cov-badge cov-partial">{cov.percentage}% partial</span>
    return <span className="cov-badge cov-missing">Missing (—)</span>
  }

  return (
    <div className="card-panel nutrition-results-panel">
      {/* Overview Cards */}
      <div className="results-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Energy per Serving</div>
          <div className="kpi-val">
            {perServingWithUnit(nutrients.energy, servingGrams, 'kcal', 0)}
          </div>
          <div className="kpi-sub">Serving: {servingSize} ({servingGrams}g)</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Protein per Serving</div>
          <div className="kpi-val highlight-protein">
            {perServingWithUnit(nutrients.protein, servingGrams, 'g', 1)}
          </div>
          <div className="kpi-sub">{fmtWithUnit(nutrients.protein, 'g')} per 100g</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Core Data Completeness</div>
          <div className="kpi-val">
            {averageCoreCoverage}%
          </div>
          <div className="kpi-sub">
            {averageCoreCoverage === 100 ? 'All core nutrients 100%' : 'Some nutrients partial'}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Composite Confidence</div>
          <div className={`kpi-val conf-${metadata?.compositeConfidence?.toLowerCase().includes('high') ? 'high' : metadata?.compositeConfidence?.toLowerCase().includes('low') ? 'low' : 'med'}`}>
            {metadata?.compositeConfidence || 'Medium'}
          </div>
          <div className="kpi-sub">Provenance score: {metadata?.confidenceScore || 2}/3</div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="results-table-header">
        <h4>Calculated Nutritional Profile</h4>
        <input
          type="text"
          className="text-input filter-input"
          placeholder="🔍 Search nutrient..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
      </div>

      <div className="table-responsive">
        <table className="results-table">
          <thead>
            <tr>
              <th className="th-nutrient">Nutrient</th>
              <th className="th-num">Per 100g</th>
              <th className="th-num">Per Serving ({servingSize})</th>
              <th className="th-cov">Data Provenance</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map(({ name, field, unit, sub }) => (
              <tr key={field} className={sub ? 'row-sub' : ''}>
                <td className="td-name">
                  {sub ? <span className="sub-indent">↳ </span> : ''}
                  {name}
                </td>
                <td className="td-num font-mono">
                  {fmtWithUnit(nutrients[field], unit)}
                </td>
                <td className="td-num font-mono">
                  {perServingWithUnit(nutrients[field], servingGrams, unit)}
                </td>
                <td className="td-cov">{getCoverageBadge(field)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {metadata?.hasAddedSalt && (
        <div className="salt-summary-box">
          <strong>🧂 Salt & Sodium Formulation Note:</strong> Added salt: {metadata.addedSaltGrams}g ({metadata.addedSaltPct}% of recipe). Added salt contributes ~{metadata.sodiumFromAddedSalt}mg sodium. Natural baseline sodium: ~{metadata.naturalSodium || 0}mg.
        </div>
      )}
    </div>
  )
}
