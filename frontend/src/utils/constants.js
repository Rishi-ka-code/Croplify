export const API_BASE = import.meta.env.VITE_API_URL || '/api'

export const SEVERITY_CONFIG = {
  Low:      { color: '#4CAF50', bg: '#E8F5E9', label: 'Low Risk' },
  Medium:   { color: '#FF9800', bg: '#FFF3E0', label: 'Moderate Risk' },
  High:     { color: '#F44336', bg: '#FFEBEE', label: 'High Risk' },
  Critical: { color: '#B71C1C', bg: '#FFCDD2', label: 'Critical' },
}

export const TABS = [
  { id: 'scan',    label: 'Scan',    icon: '📷' },
  { id: 'results', label: 'Results', icon: '🔬' },
  { id: 'map',     label: 'Map',     icon: '🗺️' },
  { id: 'history', label: 'History', icon: '📋' },
]

export const CONFIDENCE_THRESHOLD = 0.4