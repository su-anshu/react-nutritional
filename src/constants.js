// FSSAI reference RDA values used to compute % RDA.
// Nutrients without an official RDA (e.g. Total Sugars) are intentionally
// omitted so their % RDA renders as "-".
export const DAILY_VALUES = {
  Energy:                2000,
  'Added Sugars':        50,
  'Total Fat':           67,
  'Saturated Fat':       22,
  'Trans Fat':           2,
  'Sodium(mg)':          2000,
}

export const GOOGLE_SHEETS_URL =
  'https://docs.google.com/spreadsheets/d/11dBw92P7Bg0oFyfqramGqdAlLTGhcb2ScjmR_1wtiTM/edit?gid=1800176856#gid=1800176856'

export const DEFAULT_DATA = {
  product:      'Sample Product',
  servingSize:  '20g',
  energy:       510,
  protein:      7.8,
  totalCarb:    68.0,
  totalSugar:   0.5,
  addedSugar:   0.0,
  dietaryFiber: 11.2,
  totalFat:     22.5,
  saturatedFat: 9.2,
  transFat:     0.0,
  sodium:       315.0,
  cholesterol:  0.0,
}
