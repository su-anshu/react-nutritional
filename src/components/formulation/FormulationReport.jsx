import React from 'react'
import { fmtWithUnit, perServingWithUnit, calcPercentDV } from '../../utils'
import { ROWS } from '../templates/shared'
import { validateFormulation } from '../../engine/validationEngine'
import { evaluateClaims } from '../../engine/claimEngine'
import { calculateAminoAcids } from '../../engine/aminoAcidEngine'

export default function FormulationReport({ recipe, ingredientMaster, formulationResult }) {
  if (!formulationResult) return null

  const validation = validateFormulation(formulationResult)
  const claims = evaluateClaims(formulationResult.nutrients, formulationResult.metadata)
  const amino = calculateAminoAcids(
    recipe,
    ingredientMaster,
    formulationResult.nutrients.protein
  )

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="card-panel formulation-report-panel">
      <div className="report-header-row">
        <div>
          <h4>Technical Formulation & Compliance Report</h4>
          <p className="subtext">
            Audit-ready technical dossier for food technologists, QA, and regulatory compliance.
          </p>
        </div>
        <button type="button" className="btn btn-secondary btn-print-report" onClick={handlePrint}>
          🖨️ Print / Save PDF Dossier
        </button>
      </div>

      <div className="report-sheet" id="printable-formulation-report">
        {/* Document Header */}
        <div className="report-doc-head">
          <div className="doc-title-block">
            <h2>FOOD PRODUCT TECHNICAL SPECIFICATION DOSSIER</h2>
            <div className="doc-subtitle">{recipe.name || 'Sattu Formulation'}</div>
          </div>
          <div className="doc-meta-block">
            <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
            <div><strong>Batch Base Weight:</strong> {formulationResult.totalWeight}g</div>
            <div><strong>Serving Size:</strong> {formulationResult.servingSize} ({formulationResult.servingGrams}g)</div>
            <div><strong>Integrity Status:</strong> {validation.overallStatus} ({validation.score}/100)</div>
          </div>
        </div>

        {/* Section 1: Recipe Formulation Breakdown */}
        <div className="report-section">
          <h3>1. Recipe Formulation Breakdown</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Ingredient</th>
                <th>Category</th>
                <th>Batch Grams</th>
                <th>Recipe %</th>
                <th>Data Source</th>
                <th>Provenance Notes</th>
              </tr>
            </thead>
            <tbody>
              {recipe.items.map((item, idx) => {
                const ing = ingredientMaster.find((i) => i.id === item.ingredientId)
                const pct = formulationResult.totalWeight > 0
                  ? (Number(item.grams) / formulationResult.totalWeight) * 100
                  : 0
                return (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td><strong>{ing?.name || item.ingredientId}</strong></td>
                    <td>{ing?.category || '—'}</td>
                    <td className="font-mono">{item.grams}g</td>
                    <td className="font-mono">{pct.toFixed(1)}%</td>
                    <td>{ing?.metadata?.sourceType || 'IFCT'}</td>
                    <td>{ing?.metadata?.notes || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Section 2: Calculated Nutritional Panel */}
        <div className="report-section">
          <h3>2. Finished Product Nutritional Composition</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Nutrient</th>
                <th>Per 100g</th>
                <th>Per Serving ({formulationResult.servingSize})</th>
                <th>% RDA (Serving)</th>
                <th>Data Coverage</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(({ name, field, unit, dvKey, sub }) => (
                <tr key={field} className={sub ? 'row-sub' : ''}>
                  <td>{sub ? '  ↳ ' : ''}{name}</td>
                  <td className="font-mono">{fmtWithUnit(formulationResult.nutrients[field], unit)}</td>
                  <td className="font-mono">{perServingWithUnit(formulationResult.nutrients[field], formulationResult.servingGrams, unit)}</td>
                  <td className="font-mono">{calcPercentDV(dvKey, formulationResult.nutrients[field], formulationResult.servingGrams)}</td>
                  <td>{formulationResult.coverage?.[field]?.percentage || 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 3: Amino Acid Profile */}
        {amino.hasData && (
          <div className="report-section">
            <h3>3. Amino Acid & Protein Quality</h3>
            <div className="report-mini-stats">
              <div><strong>Total BCAA:</strong> {amino.totals.totalBcaa}g / 100g ({amino.totals.bcaaProteinPct}% of protein)</div>
              <div><strong>Total EAA:</strong> {amino.totals.totalEaa}g / 100g ({amino.totals.eaaProteinPct}% of protein)</div>
              <div><strong>Sulfur AA:</strong> {amino.totals.totalSulfurAa}g / 100g</div>
            </div>
          </div>
        )}

        {/* Section 4: Regulatory Claims & Declarations */}
        <div className="report-section">
          <h3>4. Statutory Compliance & FSSAI Claims Summary</h3>
          <div className="report-claims-summary">
            <div>
              <strong>Eligible FSSAI Claims:</strong>{' '}
              {claims.eligibleClaims.map((c) => c.claimText).join(', ') || 'None'}
            </div>
            {formulationResult.metadata?.hasAddedSalt && (
              <div className="advisory-text">
                ⚠️ Contains Added Salt ({formulationResult.metadata.addedSaltGrams}g). &apos;No Added Salt&apos; claim is prohibited.
              </div>
            )}
            {formulationResult.metadata?.hasGluten && (
              <div className="advisory-text">
                ⚠️ Statutory Allergen Statement: CONTAINS GLUTEN / BARLEY.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
