import { AlertTriangle, Stethoscope, CheckCircle2, HelpCircle } from 'lucide-react'

const TIER_CONFIG = {
  EMERGENCY: {
    label: 'Emergency -- Seek Immediate Care',
    icon: AlertTriangle,
    classes: 'bg-red-50 border-red-300 text-red-800',
    iconClasses: 'text-red-600',
  },
  NEEDS_SPECIALIST: {
    label: 'Needs Specialist Attention',
    icon: Stethoscope,
    classes: 'bg-amber-50 border-amber-300 text-amber-800',
    iconClasses: 'text-amber-600',
  },
  SELF_MANAGEABLE: {
    label: 'Likely Self-Manageable',
    icon: CheckCircle2,
    classes: 'bg-accent-50 border-accent-100 text-accent-700',
    iconClasses: 'text-accent-600',
  },
  UNCLEAR: {
    label: 'Need More Information',
    icon: HelpCircle,
    classes: 'bg-gray-50 border-gray-300 text-gray-700',
    iconClasses: 'text-gray-500',
  },
}

export default function TriageResultCard({ tier, suggestedSpecialty, explanation }) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.UNCLEAR
  const Icon = config.icon

  return (
    <div className={`border rounded-xl p-4 ${config.classes}`}>
      <div className="flex items-start gap-3">
        <Icon size={22} className={`mt-0.5 shrink-0 ${config.iconClasses}`} />
        <div>
          <p className="font-semibold text-sm">{config.label}</p>
          {suggestedSpecialty && (
            <p className="text-sm mt-0.5">
              Recommended: <span className="font-medium">{suggestedSpecialty}</span>
            </p>
          )}
          <p className="text-sm mt-1.5 leading-relaxed opacity-90">{explanation}</p>
        </div>
      </div>
    </div>
  )
}
