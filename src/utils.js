import { DAILY_VALUES } from './constants'

export function isNumeric(val) {
  if (val === null || val === undefined || val === '') return false
  const n = Number(val)
  return !isNaN(n) && isFinite(n)
}

export function parseServingGrams(servingStr) {
  if (!servingStr) return null
  const m = String(servingStr).match(/(\d+(?:\.\d+)?)\s*g\b/i)
  return m ? parseFloat(m[1]) : null
}

export function calcPercentDV(nutrientKey, valuePer100g, servingGrams) {
  const dv = DAILY_VALUES[nutrientKey]
  if (!dv || servingGrams == null || !isNumeric(valuePer100g)) return '-'
  const val = parseFloat(valuePer100g)
  if (val < 0) return '-'
  if (val === 0) return '0.0%'
  const pct = (val * servingGrams / 100 / dv) * 100
  return `${pct.toFixed(1)}%`
}

export function fmt(val, decimals = 1) {
  if (!isNumeric(val)) return '—'
  const n = parseFloat(val)
  return n.toFixed(decimals)
}

// Convert a per-100g value into the per-serving amount, formatted.
export function perServing(valuePer100g, servingGrams, decimals = 1) {
  if (!isNumeric(valuePer100g) || servingGrams == null) return '—'
  const v = parseFloat(valuePer100g)
  return fmt(v * servingGrams / 100, decimals)
}

// Format a value with its unit attached, or return '—' if missing (without dangling unit)
export function fmtWithUnit(val, unit = '', decimals = 1) {
  if (!isNumeric(val)) return '—'
  return `${fmt(val, decimals)}${unit}`
}

// Format a per-serving value with its unit attached, or return '—' if missing
export function perServingWithUnit(valuePer100g, servingGrams, unit = '', decimals = 1) {
  if (!isNumeric(valuePer100g) || servingGrams == null) return '—'
  return `${perServing(valuePer100g, servingGrams, decimals)}${unit}`
}

// Convert Google Sheets share URL → CSV export URL
export function sheetsUrlToCsv(url) {
  const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/)
  if (!idMatch) throw new Error('Invalid Google Sheets URL')
  const sheetId = idMatch[1]
  const gidMatch = url.match(/[?#]gid=(\d+)/)
  const gid = gidMatch ? gidMatch[1] : '0'
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`
}

// Parse CSV text → array of objects
export function parseCsv(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map(line => {
    // Handle quoted fields with commas inside
    const cols = []
    let cur = '', inQuote = false
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote }
      else if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = '' }
      else cur += ch
    }
    cols.push(cur.trim())
    const obj = {}
    headers.forEach((h, i) => { obj[h] = cols[i] ?? '' })
    return obj
  })
}

// Map a CSV row object → label data shape (missing values remain null, never converted to zero)
export function rowToData(row) {
  const parseCell = (key) => {
    const raw = row[key]
    if (raw === undefined || raw === null || String(raw).trim() === '' || String(raw).trim() === '-' || String(raw).trim() === '—') {
      return null
    }
    const v = parseFloat(raw)
    return isNaN(v) ? null : v
  }

  return {
    product:      row['Product'] ?? '',
    servingSize:  row['Serving Size'] ?? '100g',
    energy:       parseCell('Energy'),
    protein:      parseCell('Protein'),
    totalCarb:    parseCell('Total Carbohydrate'),
    totalSugar:   parseCell('Total Sugars'),
    addedSugar:   parseCell('Added Sugars'),
    dietaryFiber: parseCell('Dietary Fiber'),
    totalFat:     parseCell('Total Fat'),
    saturatedFat: parseCell('Saturated Fat'),
    transFat:     parseCell('Trans Fat'),
    sodium:       parseCell('Sodium(mg)'),
    cholesterol:  parseCell('Cholesterol'),
  }
}
