import { MapPin, Phone } from 'lucide-react'

export default function FacilityList({ facilities }) {
  if (!facilities.length) return null

  return (
    <div className="space-y-2 mt-3">
      {facilities.map((fac) => (
        <div
          key={fac.id}
          className="flex items-start justify-between gap-3 bg-white border border-gray-200 rounded-lg p-3"
        >
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-accent-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-800">{fac.name}</p>
              <p className="text-xs text-gray-500">{fac.type} &middot; {fac.address}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <Phone size={12} /> {fac.phone}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-accent-600 whitespace-nowrap">
            {fac.distance_km} km
          </span>
        </div>
      ))}
    </div>
  )
}
