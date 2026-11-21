import React from 'react'
import { calcPercentDV, fmtWithUnit, perServingWithUnit } from '../../utils'
import { ROWS } from './shared'

// ── Curved Panel: rounded card, soft shadow, gradient accent bar ──
export default function CurvedPanelLabel({ data, servingGrams }) {
  return (
    <>
      <div className="curved-accent-bar" />
      <div className="curved-head">
        <div className="curved-title">Nutrition Facts</div>
        <div className="curved-serving">Serving size {data.servingSize || '100g'}</div>
      </div>
      <div className="curved-table-wrap">
        <table className="curved-table">
          <thead>
            <tr>
              <th className="col-name"></th>
              <th className="col-num">100 g</th>
              <th className="col-num">Serving</th>
              <th className="col-num">% RDA</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(({ name, field, unit, dvKey, sub }) => (
              <tr key={field} className={sub ? 'sub' : ''}>
                <td className="col-name">{name}</td>
                <td className="col-num">{fmtWithUnit(data[field], unit)}</td>
                <td className="col-num">{perServingWithUnit(data[field], servingGrams, unit)}</td>
                <td className="col-num">{calcPercentDV(dvKey, data[field], servingGrams)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
