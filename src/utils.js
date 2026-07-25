import { DAILY_VALUES } from './constants'

export function parseServingGrams(servingStr) {
  const m = String(servingStr).match(/(\d+(?:\.\d+)?)\s*g\b/i)
  return m ? parseFloat(m[1]) : null
}

export function calcPercentDV(nutrientKey, valuePer100g, servingGrams) {
  const dv = DAILY_VALUES[nutrientKey]
  if (!dv || servingGrams == null) return '-'
  const val = parseFloat(valuePer100g)
  if (isNaN(val) || val < 0) return '-'
  if (val === 0) return '0.0%'
  const pct = (val * servingGrams / 100 / dv) * 100
  return `${pct.toFixed(1)}%`
}

export function fmt(val) {
  const n = parseFloat(val)
  return isNaN(n) ? '0.0' : n.toFixed(1)
}

// Convert a per-100g value into the per-serving amount, formatted.
export function perServing(valuePer100g, servingGrams) {
  const v = parseFloat(valuePer100g)
  if (isNaN(v) || servingGrams == null) return fmt(valuePer100g)
  return fmt(v * servingGrams / 100)
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

// Map a CSV row object → label data shape
export function rowToData(row) {
  const n = (key, fallback = 0) => {
    const v = parseFloat(row[key])
    return isNaN(v) ? fallback : v
  }
  return {
    product:      row['Product'] ?? '',
    servingSize:  row['Serving Size'] ?? '100g',
    energy:       n('Energy'),
    protein:      n('Protein'),
    totalCarb:    n('Total Carbohydrate'),
    totalSugar:   n('Total Sugars'),
    addedSugar:   n('Added Sugars'),
    dietaryFiber: n('Dietary Fiber'),
    totalFat:     n('Total Fat'),
    saturatedFat: n('Saturated Fat'),
    transFat:     n('Trans Fat'),
    sodium:       n('Sodium(mg)'),
    cholesterol:  n('Cholesterol'),
  }
}
