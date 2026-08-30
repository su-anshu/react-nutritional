import React, { useState } from 'react'

export default function RecipeBuilder({
  recipe,
  recipes,
  ingredientMaster,
  onSelectRecipe,
  onUpdateRecipe,
  onSaveCustomRecipe,
  onDeleteRecipe,
  onResetRecipes,
  onApplyToLabel,
}) {
  const [selectedPresetId, setSelectedPresetId] = useState(recipe?.id || '')
  const [isEditingMeta, setIsEditingMeta] = useState(false)
  const [recipeName, setRecipeName] = useState(recipe?.name || '')
  const [servingSize, setServingSize] = useState(recipe?.servingSize || '50g')
  const [servingGrams, setServingGrams] = useState(recipe?.servingGrams || 50)

  // Calculate total recipe weight
  const totalWeight = recipe.items.reduce((sum, item) => sum + (Number(item.grams) || 0), 0)

  const handlePresetChange = (e) => {
    const id = e.target.value
    setSelectedPresetId(id)
    if (id) {
      onSelectRecipe(id)
    }
  }

  const handleItemGramsChange = (index, grams) => {
    const newItems = [...recipe.items]
    newItems[index] = { ...newItems[index], grams: Number(grams) || 0 }
    onUpdateRecipe({ ...recipe, items: newItems })
  }

  const handleItemIngredientChange = (index, ingredientId) => {
    const newItems = [...recipe.items]
    newItems[index] = { ...newItems[index], ingredientId }
    onUpdateRecipe({ ...recipe, items: newItems })
  }

  const handleAddItem = () => {
    const firstIng = ingredientMaster[0]?.id || 'roasted-chana-sattu'
    const newItems = [...recipe.items, { ingredientId: firstIng, grams: 10 }]
    onUpdateRecipe({ ...recipe, items: newItems })
  }

  const handleRemoveItem = (index) => {
    if (recipe.items.length <= 1) return
    const newItems = recipe.items.filter((_, i) => i !== index)
    onUpdateRecipe({ ...recipe, items: newItems })
  }

  const handleSaveMeta = () => {
    onUpdateRecipe({
      ...recipe,
      name: recipeName,
      servingSize,
      servingGrams: Number(servingGrams) || 50,
    })
    setIsEditingMeta(false)
  }

  const handleScaleTo100g = () => {
    if (totalWeight <= 0) return
    const factor = 100 / totalWeight
    const newItems = recipe.items.map((item) => ({
      ...item,
      grams: Number((Number(item.grams || 0) * factor).toFixed(2)),
    }))
    onUpdateRecipe({ ...recipe, items: newItems })
  }

  return (
    <div className="card-panel recipe-builder-panel">
      {/* Top Controls: Preset selector & Action buttons */}
      <div className="panel-header-row">
        <div className="preset-selector-group">
          <label className="field-label">Select Formulation / Recipe:</label>
          <select
            value={recipe.id || selectedPresetId}
            onChange={handlePresetChange}
            className="select-input select-preset"
          >
            {recipes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} {r.isCustom ? '(Custom)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="builder-header-actions">
          <button
            type="button"
            className="btn btn-primary btn-apply-label"
            onClick={onApplyToLabel}
            title="Transfer calculated nutrition directly to Label Generator"
          >
            ⚡ Use in Label Generator
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onSaveCustomRecipe(recipe)}
          >
            💾 Save Recipe
          </button>
          {recipe.isCustom && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => onDeleteRecipe(recipe.id)}
            >
              🗑️ Delete
            </button>
          )}
        </div>
      </div>

      {/* Recipe Meta Info */}
      <div className="recipe-meta-card">
        {isEditingMeta ? (
          <div className="meta-edit-form">
            <div className="form-group">
              <label>Product / Recipe Name</label>
              <input
                type="text"
                className="text-input"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
              />
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label>Serving Label (e.g. 50g, 2 tbsp)</label>
                <input
                  type="text"
                  className="text-input"
                  value={servingSize}
                  onChange={(e) => setServingSize(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Serving Grams (numeric)</label>
                <input
                  type="number"
                  className="text-input"
                  value={servingGrams}
                  onChange={(e) => setServingGrams(e.target.value)}
                />
              </div>
            </div>
            <div className="meta-buttons">
              <button type="button" className="btn btn-sm btn-primary" onClick={handleSaveMeta}>
                Save Details
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setIsEditingMeta(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="meta-display-row">
            <div>
              <h3 className="recipe-title">{recipe.name || 'Custom Sattu Formulation'}</h3>
              <p className="recipe-desc">{recipe.description || 'Custom formulation'}</p>
            </div>
            <div className="meta-badges">
              <span className="badge badge-info">Serving: {recipe.servingSize || '50g'} ({recipe.servingGrams || 50}g)</span>
              <button
                type="button"
                className="btn-link-edit"
                onClick={() => {
                  setRecipeName(recipe.name || '')
                  setServingSize(recipe.servingSize || '50g')
                  setServingGrams(recipe.servingGrams || 50)
                  setIsEditingMeta(true)
                }}
              >
                ✏️ Edit Info
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Batch Weight Summary Bar */}
      <div className={`batch-weight-bar ${Math.abs(totalWeight - 100) > 0.1 ? 'weight-mismatch' : 'weight-100'}`}>
        <div className="weight-info">
          <span><strong>Total Batch Weight:</strong> {totalWeight.toFixed(1)}g</span>
          {Math.abs(totalWeight - 100) > 0.1 ? (
            <span className="weight-note warning-text">
              ⚠️ Batch weight is {totalWeight.toFixed(1)}g (not 100g). Calculations are normalized per 100g.
            </span>
          ) : (
            <span className="weight-note success-text">✓ Standard 100g formulation base</span>
          )}
        </div>
        {Math.abs(totalWeight - 100) > 0.1 && (
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={handleScaleTo100g}
            title="Proportionally scales all ingredient weights to sum to exactly 100g"
          >
            ⚖️ Normalize to 100g
          </button>
        )}
      </div>

      {/* Ingredient Items Table */}
      <div className="table-responsive">
        <table className="formulation-table">
          <thead>
            <tr>
              <th style={{ width: '45%' }}>Ingredient</th>
              <th style={{ width: '20%' }}>Weight (g)</th>
              <th style={{ width: '20%' }}>% of Recipe</th>
              <th style={{ width: '15%' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {recipe.items.map((item, idx) => {
              const ing = ingredientMaster.find((i) => i.id === item.ingredientId)
              const grams = Number(item.grams) || 0
              const pct = totalWeight > 0 ? (grams / totalWeight) * 100 : 0

              return (
                <tr key={`${item.ingredientId}-${idx}`}>
                  <td>
                    <select
                      value={item.ingredientId}
                      onChange={(e) => handleItemIngredientChange(idx, e.target.value)}
                      className="select-input select-ingredient-item"
                    >
                      {ingredientMaster.map((ingItem) => (
                        <option key={ingItem.id} value={ingItem.id}>
                          {ingItem.name} ({ingItem.metadata?.sourceType || 'IFCT'})
                        </option>
                      ))}
                    </select>
                    {ing?.metadata?.allergenNotes && (
                      <div className="item-subnote warning-text">{ing.metadata.allergenNotes}</div>
                    )}
                    {ing?.metadata?.notes && (
                      <div className="item-subnote">{ing.metadata.notes}</div>
                    )}
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      className="text-input num-input"
                      value={item.grams}
                      onChange={(e) => handleItemGramsChange(idx, e.target.value)}
                    />
                  </td>
                  <td>
                    <div className="pct-progress-cell">
                      <span>{pct.toFixed(1)}%</span>
                      <div className="pct-bar-bg">
                        <div className="pct-bar-fill" style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-icon-danger"
                      disabled={recipe.items.length <= 1}
                      onClick={() => handleRemoveItem(idx)}
                      title="Remove ingredient"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Add ingredient button */}
      <div className="builder-footer-row">
        <button type="button" className="btn btn-secondary" onClick={handleAddItem}>
          ➕ Add Ingredient Row
        </button>
        <button type="button" className="btn btn-outline" onClick={onResetRecipes}>
          🔄 Reset Default Recipes
        </button>
      </div>
    </div>
  )
}
