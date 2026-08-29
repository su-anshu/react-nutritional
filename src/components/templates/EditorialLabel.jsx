import React from 'react'
import { calcPercentDV, fmt, perServing } from '../../utils'
import { ROWS } from './shared'

// ── Editorial: serif masthead, hairline table, magazine-style footnote ──
export default function EditorialLabel({ data, servingGrams }) {
  return (
    <>
      <div className="ed-masthead">Nutrition Facts</div>
      <div className="ed-serving">Serving size <em>{data.servingSize}</em></div>
      <table className="ed-table">
        <thead>
          <tr>
            <th className="col-name"></th>
            <th className="col-num">Per 100g</th>
            <th className="col-num">Per Serving</th>
            <th className="col-num">% RDA</th>
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
      <div className="ed-footnote">Values approximate. Percent RDA based on a 2000 kcal reference diet.</div>
    </>
  )
}
