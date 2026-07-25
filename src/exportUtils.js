// ── Export helpers: canvas, PDF, PNG, clipboard, ZIP ──────────
export const PRINT_DPI = 300

// Scale factor so the element exports at `mmWidth` physical width @ 300 DPI
export function scaleFor(el, mmWidth) {
  const targetPx = (mmWidth / 25.4) * PRINT_DPI
  return targetPx / el.offsetWidth
}

export async function labelToCanvas(el, scale) {
  const { default: html2canvas } = await import('html2canvas')
  return html2canvas(el, { scale, backgroundColor: '#fff', useCORS: true })
}

// Canvas pixels are 300 DPI → physical size in mm is fixed by the DPI
export async function canvasToPDF(canvas, filename) {
  const { default: jsPDF } = await import('jspdf')
  const w = (canvas.width  * 25.4) / PRINT_DPI
  const h = (canvas.height * 25.4) / PRINT_DPI
  const pdf = new jsPDF({ unit: 'mm', format: [w, h] })
  // JPEG instead of PNG: ~10× smaller files, indistinguishable at print size
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, w, h)
  pdf.save(filename)
}

export function canvasToBlob(canvas, type = 'image/png', quality) {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality))
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.download = filename
  a.href = url
  a.click()
  URL.revokeObjectURL(url)
}

export async function copyCanvasToClipboard(canvas) {
  const blob = await canvasToBlob(canvas)
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}

// ── Minimal ZIP writer (store method, no compression) ─────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(data) {
  let c = 0xffffffff
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function dosDateTime(d = new Date()) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()
  return { time, date }
}

// files: [{ name: string, data: Uint8Array }] → Blob (application/zip)
export function makeZip(files) {
  const encoder = new TextEncoder()
  const { time, date } = dosDateTime()
  const chunks = []
  const central = []
  let offset = 0

  for (const { name, data } of files) {
    const nameBytes = encoder.encode(name)
    const crc = crc32(data)

    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034b50, true)   // local file header signature
    local.setUint16(4, 20, true)           // version needed
    local.setUint16(8, 0, true)            // method: store
    local.setUint16(10, time, true)
    local.setUint16(12, date, true)
    local.setUint32(14, crc, true)
    local.setUint32(18, data.length, true) // compressed size
    local.setUint32(22, data.length, true) // uncompressed size
    local.setUint16(26, nameBytes.length, true)
    chunks.push(new Uint8Array(local.buffer), nameBytes, data)

    const cen = new DataView(new ArrayBuffer(46))
    cen.setUint32(0, 0x02014b50, true)     // central directory signature
    cen.setUint16(4, 20, true)
    cen.setUint16(6, 20, true)
    cen.setUint16(10, 0, true)             // method: store
    cen.setUint16(12, time, true)
    cen.setUint16(14, date, true)
    cen.setUint32(16, crc, true)
    cen.setUint32(20, data.length, true)
    cen.setUint32(24, data.length, true)
    cen.setUint16(28, nameBytes.length, true)
    cen.setUint32(42, offset, true)        // local header offset
    central.push(new Uint8Array(cen.buffer), nameBytes)

    offset += 30 + nameBytes.length + data.length
  }

  let centralSize = 0
  for (const c of central) centralSize += c.length

  const eocd = new DataView(new ArrayBuffer(22))
  eocd.setUint32(0, 0x06054b50, true)      // end of central directory
  eocd.setUint16(8, files.length, true)
  eocd.setUint16(10, files.length, true)
  eocd.setUint32(12, centralSize, true)
  eocd.setUint32(16, offset, true)

  return new Blob([...chunks, ...central, new Uint8Array(eocd.buffer)], { type: 'application/zip' })
}
