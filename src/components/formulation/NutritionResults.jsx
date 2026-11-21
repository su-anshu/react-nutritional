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

export default function NutritionResults({ formulationResult, overrides = {}, onUpdateOverrides }) {
  const [filterText, setFilterText] = useState('')
  const [customServing, setCustomServing] = useState(30)
  const [showOverridePanel, setShowOverridePanel] = useState(false)
  const [editingField, setEditingField] = useState('protein')
  const [overrideValue, setOverrideValue] = useState('')
  const [overrideSource, setOverrideSource] = useState('LAB_VERIFIED')
  const [overrideNotes, setOverrideNotes] = useState('')

  if (!formulationResult || !formulationResult.nutrients) {
    return <div className="card-panel">No formulation calculated yet.</div>
  }

  const {
    nutrients,
    calculatedNutrition,
    finalNutrition,
    coverage,
    metadata,
    servingSize,
    servingGrams,
    primaryServingGrams = 25,
    heavyServingGrams = 50,
    perPrimaryServing,
    perHeavyServing,
    averageCoreCoverage,
  } = formulationResult

  const activeNutrients = finalNutrition || nutrients

  const filteredRows = EXTENDED_NUTRIENTS.filter((row) =>
    row.name.toLowerCase().includes(filterText.toLowerCase())
  )

  const getCoverageBadge = (field) => {
    const isOverridden = overrides && overrides[field] != null
    if (isOverridden) {
      return (
        <span className="cov-badge cov-override" title={`Overridden by ${overrides[field].sourceType || 'LAB'}: ${overrides[field].notes || ''}`}>
          🔬 {overrides[field].sourceType || 'LAB'} Override
        </span>
      )
    }
    const cov = coverage?.[field]
    if (!cov) return <span className="cov-badge cov-missing">0%</span>
    if (cov.isComplete) return <span className="cov-badge cov-100">100% complete</span>
    if (cov.isPartial) return <span className="cov-badge cov-partial">{cov.percentage}% partial</span>
    return <span className="cov-badge cov-missing">Missing (—)</span>
  }

  const handleSaveOverride = () => {
    if (!onUpdateOverrides) return
    const val = overrideValue === '' ? null : Number(overrideValue)
    if (val === null || isNaN(val)) {
      alert('Please enter a valid numeric value for the override.')
      return
    }
    const newOverrides = {
      ...overrides,
      [editingField]: {
        value: val,
        sourceType: overrideSource,
        notes: overrideNotes || 'Lab test override',
        appliedAt: new Date().toISOString(),
      },
    }
    onUpdateOverrides(newOverrides)
    setOverrideValue('')
    setOverrideNotes('')
  }

  const handleClearOverride = (field) => {
    if (!onUpdateOverrides) return
    const newOverrides = { ...overrides }
    delete newOverrides[field]
    onUpdateOverrides(newOverrides)
  }

  return (
    <div className="card-panel nutrition-results-panel">
      {/* Serving Tier KPI Grid */}
      <div className="results-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Primary Daily Serving ({primaryServingGrams}g)</div>
          <div className="kpi-val">
            {perServingWithUnit(activeNutrients.energy, primaryServingGrams, 'kcal', 0)}
          </div>
          <div className="kpi-sub">
            Protein: {perServingWithUnit(activeNutrients.protein, primaryServingGrams, 'g', 1)} · Standard drink
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Heavy / Fitness Serving ({heavyServingGrams}g)</div>
          <div className="kpi-val highlight-protein">
            {perServingWithUnit(activeNutrients.energy, heavyServingGrams, 'kcal', 0)}
          </div>
          <div className="kpi-sub">
            Protein: {perServingWithUnit(activeNutrients.protein, heavyServingGrams, 'g', 1)} · Meal replacement
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Core Data Completeness</div>
          <div className="kpi-val">
            {averageCoreCoverage}%
          </div>
          <div className="kpi-sub">
            {averageCoreCoverage === 100 ? 'All 10 core nutrients 100%' : 'Some nutrients partial/missing'}
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

      {/* Serving Multiplier Bar */}
      <div className="custom-serving-bar">
        <div className="custom-serving-controls">
          <label><strong>Interactive Serving Calculator:</strong></label>
          <input
            type="number"
            min="1"
            max="500"
            className="text-input custom-serving-input"
            value={customServing}
            onChange={(e) => setCustomServing(Number(e.target.value) || 30)}
          />
          <span>grams per serving</span>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={() => setShowOverridePanel(!showOverridePanel)}
        >
          🔬 {showOverridePanel ? 'Hide Lab Overrides' : 'Lab / Manual Overrides'}
        </button>
      </div>

      {/* Lab / Manual Overrides Drawer */}
      {showOverridePanel && (
        <div className="overrides-manager-card">
          <div className="overrides-header">
            <div>
              <h5>🔬 Laboratory Assay & Manual Overrides</h5>
              <p className="subtext">
                Override calculated recipe estimates with accredited laboratory COA test results without destroying the underlying recipe calculations.
              </p>
            </div>
          </div>

          <div className="override-form-row">
            <div className="form-group">
              <label>Select Nutrient</label>
              <select
                className="select-input"
                value={editingField}
                onChange={(e) => setEditingField(e.target.value)}
              >
                {EXTENDED_NUTRIENTS.map((n) => (
                  <option key={n.field} value={n.field}>
                    {n.name} ({n.unit}) — Calc: {fmtWithUnit(calculatedNutrition?.[n.field], n.unit)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Lab Value (per 100g)</label>
              <input
                type="number"
                step="0.01"
                className="text-input"
                placeholder="e.g. 24.2"
                value={overrideValue}
                onChange={(e) => setOverrideValue(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Source Type</label>
              <select
                className="select-input"
                value={overrideSource}
                onChange={(e) => setOverrideSource(e.target.value)}
              >
                <option value="LAB_VERIFIED">Accredited Lab Test (NABL/FSSAI)</option>
                <option value="SUPPLIER_COA">Supplier Batch COA</option>
                <option value="MANUAL_OVERRIDE">Manual QA Override</option>
              </select>
            </div>

            <div className="form-group">
              <label>Reference / Batch Note</label>
              <input
                type="text"
                className="text-input"
                placeholder="e.g. NABL Report #48291"
                value={overrideNotes}
                onChange={(e) => setOverrideNotes(e.target.value)}
              />
            </div>

            <div className="form-group btn-align-bottom">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveOverride}
              >
                Apply Override
              </button>
            </div>
          </div>

          {/* Active Overrides List */}
          {Object.keys(overrides || {}).length > 0 && (
            <div className="active-overrides-list">
              <h6>Active Formulation Overrides:</h6>
              <div className="override-chips">
                {Object.entries(overrides).map(([k, ov]) => (
                  <span key={k} className="override-chip">
                    <strong>{k}:</strong> {ov.value} ({ov.sourceType})
                    <button
                      type="button"
                      className="chip-remove-btn"
                      onClick={() => handleClearOverride(k)}
                      title="Clear override and restore calculated value"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter and Table */}
      <div className="results-table-header">
        <h4>Nutritional Profile Matrix</h4>
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
              <th className="th-num">Per 25g (Std)</th>
              <th className="th-num">Per 50g (Heavy)</th>
              <th className="th-num">Per {customServing}g</th>
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
                  {fmtWithUnit(activeNutrients[field], unit)}
                </td>
                <td className="td-num font-mono">
                  {perServingWithUnit(activeNutrients[field], primaryServingGrams, unit)}
                </td>
                <td className="td-num font-mono">
                  {perServingWithUnit(activeNutrients[field], heavyServingGrams, unit)}
                </td>
                <td className="td-num font-mono highlight-col">
                  {perServingWithUnit(activeNutrients[field], customServing, unit)}
                </td>
                <td className="td-cov">{getCoverageBadge(field)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {metadata?.hasAddedSalt && (
        <div className="salt-summary-box">
          <strong>🧂 Salt & Sodium Formulation Note:</strong> Added salt: {metadata.addedSaltGrams}g ({metadata.addedSaltPct}% of recipe). Added salt contributes ~{metadata.sodiumFromAddedSalt}mg sodium ({metadata.hasUnverifiedSaltFraction ? 'Unverified specialty salt fraction' : 'Verified salt assay'}). Baseline natural sodium: ~{metadata.naturalSodium || 0}mg.
        </div>
      )}
    </div>
  )
}
