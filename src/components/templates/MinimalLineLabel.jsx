import React from 'react'
import { calcPercentDV, perServing } from '../../utils'
import { ROWS } from './shared'

// ── Minimal Line: thin hairlines only, big whitespace, no bold table ──
export default function MinimalLineLabel({ data, servingGrams }) {
  return (
    <>
      <div className="minimal-title">Nutrition</div>
      <div className="minimal-serving">Per serving ({data.servingSize})</div>
      <hr className="minimal-rule" />
      {ROWS.map(({ name, field, unit, dvKey, sub }) => (
        <div key={field} className={`minimal-row${sub ? ' sub' : ''}`}>
          <span className="minimal-name">{name}</span>
          <span className="minimal-val">{perServing(data[field], servingGrams)}{unit}</span>
          <span className="minimal-dv">{calcPercentDV(dvKey, data[field], servingGrams)}</span>
        </div>
      ))}
      <hr className="minimal-rule" />
      <div className="minimal-footnote">Per 100g values available on request. % RDA based on a 2000 kcal diet.</div>
    </>
  )
}
