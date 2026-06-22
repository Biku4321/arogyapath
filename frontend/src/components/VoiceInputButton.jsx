import { Mic, MicOff } from 'lucide-react'

export default function VoiceInputButton({ isListening, isSupported, onClick }) {
  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        title="Voice input isn't supported in this browser"
        className="p-3 rounded-full bg-gray-100 text-gray-400 cursor-not-allowed"
      >
        <MicOff size={20} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={isListening ? 'Stop listening' : 'Speak your symptoms'}
      className={`p-3 rounded-full transition-colors ${
        isListening
          ? 'bg-red-500 text-white animate-pulse'
          : 'bg-accent-50 text-accent-600 hover:bg-accent-100'
      }`}
    >
      <Mic size={20} />
    </button>
  )
}
