import React, { useState } from 'react'
import RecipeBuilder from './RecipeBuilder'
import NutritionResults from './NutritionResults'
import IngredientContribution from './IngredientContribution'
import ValidationPanel from './ValidationPanel'
import ClaimChecker from './ClaimChecker'
import AminoAcidPanel from './AminoAcidPanel'
import FormulationReport from './FormulationReport'
import { calculateRecipeNutrition } from '../../engine/nutritionEngine'

export const FORMULATION_TABS = {
  RECIPE: 'Recipe Builder',
  NUTRITION: 'Nutritional Profile',
  CONTRIBUTION: 'Ingredient Contribution',
  VALIDATION: 'Validation & Physics',
  CLAIMS: 'Claim Checker',
  AMINO: 'Amino Acids & BCAA',
  REPORT: 'Technical Dossier',
}

export default function FormulationWorkspace({
  recipe,
  recipes,
  ingredientMaster,
  overrides = {},
  onUpdateOverrides,
  onSelectRecipe,
  onUpdateRecipe,
  onSaveCustomRecipe,
  onDeleteRecipe,
  onResetRecipes,
  onApplyToLabel,
}) {
  const [activeTab, setActiveTab] = useState(FORMULATION_TABS.RECIPE)

  // Calculate live nutrition from formulation with active overrides
  const formulationResult = calculateRecipeNutrition(recipe, ingredientMaster, overrides)

  return (
    <div className="formulation-workspace">
      {/* Formulation Sub-navigation Bar */}
      <div className="formulation-nav-bar">
        {Object.entries(FORMULATION_TABS).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`f-tab-btn ${activeTab === label ? 'active' : ''}`}
            onClick={() => setActiveTab(label)}
          >
            {label}
            {key === 'VALIDATION' && formulationResult.warnings?.length > 0 && (
              <span className="dot-warn" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="formulation-tab-content">
        {activeTab === FORMULATION_TABS.RECIPE && (
          <RecipeBuilder
            recipe={recipe}
            recipes={recipes}
            ingredientMaster={ingredientMaster}
            onSelectRecipe={onSelectRecipe}
            onUpdateRecipe={onUpdateRecipe}
            onSaveCustomRecipe={onSaveCustomRecipe}
            onDeleteRecipe={onDeleteRecipe}
            onResetRecipes={onResetRecipes}
            onApplyToLabel={() => onApplyToLabel(formulationResult)}
          />
        )}

        {activeTab === FORMULATION_TABS.NUTRITION && (
          <NutritionResults
            formulationResult={formulationResult}
            overrides={overrides}
            onUpdateOverrides={onUpdateOverrides}
          />
        )}

        {activeTab === FORMULATION_TABS.CONTRIBUTION && (
          <IngredientContribution formulationResult={formulationResult} />
        )}

        {activeTab === FORMULATION_TABS.VALIDATION && (
          <ValidationPanel formulationResult={formulationResult} />
        )}

        {activeTab === FORMULATION_TABS.CLAIMS && (
          <ClaimChecker formulationResult={formulationResult} />
        )}

        {activeTab === FORMULATION_TABS.AMINO && (
          <AminoAcidPanel
            recipe={recipe}
            ingredientMaster={ingredientMaster}
            totalProtein={formulationResult.nutrients?.protein}
          />
        )}

        {activeTab === FORMULATION_TABS.REPORT && (
          <FormulationReport
            recipe={recipe}
            ingredientMaster={ingredientMaster}
            formulationResult={formulationResult}
          />
        )}
      </div>
    </div>
  )
}
