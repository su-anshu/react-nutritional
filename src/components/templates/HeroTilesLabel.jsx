import React from 'react'
import { calcPercentDV, fmt, perServing } from '../../utils'
import { ROWS } from './shared'

const HERO_FIELDS = ['energy', 'protein']

// ── Hero Tiles: Energy + Protein as big colored tiles, rest in small table ──
export default function HeroTilesLabel({ data, servingGrams }) {
  const heroRows = ROWS.filter(r => HERO_FIELDS.includes(r.field))
  const restRows = ROWS.filter(r => !HERO_FIELDS.includes(r.field))
  return (
    <>
      <div className="hero-title">Nutrition Facts</div>
      <div className="hero-serving">Serving size {data.servingSize}</div>
      <div className="hero-tiles">
        {heroRows.map(({ name, field, unit }) => (
          <div key={field} className="hero-tile">
            <div className="hero-tile-value">{perServing(data[field], servingGrams)}{unit}</div>
            <div className="hero-tile-name">{name} / serving</div>
          </div>
        ))}
      </div>
      <table className="hero-table">
        <thead>
          <tr>
            <th className="col-name"></th>
            <th className="col-num">100g</th>
            <th className="col-num">Serving</th>
            <th className="col-num">% RDA</th>
          </tr>
        </thead>
        <tbody>
          {restRows.map(({ name, field, unit, dvKey, sub }) => (
            <tr key={field} className={sub ? 'sub' : ''}>
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
