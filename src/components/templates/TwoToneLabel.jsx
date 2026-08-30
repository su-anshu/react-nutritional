import React from 'react'
import { calcPercentDV, fmtWithUnit, perServingWithUnit } from '../../utils'
import { ROWS } from './shared'

// ── Two-Tone Split: dark nutrient-name strip vs light value columns ──
export default function TwoToneLabel({ data, servingGrams }) {
  return (
    <>
      <div className="twotone-title">Nutrition Facts</div>
      <div className="twotone-serving">Serving size {data.servingSize || '100g'}</div>
      <table className="twotone-table">
        <thead>
          <tr>
            <th className="tt-name-head"></th>
            <th className="col-num">100g</th>
            <th className="col-num">Serving</th>
            <th className="col-num">% RDA</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(({ name, field, unit, dvKey, sub }) => (
            <tr key={field} className={sub ? 'sub' : ''}>
              <td className="tt-name">{name}</td>
              <td className="col-num">{fmtWithUnit(data[field], unit)}</td>
              <td className="col-num">{perServingWithUnit(data[field], servingGrams, unit)}</td>
              <td className="col-num">{calcPercentDV(dvKey, data[field], servingGrams)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
