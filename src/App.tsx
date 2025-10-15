import { Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { db } from './lib/database'
import { Settings } from './types/database'
import { getSeasonalIcon } from './lib/seasonalIcons'
import Layout from './components/Layout'
import Today from './screens/Today'
import History from './screens/History'
import ExercisePRs from './screens/ExercisePRs'
import Templates from './screens/Templates'
import SettingsScreen from './screens/Settings'
function App() {
  const [_settings, _setSettings] = useState<Settings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsData = await db.settings.toArray()
        if (settingsData.length > 0) {
          _setSettings(settingsData[0])
        }
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to load settings:', error)
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="medieval-title mb-4">{getSeasonalIcon()} Workout Tracker</div>
          <div className="text-gray-400">Loading your medieval training grounds...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Layout>
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/history" element={<History />} />
          <Route path="/exercise-prs" element={<ExercisePRs />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Routes>
      </Layout>
    </div>
  )
}

export default App
