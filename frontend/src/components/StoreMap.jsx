import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { fetchNearbyStores } from '../utils/api'
import LoadingSpinner from './LoadingSpinner'

// Fix default leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
})

function RecenterMap({ lat, lng }) {
  const map = useMap()
  useEffect(() => { map.setView([lat, lng], 13) }, [lat, lng, map])
  return null
}

export default function StoreMap({ position }) {
  const [stores,  setStores]  = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!position) return
    setLoading(true)
    setError(null)
    fetchNearbyStores(position.lat, position.lng)
      .then((data) => setStores(data.stores || []))
      .catch((e)   => setError(e.message))
      .finally(()  => setLoading(false))
  }, [position])

  if (!position) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="icon">📍</div>
          <p>Location access required to find nearby agricultural stores.</p>
          <p style={{ fontSize: 12 }}>Please enable location permissions in your browser settings.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={13}
          style={{ height: 300 }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <RecenterMap lat={position.lat} lng={position.lng} />
          <Marker position={[position.lat, position.lng]} icon={userIcon}>
            <Popup>You are here</Popup>
          </Marker>
          {stores.map((store, i) => (
            <Marker key={i} position={[store.lat, store.lng]}>
              <Popup>
                <strong>{store.name}</strong><br />
                {store.type}<br />
                📍 {store.distance_km} km away
                {store.opening_hours && store.opening_hours !== 'Not available' && (
                  <>
                    <br />
                    🕐 {store.opening_hours}
                  </>
                )}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="card">
        <div className="section-title">Nearby Stores ({stores.length})</div>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
            <LoadingSpinner dark />
          </div>
        )}
        {error && <div className="error-banner">⚠️ {error}</div>}
        {!loading && !error && stores.length === 0 && (
          <div className="empty-state" style={{ padding: '20px 0' }}>
            <div className="icon">🏪</div>
            <p>No agricultural stores found within 10 km.</p>
          </div>
        )}
        <div className="store-list">
          {stores.map((store, i) => (
            <div key={i} className="store-item">
              <div>
                <div className="store-name">{store.name}</div>
                <div className="store-meta">
                  {store.type}
                  {store.opening_hours && store.opening_hours !== 'Not available' && ` · ${store.opening_hours}`}
                </div>
              </div>
              <div className="store-dist">{store.distance_km} km</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}