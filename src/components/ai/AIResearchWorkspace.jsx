import React, { useState, useEffect } from 'react'
import {
  loadAISettings,
  saveAISettings,
  loadResearchHistory,
  saveResearchToHistory,
  clearResearchHistory,
  executeAIResearch,
} from '../../services/aiClient'
import ResearchQuery from './ResearchQuery'
import ResearchResult from './ResearchResult'
import AISettings from './AISettings'
import CandidateReviewModal from './CandidateReviewModal'

export default function AIResearchWorkspace({
  ingredients = {},
  onUpdateIngredient,
  onAddIngredient,
}) {
  const [settings, setSettings] = useState(loadAISettings())
  const [history, setHistory] = useState([])
  const [activeResult, setActiveResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedIngredientId, setSelectedIngredientId] = useState('')
  const [successNotice, setSuccessNotice] = useState(null)

  useEffect(() => {
    const loaded = loadResearchHistory()
    setHistory(loaded)
    if (loaded.length > 0) {
      setActiveResult(loaded[0])
    }
  }, [])

  const handleExecute = async ({ query, mode, ingredientId, ingredientName, targetNutrients }) => {
    setLoading(true)
    setError(null)
    setSuccessNotice(null)

    try {
      const res = await executeAIResearch({
        query,
        mode,
        ingredientId,
        ingredientName,
        targetNutrients,
        model: settings.selectedModel,
        temperature: settings.temperature,
      })

      const fullResult = {
        id: 'req_' + Date.now(),
        ...res,
      }

      setActiveResult(fullResult)
      if (settings.autoSaveHistory) {
        const updated = saveResearchToHistory(fullResult)
        setHistory(updated)
      }
    } catch (err) {
      setError(err.message || 'Failed to execute grounded AI research query')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings)
    saveAISettings(newSettings)
  }

  const handleClearHistory = () => {
    if (window.confirm('Clear all AI research query history?')) {
      clearResearchHistory()
      setHistory([])
      setActiveResult(null)
    }
  }

  const handleAcceptCandidate = ({ ingredientId, ingredient, isNew }) => {
    if (isNew && onAddIngredient) {
      onAddIngredient(ingredient)
      setSuccessNotice(`Successfully created new ingredient "${ingredient.name}" in Ingredient Master!`)
    } else if (onUpdateIngredient) {
      onUpdateIngredient(ingredientId, ingredient)
      setSuccessNotice(`Successfully updated ingredient "${ingredient.name}" with grounded candidate nutrients!`)
    }
    setShowReviewModal(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Top Controls Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: '#ffffff',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
            🔎 Gemini AI Research Engine with Google Search Grounding
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            Authoritative Food Formulation & Nutritional Intelligence · Missing ≠ Zero Governance · Dehydration Physics Aware
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 500,
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#334155',
            }}
          >
            <span>⚙️</span> Model Settings ({settings.selectedModel})
          </button>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              style={{
                padding: '8px 12px',
                fontSize: '12px',
                background: '#ffffff',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#b91c1c',
              }}
            >
              Clear History
            </button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successNotice && (
        <div
          style={{
            padding: '12px 16px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '8px',
            color: '#065f46',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✅ {successNotice}</span>
          <button
            onClick={() => setSuccessNotice(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#065f46' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          style={{
            padding: '14px 16px',
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            borderRadius: '8px',
            color: '#9f1239',
            fontSize: '13px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <strong>⚠️ AI Query Execution Error:</strong>
          <div>{error}</div>
          <div style={{ fontSize: '12px', color: '#be123c', marginTop: '4px' }}>
            Ensure your <code>GEMINI_API_KEY</code> is set in <code>.env.local</code> and Vite dev server is running.
          </div>
        </div>
      )}

      {/* Main Grid: Query & Results */}
      <div style={{ display: 'grid', gridTemplateColumns: history.length > 0 ? '1fr 300px' : '1fr', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Query Component */}
          <ResearchQuery
            existingIngredients={ingredients}
            selectedIngredientId={selectedIngredientId}
            onSelectIngredientId={setSelectedIngredientId}
            onSubmit={handleExecute}
            loading={loading}
          />

          {/* Loading Indicator */}
          {loading && (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '30px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '28px', animation: 'spin 1.5s linear infinite' }}>⏳</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                Grounding Food Science Query via Google Search...
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', maxWidth: '480px' }}>
                Querying official food databases (IFCT / ICMR-NIN, USDA FoodData Central) and extracting verified citations and candidate nutrients.
              </div>
            </div>
          )}

          {/* Active Result Component */}
          {!loading && activeResult && (
            <ResearchResult
              result={activeResult}
              existingIngredients={ingredients}
              onOpenReviewModal={() => setShowReviewModal(true)}
            />
          )}
        </div>

        {/* History Sidebar */}
        {history.length > 0 && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '16px',
              height: 'fit-content',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                📜 Research History ({history.length})
              </h4>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Latest first</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '600px', overflowY: 'auto' }}>
              {history.map((item) => {
                const isSelected = activeResult?.id === item.id
                const isGrounded = item.isGrounded && (item.citations?.length || 0) > 0
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveResult(item)}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      background: isSelected ? '#f0f9ff' : '#f8fafc',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '8px',
                          background: isGrounded ? '#dcfce7' : '#fee2e2',
                          color: isGrounded ? '#166534' : '#991b1b',
                        }}
                      >
                        {isGrounded ? `${item.citations?.length || 0} Citations` : 'Ungrounded'}
                      </span>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#1e293b',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.query}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <AISettings
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Review & Accept Candidate Modal */}
      {showReviewModal && activeResult && (
        <CandidateReviewModal
          candidateData={activeResult.data}
          citations={activeResult.citations}
          groundingScore={activeResult.groundingScore}
          isGrounded={activeResult.isGrounded}
          existingIngredients={ingredients}
          defaultIngredientId={selectedIngredientId}
          onAccept={handleAcceptCandidate}
          onClose={() => setShowReviewModal(false)}
        />
      )}
    </div>
  )
}
