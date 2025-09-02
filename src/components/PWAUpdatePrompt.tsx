import { useEffect, useState } from 'react'
// import { registerSW } from 'virtual:pwa-register'

export default function PWAUpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)

  useEffect(() => {
  //   const updateSW = registerSW({
  //     onNeedRefresh() {
  //       setNeedRefresh(true)
  //     },
  //     onOfflineReady() {
  //       setOfflineReady(true)
  //     },
  //   })
  }, [])

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  const update = () => {
    window.location.reload()
  }

  if (!needRefresh && !offlineReady) return null

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 z-50">
      <div className="bg-medieval-600 text-white p-4 rounded-lg shadow-lg border border-medieval-700">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {needRefresh ? (
              <div>
                <div className="font-medium">New version available</div>
                <div className="text-sm text-medieval-100">
                  A new version of the app is ready to install
                </div>
              </div>
            ) : (
              <div>
                <div className="font-medium">App ready offline</div>
                <div className="text-sm text-medieval-100">
                  You can now use the app without internet
                </div>
              </div>
            )}
          </div>
          <div className="flex space-x-2 ml-4">
            {needRefresh && (
              <button
                onClick={update}
                className="bg-medieval-700 hover:bg-medieval-800 px-3 py-1 rounded text-sm font-medium transition-colors"
              >
                Reload
              </button>
            )}
            <button
              onClick={close}
              className="bg-medieval-700 hover:bg-medieval-800 px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
