import {
  calcPercentDV,
  fmt,
  parseServingGrams,
  perServing,
  perServingWithUnit,
} from './utils'
import { ROWS, FDA_ROWS } from './components/templates/shared'

export const VECTOR_SVG_TEMPLATES = ['fssai', 'fda']

export function supportsVectorSvg(template) {
  return VECTOR_SVG_TEMPLATES.includes(template)
}

export function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

let measureCtx = null
function getMeasureContext() {
  if (measureCtx) return measureCtx
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas')
    measureCtx = canvas.getContext('2d')
  }
  return measureCtx
}

function measureTextWidth(text, fontSize, fontWeight = 'normal', fontFamily = 'Arial') {
  const ctx = getMeasureContext()
  if (ctx) {
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
    return ctx.measureText(text).width
  }
  // Deterministic fallback for headless/Node test environments
  const avgFactor = fontWeight === 'bold' || fontWeight === '800' ? 0.57 : 0.53
  return String(text).length * fontSize * avgFactor
}

export function wrapText(text, maxWidth, fontSize, fontWeight = 'normal') {
  const words = String(text ?? '').trim().split(/\s+/).filter(Boolean)
  if (!words.length) return []

  const lines = []
  let current = words[0]

  for (let i = 1; i < words.length; i++) {
    const candidate = `${current} ${words[i]}`
    if (measureTextWidth(candidate, fontSize, fontWeight) <= maxWidth) {
      current = candidate
    } else {
      lines.push(current)
      current = words[i]
    }
  }
  lines.push(current)
  return lines
}

const FONT_REGULAR = 'ArialMT'
const FONT_BLACK = 'Arial-Black'

function buildFssaiSvg(data, mmWidth) {
  const W = 420
  const BORDER = 3
  const PAD_X = 14
  const X_LEFT = BORDER + PAD_X // 17
  const X_RIGHT = W - BORDER - PAD_X // 403
  const CONTENT_W = X_RIGHT - X_LEFT // 386

  // Table column geometry matching 40% / 20% / 20% / 20% with 4px cell padding
  const COL_NAME_X = X_LEFT + 4
  const COL_SUB_X = X_LEFT + 16
  const COL1_RIGHT = Number((X_LEFT + CONTENT_W * 0.60 - 4).toFixed(2))
  const COL2_RIGHT = Number((X_LEFT + CONTENT_W * 0.80 - 4).toFixed(2))
  const COL3_RIGHT = X_RIGHT - 4

  const servingGrams = parseServingGrams(data.servingSize)
  const servingHeader = `Per ${servingGrams != null ? `${servingGrams} g` : 'Serving'}`
  const servingNoteLines = wrapText(
    'Number of servings may vary based on pack size and intended use.',
    CONTENT_W,
    12,
    'normal'
  )
  const footnote2Lines = wrapText(
    '** Percent Daily Values are based on a 2000 calories diet. Your daily values may be higher or lower depending on your calories needs.',
    CONTENT_W,
    10,
    'normal'
  )

  const headerParts = []
  const tableParts = []
  const footnoteParts = []

  let y = BORDER + 10 // 13

  // Title
  headerParts.push(
    `<text x="${X_LEFT}" y="${y + 26}" font-family="${FONT_BLACK}" font-size="26" letter-spacing="-0.5" fill="#000000">Nutritional Information</text>`
  )
  y += 37

  // Thin line
  headerParts.push(`<line x1="${X_LEFT}" y1="${y}" x2="${X_RIGHT}" y2="${y}" stroke="#000000" stroke-width="0.75" />`)
  y += 6

  // Serving size row
  headerParts.push(
    `<text x="${X_LEFT}" y="${y + 15}" font-family="${FONT_BLACK}" font-size="17" fill="#000000">Serving size</text>`,
    `<text x="${X_RIGHT}" y="${y + 15}" text-anchor="end" font-family="${FONT_BLACK}" font-size="17" fill="#000000">${escapeXml(data.servingSize || '100g')}</text>`
  )
  y += 22

  // Serving note
  y += 4
  servingNoteLines.forEach((line) => {
    headerParts.push(
      `<text x="${X_LEFT}" y="${y + 11}" font-family="${FONT_REGULAR}" font-size="12" fill="#000000">${escapeXml(line)}</text>`
    )
    y += 15.5
  })
  y += 6

  // Thick rule
  headerParts.push(`<line x1="${X_LEFT}" y1="${y + 1.5}" x2="${X_RIGHT}" y2="${y + 1.5}" stroke="#000000" stroke-width="3" />`)
  y += 7

  // Table header
  tableParts.push(
    `<text x="${COL_NAME_X}" y="${y + 13}" font-family="${FONT_BLACK}" font-size="10" fill="#000000">Nutrients</text>`,
    `<text x="${COL1_RIGHT}" y="${y + 13}" text-anchor="end" font-family="${FONT_BLACK}" font-size="10" fill="#000000">Per 100g*</text>`,
    `<text x="${COL2_RIGHT}" y="${y + 13}" text-anchor="end" font-family="${FONT_BLACK}" font-size="10" fill="#000000">${escapeXml(servingHeader)}</text>`,
    `<text x="${COL3_RIGHT}" y="${y + 13}" text-anchor="end" font-family="${FONT_BLACK}" font-size="10" fill="#000000">% RDA**</text>`
  )
  y += 19
  tableParts.push(`<line x1="${X_LEFT}" y1="${y}" x2="${X_RIGHT}" y2="${y}" stroke="#000000" stroke-width="1.5" />`)

  // Nutrient rows
  const ROW_H = 26
  ROWS.forEach(({ name, field, unit, dvKey, sub }, idx) => {
    const labelWithUnit = `${name} (${unit})`
    const val100 = fmt(data[field])
    const valServ = perServing(data[field], servingGrams)
    const valDv = calcPercentDV(dvKey, data[field], servingGrams)
    const textY = y + 17.5
    const nameX = sub ? COL_SUB_X : COL_NAME_X
    const fontFamily = sub ? FONT_REGULAR : FONT_BLACK
    const fontSize = 11.5

    tableParts.push(
      `<text x="${nameX}" y="${textY}" font-family="${fontFamily}" font-size="${fontSize}" fill="#000000">${escapeXml(labelWithUnit)}</text>`,
      `<text x="${COL1_RIGHT}" y="${textY}" text-anchor="end" font-family="${fontFamily}" font-size="${fontSize}" fill="#000000">${escapeXml(val100)}</text>`,
      `<text x="${COL2_RIGHT}" y="${textY}" text-anchor="end" font-family="${fontFamily}" font-size="${fontSize}" fill="#000000">${escapeXml(valServ)}</text>`,
      `<text x="${COL3_RIGHT}" y="${textY}" text-anchor="end" font-family="${fontFamily}" font-size="${fontSize}" fill="#000000">${escapeXml(valDv)}</text>`
    )

    y += ROW_H
    if (idx < ROWS.length - 1) {
      tableParts.push(`<line x1="${X_LEFT}" y1="${y}" x2="${X_RIGHT}" y2="${y}" stroke="#000000" stroke-width="0.75" />`)
    }
  })

  // Bottom thick line
  y += 3
  tableParts.push(`<line x1="${X_LEFT}" y1="${y + 1.5}" x2="${X_RIGHT}" y2="${y + 1.5}" stroke="#000000" stroke-width="3" />`)
  y += 8

  // Footnotes
  footnoteParts.push(
    `<text x="${X_LEFT}" y="${y + 10}" font-family="${FONT_REGULAR}" font-size="10" fill="#000000">* Approximate values</text>`
  )
  y += 16

  footnote2Lines.forEach((line) => {
    footnoteParts.push(
      `<text x="${X_LEFT}" y="${y + 10}" font-family="${FONT_REGULAR}" font-size="10" fill="#000000">${escapeXml(line)}</text>`
    )
    y += 14
  })

  const totalH = Math.ceil(y + 10 + BORDER)
  const mmHeight = ((totalH / W) * mmWidth).toFixed(2)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${mmWidth}mm" height="${mmHeight}mm" viewBox="0 0 ${W} ${totalH}" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
  <g id="frame">
    <rect x="0" y="0" width="${W}" height="${totalH}" fill="#ffffff" />
    <rect x="${BORDER / 2}" y="${BORDER / 2}" width="${W - BORDER}" height="${totalH - BORDER}" fill="none" stroke="#000000" stroke-width="${BORDER}" />
  </g>
  <g id="header">
    ${headerParts.join('\n    ')}
  </g>
  <g id="nutrient-table">
    ${tableParts.join('\n    ')}
  </g>
  <g id="footnotes">
    ${footnoteParts.join('\n    ')}
  </g>
</svg>`
}

function buildFdaSvg(data, mmWidth) {
  const W = 420
  const BORDER = 3
  const PAD_X = 14
  const X_LEFT = BORDER + PAD_X
  const X_RIGHT = W - BORDER - PAD_X
  const CONTENT_W = X_RIGHT - X_LEFT

  const servingGrams = parseServingGrams(data.servingSize)
  const calRaw = perServing(data.energy, servingGrams, 0)
  const calDisplay = calRaw === '—' ? '—' : String(Math.round(parseFloat(calRaw)))
  const footnoteLines = wrapText(
    '* Percent Daily Values are based on a 2000 calories diet. Your daily values may be higher or lower depending on your calories needs.',
    CONTENT_W,
    10,
    'normal'
  )

  const headerParts = []
  const rowsParts = []
  const footnoteParts = []

  let y = BORDER + 10

  // Title
  headerParts.push(
    `<text x="${X_LEFT}" y="${y + 34}" font-family="${FONT_BLACK}" font-size="40" letter-spacing="-0.5" fill="#000000">Nutrition Facts</text>`
  )
  y += 45

  // Thin line
  headerParts.push(`<line x1="${X_LEFT}" y1="${y}" x2="${X_RIGHT}" y2="${y}" stroke="#000000" stroke-width="0.75" />`)
  y += 6

  // Serving size
  headerParts.push(
    `<text x="${X_LEFT}" y="${y + 15}" font-family="${FONT_BLACK}" font-size="17" fill="#000000">Serving size</text>`,
    `<text x="${X_RIGHT}" y="${y + 15}" text-anchor="end" font-family="${FONT_BLACK}" font-size="17" fill="#000000">${escapeXml(data.servingSize || '100g')}</text>`
  )
  y += 26

  // Thick line
  headerParts.push(`<line x1="${X_LEFT}" y1="${y + 1.5}" x2="${X_RIGHT}" y2="${y + 1.5}" stroke="#000000" stroke-width="3" />`)
  y += 8

  // Calories block
  headerParts.push(
    `<text x="${X_LEFT}" y="${y + 12}" font-family="${FONT_BLACK}" font-size="11" fill="#000000">Amount per serving</text>`,
    `<text x="${X_LEFT}" y="${y + 42}" font-family="${FONT_BLACK}" font-size="30" fill="#000000">Calories</text>`,
    `<text x="${X_RIGHT}" y="${y + 42}" text-anchor="end" font-family="${FONT_BLACK}" font-size="40" fill="#000000">${escapeXml(calDisplay)}</text>`
  )
  y += 50

  // 5px mid line
  headerParts.push(`<line x1="${X_LEFT}" y1="${y + 2.5}" x2="${X_RIGHT}" y2="${y + 2.5}" stroke="#000000" stroke-width="5" />`)
  y += 8

  // % Daily Value*
  headerParts.push(
    `<text x="${X_RIGHT}" y="${y + 11}" text-anchor="end" font-family="${FONT_BLACK}" font-size="10" fill="#000000">% Daily Value*</text>`
  )
  y += 17

  const ROW_H = 23
  FDA_ROWS.forEach(({ label, field, unit, dvKey, bold, indent }) => {
    rowsParts.push(`<line x1="${X_LEFT}" y1="${y}" x2="${X_RIGHT}" y2="${y}" stroke="#000000" stroke-width="0.75" />`)
    const valStr = perServingWithUnit(data[field], servingGrams, unit)
    const dvStr = calcPercentDV(dvKey, data[field], servingGrams)
    const rowX = X_LEFT + indent * 16
    const textY = y + 16
    const labelFont = bold ? FONT_BLACK : FONT_REGULAR

    rowsParts.push(
      `<text x="${rowX}" y="${textY}" font-family="${FONT_REGULAR}" font-size="11.5" fill="#000000"><tspan font-family="${labelFont}">${escapeXml(label)}</tspan><tspan font-family="${FONT_REGULAR}"> ${escapeXml(valStr)}</tspan></text>`,
      `<text x="${X_RIGHT}" y="${textY}" text-anchor="end" font-family="${FONT_BLACK}" font-size="11.5" fill="#000000">${escapeXml(dvStr)}</text>`
    )
    y += ROW_H
  })

  // Bottom thick line
  y += 2
  rowsParts.push(`<line x1="${X_LEFT}" y1="${y + 1.5}" x2="${X_RIGHT}" y2="${y + 1.5}" stroke="#000000" stroke-width="3" />`)
  y += 8

  footnoteLines.forEach((line) => {
    footnoteParts.push(
      `<text x="${X_LEFT}" y="${y + 10}" font-family="${FONT_REGULAR}" font-size="10" fill="#000000">${escapeXml(line)}</text>`
    )
    y += 14
  })

  const totalH = Math.ceil(y + 10 + BORDER)
  const mmHeight = ((totalH / W) * mmWidth).toFixed(2)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${mmWidth}mm" height="${mmHeight}mm" viewBox="0 0 ${W} ${totalH}" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
  <g id="frame">
    <rect x="0" y="0" width="${W}" height="${totalH}" fill="#ffffff" />
    <rect x="${BORDER / 2}" y="${BORDER / 2}" width="${W - BORDER}" height="${totalH - BORDER}" fill="none" stroke="#000000" stroke-width="${BORDER}" />
  </g>
  <g id="header">
    ${headerParts.join('\n    ')}
  </g>
  <g id="nutrient-rows">
    ${rowsParts.join('\n    ')}
  </g>
  <g id="footnotes">
    ${footnoteParts.join('\n    ')}
  </g>
</svg>`
}

/**
 * Generates a pure vector SVG string (no <foreignObject> or raster bitmaps)
 * sized in physical millimeters for direct import into CorelDRAW / Illustrator.
 *
 * @param {Object} data - Nutrition label data object
 * @param {string} template - 'fssai' or 'fda'
 * @param {number} mmWidth - Physical print width in millimeters (e.g. 80, 111, 140)
 * @returns {string} UTF-8 XML SVG document
 */
export function dataToVectorSvg(data, template = 'fssai', mmWidth = 111) {
  if (!supportsVectorSvg(template)) {
    throw new Error(`Vector SVG export is only supported for statutory templates (${VECTOR_SVG_TEMPLATES.join(', ')}).`)
  }
  if (template === 'fda') {
    return buildFdaSvg(data || {}, mmWidth)
  }
  return buildFssaiSvg(data || {}, mmWidth)
}

export function svgStringToBlob(svgText) {
  return new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
}
