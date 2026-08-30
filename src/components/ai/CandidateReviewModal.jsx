import React, { useState, useMemo } from 'react'
import { SOURCE_TYPES } from '../../data/ingredientMaster'

const NUTRIENT_DISPLAY_NAMES = {
  energy: { label: 'Energy', unit: 'kcal' },
  protein: { label: 'Protein', unit: 'g' },
  totalCarb: { label: 'Total Carbohydrate', unit: 'g' },
  availableCarb: { label: 'Available Carbohydrate', unit: 'g' },
  dietaryFiber: { label: 'Dietary Fibre', unit: 'g' },
  totalSugar: { label: 'Total Sugars', unit: 'g' },
  addedSugar: { label: 'Added Sugars', unit: 'g' },
  totalFat: { label: 'Total Fat', unit: 'g' },
  saturatedFat: { label: 'Saturated Fat', unit: 'g' },
  transFat: { label: 'Trans Fat', unit: 'g' },
  cholesterol: { label: 'Cholesterol', unit: 'mg' },
  sodium: { label: 'Sodium', unit: 'mg' },
  calcium: { label: 'Calcium', unit: 'mg' },
  iron: { label: 'Iron', unit: 'mg' },
  potassium: { label: 'Potassium', unit: 'mg' },
  magnesium: { label: 'Magnesium', unit: 'mg' },
  folate: { label: 'Folate', unit: 'mcg' },
  vitaminC: { label: 'Vitamin C', unit: 'mg' },
  moisture: { label: 'Moisture', unit: 'g' },
  ash: { label: 'Ash', unit: 'g' },
}

export default function CandidateReviewModal({
  candidateData = {},
  citations = [],
  groundingScore = 0,
  isGrounded = false,
  existingIngredients = {},
  defaultIngredientId = '',
  onAccept,
  onClose,
}) {
  const [targetMode, setTargetMode] = useState(defaultIngredientId ? 'UPDATE' : 'CREATE')
  const [selectedIngredientId, setSelectedIngredientId] = useState(defaultIngredientId || Object.keys(existingIngredients)[0] || '')
  
  // For creating new ingredient
  const [newIngredientId, setNewIngredientId] = useState(
    (candidateData.identifiedIngredient?.name || 'new-ingredient')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  )
  const [newIngredientName, setNewIngredientName] = useState(
    candidateData.identifiedIngredient?.name || 'New Research Ingredient'
  )
  const [newCategory, setNewCategory] = useState(
    candidateData.identifiedIngredient?.category || 'superfood'
  )

  const currentIngredient = existingIngredients[selectedIngredientId] || null
  const candidateNutrients = candidateData.candidateNutrients || {}

  // Initial selection: all candidate nutrients that have a non-null value
  const initialSelection = useMemo(() => {
    const sel = {}
    Object.keys(candidateNutrients).forEach((key) => {
      if (candidateNutrients[key]?.value !== null && candidateNutrients[key]?.value !== undefined) {
        sel[key] = true
      }
    })
    return sel
  }, [candidateNutrients])

  const [selectedNutrients, setSelectedNutrients] = useState(initialSelection)

  const toggleNutrient = (key) => {
    setSelectedNutrients((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const selectAll = () => {
    const sel = {}
    Object.keys(candidateNutrients).forEach((key) => {
      if (candidateNutrients[key]?.value !== null && candidateNutrients[key]?.value !== undefined) {
        sel[key] = true
      }
    })
    setSelectedNutrients(sel)
  }

  const selectMissingOnly = () => {
    if (!currentIngredient) return
    const sel = {}
    Object.keys(candidateNutrients).forEach((key) => {
      const candVal = candidateNutrients[key]?.value
      const currVal = currentIngredient.nutrients?.[key]
      if (candVal !== null && candVal !== undefined && (currVal === null || currVal === undefined)) {
        sel[key] = true
      }
    })
    setSelectedNutrients(sel)
  }

  const deselectAll = () => {
    setSelectedNutrients({})
  }

  const handleApply = () => {
    const isNew = targetMode === 'CREATE'
    const targetId = isNew ? newIngredientId : selectedIngredientId
    const baseIngredient = isNew
      ? {
          id: targetId,
          name: newIngredientName,
          category: newCategory,
          form: candidateData.identifiedIngredient?.processing || 'powder',
          sourceType: SOURCE_TYPES.AI_RESEARCH_CANDIDATE,
          sourceName: citations[0]?.title || 'Gemini Grounded Research',
          sourceUrl: citations[0]?.uri || '',
          sourceYear: '2026',
          confidence: groundingScore >= 70 ? 'Medium' : 'Medium-Low',
          discoveredVia: 'GEMINI_GROUNDED_RESEARCH',
          nutrients: {},
          nutrientMetadata: {},
        }
      : {
          ...currentIngredient,
          nutrients: { ...currentIngredient.nutrients },
          nutrientMetadata: { ...(currentIngredient.nutrientMetadata || {}) },
        }

    const updatedNutrients = { ...baseIngredient.nutrients }
    const updatedMetadata = { ...baseIngredient.nutrientMetadata }

    Object.keys(selectedNutrients).forEach((key) => {
      if (selectedNutrients[key]) {
        const cand = candidateNutrients[key]
        if (cand && cand.value !== null && cand.value !== undefined) {
          updatedNutrients[key] = Number(cand.value)
          updatedMetadata[key] = {
            sourceType: SOURCE_TYPES.AI_RESEARCH_CANDIDATE,
            sourceName: cand.sourceReference || citations[0]?.title || 'Grounded Gemini R&D Research',
            sourceUrl: citations[0]?.uri || '',
            sourceYear: '2026',
            confidence: cand.confidence || (groundingScore >= 70 ? 'Medium' : 'Medium-Low'),
            processingMatch: 'EXACT',
            discoveredVia: 'GEMINI_GROUNDED_RESEARCH',
            lastVerified: new Date().toISOString().split('T')[0],
            notes: cand.note || 'Accepted from Google Search-grounded AI research candidate',
          }
        }
      }
    })

    const finalIngredient = {
      ...baseIngredient,
      nutrients: updatedNutrients,
      nutrientMetadata: updatedMetadata,
      lastModified: new Date().toISOString(),
    }

    onAccept({
      ingredientId: targetId,
      ingredient: finalIngredient,
      isNew,
    })
  }

  const selectedCount = Object.values(selectedNutrients).filter(Boolean).length

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🔬</span>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                Review & Accept Candidate Nutrients into Ingredient Master
              </h3>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              AI findings are not automatically verified. Review individual nutrients, compare variances, and explicitly accept.
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#64748b',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Grounding status alert */}
          {!isGrounded ? (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                color: '#9f1239',
                fontSize: '13px',
              }}
            >
              <strong>⛔ Ungrounded AI Knowledge:</strong> This research query did not produce verified web citations. Data governance policies prohibit importing ungrounded AI predictions directly into master data.
            </div>
          ) : (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#166534',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <strong>✅ Search Grounded Result (Score: {groundingScore}/100):</strong> Citations verified from {citations.length} authoritative web source(s).
              </div>
              <span style={{ fontSize: '11px', background: '#dcfce7', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                Eligible for Master Import
              </span>
            </div>
          )}

          {/* Destination Selector */}
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '10px' }}>
              Target Destination in Ingredient Master:
            </div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="targetMode"
                  value="UPDATE"
                  checked={targetMode === 'UPDATE'}
                  onChange={() => setTargetMode('UPDATE')}
                />
                Update Existing Ingredient
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="targetMode"
                  value="CREATE"
                  checked={targetMode === 'CREATE'}
                  onChange={() => setTargetMode('CREATE')}
                />
                Create Brand New Ingredient
              </label>
            </div>

            {targetMode === 'UPDATE' ? (
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                  Select Ingredient to Update:
                </label>
                <select
                  value={selectedIngredientId}
                  onChange={(e) => setSelectedIngredientId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                  }}
                >
                  {Object.values(existingIngredients).map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} ({ing.id})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>
                    Ingredient Name
                  </label>
                  <input
                    type="text"
                    value={newIngredientName}
                    onChange={(e) => setNewIngredientName(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>
                    System ID
                  </label>
                  <input
                    type="text"
                    value={newIngredientId}
                    onChange={(e) => setNewIngredientId(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff' }}
                  >
                    <option value="pulse">Pulse / Legume</option>
                    <option value="grain">Grain / Cereal</option>
                    <option value="superfood">Superfood / Herbal</option>
                    <option value="spice">Spice / Flavoring</option>
                    <option value="vegetable-powder">Vegetable Powder</option>
                    <option value="fruit-powder">Fruit Powder</option>
                    <option value="protein-isolate">Protein Isolate</option>
                    <option value="salt">Salt / Mineral</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Quick Selection Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
              Candidate Nutrients per 100g ({selectedCount} selected)
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={selectAll}
                style={{ fontSize: '11px', padding: '4px 8px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
              >
                Select All Found
              </button>
              {targetMode === 'UPDATE' && (
                <button
                  type="button"
                  onClick={selectMissingOnly}
                  style={{ fontSize: '11px', padding: '4px 8px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Select Missing Only
                </button>
              )}
              <button
                type="button"
                onClick={deselectAll}
                style={{ fontSize: '11px', padding: '4px 8px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Side-by-Side Comparison Table */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '8px 12px', width: '36px' }}></th>
                  <th style={{ padding: '8px 12px' }}>Nutrient</th>
                  {targetMode === 'UPDATE' && <th style={{ padding: '8px 12px' }}>Current Master</th>}
                  <th style={{ padding: '8px 12px' }}>AI Candidate Value</th>
                  {targetMode === 'UPDATE' && <th style={{ padding: '8px 12px' }}>Variance / Diff</th>}
                  <th style={{ padding: '8px 12px' }}>Confidence & Reference</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(NUTRIENT_DISPLAY_NAMES).map((key) => {
                  const meta = NUTRIENT_DISPLAY_NAMES[key]
                  const cand = candidateNutrients[key]
                  const candVal = cand?.value
                  const hasCand = candVal !== null && candVal !== undefined
                  const currVal = currentIngredient?.nutrients?.[key]
                  const isChecked = Boolean(selectedNutrients[key])

                  // Variance Calculation
                  let varianceBadge = null
                  if (targetMode === 'UPDATE') {
                    if (currVal == null && hasCand) {
                      varianceBadge = (
                        <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>
                          NEW VALUE
                        </span>
                      )
                    } else if (currVal != null && hasCand) {
                      const diffPct = currVal > 0 ? Math.abs((candVal - currVal) / currVal) * 100 : 0
                      if (diffPct <= 10) {
                        varianceBadge = (
                          <span style={{ background: '#ecfdf5', color: '#065f46', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>
                            {diffPct.toFixed(1)}% (Minor)
                          </span>
                        )
                      } else if (diffPct <= 50) {
                        varianceBadge = (
                          <span style={{ background: '#fffbeb', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>
                            {diffPct.toFixed(1)}% (Major)
                          </span>
                        )
                      } else {
                        varianceBadge = (
                          <span style={{ background: '#fef2f2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>
                            {diffPct.toFixed(1)}% (Critical)
                          </span>
                        )
                      }
                    } else {
                      varianceBadge = <span style={{ color: '#94a3b8' }}>—</span>
                    }
                  }

                  return (
                    <tr
                      key={key}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: isChecked ? '#f0f9ff' : hasCand ? '#ffffff' : '#fafafa',
                      }}
                    >
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          disabled={!hasCand || !isGrounded}
                          checked={isChecked}
                          onChange={() => toggleNutrient(key)}
                        />
                      </td>
                      <td style={{ padding: '8px 12px', fontWeight: 500, color: '#1e293b' }}>
                        {meta.label} <span style={{ color: '#94a3b8', fontSize: '11px' }}>({meta.unit})</span>
                      </td>
                      {targetMode === 'UPDATE' && (
                        <td style={{ padding: '8px 12px', color: currVal != null ? '#0f172a' : '#94a3b8', fontStyle: currVal != null ? 'normal' : 'italic' }}>
                          {currVal != null ? `${currVal} ${meta.unit}` : 'Missing (null)'}
                        </td>
                      )}
                      <td style={{ padding: '8px 12px', fontWeight: hasCand ? 600 : 400, color: hasCand ? '#0284c7' : '#94a3b8' }}>
                        {hasCand ? `${candVal} ${meta.unit}` : 'Not Found (null)'}
                      </td>
                      {targetMode === 'UPDATE' && (
                        <td style={{ padding: '8px 12px' }}>{varianceBadge}</td>
                      )}
                      <td style={{ padding: '8px 12px', fontSize: '11px', color: '#64748b' }}>
                        {cand?.confidence && (
                          <span
                            style={{
                              marginRight: '6px',
                              background: cand.confidence === 'High' ? '#dcfce7' : '#fef3c7',
                              color: cand.confidence === 'High' ? '#166534' : '#92400e',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontWeight: 600,
                            }}
                          >
                            {cand.confidence}
                          </span>
                        )}
                        {cand?.sourceReference || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
          }}
        >
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            {selectedCount === 0
              ? 'Select at least one nutrient to import.'
              : `Ready to import ${selectedCount} nutrient(s) with sourceType: AI_RESEARCH_CANDIDATE.`}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#475569',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={selectedCount === 0 || !isGrounded}
              style={{
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                background: selectedCount > 0 && isGrounded ? '#0284c7' : '#94a3b8',
                color: '#ffffff',
                borderRadius: '6px',
                cursor: selectedCount > 0 && isGrounded ? 'pointer' : 'not-allowed',
              }}
            >
              {targetMode === 'CREATE' ? 'Create Ingredient & Import' : 'Apply Selected Nutrients'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
