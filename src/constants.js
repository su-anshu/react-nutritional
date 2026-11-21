// FSSAI & ICMR reference RDA values used to compute % RDA.
// Nutrients without an official RDA (e.g. Total Sugars) are intentionally
// omitted so their % RDA renders as "-".
export const DAILY_VALUES = {
  Energy: 2000,
  Protein: 54,
  'Added Sugars': 50,
  'Dietary Fiber': 30,
  'Total Fat': 67,
  'Saturated Fat': 22,
  'Trans Fat': 2,
  'Sodium(mg)': 2000,
  Calcium: 1000,
  Iron: 19,
}

export const GOOGLE_SHEETS_URL =
  'https://docs.google.com/spreadsheets/d/11dBw92P7Bg0oFyfqramGqdAlLTGhcb2ScjmR_1wtiTM/edit?gid=1800176856#gid=1800176856'

export const DEFAULT_DATA = {
  product: 'Chana Sattu',
  servingSize: '25g',
  energy: 394,
  protein: 22.5,
  totalCarb: 64.0,
  availableCarb: 47.0,
  totalSugar: 0.8,
  addedSugar: 0.0,
  dietaryFiber: 17.0,
  totalFat: 5.2,
  saturatedFat: 0.45,
  transFat: 0.0,
  sodium: 20.0,
  cholesterol: 0.0,
  calcium: null,
  iron: null,
  potassium: null,
  magnesium: null,
  folate: null,
  vitaminC: null,
  dataOrigin: 'INTERNAL_CONFIRMED_BASE',
}

export const TEMPLATE_GROUPS = [
  {
    group: 'REGULATORY REFERENCE PANELS',
    disclaimer: 'Statutory layout references. Final statutory layout should be reviewed against current applicable labelling regulations.',
    isRegulatory: true,
    templates: [
      { id: 'fssai', label: 'FSSAI-style Nutrition Panel', type: 'regulatory' },
      { id: 'fda', label: 'FDA-style Nutrition Facts', type: 'regulatory' },
    ],
  },
  {
    group: 'Marketing / Digital / Quick Nutrition Views',
    disclaimer: 'Marketing templates are promotional presentations and are NOT substitutes for statutory nutrition panels.',
    isRegulatory: false,
    templates: [
      { id: 'compact', label: 'Compact Strip (Quick View)', type: 'marketing' },
      { id: 'boxed-banner', label: 'Boxed Banner', type: 'marketing' },
      { id: 'curved-panel', label: 'Curved Modern Panel', type: 'marketing' },
      { id: 'dark-premium', label: 'Dark Premium Gold', type: 'marketing' },
      { id: 'dual-cards', label: 'Dual Stat Cards', type: 'marketing' },
      { id: 'editorial', label: 'Editorial Magazine', type: 'marketing' },
      { id: 'hero-tiles', label: 'Hero Highlights (Energy + Protein)', type: 'marketing' },
      { id: 'icon-row', label: 'Color Swatch Icon Rows', type: 'marketing' },
      { id: 'minimal-line', label: 'Minimal Hairline', type: 'marketing' },
      { id: 'rda-ring', label: 'Circular RDA Progress Rings', type: 'marketing' },
      { id: 'two-tone', label: 'Two-Tone Split', type: 'marketing' },
    ],
  },
]
