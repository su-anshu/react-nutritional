import React, { useState } from 'react'
import { fmtWithUnit } from '../../utils'

const CONTRIBUTABLE_NUTRIENTS = [
  { key: 'protein', name: 'Protein (g)', unit: 'g' },
  { key: 'energy', name: 'Energy (kcal)', unit: 'kcal' },
  { key: 'dietaryFiber', name: 'Dietary Fiber (g)', unit: 'g' },
  { key: 'totalCarb', name: 'Total Carbohydrate (g)', unit: 'g' },
  { key: 'totalFat', name: 'Total Fat (g)', unit: 'g' },
  { key: 'sodium', name: 'Sodium (mg)', unit: 'mg' },
  { key: 'totalSugar', name: 'Total Sugar (g)', unit: 'g' },
  { key: 'iron', name: 'Iron (mg)', unit: 'mg' },
  { key: 'calcium', name: 'Calcium (mg)', unit: 'mg' },
  { key: 'potassium', name: 'Potassium (mg)', unit: 'mg' },
]

export default function IngredientContribution({ formulationResult }) {
  const [selectedNutrient, setSelectedNutrient] = useState('protein')

  if (!formulationResult || !formulationResult.contributions) {
    return <div className="card-panel">No contribution data available.</div>
  }

  const { contributions, nutrients } = formulationResult
  const currentContributions = contributions[selectedNutrient] || []
  const currentTotal = nutrients[selectedNutrient]
  const currentNutrientMeta = CONTRIBUTABLE_NUTRIENTS.find((n) => n.key === selectedNutrient) || {
    unit: '',
    name: selectedNutrient,
  }

  return (
    <div className="card-panel ingredient-contribution-panel">
      <div className="contribution-header-row">
        <div>
          <h4>Ingredient Nutrient Contribution Breakdown</h4>
          <p className="subtext">
            Analyze which ingredients drive each nutrient in the final product.
          </p>
        </div>

        <div className="nutrient-select-group">
          <label className="field-label">Analyze Nutrient:</label>
          <select
            value={selectedNutrient}
            onChange={(e) => setSelectedNutrient(e.target.value)}
            className="select-input"
          >
            {CONTRIBUTABLE_NUTRIENTS.map((n) => (
              <option key={n.key} value={n.key}>
                {n.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="total-highlight-bar">
        <span>Total Finished Product {currentNutrientMeta.name}:</span>
        <strong className="font-mono">
          {fmtWithUnit(currentTotal, currentNutrientMeta.unit)} per 100g
        </strong>
      </div>

      {/* Contribution Table */}
      <div className="table-responsive">
        <table className="formulation-table">
          <thead>
            <tr>
              <th style={{ width: '35%' }}>Ingredient</th>
              <th style={{ width: '15%' }}>Recipe Weight</th>
              <th style={{ width: '15%' }}>Raw / 100g</th>
              <th style={{ width: '15%' }}>Contrib / 100g</th>
              <th style={{ width: '20%' }}>% of Total</th>
            </tr>
          </thead>
          <tbody>
            {currentContributions.map((item) => {
              const sharePct =
                currentTotal && currentTotal > 0 && item.contributionAmount != null
                  ? (item.contributionAmount / currentTotal) * 100
                  : 0

              return (
                <tr key={item.ingredientId}>
                  <td>
                    <strong>{item.ingredientName}</strong>
                  </td>
                  <td>
                    {item.grams}g ({item.recipePct.toFixed(1)}%)
                  </td>
                  <td className="font-mono">
                    {fmtWithUnit(item.ingredientValue, currentNutrientMeta.unit)}
                  </td>
                  <td className="font-mono">
                    {fmtWithUnit(item.contributionAmount, currentNutrientMeta.unit)}
                  </td>
                  <td>
                    <div className="pct-progress-cell">
                      <span>{sharePct.toFixed(1)}%</span>
                      <div className="pct-bar-bg">
                        <div
                          className="pct-bar-fill"
                          style={{
                            width: `${Math.min(100, sharePct)}%`,
                            backgroundColor:
                              selectedNutrient === 'protein'
                                ? '#3b82f6'
                                : selectedNutrient === 'dietaryFiber'
                                ? '#10b981'
                                : selectedNutrient === 'sodium'
                                ? '#ef4444'
                                : '#6366f1',
                          }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
