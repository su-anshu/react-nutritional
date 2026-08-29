import React from 'react'
import { calcPercentDV, fmt, perServing } from '../../utils'
import { ROWS } from './shared'

// Small SVG progress ring rendering a "NN.N%" string (or a dash when absent)
function Ring({ pctText }) {
  if (pctText === '-') return <span className="ring-dash">-</span>
  const pct = Math.min(parseFloat(pctText) || 0, 100)
  const r = 9
  const c = 2 * Math.PI * r
  const offset = c * (1 - pct / 100)
  return (
    <span className="ring-wrap">
      <svg width="22" height="22" viewBox="0 0 22 22">
        <circle cx="11" cy="11" r={r} className="ring-bg" />
        <circle
          cx="11" cy="11" r={r}
          className="ring-fg"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 11 11)"
        />
      </svg>
      <span className="ring-text">{pctText}</span>
    </span>
  )
}

// ── RDA Ring: each row's %RDA rendered as a small progress ring ──
export default function RdaRingLabel({ data, servingGrams }) {
  return (
    <>
      <div className="rr-title">Nutrition Facts</div>
      <div className="rr-serving">Serving size {data.servingSize}</div>
      <table className="rr-table">
        <thead>
          <tr>
            <th className="col-name"></th>
            <th className="col-num">100g</th>
            <th className="col-num">Serving</th>
            <th className="rr-dv-head">% RDA</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(({ name, field, unit, dvKey, sub }) => (
            <tr key={field} className={sub ? 'sub' : ''}>
              <td className="col-name">{name}</td>
              <td className="col-num">{fmt(data[field])}{unit}</td>
              <td className="col-num">{perServing(data[field], servingGrams)}{unit}</td>
              <td className="rr-dv-cell"><Ring pctText={calcPercentDV(dvKey, data[field], servingGrams)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
