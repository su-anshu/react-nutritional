import React from 'react'
import { calcPercentDV, fmt, perServing } from '../../utils'
import { ROWS } from './shared'

// Category color swatch per nutrient — groups sub-rows under their parent's hue
const SWATCH = {
  energy: '#f59e0b', protein: '#3b82f6',
  totalCarb: '#10b981', totalSugar: '#10b981', addedSugar: '#10b981', dietaryFiber: '#10b981',
  totalFat: '#ef4444', saturatedFat: '#ef4444', transFat: '#ef4444',
  sodium: '#8b5cf6', cholesterol: '#6b7280',
}

// ── Icon Row: colored category swatch beside each nutrient name ──
export default function IconRowLabel({ data, servingGrams }) {
  return (
    <>
      <div className="ir-title">Nutrition Facts</div>
      <div className="ir-serving">Serving size {data.servingSize}</div>
      <table className="ir-table">
        <thead>
          <tr>
            <th className="ir-swatch-head"></th>
            <th className="col-name"></th>
            <th className="col-num">100g</th>
            <th className="col-num">Serving</th>
            <th className="col-num">% RDA</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(({ name, field, unit, dvKey, sub }) => (
            <tr key={field} className={sub ? 'sub' : ''}>
              <td className="ir-swatch"><span style={{ background: SWATCH[field] }} /></td>
              <td className="col-name">{name}</td>
              <td className="col-num">{fmt(data[field])}{unit}</td>
              <td className="col-num">{perServing(data[field], servingGrams)}{unit}</td>
              <td className="col-num">{calcPercentDV(dvKey, data[field], servingGrams)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
