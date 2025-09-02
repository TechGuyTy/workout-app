import { useState, useEffect } from 'react'
import { db } from '../lib/database'
import { Settings as AppSettings } from '../types/database'
import { 
  Cog6ToothIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importData, setImportData] = useState('')
  const [showImportForm, setShowImportForm] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const settingsData = await db.settings.toArray()
      if (settingsData.length > 0) {
        setSettings(settingsData[0])
      }
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to load settings:', error)
      setIsLoading(false)
    }
  }

  const updateSetting = async (field: keyof AppSettings, value: any) => {
    if (!settings) return

    try {
      const updatedSettings = { ...settings, [field]: value, updatedAt: new Date() }
      await db.settings.update(settings.id!, updatedSettings)
      setSettings(updatedSettings)
    } catch (error) {
      console.error('Failed to update setting:', error)
    }
  }

  const exportData = async () => {
    try {
      setIsExporting(true)
      const data = await db.exportData()
      
      // Create and download file
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `workout-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export data:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportData = async () => {
    if (!importData.trim()) {
      alert('Please paste your backup data.')
      return
    }

    try {
      setIsImporting(true)
      await db.importData(importData)
      setImportData('')
      setShowImportForm(false)
      alert('Data imported successfully! The app will reload.')
      window.location.reload()
    } catch (error) {
      console.error('Failed to import data:', error)
      alert('Failed to import data. Please check the format and try again.')
    } finally {
      setIsImporting(false)
    }
  }

  const clearAllData = async () => {
    if (!confirm('Are you sure you want to clear ALL data? This action cannot be undone and will remove all workouts, exercises, and settings.')) {
      return
    }

    if (!confirm('This will permanently delete everything. Are you absolutely sure?')) {
      return
    }

    try {
      await db.clearAllData()
      alert('All data has been cleared. The app will reload.')
      window.location.reload()
    } catch (error) {
      console.error('Failed to clear data:', error)
      alert('Failed to clear data. Please try again.')
    }
  }

  const resetToDefaults = async () => {
    if (!confirm('This will reset all settings to default values. Continue?')) {
      return
    }

    try {
      const defaultSettings: Omit<AppSettings, 'id'> = {
        units: 'lbs',
        theme: 'dark',
        backupReminders: true,
        backupFrequency: 'weekly',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (settings) {
        await db.settings.update(settings.id!, defaultSettings)
      } else {
        await db.settings.add(defaultSettings)
      }

      await db.seedInitialData()
      loadSettings()
      alert('Settings reset to defaults successfully!')
    } catch (error) {
      console.error('Failed to reset settings:', error)
      alert('Failed to reset settings. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="medieval-title mb-4">Loading Settings</div>
        <div className="text-gray-400">Preparing your configuration...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="medieval-title">Settings & Configuration</div>

      {/* App Settings */}
      <div className="card">
        <div className="card-header">
          <h3 className="medieval-subtitle flex items-center">
            <Cog6ToothIcon className="h-5 w-5 mr-2" />
            App Settings
          </h3>
        </div>
        <div className="card-body space-y-6">
          {/* Units */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Weight Units
            </label>
            <select
              value={settings?.units || 'lbs'}
              onChange={(e) => updateSetting('units', e.target.value)}
              className="input-field w-full"
            >
              <option value="lbs">Pounds (lbs)</option>
              <option value="kg">Kilograms (kg)</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Choose your preferred weight measurement unit
            </p>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Theme
            </label>
            <select
              value={settings?.theme || 'dark'}
              onChange={(e) => updateSetting('theme', e.target.value)}
              className="input-field w-full"
            >
              <option value="dark">Dark Theme</option>
              <option value="light">Light Theme</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Choose your preferred color scheme
            </p>
          </div>

          {/* Backup Reminders */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings?.backupReminders || false}
                onChange={(e) => updateSetting('backupReminders', e.target.checked)}
                className="rounded border-gray-600 text-medieval-600 focus:ring-medieval-500 focus:ring-offset-gray-800"
              />
              <span className="ml-2 text-sm font-medium text-gray-300">
                Enable Backup Reminders
              </span>
            </label>
            <p className="text-xs text-gray-400 mt-1">
              Get reminded to backup your data regularly
            </p>
          </div>

          {/* Backup Frequency */}
          {settings?.backupReminders && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Backup Frequency
              </label>
              <select
                value={settings?.backupFrequency || 'weekly'}
                onChange={(e) => updateSetting('backupFrequency', e.target.value)}
                className="input-field w-full"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                How often to remind you to backup your data
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Data Management */}
      <div className="card">
        <div className="card-header">
          <h3 className="medieval-subtitle flex items-center">
            <ShieldCheckIcon className="h-5 w-5 mr-2" />
            Data Management
          </h3>
        </div>
        <div className="card-body space-y-4">
          {/* Export Data */}
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div>
              <div className="font-medium text-white">Export Data</div>
              <div className="text-sm text-gray-400">
                Download a backup of all your workout data
              </div>
            </div>
            <button
              onClick={exportData}
              disabled={isExporting}
              className="btn-primary"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>

          {/* Import Data */}
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div>
              <div className="font-medium text-white">Import Data</div>
              <div className="text-sm text-gray-400">
                Restore data from a previous backup
              </div>
            </div>
            <button
              onClick={() => setShowImportForm(true)}
              className="btn-secondary"
            >
              <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
              Import
            </button>
          </div>

          {/* Reset Settings */}
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div>
              <div className="font-medium text-white">Reset Settings</div>
              <div className="text-sm text-gray-400">
                Reset all settings to default values
              </div>
            </div>
            <button
              onClick={resetToDefaults}
              className="btn-secondary"
            >
              <Cog6ToothIcon className="h-4 w-4 mr-2" />
              Reset
            </button>
          </div>

          {/* Clear All Data */}
          <div className="flex items-center justify-between p-4 bg-red-900/20 border border-red-700 rounded-lg">
            <div>
              <div className="font-medium text-red-400">Clear All Data</div>
              <div className="text-sm text-red-300">
                Permanently delete all workouts, exercises, and settings
              </div>
            </div>
            <button
              onClick={clearAllData}
              className="btn-danger"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="card">
        <div className="card-header">
          <h3 className="medieval-subtitle">App Information</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Version</div>
              <div className="text-white">1.0.0</div>
            </div>
            <div>
              <div className="text-gray-400">Database</div>
              <div className="text-white">IndexedDB (Dexie)</div>
            </div>
            <div>
              <div className="text-gray-400">Storage</div>
              <div className="text-white">Local (Offline)</div>
            </div>
            <div>
              <div className="text-gray-400">Theme</div>
              <div className="text-white">Medieval</div>
            </div>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full">
            <div className="card-header">
              <h3 className="medieval-subtitle">Import Data</h3>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Backup Data (JSON)
                </label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  className="input-field w-full h-32 font-mono text-sm"
                  placeholder="Paste your backup JSON data here..."
                />
                <p className="text-xs text-gray-400 mt-1">
                  Paste the contents of your exported backup file
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleImportData}
                  disabled={isImporting || !importData.trim()}
                  className="btn-primary flex-1"
                >
                  <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                  {isImporting ? 'Importing...' : 'Import Data'}
                </button>
                <button
                  onClick={() => {
                    setShowImportForm(false)
                    setImportData('')
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                <div className="text-yellow-400 text-sm font-medium mb-1">⚠️ Warning</div>
                <div className="text-yellow-300 text-xs">
                  Importing data will replace all existing data. Make sure to export your current data first if you want to keep it.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
