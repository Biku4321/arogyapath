import { SUPPORTED_LANGUAGES } from '../data/languages'
import { Languages } from 'lucide-react'

export default function LanguageSelector({ value, onChange }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-gray-500">
      <Languages size={16} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent-100"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  )
}
