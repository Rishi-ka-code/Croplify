import { API_BASE } from './constants'

async function handleResponse(res) {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(error.detail || `Request failed: ${res.status}`)
  }
  return res.json()
}

export async function predictDisease(imageFile, lat = null, lng = null) {
  const formData = new FormData()
  formData.append('file', imageFile)

  const params = new URLSearchParams()
  if (lat !== null) params.set('lat', lat)
  if (lng !== null) params.set('lng', lng)

  const url = `${API_BASE}/predict${params.toString() ? '?' + params : ''}`
  const res = await fetch(url, { method: 'POST', body: formData })
  return handleResponse(res)
}

export async function fetchNearbyStores(lat, lng, radius = 10) {
  const res = await fetch(`${API_BASE}/stores?lat=${lat}&lng=${lng}&radius=${radius}`)
  return handleResponse(res)
}

export async function fetchHistory() {
  const res = await fetch(`${API_BASE}/history`)
  return handleResponse(res)
}

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`)
  return handleResponse(res)
}