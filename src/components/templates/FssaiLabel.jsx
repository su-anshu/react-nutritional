import React from 'react'
import { calcPercentDV, fmt, perServing } from '../../utils'
import { ThinLine, ThickLine, ROWS } from './shared'

// ── FSSAI tabular (Per 100g / Per Serving / % RDA) — original layout ──
export default function FssaiLabel({ data, servingGrams }) {
  return (
    <>
      <div className="label-title">Nutrition Facts</div>
      <ThinLine />

      <div className="serving-row">
        <span>Serving size</span>
        <span>{data.servingSize}</span>
      </div>
      <div className="serving-note">
        Number of servings may vary based on pack size and intended use.
      </div>

      <div style={{ marginTop: 8 }}><ThickLine /></div>

      <table className="nutri-table">
        <thead>
          <tr>
            <th className="col-name"></th>
            <th className="col-num">Per 100g*</th>
            <th className="col-num">Per {servingGrams != null ? `${servingGrams} g` : 'Serving'}</th>
            <th className="col-num">% RDA**</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(({ name, field, unit, dvKey, sub }) => (
            <tr key={field} className={sub ? 'sub' : ''}>
              <td className="col-name">{name}</td>
              <td className="col-num">{fmt(data[field])}{unit}</td>
              <td className="col-num">{perServing(data[field], servingGrams)}{unit}</td>
              <td className="col-num">{calcPercentDV(dvKey, data[field], servingGrams)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 3 }}><ThickLine /></div>

      <div className="footnotes">
        <div>* Approximate values</div>
        <div className="footnote2">
          ** Percent Daily Values are based on a 2000 calories diet. Your daily
          values may be higher or lower depending on your calories needs.
        </div>
      </div>
    </>
  )
}
