import React from 'react'
import { calcPercentDV, fmt, perServing } from '../../utils'
import { ROWS } from './shared'

// ── Boxed Banner: bordered box, colored title banner, colored table header ──
export default function BoxedBannerLabel({ data, servingGrams }) {
  return (
    <>
      <div className="boxed-banner">{data.product || 'Nutrition Facts'}</div>
      <div className="boxed-sub">Nutritional Information (Approx.)</div>
      <div className="boxed-serving">Serving size: {data.servingSize}</div>

      <table className="boxed-table">
        <thead>
          <tr>
            <th className="col-name"></th>
            <th className="col-num">per {servingGrams != null ? `${servingGrams} g` : 'serving'}</th>
            <th className="col-num">per 100g</th>
            <th className="col-num">% RDA</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(({ name, field, unit, dvKey, sub }, i) => (
            <tr key={field} className={`${sub ? 'sub' : ''} ${i % 2 ? 'alt' : ''}`}>
              <td className="col-name">{name}</td>
              <td className="col-num">{perServing(data[field], servingGrams)}{unit}</td>
              <td className="col-num">{fmt(data[field])}{unit}</td>
              <td className="col-num">{calcPercentDV(dvKey, data[field], servingGrams)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="boxed-footnote">* Values approximate. % RDA based on a 2000 kcal diet.</div>
    </>
  )
}
