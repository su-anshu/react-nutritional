import React from 'react'
import { calcPercentDV, perServing } from '../../utils'
import { ThinLine, ThickLine, FDA_ROWS } from './shared'

// ── FDA-style vertical panel (per serving amounts, %DV on the right) ──
export default function FdaLabel({ data, servingGrams }) {
  return (
    <>
      <div className="label-title">Nutrition Facts</div>
      <ThinLine />

      <div className="serving-row">
        <span>Serving size</span>
        <span>{data.servingSize}</span>
      </div>

      <div style={{ marginTop: 6 }}><ThickLine /></div>

      <div className="fda-cal-row">
        <div>
          <div className="fda-cal-caption">Amount per serving</div>
          <div className="fda-cal-word">Calories</div>
        </div>
        <div className="fda-cal-value">
          {Math.round(parseFloat(perServing(data.energy, servingGrams)) || 0)}
        </div>
      </div>

      <div className="fda-mid-line" />
      <div className="fda-dv-head">% Daily Value*</div>
      <ThinLine />

      {FDA_ROWS.map(({ label, field, unit, dvKey, bold, indent }) => (
        <div key={field} className={`fda-row${bold ? ' bold' : ''} indent-${indent}`}>
          <span className="fda-row-name">
            <span className="fda-row-label">{label}</span> {perServing(data[field], servingGrams)}{unit}
          </span>
          <span className="fda-row-dv">{calcPercentDV(dvKey, data[field], servingGrams)}</span>
        </div>
      ))}

      <div style={{ marginTop: 2 }}><ThickLine /></div>

      <div className="footnotes">
        * Percent Daily Values are based on a 2000 calories diet. Your daily
        values may be higher or lower depending on your calories needs.
      </div>
    </>
  )
}
