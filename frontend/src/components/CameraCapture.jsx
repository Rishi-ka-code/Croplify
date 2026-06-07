import { useState, useRef, useCallback } from 'react'
import LoadingSpinner from './LoadingSpinner'

export default function CameraCapture({ onAnalyse, loading }) {
  const [mode, setMode]       = useState('upload') // 'upload' | 'camera'
  const [preview, setPreview] = useState(null)
  const [file, setFile]       = useState(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [camError, setCamError] = useState(null)

  const fileInputRef = useRef(null)
  const videoRef     = useRef(null)
  const streamRef    = useRef(null)

  const handleFile = useCallback((f) => {
    if (!f || !f.type.startsWith('image/')) return
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreview(url)
  }, [])

  const onFileChange = (e) => handleFile(e.target.files?.[0])

  const onDrop = (e) => {
    e.preventDefault()
    handleFile(e.dataTransfer.files?.[0])
  }

  const startCamera = async () => {
    setCamError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraOn(true)
    } catch (err) {
      setCamError('Camera access denied. Please allow camera permissions or use file upload.')
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraOn(false)
  }

  const capturePhoto = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      const captured = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
      setFile(captured)
      setPreview(URL.createObjectURL(captured))
      stopCamera()
    }, 'image/jpeg', 0.92)
  }

  const switchMode = (m) => {
    setMode(m)
    setPreview(null)
    setFile(null)
    setCamError(null)
    if (m !== 'camera') stopCamera()
  }

  const handleAnalyse = () => {
    if (file) onAnalyse(file)
  }

  const clearPreview = () => {
    setPreview(null)
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="card">
      <div className="mode-toggle">
        <button className={`mode-btn ${mode === 'upload' ? 'active' : ''}`} onClick={() => switchMode('upload')}>
          📁 Upload
        </button>
        <button className={`mode-btn ${mode === 'camera' ? 'active' : ''}`} onClick={() => switchMode('camera')}>
          📷 Camera
        </button>
      </div>

      {mode === 'upload' && (
        <>
          <div
            className="capture-zone"
            style={{ minHeight: preview ? 480 : 220 }}
            onClick={() => !preview && fileInputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            {preview ? (
              <>
                <img src={preview} alt="Selected leaf" />
                <button
                  onClick={(e) => { e.stopPropagation(); clearPreview() }}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 14 }}
                >
                  ✕
                </button>
              </>
            ) : (
              <div className="placeholder">
                <div className="icon">🌿</div>
                <p>Tap to upload or drag & drop a leaf image</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>JPEG, PNG, WebP — max 10 MB</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={onFileChange}
          />
        </>
      )}

      {mode === 'camera' && (
        <div style={{ position: 'relative' }}>
          {!cameraOn && !preview && (
            <div className="capture-zone" style={{ minHeight: 220 }} onClick={startCamera}>
              <div className="placeholder">
                <div className="icon">📷</div>
                <p>Tap to open camera</p>
              </div>
            </div>
          )}
          {cameraOn && (
            <div style={{ position: 'relative' }}>
              <video ref={videoRef} autoPlay playsInline className="camera-preview" style={{ minHeight: 320 }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="analyse-btn" style={{ flex: 1 }} onClick={capturePhoto}>
                  📸 Capture
                </button>
                <button onClick={stopCamera} style={{ padding: '12px 20px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', background: 'transparent', cursor: 'pointer', fontSize: 14 }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
          {preview && (
            <div className="capture-zone" style={{ minHeight: 480 }}>
              <img src={preview} alt="Captured" />
              <button
                onClick={clearPreview}
                style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 14 }}
              >
                ✕
              </button>
            </div>
          )}
          {camError && <div className="error-banner">⚠️ {camError}</div>}
        </div>
      )}

      <button className="analyse-btn" disabled={!file || loading} onClick={handleAnalyse}>
        {loading ? <><LoadingSpinner /> Analysing...</> : '🔬 Analyse Leaf'}
      </button>
    </div>
  )
}