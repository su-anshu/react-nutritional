import React, { useState, useEffect } from 'react'
import { fetchAvailableModels, testAIConnection } from '../../services/aiClient'

export default function AISettings({ settings, onSave, onClose }) {
  const [localSettings, setLocalSettings] = useState(settings)
  const [models, setModels] = useState([])
  const [hasApiKey, setHasApiKey] = useState(true)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [loadingModels, setLoadingModels] = useState(true)

  useEffect(() => {
    async function init() {
      setLoadingModels(true)
      const data = await fetchAvailableModels()
      if (data.models) setModels(data.models)
      if (typeof data.hasApiKey === 'boolean') setHasApiKey(data.hasApiKey)
      setLoadingModels(false)
    }
    init()
  }, [])

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    const res = await testAIConnection(localSettings.selectedModel)
    setTesting(false)
    setTestResult(res)
  }

  const handleSave = () => {
    onSave(localSettings)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>⚙️</span>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
              Gemini AI & Google Search Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#64748b',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
          {/* API Key Status Notice */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: hasApiKey ? '#ecfdf5' : '#fff1f2',
              border: `1px solid ${hasApiKey ? '#a7f3d0' : '#fecdd3'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: hasApiKey ? '#065f46' : '#9f1239' }}>
                {hasApiKey ? '✅ Server API Key Configured' : '❌ GEMINI_API_KEY Missing on Server'}
              </div>
              <div style={{ fontSize: '12px', color: hasApiKey ? '#047857' : '#be123c', marginTop: '2px' }}>
                {hasApiKey
                  ? 'Serverless endpoints securely authenticate using process.env.GEMINI_API_KEY.'
                  : 'Add GEMINI_API_KEY to your .env.local file or server environment.'}
              </div>
            </div>
            <button
              onClick={handleTest}
              disabled={testing}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: testing ? 'not-allowed' : 'pointer',
              }}
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {testResult && (
            <div
              style={{
                padding: '12px',
                borderRadius: '6px',
                fontSize: '12px',
                background: testResult.success ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${testResult.success ? '#bbf7d0' : '#fecaca'}`,
                color: testResult.success ? '#166534' : '#991b1b',
              }}
            >
              {testResult.success ? (
                <div>
                  <strong>Connected!</strong> Response from Gemini API received successfully ({testResult.model}).
                </div>
              ) : (
                <div>
                  <strong>Connection Failed:</strong> {testResult.error}
                </div>
              )}
            </div>
          )}

          {/* Model Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Gemini Model Selection
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {models.map((m) => (
                <label
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px 12px',
                    border: localSettings.selectedModel === m.id ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    background: localSettings.selectedModel === m.id ? '#f0f9ff' : '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="model"
                    value={m.id}
                    checked={localSettings.selectedModel === m.id}
                    onChange={(e) => setLocalSettings({ ...localSettings, selectedModel: e.target.value })}
                    style={{ marginTop: '2px' }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                      {m.name} {m.isDefault && <span style={{ fontSize: '10px', background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '4px' }}>Recommended</span>}
                    </div>
                    {m.description && (
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        {m.description}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Temperature Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                Creativity / Strictness (Temperature)
              </label>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#0284c7' }}>
                {localSettings.temperature} (Scientific Strict)
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.7"
              step="0.05"
              value={localSettings.temperature}
              onChange={(e) => setLocalSettings({ ...localSettings, temperature: parseFloat(e.target.value) })}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
              <span>0.0 (Deterministic / Exact)</span>
              <span>0.2 (R&D Recommended)</span>
              <span>0.7 (Creative synthesis)</span>
            </div>
          </div>

          {/* History Preferences */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localSettings.autoSaveHistory}
                onChange={(e) => setLocalSettings({ ...localSettings, autoSaveHistory: e.target.checked })}
              />
              <span>Automatically save research query logs to browser local storage</span>
            </label>
          </div>
        </div>

        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            background: '#f8fafc',
          }}
        >
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
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              background: '#0284c7',
              color: '#ffffff',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}
