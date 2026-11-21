import React from 'react'
import {
  calculateAminoAcids,
  ESSENTIAL_AMINO_ACIDS,
  NON_ESSENTIAL_AMINO_ACIDS,
} from '../../engine/aminoAcidEngine'
import { fmtWithUnit } from '../../utils'

export default function AminoAcidPanel({ recipe, ingredientMaster, totalProtein }) {
  const aminoResult = calculateAminoAcids(recipe, ingredientMaster, totalProtein)
  const { values, totals, hasData, disclaimer } = aminoResult

  if (!hasData) {
    return (
      <div className="card-panel amino-panel">
        <h4>Amino Acid & Protein Quality Profile</h4>
        <p className="subtext">
          Amino acid assay data is not available for the ingredients in this formulation.
          (Pure Chana Sattu, Pea Protein Isolate, and Moringa contain standard EAA assays in the master database).
        </p>
      </div>
    )
  }

  return (
    <div className="card-panel amino-panel">
      {/* Top BCAA and EAA KPI Cards */}
      <div className="amino-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Branched-Chain Amino Acids (BCAA)</div>
          <div className="kpi-val highlight-bcaa">
            {totals.totalBcaa != null ? (
              totals.isBcaaPartial ? `≥${totals.totalBcaa.toFixed(2)}g*` : `${totals.totalBcaa.toFixed(2)}g`
            ) : '—'}
          </div>
          <div className="kpi-sub">
            {totals.isBcaaPartial ? (
              <span className="warning-text">
                *Partial estimate ({totals.minBcaaProteinCoverage}% protein coverage)
              </span>
            ) : totals.bcaaProteinPct != null ? (
              `${totals.bcaaProteinPct}% of total protein (Leu + Ile + Val)`
            ) : (
              'Per 100g finished product'
            )}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Total Essential Amino Acids (EAA)</div>
          <div className="kpi-val">
            {totals.totalEaa != null ? `${totals.totalEaa.toFixed(2)}g` : '—'}
          </div>
          <div className="kpi-sub">
            {totals.eaaProteinPct != null
              ? `${totals.eaaProteinPct}% of total protein`
              : 'Per 100g finished product'}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Sulfur Amino Acids</div>
          <div className="kpi-val">
            {totals.totalSulfurAa != null ? `${totals.totalSulfurAa.toFixed(2)}g` : '—'}
          </div>
          <div className="kpi-sub">Methionine + Cysteine / 100g</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Aromatic Amino Acids</div>
          <div className="kpi-val">
            {totals.totalAromaticAa != null ? `${totals.totalAromaticAa.toFixed(2)}g` : '—'}
          </div>
          <div className="kpi-sub">Phenylalanine + Tyrosine / 100g</div>
        </div>
      </div>

      {/* PDCAAS / Bio-availability Statutory Disclaimer Banner */}
      <div className="amino-disclaimer-banner">
        ℹ️ <strong>Protein Bio-efficacy Notice:</strong> {disclaimer} Complete protein claims require bio-assay validation.
      </div>

      {/* Amino Acid Tables */}
      <div className="amino-tables-grid">
        {/* Essential Amino Acids */}
        <div className="amino-table-wrapper">
          <h5>Essential Amino Acids (EAA)</h5>
          <table className="formulation-table">
            <thead>
              <tr>
                <th>Amino Acid</th>
                <th>Per 100g</th>
                <th>Type</th>
                <th>Coverage</th>
              </tr>
            </thead>
            <tbody>
              {ESSENTIAL_AMINO_ACIDS.map(({ key, name, symbol, isBcaa }) => {
                const item = values[key]
                return (
                  <tr key={key}>
                    <td>
                      <strong>{name}</strong> <span className="subtext">({symbol})</span>
                    </td>
                    <td className="font-mono">
                      {fmtWithUnit(item?.amountPer100g, 'g', 2)}
                    </td>
                    <td>
                      {isBcaa ? (
                        <span className="badge badge-info">BCAA</span>
                      ) : (
                        <span className="badge badge-neutral">EAA</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${item?.isComplete ? 'badge-success' : 'badge-warning'}`}>
                        {item?.proteinCoveragePct || 0}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Non-Essential Amino Acids */}
        <div className="amino-table-wrapper">
          <h5>Non-Essential & Conditionally Essential</h5>
          <table className="formulation-table">
            <thead>
              <tr>
                <th>Amino Acid</th>
                <th>Per 100g</th>
                <th>Type</th>
                <th>Coverage</th>
              </tr>
            </thead>
            <tbody>
              {NON_ESSENTIAL_AMINO_ACIDS.map(({ key, name, symbol, isSulfur, isAromatic }) => {
                const item = values[key]
                return (
                  <tr key={key}>
                    <td>
                      <strong>{name}</strong> <span className="subtext">({symbol})</span>
                    </td>
                    <td className="font-mono">
                      {fmtWithUnit(item?.amountPer100g, 'g', 2)}
                    </td>
                    <td>
                      {isSulfur ? (
                        <span className="badge badge-warning">Sulfur</span>
                      ) : isAromatic ? (
                        <span className="badge badge-purple">Aromatic</span>
                      ) : (
                        <span className="badge badge-neutral">NEAA</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${item?.isComplete ? 'badge-success' : 'badge-warning'}`}>
                        {item?.proteinCoveragePct || 0}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
