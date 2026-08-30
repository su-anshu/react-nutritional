import React, { useRef } from 'react'

export default function DataSettings({
  ingredientMaster,
  recipes,
  onImportData,
  onResetAllFactory,
}) {
  const fileInputRef = useRef(null)

  const handleExportJson = () => {
    const backup = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      ingredients: ingredientMaster,
      recipes: recipes,
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sattu-nutrition-formulation-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result)
        if (parsed && (parsed.ingredients || parsed.recipes)) {
          onImportData(parsed)
          alert('Data imported successfully!')
        } else {
          alert('Invalid backup file format. Expected ingredients or recipes arrays.')
        }
      } catch (err) {
        alert('Failed to parse JSON file: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="card-panel data-settings-panel">
      <div className="settings-header">
        <h4>Data Backup, Restore & Factory Settings</h4>
        <p className="subtext">
          Manage your custom formulations, ingredient databases, and local storage state.
        </p>
      </div>

      <div className="settings-cards-grid">
        <div className="settings-card">
          <h5>💾 Export Backup File</h5>
          <p>
            Download your full formulation repository, custom recipes, and customized ingredient master data as a JSON file.
          </p>
          <button type="button" className="btn btn-primary" onClick={handleExportJson}>
            Download JSON Backup
          </button>
        </div>

        <div className="settings-card">
          <h5>📥 Restore / Import Data</h5>
          <p>
            Upload a previously exported JSON backup file to restore recipes and custom ingredients.
          </p>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".json"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            Select JSON File to Restore
          </button>
        </div>

        <div className="settings-card card-danger">
          <h5>⚠️ Factory Reset</h5>
          <p>
            Reset all ingredient records and formulations back to the original 10 Sattu recipes and 16 IFCT/USDA standard ingredients.
          </p>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              if (window.confirm('Are you sure you want to reset all data to factory defaults? Any unsaved custom formulations will be cleared.')) {
                onResetAllFactory()
              }
            }}
          >
            Reset All to Factory Defaults
          </button>
        </div>
      </div>
    </div>
  )
}
