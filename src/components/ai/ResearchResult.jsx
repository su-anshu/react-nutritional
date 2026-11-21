import React from 'react'
import SourceList from './SourceList'

export default function ResearchResult({
  result,
  onOpenReviewModal,
  existingIngredients = {},
}) {
  if (!result) return null

  const isGrounded = result.isGrounded && (result.citations?.length || 0) > 0
  const isImportable = result.isImportable && isGrounded
  const data = result.data || {}
  const candNutrients = data.candidateNutrients || {}
  const identified = data.identifiedIngredient || null
  const aminoAcids = data.aminoAcids || {}
  const regNotes = data.regulatoryAssessment || null

  const candidateNutrientKeys = Object.keys(candNutrients).filter(
    (k) => candNutrients[k]?.value !== null && candNutrients[k]?.value !== undefined
  )

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
      {/* Status Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          paddingBottom: '12px',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '12px',
              background: isGrounded ? '#ecfdf5' : '#fff1f2',
              color: isGrounded ? '#065f46' : '#9f1239',
              border: `1px solid ${isGrounded ? '#a7f3d0' : '#fecdd3'}`,
            }}
          >
            {isGrounded ? `✅ GROUNDED IN GOOGLE SEARCH (${result.groundingScore || 0}/100)` : '⚠️ UNGROUNDED AI RESPONSE'}
          </span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Model: {result.model || 'gemini-2.5-flash'} · Mode: {result.mode || 'RESEARCH'}
          </span>
        </div>

        {isImportable && candidateNutrientKeys.length > 0 && (
          <button
            onClick={onOpenReviewModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            }}
          >
            <span>📥</span> Review & Import Candidate Nutrients ({candidateNutrientKeys.length})
          </button>
        )}
      </div>

      {/* R&D Scientific Summary */}
      <div>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
          📋 Food Science & Nutritional Findings
        </h4>
        <div
          style={{
            fontSize: '13px',
            lineHeight: 1.6,
            color: '#334155',
            background: '#f8fafc',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            whiteSpace: 'pre-line',
          }}
        >
          {data.summary || result.rawResponse}
        </div>
      </div>

      {/* Botanical & Processing Identity */}
      {identified && (identified.name || identified.botanicalName) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            padding: '12px 16px',
            borderRadius: '8px',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>Identified Ingredient:</span>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#14532d' }}>
              {identified.name || '—'}
            </div>
          </div>
          {identified.botanicalName && (
            <div>
              <span style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>Botanical / Latin Taxon:</span>
              <div style={{ fontSize: '13px', fontStyle: 'italic', color: '#14532d' }}>
                {identified.botanicalName}
              </div>
            </div>
          )}
          {identified.moistureState && (
            <div>
              <span style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>Moisture & State:</span>
              <div style={{ fontSize: '12px', color: '#14532d' }}>
                {identified.moistureState}
              </div>
            </div>
          )}
          {identified.processing && (
            <div>
              <span style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>Processing State:</span>
              <div style={{ fontSize: '12px', color: '#14532d' }}>
                {identified.processing}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Candidate Nutrients Summary Grid */}
      {candidateNutrientKeys.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
              📊 Candidate Nutrients Extracted ({candidateNutrientKeys.length})
            </h4>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Values per 100g finished ingredient
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '8px',
            }}
          >
            {candidateNutrientKeys.map((key) => {
              const nut = candNutrients[key]
              return (
                <div
                  key={key}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'capitalize' }}>
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0284c7' }}>
                    {nut.value} <span style={{ fontSize: '11px', fontWeight: 400, color: '#64748b' }}>{nut.unit}</span>
                  </span>
                  {nut.confidence && (
                    <span style={{ fontSize: '10px', color: nut.confidence === 'High' ? '#166534' : '#92400e' }}>
                      {nut.confidence} Conf.
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Amino Acids if available */}
      {Object.keys(aminoAcids).length > 0 && (
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
            🧬 Amino Acid Profile Extracted
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {Object.keys(aminoAcids).map((aa) => {
              const val = aminoAcids[aa]
              const displayVal = typeof val === 'object' ? `${val.value} ${val.unit || 'g'}` : `${val}g`
              return (
                <span
                  key={aa}
                  style={{
                    fontSize: '11px',
                    background: '#eff6ff',
                    color: '#1e40af',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid #bfdbfe',
                  }}
                >
                  <strong>{aa}:</strong> {displayVal}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Regulatory Notes if available */}
      {regNotes && (regNotes.fssaiCategory || regNotes.notes || regNotes.statutoryAllergens?.length > 0) && (
        <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', color: '#92400e' }}>
          <strong>⚖️ Regulatory & Allergen Notes:</strong>{' '}
          {regNotes.fssaiCategory && `[FSSAI Category: ${regNotes.fssaiCategory}] `}
          {regNotes.statutoryAllergens?.length > 0 && `[Allergens: ${regNotes.statutoryAllergens.join(', ')}] `}
          {regNotes.notes || ''}
        </div>
      )}

      {/* Grounding Source List */}
      <SourceList
        citations={result.citations}
        webSearchQueries={result.webSearchQueries}
        searchEntryPointHtml={result.searchEntryPointHtml}
      />
    </div>
  )
}
