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
  product: 'Pure Chana Sattu (Classic)',
  servingSize: '50g',
  energy: 388,
  protein: 22.5,
  totalCarb: 59.8,
  availableCarb: 47.3,
  totalSugar: 3.2,
  addedSugar: 0.0,
  dietaryFiber: 12.5,
  totalFat: 5.2,
  saturatedFat: 0.8,
  transFat: 0.0,
  sodium: 35.0,
  cholesterol: 0.0,
  calcium: 58.0,
  iron: 7.2,
  potassium: 780.0,
  magnesium: 130.0,
  folate: 180.0,
  vitaminC: 0.0,
}

export const TEMPLATE_GROUPS = [
  {
    group: 'Regulatory Statutory Panels',
    disclaimer: 'Statutory compliance templates adhering strictly to official food authority labelling mandates.',
    isRegulatory: true,
    templates: [
      { id: 'fssai', label: 'FSSAI Standard (India Statutory)', type: 'regulatory' },
      { id: 'fda', label: 'FDA Nutrition Facts (US Statutory)', type: 'regulatory' },
      { id: 'compact', label: 'Compact Strip (Small Packs)', type: 'regulatory' },
    ],
  },
  {
    group: 'Marketing & Consumer Layouts',
    disclaimer: 'Marketing templates are visual promotional presentations and are NOT substitutes for statutory nutrition panels.',
    isRegulatory: false,
    templates: [
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

