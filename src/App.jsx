import React, { useState, useRef, useCallback, useEffect } from 'react'
import NutritionLabel from './components/NutritionLabel'
import ProductSelect from './components/ProductSelect'
import { DEFAULT_DATA, GOOGLE_SHEETS_URL } from './constants'
import { sheetsUrlToCsv, parseCsv, rowToData } from './utils'
import {
  scaleFor, labelToCanvas, canvasToPDF, canvasToBlob,
  downloadBlob, copyCanvasToClipboard, makeZip, PRINT_DPI,
} from './exportUtils'

// ── label size presets (physical width; exports always at 300 DPI) ──
const SIZE_PRESETS = [
  { id: 'standard', name: 'Standard · 111 mm', mm: 111 },
  { id: 'small',    name: 'Small pack · 80 mm', mm: 80 },
  { id: 'large',    name: 'Large pack · 140 mm', mm: 140 },
]

const TEMPLATES = [
  { id: 'fssai',   name: 'FSSAI Tabular' },
  { id: 'fda',     name: 'FDA Vertical' },
  { id: 'compact', name: 'Compact Strip' },
]

// remembered UI state
const LS_KEY = 'nlg-prefs'
const loadPrefs = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {} } catch { return {} }
}
const savePrefs = p => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(p)) } catch { /* ignore */ }
}

// ── main component ─────────────────────────────────────
export default function App() {
  const prefs = useRef(loadPrefs()).current

  const [status, setStatus]           = useState({ type: '', msg: '' })
  const [allRows, setAllRows]         = useState([])        // parsed CSV rows
  const [products, setProducts]       = useState([])        // product name list
  const [selectedProduct, setSelected]= useState('')
  const [data, setData]               = useState(DEFAULT_DATA)
  const [batchMode, setBatchMode]     = useState(false)
  const [batchSelected, setBatchSel]  = useState([])
  const [batchQuery, setBatchQuery]   = useState('')
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress]       = useState('')        // batch progress text
  const [copied, setCopied]           = useState(false)
  const [template, setTemplate]       = useState(prefs.template || 'fssai')
  const [sizeId, setSizeId]           = useState(prefs.sizeId || 'standard')

  const labelRef = useRef(null)

  const size = SIZE_PRESETS.find(s => s.id === sizeId) || SIZE_PRESETS[0]

  // persist prefs on change
  useEffect(() => {
    savePrefs({ template, sizeId, product: selectedProduct })
  }, [template, sizeId, selectedProduct])

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
        .sort((a, b) => a.localeCompare(b))
      setProducts(names)
      setStatus({ type: 'ok', msg: `✅ Connected — ${names.length} products loaded` })
      if (names.length) {
        // restore last product if it still exists in the sheet
        const initial = names.includes(prefs.product) ? prefs.product : names[0]
        setSelected(initial)
        setData(rowToData(rows.find(r => r['Product'] === initial) || rows[0]))
      }
    } catch (e) {
      setStatus({ type: 'error', msg: `❌ Failed: ${e.message}` })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-load the sheet on first render
  useEffect(() => { loadSheet() }, [])   // eslint-disable-line react-hooks/exhaustive-deps

  // ── product selection ────────────────────────────────
  function handleProductChange(name) {
    setSelected(name)
    const row = allRows.find(r => r['Product'] === name)
    if (row) setData(rowToData(row))
  }

  // ── single export ────────────────────────────────────
  function exportCanvas() {
    const el = labelRef.current
    return labelToCanvas(el, scaleFor(el, size.mm))
  }

  async function downloadPDF() {
    setDownloading(true)
    try {
      const canvas = await exportCanvas()
      await canvasToPDF(canvas, `${data.product || 'label'}.pdf`)
    } finally { setDownloading(false) }
  }

  async function downloadPNG() {
    setDownloading(true)
    try {
      const canvas = await exportCanvas()
      const blob = await canvasToBlob(canvas)
      downloadBlob(blob, `${data.product || 'label'}.png`)
    } finally { setDownloading(false) }
  }

  async function copyPNG() {
    setDownloading(true)
    try {
      const canvas = await exportCanvas()
      await copyCanvasToClipboard(canvas)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch (e) {
      setStatus({ type: 'error', msg: `❌ Clipboard failed: ${e.message}` })
    } finally { setDownloading(false) }
  }

  // ── batch export ─────────────────────────────────────
  // Renders each selected product off-screen and hands its canvas to `emit`.
  async function forEachBatchLabel(emit) {
    const { createRoot } = await import('react-dom/client')
    const container = document.createElement('div')
    container.style.cssText = 'position:fixed;left:-9999px;top:0;'
    document.body.appendChild(container)
    try {
      let i = 0
      for (const name of batchSelected) {
        const row = allRows.find(r => r['Product'] === name)
        if (!row) continue
        i++
        setProgress(`${i} / ${batchSelected.length}`)
        const d = rowToData(row)

        const wrapper = document.createElement('div')
        container.appendChild(wrapper)
        const root = createRoot(wrapper)
        await new Promise(resolve => {
          root.render(<NutritionLabel data={d} labelRef={{ current: wrapper }} template={template} />)
          setTimeout(resolve, 120)
        })

        const labelEl = wrapper.firstChild
        const canvas = await labelToCanvas(labelEl, scaleFor(labelEl, size.mm))
        await emit(name, canvas)

        root.unmount()
        container.removeChild(wrapper)
      }
    } finally {
      document.body.removeChild(container)
      setProgress('')
    }
  }

  async function downloadBatchPDF() {
    setDownloading(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      let pdf = null
      await forEachBatchLabel(async (name, canvas) => {
        const w = (canvas.width  * 25.4) / PRINT_DPI
        const h = (canvas.height * 25.4) / PRINT_DPI
        if (!pdf) pdf = new jsPDF({ unit: 'mm', format: [w, h] })
        else pdf.addPage([w, h])
        // JPEG instead of PNG: ~10× smaller batch files
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, w, h)
      })
      if (pdf) pdf.save('NutritionLabels_batch.pdf')
    } finally { setDownloading(false) }
  }

  async function downloadBatchPNG() {
    setDownloading(true)
    try {
      const files = []
      await forEachBatchLabel(async (name, canvas) => {
        const blob = await canvasToBlob(canvas)
        const buf = new Uint8Array(await blob.arrayBuffer())
        // sanitize filename
        const safe = name.replace(/[\\/:*?"<>|]/g, '-')
        files.push({ name: `${safe}.png`, data: buf })
      })
      if (files.length) downloadBlob(makeZip(files), 'NutritionLabels_PNG.zip')
    } finally { setDownloading(false) }
  }

  // ── batch selection helpers ──────────────────────────
  const batchFiltered = batchQuery
    ? products.filter(p => p.toLowerCase().includes(batchQuery.toLowerCase()))
    : products

  function toggleBatch(name) {
    setBatchSel(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  function selectAllVisible() {
    setBatchSel(prev => [...new Set([...prev, ...batchFiltered])])
  }

  function clearBatch() { setBatchSel([]) }

  // ── render ───────────────────────────────────────────
  return (
    <div className="app">
      <header className="app-header">
        <h1>Nutrition Label Generator</h1>
        <p className="app-subtitle">FSSAI-compliant labels from your product sheet</p>
      </header>

      <div className="layout">

        {/* ── Left: controls ── */}
        <div className="form-panel">

          {status.msg && (
            <div className={`status-bar ${status.type}`}>
              <span>{status.msg}</span>
              <button
                className="refresh-btn"
                onClick={loadSheet}
                disabled={status.type === 'loading'}
                title="Reload products from Google Sheets"
              >
                ↻ Refresh
              </button>
            </div>
          )}

          {/* Product selector */}
          <div className="section-title">Product</div>
          <div className="form-group">
            <ProductSelect
              products={products}
              value={selectedProduct}
              onChange={handleProductChange}
              disabled={products.length === 0}
              placeholder={
                products.length === 0
                  ? (status.type === 'error' ? 'Load failed' : 'Loading products…')
                  : 'Choose a product'
              }
            />
          </div>

          {/* Template + size */}
          <div className="option-grid">
            <div>
              <div className="section-title">Template</div>
              <div className="segmented">
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    className={`segment${template === t.id ? ' active' : ''}`}
                    onClick={() => setTemplate(t.id)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="section-title">Print size (300 DPI)</div>
              <div className="segmented">
                {SIZE_PRESETS.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    className={`segment${sizeId === s.id ? ' active' : ''}`}
                    onClick={() => setSizeId(s.id)}
                    title={`${s.mm} mm wide at 300 DPI`}
                  >
                    {s.name.split(' · ')[0]}
                  </button>
                ))}
              </div>
              <div className="size-hint">{size.mm} mm wide · {Math.round(size.mm / 25.4 * PRINT_DPI)} px</div>
            </div>
          </div>

          {/* Batch mode */}
          {products.length > 0 && (
            <label className="toggle-row">
              <input
                type="checkbox"
                className="toggle-input"
                checked={batchMode}
                onChange={e => { setBatchMode(e.target.checked); setBatchSel([]); setBatchQuery('') }}
              />
              <span className="toggle-track" aria-hidden="true"><span className="toggle-thumb" /></span>
              <span className="toggle-label">Batch mode</span>
            </label>
          )}

          {batchMode && (
            <>
              <div className="section-title">Products for batch</div>

              <div className="batch-tools">
                <input
                  className="batch-search"
                  value={batchQuery}
                  placeholder="Search…"
                  onChange={e => setBatchQuery(e.target.value)}
                />
                <button type="button" className="mini-btn" onClick={selectAllVisible}>
                  Select all{batchQuery ? ' (filtered)' : ''}
                </button>
                <button type="button" className="mini-btn" onClick={clearBatch} disabled={batchSelected.length === 0}>
                  Clear
                </button>
              </div>

              <div className="batch-list">
                {batchFiltered.length === 0 && (
                  <div className="batch-empty">No products match “{batchQuery}”</div>
                )}
                {batchFiltered.map(p => (
                  <label key={p} className="batch-item">
                    <input
                      type="checkbox"
                      checked={batchSelected.includes(p)}
                      onChange={() => toggleBatch(p)}
                    />
                    <span>{p}</span>
                  </label>
                ))}
              </div>

              <div className="batch-count">{batchSelected.length} selected</div>

              <div className="btn-row">
                <button
                  className="btn btn-primary"
                  onClick={downloadBatchPDF}
                  disabled={downloading || batchSelected.length === 0}
                >
                  {downloading ? `Generating… ${progress}` : 'Batch PDF'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={downloadBatchPNG}
                  disabled={downloading || batchSelected.length === 0}
                >
                  {downloading ? `Generating… ${progress}` : 'Batch PNG (ZIP)'}
                </button>
              </div>
            </>
          )}

          {/* Download buttons */}
          {!batchMode && (
            <>
              <div className="btn-row">
                <button className="btn btn-primary" onClick={downloadPDF} disabled={downloading || !selectedProduct}>
                  {downloading ? 'Exporting…' : 'Download PDF'}
                </button>
                <button className="btn btn-secondary" onClick={downloadPNG} disabled={downloading || !selectedProduct}>
                  {downloading ? 'Exporting…' : 'Download PNG'}
                </button>
              </div>
              <button
                className="btn btn-secondary btn-block"
                style={{ marginTop: 10 }}
                onClick={copyPNG}
                disabled={downloading || !selectedProduct}
              >
                {copied ? '✓ Copied to clipboard' : 'Copy PNG to clipboard'}
              </button>
            </>
          )}
        </div>

        {/* ── Right: label preview ── */}
        <div className="preview-panel">
          <div className="preview-caption">
            Preview · {data.product || 'Untitled'}
          </div>
          <div className="preview-frame">
            <NutritionLabel data={data} labelRef={labelRef} template={template} />
          </div>
        </div>

      </div>
    </div>
  )
}
