import React from 'react'
import { calcPercentDV, perServing } from '../../utils'
import { FDA_ROWS } from './shared'

// ── Dark Premium: dark background, gold text, FDA-vertical layout ──
export default function DarkPremiumLabel({ data, servingGrams }) {
  return (
    <>
      <div className="dp-title">Nutrition Facts</div>
      <div className="dp-serving">Serving size {data.servingSize}</div>
      <div className="dp-cal-row">
        <span>Calories</span>
        <span className="dp-cal-value">
          {Math.round(parseFloat(perServing(data.energy, servingGrams)) || 0)}
        </span>
      </div>
      <div className="dp-divider" />
      {FDA_ROWS.map(({ label, field, unit, dvKey, bold, indent }) => (
        <div key={field} className={`dp-row${bold ? ' bold' : ''} indent-${indent}`}>
          <span>{label} {perServing(data[field], servingGrams)}{unit}</span>
          <span className="dp-dv">{calcPercentDV(dvKey, data[field], servingGrams)}</span>
        </div>
      ))}
    </>
  )
}
