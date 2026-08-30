import React, { useState, useRef, useCallback, useEffect } from 'react'
import NutritionLabel from './components/NutritionLabel'
import ProductSelect from './components/ProductSelect'
import FormulationWorkspace from './components/formulation/FormulationWorkspace'
import IngredientMaster from './components/formulation/IngredientMaster'
import DataSettings from './components/formulation/DataSettings'
import AIResearchWorkspace from './components/ai/AIResearchWorkspace'
import { DEFAULT_DATA, GOOGLE_SHEETS_URL, TEMPLATE_GROUPS } from './constants'
import { DEFAULT_INGREDIENTS } from './data/ingredientMaster'
import { DEFAULT_RECIPES } from './data/productRecipes'
import { prepareSafeLabelTransfer } from './engine/nutritionEngine'
import { sheetsUrlToCsv, parseCsv, rowToData } from './utils'
import {
  scaleFor,
  labelToCanvas,
  canvasToPDF,
  canvasToBlob,
  downloadBlob,
  copyCanvasToClipboard,
  makeZip,
  PRINT_DPI,
} from './exportUtils'

// Top Navigation Views
const NAV_VIEWS = {
  LABEL_GENERATOR: 'LABEL_GENERATOR',
  FORMULATION: 'FORMULATION',
  INGREDIENT_MASTER: 'INGREDIENT_MASTER',
  AI_RESEARCH: 'AI_RESEARCH',
  DATA_SETTINGS: 'DATA_SETTINGS',
}

// Label size presets (physical width; exports always at 300 DPI)
const SIZE_PRESETS = [
  { id: 'standard', name: 'Standard · 111 mm', mm: 111 },
  { id: 'small', name: 'Small pack · 80 mm', mm: 80 },
  { id: 'large', name: 'Large pack · 140 mm', mm: 140 },
]

// Storage Keys
const LS_PREFS = 'nlg-prefs-v2'
const LS_INGREDIENTS = 'nutrition-app-v2-ingredients'
const LS_RECIPES = 'nutrition-app-v2-recipes'
const LS_OVERRIDES = 'nutrition-app-v2-overrides'

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch {
    /* ignore */
  }
}

export default function App() {
  const prefs = useRef(loadFromStorage(LS_PREFS, {})).current

  // Navigation State
  const [activeView, setActiveView] = useState(NAV_VIEWS.LABEL_GENERATOR)

  // Master Data State
  const [ingredients, setIngredients] = useState(() =>
    loadFromStorage(LS_INGREDIENTS, DEFAULT_INGREDIENTS)
  )
  const [recipes, setRecipes] = useState(() =>
    loadFromStorage(LS_RECIPES, DEFAULT_RECIPES)
  )
  const [recipeOverrides, setRecipeOverrides] = useState(() =>
    loadFromStorage(LS_OVERRIDES, {})
  )
  const [activeRecipeId, setActiveRecipeId] = useState(
    recipes[0]?.id || 'chana-sattu'
  )

  // Active Recipe object
  const currentRecipe =
    recipes.find((r) => r.id === activeRecipeId) || recipes[0] || DEFAULT_RECIPES[0]

  // Persist master data changes
  useEffect(() => {
    saveToStorage(LS_INGREDIENTS, ingredients)
  }, [ingredients])

  useEffect(() => {
    saveToStorage(LS_RECIPES, recipes)
  }, [recipes])

  useEffect(() => {
    saveToStorage(LS_OVERRIDES, recipeOverrides)
  }, [recipeOverrides])

  // Label Generator State
  const [status, setStatus] = useState({ type: '', msg: '' })
  const [allRows, setAllRows] = useState([])
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelected] = useState('')
  const [data, setData] = useState(DEFAULT_DATA)
  const [showDataEditor, setShowDataEditor] = useState(false)

  // Batch & Export State
  const [batchMode, setBatchMode] = useState(false)
  const [batchSelected, setBatchSel] = useState([])
  const [batchQuery, setBatchQuery] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState('')
  const [copied, setCopied] = useState(false)
  const [template, setTemplate] = useState(prefs.template || 'fssai')
  const [sizeId, setSizeId] = useState(prefs.sizeId || 'standard')

  const labelRef = useRef(null)
  const size = SIZE_PRESETS.find((s) => s.id === sizeId) || SIZE_PRESETS[0]

  // Persist UI prefs
  useEffect(() => {
    saveToStorage(LS_PREFS, { template, sizeId, product: selectedProduct })
  }, [template, sizeId, selectedProduct])

  // Load Google Sheet
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
      const names = [...new Set(rows.map((r) => r['Product']).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      )
      setProducts(names)
      setStatus({ type: 'ok', msg: `✅ Connected — ${names.length} products loaded` })
      if (names.length) {
        const initial = names.includes(prefs.product) ? prefs.product : names[0]
        setSelected(initial)
        setData(rowToData(rows.find((r) => r['Product'] === initial) || rows[0]))
      }
    } catch (e) {
      setStatus({ type: 'error', msg: `❌ Failed: ${e.message}` })
    }
  }, [prefs.product])

  useEffect(() => {
    loadSheet()
  }, [loadSheet])

  function handleProductChange(name) {
    setSelected(name)
    const row = allRows.find((r) => r['Product'] === name)
    if (row) setData(rowToData(row))
  }

  // Formulation State Handlers
  const handleSelectRecipe = (id) => {
    setActiveRecipeId(id)
  }

  const handleUpdateRecipe = (updatedRecipe) => {
    setRecipes((prev) =>
      prev.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r))
    )
  }

  const handleUpdateRecipeOverrides = (recipeId, newOverrides) => {
    setRecipeOverrides((prev) => ({
      ...prev,
      [recipeId]: newOverrides,
    }))
  }

  const handleSaveCustomRecipe = (recipeToSave) => {
    const isNew = !recipes.some((r) => r.id === recipeToSave.id)
    if (isNew) {
      const newId = `custom-recipe-${Date.now()}`
      const newRecipe = { ...recipeToSave, id: newId, isCustom: true }
      setRecipes((prev) => [newRecipe, ...prev])
      setActiveRecipeId(newId)
    } else {
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === recipeToSave.id ? { ...recipeToSave, isCustom: true } : r
        )
      )
    }
    setStatus({ type: 'ok', msg: `✅ Recipe "${recipeToSave.name}" saved successfully!` })
  }

  const handleDeleteRecipe = (id) => {
    if (recipes.length <= 1) {
      alert('Cannot delete the last remaining recipe.')
      return
    }
    setRecipes((prev) => prev.filter((r) => r.id !== id))
    setActiveRecipeId(recipes[0]?.id || DEFAULT_RECIPES[0].id)
  }

  const handleResetRecipes = () => {
    if (window.confirm('Reset all formulations to the 10 standard Sattu manufacturing master recipes?')) {
      setRecipes(DEFAULT_RECIPES)
      setActiveRecipeId(DEFAULT_RECIPES[0].id)
      saveToStorage(LS_RECIPES, DEFAULT_RECIPES)
    }
  }

  const handleSaveIngredient = (ingToSave) => {
    setIngredients((prev) => {
      const exists = prev.some((i) => i.id === ingToSave.id)
      if (exists) {
        return prev.map((i) => (i.id === ingToSave.id ? ingToSave : i))
      }
      return [ingToSave, ...prev]
    })
  }

  const handleDeleteIngredient = (id) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id))
  }

  const handleResetIngredients = () => {
    if (window.confirm('Reset all ingredients to the default IFCT/USDA/Internal baseline database?')) {
      setIngredients(DEFAULT_INGREDIENTS)
      saveToStorage(LS_INGREDIENTS, DEFAULT_INGREDIENTS)
    }
  }

  const handleImportData = (imported) => {
    if (Array.isArray(imported.ingredients)) {
      setIngredients(imported.ingredients)
      saveToStorage(LS_INGREDIENTS, imported.ingredients)
    }
    if (Array.isArray(imported.recipes)) {
      setRecipes(imported.recipes)
      saveToStorage(LS_RECIPES, imported.recipes)
      if (imported.recipes[0]?.id) setActiveRecipeId(imported.recipes[0].id)
    }
    if (imported.overrides) {
      setRecipeOverrides(imported.overrides)
      saveToStorage(LS_OVERRIDES, imported.overrides)
    }
  }

  const handleResetAllFactory = () => {
    setIngredients(DEFAULT_INGREDIENTS)
    setRecipes(DEFAULT_RECIPES)
    setRecipeOverrides({})
    setActiveRecipeId(DEFAULT_RECIPES[0].id)
    localStorage.removeItem(LS_INGREDIENTS)
    localStorage.removeItem(LS_RECIPES)
    localStorage.removeItem(LS_OVERRIDES)
    setStatus({ type: 'ok', msg: '✅ Restored all factory seed formulations and ingredients.' })
  }

  // Safe transfer from formulation into active regulatory label
  const handleApplyFormulationToLabel = (formulationResult) => {
    if (!formulationResult || !formulationResult.nutrients) return

    const safeLabelData = prepareSafeLabelTransfer(formulationResult, 'RECIPE_ESTIMATE')

    setData(safeLabelData)
    setSelected(safeLabelData.product)
    setActiveView(NAV_VIEWS.LABEL_GENERATOR)
    setStatus({
      type: 'ok',
      msg: `✅ Applied formulation "${safeLabelData.product}" to Label Generator (100% complete nutrients transferred; incomplete/proxy nutrients marked as "—" to prevent unverified statutory claims).`,
    })
  }

  // Export handlers
  function exportCanvas() {
    const el = labelRef.current
    return labelToCanvas(el, scaleFor(el, size.mm))
  }

  async function downloadPDF() {
    setDownloading(true)
    try {
      const canvas = await exportCanvas()
      await canvasToPDF(canvas, `${data.product || 'label'}.pdf`)
    } finally {
      setDownloading(false)
    }
  }

  async function downloadPNG() {
    setDownloading(true)
    try {
      const canvas = await exportCanvas()
      const blob = await canvasToBlob(canvas)
      downloadBlob(blob, `${data.product || 'label'}.png`)
    } finally {
      setDownloading(false)
    }
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
    } finally {
      setDownloading(false)
    }
  }

  // Batch Export
  async function forEachBatchLabel(emit) {
    const { createRoot } = await import('react-dom/client')
    const container = document.createElement('div')
    container.style.cssText = 'position:fixed;left:-9999px;top:0;'
    document.body.appendChild(container)
    try {
      let i = 0
      for (const name of batchSelected) {
        const row = allRows.find((r) => r['Product'] === name)
        if (!row) continue
        i++
        setProgress(`${i} / ${batchSelected.length}`)
        const d = rowToData(row)

        const wrapper = document.createElement('div')
        container.appendChild(wrapper)
        const root = createRoot(wrapper)
        await new Promise((resolve) => {
          root.render(
            <NutritionLabel data={d} labelRef={{ current: wrapper }} template={template} />
          )
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
        const w = (canvas.width * 25.4) / PRINT_DPI
        const h = (canvas.height * 25.4) / PRINT_DPI
        if (!pdf) pdf = new jsPDF({ unit: 'mm', format: [w, h] })
        else pdf.addPage([w, h])
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, w, h)
      })
      if (pdf) pdf.save('NutritionLabels_batch.pdf')
    } finally {
      setDownloading(false)
    }
  }

  async function downloadBatchPNG() {
    setDownloading(true)
    try {
      const files = []
      await forEachBatchLabel(async (name, canvas) => {
        const blob = await canvasToBlob(canvas)
        const buf = new Uint8Array(await blob.arrayBuffer())
        const safe = name.replace(/[\\/:*?"<>|]/g, '-')
        files.push({ name: `${safe}.png`, data: buf })
      })
      if (files.length) downloadBlob(makeZip(files), 'NutritionLabels_PNG.zip')
    } finally {
      setDownloading(false)
    }
  }

  // Batch selection helpers
  const batchFiltered = batchQuery
    ? products.filter((p) => p.toLowerCase().includes(batchQuery.toLowerCase()))
    : products

  function toggleBatch(name) {
    setBatchSel((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  function selectAllVisible() {
    setBatchSel((prev) => [...new Set([...prev, ...batchFiltered])])
  }

  function clearBatch() {
    setBatchSel([])
  }

  // Find active template metadata
  const currentTemplateObj = TEMPLATE_GROUPS.flatMap((g) => g.templates).find(
    (t) => t.id === template
  )
  const isMarketingTemplate = currentTemplateObj?.type === 'marketing'

  return (
    <div className="app">
      {/* Global Header with Brand & Navigation Tabs */}
      <header className="app-header">
        <div className="header-brand-block">
          <h1>SattuPro Formulation & Nutrition Suite</h1>
          <p className="app-subtitle">
            Recipe Nutrition Calculation · Data Validation · Claim Screening · Label Workspace
          </p>
        </div>

        {/* Top Navigation Tabs */}
        <nav className="top-nav-tabs">
          <button
            type="button"
            className={`nav-tab-btn ${activeView === NAV_VIEWS.LABEL_GENERATOR ? 'active' : ''}`}
            onClick={() => setActiveView(NAV_VIEWS.LABEL_GENERATOR)}
          >
            🏷️ Label Generator
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeView === NAV_VIEWS.FORMULATION ? 'active' : ''}`}
            onClick={() => setActiveView(NAV_VIEWS.FORMULATION)}
          >
            🧪 Formulation & Recipes
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeView === NAV_VIEWS.INGREDIENT_MASTER ? 'active' : ''}`}
            onClick={() => setActiveView(NAV_VIEWS.INGREDIENT_MASTER)}
          >
            🥗 Ingredient Master
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeView === NAV_VIEWS.AI_RESEARCH ? 'active' : ''}`}
            onClick={() => setActiveView(NAV_VIEWS.AI_RESEARCH)}
          >
            🔎 AI Research
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeView === NAV_VIEWS.DATA_SETTINGS ? 'active' : ''}`}
            onClick={() => setActiveView(NAV_VIEWS.DATA_SETTINGS)}
          >
            ⚙️ Data & Backup
          </button>
        </nav>
      </header>

      {/* Global Status Banner */}
      {status.msg && (
        <div className={`status-bar ${status.type}`}>
          <span>{status.msg}</span>
          {activeView === NAV_VIEWS.LABEL_GENERATOR && (
            <button
              className="refresh-btn"
              onClick={loadSheet}
              disabled={status.type === 'loading'}
              title="Reload products from Google Sheets"
            >
              ↻ Refresh Sheet
            </button>
          )}
        </div>
      )}

      {/* ── View 1: LABEL GENERATOR ── */}
      {activeView === NAV_VIEWS.LABEL_GENERATOR && (
        <div className="layout">
          {/* Controls Panel */}
          <div className="form-panel">
            {/* Product Selector */}
            <div className="section-title">Product / Preset</div>
            <div className="form-group">
              <ProductSelect
                products={products}
                value={selectedProduct}
                onChange={handleProductChange}
                disabled={products.length === 0}
                placeholder={
                  products.length === 0
                    ? status.type === 'error'
                      ? 'Load failed'
                      : 'Loading products…'
                    : 'Choose a product'
                }
              />
            </div>

            {/* Quick link to formulate */}
            <div className="formulation-shortcut-bar">
              <span>Need custom recipe calculation?</span>
              <button
                type="button"
                className="btn-link"
                onClick={() => setActiveView(NAV_VIEWS.FORMULATION)}
              >
                Go to Formulation Engine →
              </button>
            </div>

            {data.dataOrigin === 'RECIPE_ESTIMATE' && (
              <div className="recipe-origin-notice">
                🌱 <strong>Formulation Transfer Active:</strong> Displaying calculated recipe estimate. Nutrients with incomplete data coverage are held as &ldquo;—&rdquo; to protect regulatory compliance.
              </div>
            )}

            {/* Categorized Template Picker */}
            <div className="option-grid">
              <div>
                <div className="section-title">Label Template</div>
                <select
                  className="template-select"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                >
                  {TEMPLATE_GROUPS.map((group) => (
                    <optgroup key={group.group} label={group.group}>
                      {group.templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {isMarketingTemplate && (
                  <div className="template-disclaimer-note">
                    ⚠️ <strong>Notice:</strong> Marketing views are promotional visualizations and not statutory nutrition panels.
                  </div>
                )}
              </div>

              <div>
                <div className="section-title">Print size (300 DPI)</div>
                <div className="segmented">
                  {SIZE_PRESETS.map((s) => (
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
                <div className="size-hint">
                  {size.mm} mm wide · {Math.round((size.mm / 25.4) * PRINT_DPI)} px
                </div>
              </div>
            </div>

            {/* Batch Mode Controls */}
            {products.length > 0 && (
              <label className="toggle-row">
                <input
                  type="checkbox"
                  className="toggle-input"
                  checked={batchMode}
                  onChange={(e) => {
                    setBatchMode(e.target.checked)
                    setBatchSel([])
                    setBatchQuery('')
                  }}
                />
                <span className="toggle-track" aria-hidden="true">
                  <span className="toggle-thumb" />
                </span>
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
                    onChange={(e) => setBatchQuery(e.target.value)}
                  />
                  <button type="button" className="mini-btn" onClick={selectAllVisible}>
                    Select all{batchQuery ? ' (filtered)' : ''}
                  </button>
                  <button
                    type="button"
                    className="mini-btn"
                    onClick={clearBatch}
                    disabled={batchSelected.length === 0}
                  >
                    Clear
                  </button>
                </div>

                <div className="batch-list">
                  {batchFiltered.length === 0 && (
                    <div className="batch-empty">No products match “{batchQuery}”</div>
                  )}
                  {batchFiltered.map((p) => (
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

            {/* Single Export Buttons */}
            {!batchMode && (
              <>
                <div className="btn-row">
                  <button
                    className="btn btn-primary"
                    onClick={downloadPDF}
                    disabled={downloading || !data.product}
                  >
                    {downloading ? 'Exporting…' : 'Download PDF'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={downloadPNG}
                    disabled={downloading || !data.product}
                  >
                    {downloading ? 'Exporting…' : 'Download PNG'}
                  </button>
                </div>
                <button
                  className="btn btn-secondary btn-block"
                  style={{ marginTop: 10 }}
                  onClick={copyPNG}
                  disabled={downloading || !data.product}
                >
                  {copied ? '✓ Copied to clipboard' : 'Copy PNG to clipboard'}
                </button>
              </>
            )}

            {/* Optional Collapsible Nutrient Tweaker */}
            <div className="manual-edit-accordion">
              <button
                type="button"
                className="accordion-toggle"
                onClick={() => setShowDataEditor((prev) => !prev)}
              >
                <span>{showDataEditor ? '▼' : '►'} Manual Label Value Overrides</span>
              </button>

              {showDataEditor && (
                <div className="accordion-body">
                  <div className="form-group">
                    <label>Product Title</label>
                    <input
                      type="text"
                      className="text-input"
                      value={data.product || ''}
                      onChange={(e) => setData({ ...data, product: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Serving Size Text</label>
                    <input
                      type="text"
                      className="text-input"
                      value={data.servingSize || '25g'}
                      onChange={(e) => setData({ ...data, servingSize: e.target.value })}
                    />
                  </div>
                  <div className="grid-nutrients-form">
                    {[
                      { key: 'energy', label: 'Energy (kcal)' },
                      { key: 'protein', label: 'Protein (g)' },
                      { key: 'totalCarb', label: 'Total Carb (g)' },
                      { key: 'totalSugar', label: 'Total Sugar (g)' },
                      { key: 'addedSugar', label: 'Added Sugar (g)' },
                      { key: 'dietaryFiber', label: 'Dietary Fiber (g)' },
                      { key: 'totalFat', label: 'Total Fat (g)' },
                      { key: 'saturatedFat', label: 'Saturated Fat (g)' },
                      { key: 'transFat', label: 'Trans Fat (g)' },
                      { key: 'sodium', label: 'Sodium (mg)' },
                    ].map(({ key, label }) => (
                      <div key={key} className="form-group">
                        <label>{label}</label>
                        <input
                          type="number"
                          step="0.1"
                          className="text-input"
                          value={data[key] !== null && data[key] !== undefined ? data[key] : ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : Number(e.target.value)
                            setData({ ...data, [key]: val })
                          }}
                          placeholder="—"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Label Preview Frame */}
          <div className="preview-panel">
            <div className="preview-caption">
              Preview · {data.product || 'Untitled'}
            </div>
            <div className="preview-frame">
              <NutritionLabel data={data} labelRef={labelRef} template={template} />
            </div>
          </div>
        </div>
      )}

      {/* ── View 2: FORMULATION & RECIPES ── */}
      {activeView === NAV_VIEWS.FORMULATION && (
        <FormulationWorkspace
          recipe={currentRecipe}
          recipes={recipes}
          ingredientMaster={ingredients}
          overrides={recipeOverrides[activeRecipeId] || {}}
          onUpdateOverrides={(newOv) => handleUpdateRecipeOverrides(activeRecipeId, newOv)}
          onSelectRecipe={handleSelectRecipe}
          onUpdateRecipe={handleUpdateRecipe}
          onSaveCustomRecipe={handleSaveCustomRecipe}
          onDeleteRecipe={handleDeleteRecipe}
          onResetRecipes={handleResetRecipes}
          onApplyToLabel={handleApplyFormulationToLabel}
        />
      )}

      {/* ── View 3: INGREDIENT MASTER ── */}
      {activeView === NAV_VIEWS.INGREDIENT_MASTER && (
        <IngredientMaster
          ingredientMaster={ingredients}
          onSaveIngredient={handleSaveIngredient}
          onDeleteIngredient={handleDeleteIngredient}
          onResetIngredients={handleResetIngredients}
        />
      )}

      {/* ── View 4: AI RESEARCH ── */}
      {activeView === NAV_VIEWS.AI_RESEARCH && (
        <AIResearchWorkspace
          ingredients={
            Array.isArray(ingredients)
              ? Object.fromEntries(ingredients.map((i) => [i.id, i]))
              : ingredients
          }
          onUpdateIngredient={(id, updated) => {
            setIngredients((prev) => {
              if (Array.isArray(prev)) {
                return prev.map((i) => (i.id === id ? updated : i))
              }
              return { ...prev, [id]: updated }
            })
          }}
          onAddIngredient={(newIng) => {
            setIngredients((prev) => {
              if (Array.isArray(prev)) {
                return [newIng, ...prev]
              }
              return { ...prev, [newIng.id]: newIng }
            })
          }}
        />
      )}

      {/* ── View 5: DATA & BACKUP ── */}
      {activeView === NAV_VIEWS.DATA_SETTINGS && (
        <DataSettings
          ingredientMaster={ingredients}
          recipes={recipes}
          onImportData={handleImportData}
          onResetAllFactory={handleResetAllFactory}
        />
      )}
    </div>
  )
}
