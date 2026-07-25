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

export default function NutritionLabel({ data, labelRef }) {
  const servingGrams = parseServingGrams(data.servingSize)

  return (
    <div className="nutrition-label" ref={labelRef}>

      {/* Title */}
      <div className="label-title">Nutrition Facts</div>
      <ThinLine />

      {/* Serving size */}
      <div className="serving-row">
        <span>Serving size</span>
        <span>{data.servingSize}</span>
      </div>
      <div className="serving-note">
        Number of servings may vary based on pack size and intended use.
      </div>

      {/* Thick line */}
      <div style={{ marginTop: 8 }}><ThickLine /></div>

      {/* Nutrient table */}
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

      {/* Thick bottom line */}
      <div style={{ marginTop: 3 }}><ThickLine /></div>

      {/* Footnotes */}
      <div className="footnotes">
        <div>* Approximate values</div>
        <div className="footnote2">
          ** Percent Daily Values are based on a 2000 calories diet. Your daily
          values may be higher or lower depending on your calories needs.
        </div>
      </div>

    </div>
  )
}
