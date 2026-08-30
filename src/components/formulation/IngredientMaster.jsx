import React, { useState } from 'react'
import { fmtWithUnit } from '../../utils'

export default function IngredientMaster({
  ingredientMaster,
  onSaveIngredient,
  onDeleteIngredient,
  onResetIngredients,
}) {
  const [filterText, setFilterText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [editingIngredient, setEditingIngredient] = useState(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  const categories = [
    'ALL',
    ...Array.from(new Set(ingredientMaster.map((i) => i.category || 'other'))),
  ]

  const filteredIngredients = ingredientMaster.filter((ing) => {
    const matchesCategory = selectedCategory === 'ALL' || ing.category === selectedCategory
    const matchesSearch =
      ing.name.toLowerCase().includes(filterText.toLowerCase()) ||
      (ing.metadata?.sourceType || '').toLowerCase().includes(filterText.toLowerCase()) ||
      (ing.aliases || []).some((a) => a.toLowerCase().includes(filterText.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const handleStartEdit = (ing) => {
    setEditingIngredient(JSON.parse(JSON.stringify(ing)))
    setIsCreatingNew(false)
  }

  const handleStartCreate = () => {
    const newIng = {
      id: `custom-ing-${Date.now()}`,
      name: '',
      aliases: [],
      category: 'pulse',
      processing: 'ground',
      nutrients: {
        energy: null,
        protein: null,
        totalCarb: null,
        totalSugar: null,
        addedSugar: 0,
        dietaryFiber: null,
        totalFat: null,
        saturatedFat: null,
        transFat: null,
        sodium: null,
        calcium: null,
        iron: null,
      },
      aminoAcids: {},
      metadata: {
        sourceType: 'USER_ENTERED',
        sourceName: 'User Custom Entry',
        confidence: 'medium',
        isSalt: false,
        isGluten: false,
        notes: '',
        allergenNotes: '',
      },
      isCustom: true,
    }
    setEditingIngredient(newIng)
    setIsCreatingNew(true)
  }

  const handleSaveModal = () => {
    if (!editingIngredient.name.trim()) {
      alert('Please provide an ingredient name.')
      return
    }
    onSaveIngredient(editingIngredient)
    setEditingIngredient(null)
  }

  return (
    <div className="card-panel ingredient-master-panel">
      {/* Header and Controls */}
      <div className="master-header-row">
        <div>
          <h4>Ingredient Master Database</h4>
          <p className="subtext">
            Standard reference composition (IFCT, USDA, Supplier COA). Missing nutrients are stored as null (not zero).
          </p>
        </div>

        <div className="master-action-buttons">
          <button type="button" className="btn btn-primary" onClick={handleStartCreate}>
            ➕ Add Custom Ingredient
          </button>
          <button type="button" className="btn btn-outline" onClick={onResetIngredients}>
            🔄 Reset Defaults
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="master-filter-bar">
        <input
          type="text"
          className="text-input"
          placeholder="🔍 Search ingredient name, source, or alias..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{ maxWidth: 360 }}
        />

        <div className="category-chips">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`chip-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Ingredients Table */}
      <div className="table-responsive">
        <table className="formulation-table">
          <thead>
            <tr>
              <th>Ingredient</th>
              <th>Category</th>
              <th>Energy</th>
              <th>Protein</th>
              <th>Carbs</th>
              <th>Fiber</th>
              <th>Fat</th>
              <th>Sodium</th>
              <th>Data Source</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredIngredients.map((ing) => (
              <tr key={ing.id}>
                <td>
                  <strong>{ing.name}</strong>
                  {ing.metadata?.isGluten && (
                    <span className="badge badge-warning" style={{ marginLeft: 6 }}>
                      Gluten
                    </span>
                  )}
                  {ing.metadata?.isSalt && (
                    <span className="badge badge-danger" style={{ marginLeft: 6 }}>
                      Salt
                    </span>
                  )}
                  {ing.metadata?.notes && (
                    <div className="item-subnote">{ing.metadata.notes}</div>
                  )}
                </td>
                <td>
                  <span className="badge badge-neutral">{ing.category}</span>
                </td>
                <td className="font-mono">{fmtWithUnit(ing.nutrients?.energy, 'kcal', 0)}</td>
                <td className="font-mono">{fmtWithUnit(ing.nutrients?.protein, 'g')}</td>
                <td className="font-mono">{fmtWithUnit(ing.nutrients?.totalCarb, 'g')}</td>
                <td className="font-mono">{fmtWithUnit(ing.nutrients?.dietaryFiber, 'g')}</td>
                <td className="font-mono">{fmtWithUnit(ing.nutrients?.totalFat, 'g')}</td>
                <td className="font-mono">{fmtWithUnit(ing.nutrients?.sodium, 'mg', 0)}</td>
                <td>
                  <span className={`badge badge-source badge-${(ing.metadata?.sourceType || 'IFCT').toLowerCase()}`}>
                    {ing.metadata?.sourceType || 'IFCT'}
                  </span>
                </td>
                <td>
                  <div className="table-row-actions">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => handleStartEdit(ing)}
                    >
                      ✏️ Edit
                    </button>
                    {ing.isCustom && (
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => onDeleteIngredient(ing.id)}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit / Create Ingredient Modal */}
      {editingIngredient && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{isCreatingNew ? 'Add Custom Ingredient' : `Edit: ${editingIngredient.name}`}</h3>
              <button
                type="button"
                className="btn-icon-close"
                onClick={() => setEditingIngredient(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-row-2">
                <div className="form-group">
                  <label>Ingredient Name</label>
                  <input
                    type="text"
                    className="text-input"
                    value={editingIngredient.name}
                    onChange={(e) =>
                      setEditingIngredient({ ...editingIngredient, name: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    className="select-input"
                    value={editingIngredient.category}
                    onChange={(e) =>
                      setEditingIngredient({ ...editingIngredient, category: e.target.value })
                    }
                  >
                    <option value="pulse">Pulse / Legume</option>
                    <option value="grain">Grain / Cereal</option>
                    <option value="spice">Spice / Herb</option>
                    <option value="superfood">Superfood Botanical</option>
                    <option value="protein-isolate">Protein Isolate</option>
                    <option value="fruit-powder">Fruit Powder</option>
                    <option value="vegetable-powder">Vegetable Powder</option>
                    <option value="salt">Salt / Mineral</option>
                    <option value="sweetener">Sweetener</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="modal-section-title">Nutritional Composition per 100g (Leave blank if unknown)</div>
              <div className="grid-nutrients-form">
                {[
                  { key: 'energy', label: 'Energy (kcal)' },
                  { key: 'protein', label: 'Protein (g)' },
                  { key: 'totalCarb', label: 'Total Carbohydrate (g)' },
                  { key: 'totalSugar', label: 'Total Sugars (g)' },
                  { key: 'addedSugar', label: 'Added Sugars (g)' },
                  { key: 'dietaryFiber', label: 'Dietary Fiber (g)' },
                  { key: 'totalFat', label: 'Total Fat (g)' },
                  { key: 'saturatedFat', label: 'Saturated Fat (g)' },
                  { key: 'transFat', label: 'Trans Fat (g)' },
                  { key: 'sodium', label: 'Sodium (mg)' },
                  { key: 'calcium', label: 'Calcium (mg)' },
                  { key: 'iron', label: 'Iron (mg)' },
                  { key: 'potassium', label: 'Potassium (mg)' },
                  { key: 'magnesium', label: 'Magnesium (mg)' },
                ].map(({ key, label }) => (
                  <div key={key} className="form-group">
                    <label>{label}</label>
                    <input
                      type="number"
                      step="0.01"
                      className="text-input"
                      value={
                        editingIngredient.nutrients[key] !== null &&
                        editingIngredient.nutrients[key] !== undefined
                          ? editingIngredient.nutrients[key]
                          : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value === '' ? null : Number(e.target.value)
                        setEditingIngredient({
                          ...editingIngredient,
                          nutrients: {
                            ...editingIngredient.nutrients,
                            [key]: val,
                          },
                        })
                      }}
                      placeholder="—"
                    />
                  </div>
                ))}
              </div>

              <div className="modal-section-title">Provenance & Regulatory Metadata</div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Data Source Type</label>
                  <select
                    className="select-input"
                    value={editingIngredient.metadata?.sourceType || 'IFCT'}
                    onChange={(e) =>
                      setEditingIngredient({
                        ...editingIngredient,
                        metadata: {
                          ...editingIngredient.metadata,
                          sourceType: e.target.value,
                        },
                      })
                    }
                  >
                    <option value="IFCT">IFCT (ICMR-NIN)</option>
                    <option value="USDA">USDA FoodData Central</option>
                    <option value="SUPPLIER_COA">Supplier Certificate of Analysis (COA)</option>
                    <option value="LAB_TEST">Accredited Lab Test (FSSAI/NABL)</option>
                    <option value="PROXY_ESTIMATE">Proxy / Theoretical Estimate</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Confidence Rating</label>
                  <select
                    className="select-input"
                    value={editingIngredient.metadata?.confidence || 'medium'}
                    onChange={(e) =>
                      setEditingIngredient({
                        ...editingIngredient,
                        metadata: {
                          ...editingIngredient.metadata,
                          confidence: e.target.value,
                        },
                      })
                    }
                  >
                    <option value="high">High (Standard Lab / IFCT)</option>
                    <option value="medium">Medium (Standard Reference)</option>
                    <option value="medium-low">Medium-Low (Supplier Dependent)</option>
                    <option value="low">Low (Requires Supplier COA)</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={editingIngredient.metadata?.isSalt || false}
                      onChange={(e) =>
                        setEditingIngredient({
                          ...editingIngredient,
                          metadata: {
                            ...editingIngredient.metadata,
                            isSalt: e.target.checked,
                          },
                        })
                      }
                    />{' '}
                    Is Salt / Added Sodium Chloride
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={editingIngredient.metadata?.isGluten || false}
                      onChange={(e) =>
                        setEditingIngredient({
                          ...editingIngredient,
                          metadata: {
                            ...editingIngredient.metadata,
                            isGluten: e.target.checked,
                          },
                        })
                      }
                    />{' '}
                    Contains Gluten Allergen (e.g., Barley/Wheat)
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Provenance Notes / Regulatory Warnings</label>
                <input
                  type="text"
                  className="text-input"
                  value={editingIngredient.metadata?.notes || ''}
                  onChange={(e) =>
                    setEditingIngredient({
                      ...editingIngredient,
                      metadata: {
                        ...editingIngredient.metadata,
                        notes: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. Supplier protein content may vary 75-85%"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setEditingIngredient(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveModal}>
                Save Ingredient
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
