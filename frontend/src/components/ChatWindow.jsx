import { useEffect, useRef, useState } from 'react'
import ChatBubble from './ChatBubble'
import VoiceInputButton from './VoiceInputButton'
import LanguageSelector from './LanguageSelector'
import TriageResultCard from './TriageResultCard'
import { useSpeech } from '../hooks/useSpeech'
import { assessSymptoms } from '../services/api'
import { DEFAULT_LANGUAGE } from '../data/languages'
import { Send } from 'lucide-react'

const WELCOME_MESSAGE =
  "Hello, I'm ArogyaPath. Tell me what symptoms you're experiencing, and I'll help you understand " +
  'whether this needs urgent care, a specialist, or can be managed at home. I do not diagnose -- ' +
  'I help you find the right next step.'

export default function ChatWindow({ onTriageResult }) {
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME_MESSAGE }])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE.code)
  const [latestResult, setLatestResult] = useState(null)
  const scrollRef = useRef(null)

  const { isListening, transcript, isSupported, startListening, stopListening, speak } =
    useSpeech(language)

  // Reflect live transcript into the input box while listening
  useEffect(() => {
    if (isListening) setInput(transcript)
  }, [transcript, isListening])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, latestResult])

  async function handleSend() {
    const text = input.trim()
    if (!text || isLoading) return

    const updatedMessages = [...messages, { role: 'user', content: text }]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)
    setLatestResult(null)

    try {
      const result = await assessSymptoms(text, updatedMessages, language)

      setMessages((prev) => [...prev, { role: 'assistant', content: result.explanation }])
      speak(result.explanation)

      if (!result.is_followup_question) {
        setLatestResult(result)
        onTriageResult?.(result)
      }
    } catch (err) {
      const errorMsg =
        err?.response?.data?.detail ||
        'Something went wrong reaching ArogyaPath. Please check the backend is running and try again.'
      setMessages((prev) => [...prev, { role: 'assistant', content: errorMsg }])
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleMicClick() {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <h2 className="font-semibold text-gray-800">Symptom Check-In</h2>
        <LanguageSelector value={language} onChange={setLanguage} />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 chat-scroll">
        {messages.map((msg, idx) => (
          <ChatBubble key={idx} role={msg.role} content={msg.content} />
        ))}

        {latestResult && (
          <div className="mt-2 mb-3">
            <TriageResultCard
              tier={latestResult.tier}
              suggestedSpecialty={latestResult.suggested_specialty}
              explanation=""
            />
          </div>
        )}

        {isLoading && (
          <div className="flex justify-start mb-3">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-gray-400 shadow-sm">
              ArogyaPath is thinking...
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-3 py-3 border-t border-gray-200 bg-white">
        <VoiceInputButton
          isListening={isListening}
          isSupported={isSupported}
          onClick={handleMicClick}
        />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your symptoms..."
          className="flex-1 px-4 py-2.5 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-accent-100 focus:border-accent-500"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="p-3 rounded-full bg-accent-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-600 transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}