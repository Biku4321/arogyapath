import { useEffect, useState } from 'react'
import ChatWindow from '../components/ChatWindow'
import FacilityMap from '../components/FacilityMap'
import FacilityList from '../components/FacilityList'
import { getNearbyFacilities } from '../services/api'
import { MapPin } from 'lucide-react'



const FALLBACK_LOCATION = { lat: 24.8333, lng: 92.7789 }

export default function HomePage() {
  const [userLocation, setUserLocation] = useState(null)
  const [facilities, setFacilities] = useState([])
  const [locationSource, setLocationSource] = useState('pending') // 'gps' | 'fallback' | 'pending'

  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLocation(FALLBACK_LOCATION)
      setLocationSource('fallback')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
        setLocationSource('gps')
      },
      () => {
        setUserLocation(FALLBACK_LOCATION)
        setLocationSource('fallback')
      },
      { timeout: 5000 }
    )
  }, [])

  async function handleTriageResult(result) {
    if (!userLocation) return
    try {
      const nearby = await getNearbyFacilities(
        userLocation.lat,
        userLocation.lng,
        result.suggested_specialty,
        5
      )
      setFacilities(nearby)
    } catch {
      setFacilities([])
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent-50 to-white">
      <header className="px-6 py-4 flex items-center gap-3 border-b border-accent-100 bg-white">
        <div className="w-9 h-9 rounded-full bg-accent-500 flex items-center justify-center text-white font-bold">
          +
        </div>
        <div>
          <h1 className="font-bold text-gray-800 leading-tight">ArogyaPath</h1>
          <p className="text-xs text-gray-500">Know where to go, not just what's wrong</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="h-[600px]">
          <ChatWindow onTriageResult={handleTriageResult} />
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Nearby Facilities</h2>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <MapPin size={12} />
              {locationSource === 'gps' && 'Using your location'}
              {locationSource === 'fallback' && 'Using sample location (Silchar, Assam)'}
              {locationSource === 'pending' && 'Detecting location...'}
            </span>
          </div>

          <FacilityMap userLocation={userLocation} facilities={facilities} />

          {facilities.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              Describe your symptoms in the chat -- recommended facilities will appear here.
            </p>
          ) : (
            <FacilityList facilities={facilities} />
          )}
        </section>
      </main>

      <footer className="text-center text-xs text-gray-400 py-6">
        ArogyaPath does not diagnose illness. In a medical emergency, call your local emergency
        number immediately.
      </footer>
    </div>
  )
}
