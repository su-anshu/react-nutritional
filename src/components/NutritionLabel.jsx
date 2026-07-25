import React from 'react'
import { parseServingGrams, calcPercentDV, fmt, perServing } from '../utils'

const ThinLine  = () => <hr className="label-thin-line" />
const ThickLine = () => <hr className="label-thick-line" />

// Nutrient definitions — order matches the FSSAI label layout
const ROWS = [
  { name: 'Energy',        field: 'energy',       unit: 'kcal', dvKey: 'Energy',             sub: false },
  { name: 'Protein',       field: 'protein',      unit: 'g',    dvKey: 'Protein',            sub: false },
  { name: 'Carbohydrates', field: 'totalCarb',    unit: 'g',    dvKey: 'Total Carbohydrate', sub: false },
  { name: 'Total Sugar',   field: 'totalSugar',   unit: 'g',    dvKey: 'Total Sugars',       sub: true  },
  { name: 'Added Sugar',   field: 'addedSugar',   unit: 'g',    dvKey: 'Added Sugars',       sub: true  },
  { name: 'Dietary Fiber', field: 'dietaryFiber', unit: 'g',    dvKey: 'Dietary Fiber',      sub: true  },
  { name: 'Total Fat',     field: 'totalFat',     unit: 'g',    dvKey: 'Total Fat',          sub: false },
  { name: 'Saturated Fat', field: 'saturatedFat', unit: 'g',    dvKey: 'Saturated Fat',      sub: true  },
  { name: 'Trans Fat',     field: 'transFat',     unit: 'g',    dvKey: 'Trans Fat',          sub: true  },
  { name: 'Sodium',        field: 'sodium',       unit: 'mg',   dvKey: 'Sodium(mg)',         sub: false },
  { name: 'Cholesterol',   field: 'cholesterol',  unit: 'mg',   dvKey: 'Cholesterol',        sub: false },
]

// ── FSSAI tabular (Per 100g / Per Serving / % RDA) — original layout ──
function FssaiLabel({ data, servingGrams }) {
  return (
    <>
      <div className="label-title">Nutrition Facts</div>
      <ThinLine />

      <div className="serving-row">
        <span>Serving size</span>
        <span>{data.servingSize}</span>
      </div>
      <div className="serving-note">
        Number of servings may vary based on pack size and intended use.
      </div>

      <div style={{ marginTop: 8 }}><ThickLine /></div>

      <table className="nutri-table">
        <thead>
          <tr>
            <th className="col-name"></th>
            <th className="col-num">Per 100g*</th>
            <th className="col-num">Per {servingGrams != null ? `${servingGrams} g` : 'Serving'}</th>
            <th className="col-num">% RDA**</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(({ name, field, unit, dvKey, sub }) => (
            <tr key={field} className={sub ? 'sub' : ''}>
              <td className="col-name">{name}</td>
              <td className="col-num">{fmt(data[field])}{unit}</td>
              <td className="col-num">{perServing(data[field], servingGrams)}{unit}</td>
              <td className="col-num">{calcPercentDV(dvKey, data[field], servingGrams)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 3 }}><ThickLine /></div>

      <div className="footnotes">
        <div>* Approximate values</div>
        <div className="footnote2">
          ** Percent Daily Values are based on a 2000 calories diet. Your daily
          values may be higher or lower depending on your calories needs.
        </div>
      </div>
    </>
  )
}

// ── FDA-style vertical panel (per serving amounts, %DV on the right) ──
const FDA_ROWS = [
  { label: 'Total Fat',          field: 'totalFat',     unit: 'g',  dvKey: 'Total Fat',          bold: true,  indent: 0 },
  { label: 'Saturated Fat',      field: 'saturatedFat', unit: 'g',  dvKey: 'Saturated Fat',      bold: false, indent: 1 },
  { label: 'Trans Fat',          field: 'transFat',     unit: 'g',  dvKey: 'Trans Fat',          bold: false, indent: 1 },
  { label: 'Cholesterol',        field: 'cholesterol',  unit: 'mg', dvKey: 'Cholesterol',        bold: true,  indent: 0 },
  { label: 'Sodium',             field: 'sodium',       unit: 'mg', dvKey: 'Sodium(mg)',         bold: true,  indent: 0 },
  { label: 'Total Carbohydrate', field: 'totalCarb',    unit: 'g',  dvKey: 'Total Carbohydrate', bold: true,  indent: 0 },
  { label: 'Dietary Fiber',      field: 'dietaryFiber', unit: 'g',  dvKey: 'Dietary Fiber',      bold: false, indent: 1 },
  { label: 'Total Sugars',       field: 'totalSugar',   unit: 'g',  dvKey: 'Total Sugars',       bold: false, indent: 1 },
  { label: 'Added Sugars',       field: 'addedSugar',   unit: 'g',  dvKey: 'Added Sugars',       bold: false, indent: 2 },
  { label: 'Protein',            field: 'protein',      unit: 'g',  dvKey: 'Protein',            bold: true,  indent: 0 },
]

function FdaLabel({ data, servingGrams }) {
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

// ── Compact strip (small packs): key values per 100g in a grid ──
const COMPACT_ITEMS = [
  { label: 'Energy',  field: 'energy',     unit: 'kcal' },
  { label: 'Protein', field: 'protein',    unit: 'g' },
  { label: 'Carbs',   field: 'totalCarb',  unit: 'g' },
  { label: 'Sugar',   field: 'totalSugar', unit: 'g' },
  { label: 'Fat',     field: 'totalFat',   unit: 'g' },
  { label: 'Sodium',  field: 'sodium',     unit: 'mg' },
]

function CompactLabel({ data }) {
  return (
    <>
      <div className="compact-title">Nutrition Information</div>
      <div className="compact-serving">Per 100g* · Serving size {data.servingSize}</div>
      <ThickLine />
      <div className="compact-grid">
        {COMPACT_ITEMS.map(({ label, field, unit }) => (
          <div key={field} className="compact-cell">
            <div className="compact-value">{fmt(data[field])}{unit}</div>
            <div className="compact-name">{label}</div>
          </div>
        ))}
      </div>
      <ThickLine />
      <div className="footnotes" style={{ marginTop: 4 }}>* Approximate values</div>
    </>
  )
}

export default function NutritionLabel({ data, labelRef, template = 'fssai' }) {
  const servingGrams = parseServingGrams(data.servingSize)
  const Body =
    template === 'fda'     ? FdaLabel :
    template === 'compact' ? CompactLabel :
    FssaiLabel

  return (
    <div className={`nutrition-label template-${template}`} ref={labelRef}>
      <Body data={data} servingGrams={servingGrams} />
    </div>
  )
}
