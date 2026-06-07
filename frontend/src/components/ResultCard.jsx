import { useEffect, useState } from 'react'
import { SEVERITY_CONFIG } from '../utils/constants'

export default function ResultCard({ result }) {
  const [barWidth, setBarWidth] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(result.confidence * 100), 50)
    return () => clearTimeout(t)
  }, [result])

  if (!result) return null

  const sev = SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG.Medium
  const pct = (result.confidence * 100).toFixed(1)

  if (result.message && result.disease === 'Unknown') {
    return (
      <div className="card result-card">
        <div className="error-banner" style={{ marginTop: 0 }}>
          🔍 {result.message}
        </div>
      </div>
    )
  }

  return (
    <div className="card result-card">
      {result.is_healthy ? (
        <div className="healthy-banner">
          <div className="icon">✅</div>
          <div>
            <p>Plant looks healthy!</p>
            <p style={{ fontSize: 13, color: '#388E3C', fontWeight: 400, marginTop: 4 }}>No disease detected. Keep up the good work.</p>
          </div>
        </div>
      ) : (
        <div
          className="healthy-banner"
          style={{ background: sev.bg, borderColor: sev.color }}
        >
          <div className="icon">⚠️</div>
          <div>
            <p style={{ color: sev.color }}>Disease detected</p>
            <p style={{ fontSize: 13, color: sev.color, fontWeight: 400, marginTop: 4, opacity: 0.8 }}>
              Take action to protect your crop
            </p>
          </div>
        </div>
      )}

      <div className="result-header">
        <div className="disease-name">{result.display_name}</div>
        <div
          className="severity-badge"
          style={{ background: sev.bg, color: sev.color }}
        >
          {sev.label}
        </div>
      </div>

      <div className="confidence-bar-wrap">
        <div className="confidence-label">
          <span>AI Confidence</span>
          <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{pct}%</span>
        </div>
        <div className="confidence-bar-bg">
          <div
            className="confidence-bar-fill"
            style={{
              width: `${barWidth}%`,
              background: result.is_healthy ? '#4CAF50' : sev.color,
            }}
          />
        </div>
      </div>

      {result.description && (
        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
          {result.description}
        </p>
      )}
    </div>
  )
}