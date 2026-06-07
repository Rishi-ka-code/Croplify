import { useState, useCallback } from 'react'
import { predictDisease } from '../utils/api'

export function usePrediction() {
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const analyse = useCallback(async (imageFile, position) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await predictDisease(
        imageFile,
        position?.lat ?? null,
        position?.lng ?? null
      )
      setResult(data)
      return data
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { result, loading, error, analyse, reset }
}