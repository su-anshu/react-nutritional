import React from 'react'

export const ThinLine  = () => <hr className="label-thin-line" />
export const ThickLine = () => <hr className="label-thick-line" />

// Nutrient definitions — order matches the FSSAI label layout
export const ROWS = [
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

// FDA-style vertical panel row order (per serving amounts, %DV on the right)
export const FDA_ROWS = [
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

// Compact strip (small packs): key values per 100g in a grid
export const COMPACT_ITEMS = [
  { label: 'Energy',  field: 'energy',     unit: 'kcal' },
  { label: 'Protein', field: 'protein',    unit: 'g' },
  { label: 'Carbs',   field: 'totalCarb',  unit: 'g' },
  { label: 'Sugar',   field: 'totalSugar', unit: 'g' },
  { label: 'Fat',     field: 'totalFat',   unit: 'g' },
  { label: 'Sodium',  field: 'sodium',     unit: 'mg' },
]
