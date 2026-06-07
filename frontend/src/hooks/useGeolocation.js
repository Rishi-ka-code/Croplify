import { useState, useEffect } from 'react'

export function useGeolocation() {
  const [position, setPosition] = useState(null)
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      (err) => {
        setError(err.message || 'Location access denied.')
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    )
  }, [])

  return { position, error, loading }
}