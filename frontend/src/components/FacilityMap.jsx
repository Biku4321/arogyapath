import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'


const facilityIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const userIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'hue-rotate-[180deg]', // visually distinguish user marker
})

/**
 * FIX: MapContainer sets its center only once on mount. If userLocation arrives
 * after the map has rendered (e.g. geolocation resolves asynchronously, or
 * facilities load and we want to fit the view), the map stays stuck at the
 * initial coords. This inner component uses the useMap() hook (which only
 * works inside a MapContainer) to imperatively pan whenever the center changes.
 */
function MapRecenter({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true })
  }, [lat, lng, map])
  return null
}

export default function FacilityMap({ userLocation, facilities }) {
  if (!userLocation) {
    return (
      <div className="h-72 flex items-center justify-center text-sm text-gray-400 bg-gray-50 rounded-xl border border-gray-200">
        Waiting for location...
      </div>
    )
  }

  return (
    <div className="h-72 rounded-xl overflow-hidden border border-gray-200">
      <MapContainer
        center={[userLocation.lat, userLocation.lng]}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* FIX: keep map centered on user even if location resolves after mount */}
        <MapRecenter lat={userLocation.lat} lng={userLocation.lng} />

        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>Your location</Popup>
        </Marker>

        {facilities.map((fac) => (
          <Marker key={fac.id} position={[fac.lat, fac.lng]} icon={facilityIcon}>
            <Popup>
              <strong>{fac.name}</strong>
              <br />
              {fac.type} &mdash; {fac.distance_km} km away
              <br />
              {fac.address}
              <br />
              📞 {fac.phone}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}