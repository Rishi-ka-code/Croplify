import { useState, useEffect, useCallback } from 'react'
import { fetchHistory } from '../utils/api'
import LoadingSpinner from './LoadingSpinner'

function formatDate(ts) {
  const d = new Date(ts)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function DiseaseIcon({ isHealthy }) {
  return (
    <div className="history-thumb">
      {isHealthy ? '✅' : '🍂'}
    </div>
  )
}

export default function HistoryPanel() {
  const [history, setHistory]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error,   setError]     = useState(null)
  const [startY,  setStartY]    = useState(null)
  const [pulling, setPulling]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchHistory()
      setHistory(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
      setPulling(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const onTouchStart = (e) => setStartY(e.touches[0].clientY)
  const onTouchMove  = (e) => {
    if (startY !== null && e.touches[0].clientY - startY > 60) setPulling(true)
  }
  const onTouchEnd   = () => { if (pulling) load(); setStartY(null) }

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      {pulling && (
        <div style={{ textAlign: 'center', padding: '8px 0', color: 'var(--text-3)', fontSize: 13 }}>
          ↓ Release to refresh
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Recent Scans</div>
          <button className="refresh-btn" style={{ width: 'auto', padding: '6px 14px', fontSize: 12 }} onClick={load}>
            🔄 Refresh
          </button>
        </div>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <LoadingSpinner dark />
          </div>
        )}

        {error && <div className="error-banner">⚠️ {error}</div>}

        {!loading && !error && history.length === 0 && (
          <div className="empty-state" style={{ padding: '20px 0' }}>
            <div className="icon">📋</div>
            <p>No scans yet. Analyse your first leaf to get started.</p>
          </div>
        )}

        {history.map((item) => {
          const isHealthy = item.disease.toLowerCase().includes('healthy')
          const shortName = item.disease
            .replace('Tomato_', 'T. ')
            .replace('Potato___', 'P. ')
            .replace('Pepper__bell___', 'Pb. ')
            .replace(/_/g, ' ')
          return (
            <div key={item.id} className="history-item">
              <DiseaseIcon isHealthy={isHealthy} />
              <div className="history-info">
                <div className="history-disease">{shortName}</div>
                <div className="history-meta">
                  {formatDate(item.timestamp)}
                  {item.filename && item.filename !== 'upload.jpg' && ` · ${item.filename}`}
                </div>
              </div>
              <div className="history-conf">{(item.confidence * 100).toFixed(0)}%</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}