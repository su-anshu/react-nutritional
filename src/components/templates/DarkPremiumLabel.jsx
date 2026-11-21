import React from 'react'
import { calcPercentDV, perServing, perServingWithUnit } from '../../utils'
import { FDA_ROWS } from './shared'

// ── Dark Premium: dark background, gold text, FDA-vertical layout ──
export default function DarkPremiumLabel({ data, servingGrams }) {
  const calVal = perServing(data.energy, servingGrams, 0)
  return (
    <>
      <div className="dp-title">Nutrition Facts</div>
      <div className="dp-serving">Serving size {data.servingSize || '100g'}</div>
      <div className="dp-cal-row">
        <span>Calories</span>
        <span className="dp-cal-value">
          {calVal === '—' ? '—' : Math.round(parseFloat(calVal))}
        </span>
      </div>
      <div className="dp-divider" />
      {FDA_ROWS.map(({ label, field, unit, dvKey, bold, indent }) => (
        <div key={field} className={`dp-row${bold ? ' bold' : ''} indent-${indent}`}>
          <span>{label} {perServingWithUnit(data[field], servingGrams, unit)}</span>
          <span className="dp-dv">{calcPercentDV(dvKey, data[field], servingGrams)}</span>
        </div>
      ))}
    </>
  )
}
