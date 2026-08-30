import React from 'react'

const DOMAIN_BADGES = {
  GOVERNMENT: { label: 'Gov / Regulatory', bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' },
  PEER_REVIEWED: { label: 'Peer-Reviewed Journal', bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
  DATABASE: { label: 'Nutrition Database', bg: '#f5f3ff', color: '#5b21b6', border: '#ddd6fe' },
  SUPPLIER: { label: 'Supplier Technical Spec', bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
  COMMERCIAL: { label: 'Commercial / Web', bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
  UNKNOWN: { label: 'General Web', bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
}

export default function SourceList({ citations = [], webSearchQueries = [], searchEntryPointHtml = '' }) {
  if (!citations || citations.length === 0) {
    return (
      <div style={{ padding: '16px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', color: '#92400e', fontSize: '13px' }}>
        <strong>⚠️ No Web Grounding Citations:</strong> This response was generated without verified external web citations. It cannot be directly imported into Ingredient Master without independent manual or lab verification.
      </div>
    )
  }

  return (
    <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
          🔍 Grounding Citations & Authoritative Sources ({citations.length})
        </h4>
        <span style={{ fontSize: '11px', color: '#64748b' }}>
          Real-time Google Search Grounding
        </span>
      </div>

      {webSearchQueries && webSearchQueries.length > 0 && (
        <div style={{ marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Searches performed:</span>
          {webSearchQueries.map((q, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '11px',
                background: '#f1f5f9',
                color: '#334155',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid #e2e8f0',
              }}
            >
              "{q}"
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {citations.map((c, idx) => {
          const badge = DOMAIN_BADGES[c.domainType] || DOMAIN_BADGES.UNKNOWN
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                gap: '12px',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      background: '#0f172a',
                      color: '#ffffff',
                      padding: '1px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    [{idx + 1}]
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      background: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                      padding: '1px 8px',
                      borderRadius: '12px',
                    }}
                  >
                    {badge.label}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Quality Rating: {'⭐'.repeat(c.qualityScore || 3)} ({c.qualityScore || 3}/5)
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#1e293b', wordBreak: 'break-word' }}>
                  <a
                    href={c.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#0284c7', textDecoration: 'none' }}
                  >
                    {c.title || c.uri}
                  </a>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', wordBreak: 'break-all' }}>
                  {c.uri}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {searchEntryPointHtml && (
        <div
          style={{ marginTop: '12px', fontSize: '12px' }}
          dangerouslySetInnerHTML={{ __html: searchEntryPointHtml }}
        />
      )}
    </div>
  )
}
