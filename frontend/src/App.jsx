import { useState, useEffect, useRef, Component } from 'react'
import CameraCapture  from './components/CameraCapture'
import ResultCard     from './components/ResultCard'
import TreatmentPanel from './components/TreatmentPanel'
import StoreMap       from './components/StoreMap'
import HistoryPanel   from './components/HistoryPanel'
import { usePrediction }  from './hooks/usePrediction'
import { useGeolocation } from './hooks/useGeolocation'
import { TABS } from './utils/constants'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) return (
      <div className="card" style={{ margin: 16 }}>
        <div className="error-banner" style={{ marginTop: 0 }}>Something went wrong. Please reload the page.</div>
      </div>
    )
    return this.props.children
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('scan')
  const [online, setOnline]       = useState(navigator.onLine)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstall, setShowInstall]       = useState(false)

  const { result, loading, error, analyse, reset } = usePrediction()
  const { position, error: geoError }              = useGeolocation()

  useEffect(() => {
    const up = () => setOnline(true)
    const dn = () => setOnline(false)
    window.addEventListener('online',  up)
    window.addEventListener('offline', dn)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', dn) }
  }, [])

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); setShowInstall(true) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleAnalyse = async (file) => {
    const data = await analyse(file, position)
    if (data) setActiveTab('results')
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShowInstall(false)
    setDeferredPrompt(null)
  }

  return (
    <ErrorBoundary>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
        <header className="app-header">
          <div className="logo">🌿</div>
          <h1>Croplify</h1>
          <div className={`status-dot ${online ? '' : 'offline'}`} title={online ? 'Online' : 'Offline'} />
        </header>

        <main className="page" style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'scan' && (
            <>
              <CameraCapture onAnalyse={handleAnalyse} loading={loading} />
              {error && <div className="error-banner card">⚠️ {error}</div>}
              {!result && !loading && (
                <div className="card" style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                  <p style={{ fontSize: 14 }}>📸 Upload a clear photo of a leaf to detect disease instantly</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'results' && (
            <>
              {!result && !loading && (
                <div className="empty-state">
                  <div className="icon">🔬</div>
                  <p>No analysis yet. Go to Scan and upload a leaf image.</p>
                </div>
              )}
              <ResultCard result={result} />
              <TreatmentPanel result={result} />
            </>
          )}

          {activeTab === 'map' && <StoreMap position={position} />}
          {activeTab === 'history' && <HistoryPanel />}
        </main>

        <nav className="tab-bar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.label}
            >
              <span className="icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {showInstall && (
          <div className="install-prompt">
            <p>Add Croplify to your home screen for offline access</p>
            <button onClick={handleInstall}>Install</button>
            <button className="dismiss" onClick={() => setShowInstall(false)}>✕</button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}