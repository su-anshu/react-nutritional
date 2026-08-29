import React from 'react'
import { calcPercentDV, fmt, perServing } from '../../utils'
import { ROWS } from './shared'

// ── Dual Stat Cards: each nutrient as a small card (100g + serving + %RDA) ──
export default function DualCardsLabel({ data, servingGrams }) {
  return (
    <>
      <div className="cards-title">Nutrition Facts</div>
      <div className="cards-serving">Serving size {data.servingSize}</div>
      <div className="cards-grid">
        {ROWS.map(({ name, field, unit, dvKey }) => (
          <div key={field} className="nutrient-card">
            <div className="nutrient-card-name">{name}</div>
            <div className="nutrient-card-vals">
              <div><span className="nc-label">100g</span>{fmt(data[field])}{unit}</div>
              <div><span className="nc-label">Serving</span>{perServing(data[field], servingGrams)}{unit}</div>
            </div>
            <div className="nutrient-card-dv">{calcPercentDV(dvKey, data[field], servingGrams)}</div>
          </div>
        ))}
      </div>
    </>
  )
}
