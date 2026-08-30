import React from 'react'
import { fmtWithUnit } from '../../utils'
import { ThickLine, COMPACT_ITEMS } from './shared'

// ── Compact strip (small packs): key values per 100g in a grid ──
export default function CompactLabel({ data }) {
  return (
    <>
      <div className="compact-title">Nutrition Information</div>
      <div className="compact-serving">Per 100g* · Serving size {data.servingSize || '100g'}</div>
      <ThickLine />
      <div className="compact-grid">
        {COMPACT_ITEMS.map(({ label, field, unit }) => (
          <div key={field} className="compact-cell">
            <div className="compact-value">{fmtWithUnit(data[field], unit)}</div>
            <div className="compact-name">{label}</div>
          </div>
        ))}
      </div>
      <ThickLine />
      <div className="footnotes" style={{ marginTop: 4 }}>* Approximate values</div>
    </>
  )
}
