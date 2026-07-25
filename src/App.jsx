import React, { useState, useRef, useCallback, useEffect } from 'react'
import NutritionLabel from './components/NutritionLabel'
import { DEFAULT_DATA, GOOGLE_SHEETS_URL } from './constants'
import { sheetsUrlToCsv, parseCsv, rowToData } from './utils'

// ── helpers ──────────────────────────────────────────────
async function labelToCanvas(el) {
  const { default: html2canvas } = await import('html2canvas')
  return html2canvas(el, { scale: 3, backgroundColor: '#fff', useCORS: true })
}

async function canvasToPDF(canvas, filename) {
  const { default: jsPDF } = await import('jspdf')
  const px2mm = 0.264583
  const w = (canvas.width  / 3) * px2mm
  const h = (canvas.height / 3) * px2mm
  const pdf = new jsPDF({ unit: 'mm', format: [w, h] })
  // JPEG instead of PNG: ~10× smaller files, indistinguishable at print size
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, w, h)
  pdf.save(filename)
}

// ── main component ─────────────────────────────────────
export default function App() {
  const [status, setStatus]           = useState({ type: '', msg: '' })
  const [allRows, setAllRows]         = useState([])        // parsed CSV rows
  const [products, setProducts]       = useState([])        // product name list
  const [selectedProduct, setSelected]= useState('')
  const [data, setData]               = useState(DEFAULT_DATA)
  const [batchMode, setBatchMode]     = useState(false)
  const [batchSelected, setBatchSel]  = useState([])
  const [downloading, setDownloading] = useState(false)

  const labelRef = useRef(null)

  // ── load Google Sheet ────────────────────────────────
  const loadSheet = useCallback(async () => {
    setStatus({ type: 'loading', msg: 'Connecting to Google Sheets…' })
    try {
      const csvUrl = sheetsUrlToCsv(GOOGLE_SHEETS_URL)
      const res = await fetch(csvUrl)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      const rows = parseCsv(text)
      if (!rows.length) throw new Error('No data found in sheet')

      setAllRows(rows)
      const names = [...new Set(rows.map(r => r['Product']).filter(Boolean))]
      setProducts(names)
      setStatus({ type: 'ok', msg: `✅ Connected — ${names.length} products loaded` })
      if (names.length) {
        setSelected(names[0])
        setData(rowToData(rows.find(r => r['Product'] === names[0]) || rows[0]))
      }
    } catch (e) {
      setStatus({ type: 'error', msg: `❌ Failed: ${e.message}` })
    }
  }, [])

  // Auto-load the sheet on first render
  useEffect(() => { loadSheet() }, [])   // eslint-disable-line react-hooks/exhaustive-deps

  // ── product selection ────────────────────────────────
  function handleProductChange(e) {
    const name = e.target.value
    setSelected(name)
    const row = allRows.find(r => r['Product'] === name)
    if (row) setData(rowToData(row))
  }

  // ── single download ──────────────────────────────────
  async function downloadPDF() {
    setDownloading(true)
    try {
      const canvas = await labelToCanvas(labelRef.current)
      await canvasToPDF(canvas, `${data.product || 'label'}.pdf`)
    } finally { setDownloading(false) }
  }

  async function downloadPNG() {
    setDownloading(true)
    try {
      const canvas = await labelToCanvas(labelRef.current)
      const a = document.createElement('a')
      a.download = `${data.product || 'label'}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    } finally { setDownloading(false) }
  }

  // ── batch download ───────────────────────────────────
  async function downloadBatchPDF() {
    setDownloading(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: html2canvas } = await import('html2canvas')
      // render each product in a hidden div
      const container = document.createElement('div')
      container.style.cssText = 'position:fixed;left:-9999px;top:0;'
      document.body.appendChild(container)

      const { createRoot } = await import('react-dom/client')
      const { default: NutritionLabel } = await import('./components/NutritionLabel')

      const px2mm = 0.264583
      let pdf = null

      for (const name of batchSelected) {
        const row = allRows.find(r => r['Product'] === name)
        if (!row) continue
        const d = rowToData(row)

        // mount label
        const wrapper = document.createElement('div')
        container.appendChild(wrapper)
        const root = createRoot(wrapper)
        await new Promise(resolve => {
          root.render(<NutritionLabel data={d} labelRef={{ current: wrapper }} />)
          setTimeout(resolve, 120)
        })

        const canvas = await html2canvas(wrapper, { scale: 3, backgroundColor: '#fff' })
        const w = (canvas.width  / 3) * px2mm
        const h = (canvas.height / 3) * px2mm

        if (!pdf) {
          pdf = new jsPDF({ unit: 'mm', format: [w, h] })
        } else {
          pdf.addPage([w, h])
        }
        // JPEG instead of PNG: ~10× smaller batch files
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, w, h)
        root.unmount()
        container.removeChild(wrapper)
      }

      document.body.removeChild(container)
      if (pdf) pdf.save(`NutritionLabels_batch.pdf`)
    } finally { setDownloading(false) }
  }

  function toggleBatch(name) {
    setBatchSel(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  // ── render ───────────────────────────────────────────
  return (
    <div className="app">
      <h1>Nutrition Label Generator</h1>
      <div className="layout">

        {/* ── Left: controls ── */}
        <div className="form-panel">

          {status.msg && (
            <div className={`status-bar ${status.type}`}>{status.msg}</div>
          )}

          {/* Retry after a failed sheet load */}
          {status.type === 'error' && (
            <button
              className="btn btn-pdf"
              style={{ width: '100%', marginBottom: 12 }}
              onClick={loadSheet}
            >
              ↻ Retry loading products
            </button>
          )}

          {/* Product selector */}
          <div className="section-title">Select Product</div>
          <div className="form-group">
            <label>Product</label>
            <select
              value={selectedProduct}
              onChange={handleProductChange}
              disabled={products.length === 0}
            >
              {products.length === 0
                ? <option value="">
                    {status.type === 'error' ? '— Load failed —' : '— Loading products… —'}
                  </option>
                : products.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Batch mode */}
          {products.length > 0 && (
            <div className="form-group" style={{ marginTop: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={batchMode}
                  onChange={e => { setBatchMode(e.target.checked); setBatchSel([]) }}
                  style={{ width: 'auto' }}
                />
                Batch Mode
              </label>
            </div>
          )}

          {batchMode && (
            <>
              <div className="section-title">Select products for batch</div>
              <div style={{ maxHeight: 140, overflowY: 'auto', border: '1px solid #ddd', borderRadius: 4, padding: '4px 8px', marginBottom: 8 }}>
                {products.map(p => (
                  <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '2px 0', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={batchSelected.includes(p)}
                      onChange={() => toggleBatch(p)}
                      style={{ width: 'auto' }}
                    />
                    {p}
                  </label>
                ))}
              </div>
              <button
                className="btn btn-pdf"
                style={{ width: '100%', marginBottom: 6 }}
                onClick={downloadBatchPDF}
                disabled={downloading || batchSelected.length === 0}
              >
                {downloading ? 'Generating…' : `⬇ Download ${batchSelected.length} Labels (PDF)`}
              </button>
            </>
          )}

          {/* Download buttons */}
          {!batchMode && (
            <div className="btn-row">
              <button className="btn btn-pdf" onClick={downloadPDF} disabled={downloading || !selectedProduct}>
                {downloading ? '…' : '⬇ PDF'}
              </button>
              <button className="btn btn-png" onClick={downloadPNG} disabled={downloading || !selectedProduct}>
                {downloading ? '…' : '🖼 PNG'}
              </button>
            </div>
          )}
        </div>

        {/* ── Right: label preview ── */}
        <div className="preview-panel">
          <div style={{ fontSize: 11, color: '#888', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>
            Preview — {data.product || 'Untitled'}
          </div>
          <NutritionLabel data={data} labelRef={labelRef} />
        </div>

      </div>
    </div>
  )
}
