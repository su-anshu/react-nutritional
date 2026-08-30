import React, { useState } from 'react'
import { RESEARCH_MODES, QUICK_TEMPLATES } from '../../services/aiClient'

const COMMON_NUTRIENTS = [
  'energy',
  'protein',
  'totalCarb',
  'availableCarb',
  'dietaryFiber',
  'totalSugar',
  'totalFat',
  'saturatedFat',
  'transFat',
  'sodium',
  'iron',
  'calcium',
  'potassium',
  'moisture',
  'ash',
]

export default function ResearchQuery({
  existingIngredients = {},
  selectedIngredientId = '',
  onSelectIngredientId,
  onSubmit,
  loading = false,
}) {
  const [mode, setMode] = useState('GENERAL_QUERY')
  const [query, setQuery] = useState('')
  const [targetNutrients, setTargetNutrients] = useState([])

  const handleApplyTemplate = (tmpl) => {
    setMode(tmpl.mode)
    setQuery(tmpl.query)
    if (tmpl.ingredientId && onSelectIngredientId) {
      onSelectIngredientId(tmpl.ingredientId)
    }
  }

  const toggleNutrient = (n) => {
    if (targetNutrients.includes(n)) {
      setTargetNutrients(targetNutrients.filter((x) => x !== n))
    } else {
      setTargetNutrients([...targetNutrients, n])
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!query.trim() || loading) return
    const ingredient = existingIngredients[selectedIngredientId]
    onSubmit({
      query: query.trim(),
      mode,
      ingredientId: selectedIngredientId,
      ingredientName: ingredient?.name || '',
      targetNutrients,
    })
  }

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
            🔎 Grounded Food Science & Nutrition Research
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            Queries Gemini 2.5 with live Google Search grounding across ICMR-NIN, IFCT, USDA FoodData Central & peer-reviewed journals.
          </p>
        </div>
      </div>

      {/* Quick Templates */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
          ⚡ Quick Research Presets:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {QUICK_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyTemplate(tmpl)}
              style={{
                fontSize: '11px',
                padding: '5px 10px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                color: '#1e293b',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e0f2fe'
                e.currentTarget.style.borderColor = '#7dd3fc'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc'
                e.currentTarget.style.borderColor = '#cbd5e1'
              }}
            >
              {tmpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode Grid */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
          Research Mode:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
          {RESEARCH_MODES.map((m) => {
            const isSelected = mode === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  textAlign: 'left',
                  background: isSelected ? '#f0f9ff' : '#ffffff',
                  border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: isSelected ? '#0369a1' : '#334155',
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                <span style={{ fontSize: '16px' }}>{m.icon}</span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Ingredient Context & Target Nutrients */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
              Target Ingredient (Optional):
            </label>
            <select
              value={selectedIngredientId}
              onChange={(e) => onSelectIngredientId && onSelectIngredientId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
              }}
            >
              <option value="">-- None (New / Unlisted) --</option>
              {Object.values(existingIngredients).map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name} ({ing.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
              Target Nutrients to Audit / Extract:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {COMMON_NUTRIENTS.map((n) => {
                const active = targetNutrients.includes(n)
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => toggleNutrient(n)}
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: active ? '1px solid #0284c7' : '1px solid #e2e8f0',
                      background: active ? '#e0f2fe' : '#f8fafc',
                      color: active ? '#0369a1' : '#64748b',
                      cursor: 'pointer',
                    }}
                  >
                    {n}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Query Input */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
            Food Science / Nutritional Research Query:
          </label>
          <textarea
            rows={3}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Provide nutritional composition and mineral profile for dehydrated amchur (dry mango powder) with 8% moisture. What are the authoritative IFCT / USDA references?"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '13px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              boxSizing: 'border-box',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            🔒 API queries execute with mandatory Google Search tools for scientific grounding.
          </span>
          <button
            type="submit"
            disabled={!query.trim() || loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#ffffff',
              background: query.trim() && !loading ? '#0284c7' : '#94a3b8',
              border: 'none',
              borderRadius: '8px',
              cursor: query.trim() && !loading ? 'pointer' : 'not-allowed',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            }}
          >
            {loading ? (
              <>
                <span>⏳</span> Grounding with Google Search...
              </>
            ) : (
              <>
                <span>🚀</span> Run Grounded Research Query
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
