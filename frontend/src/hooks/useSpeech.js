import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * useSpeech -- thin wrapper around the browser-native Web Speech API.
 *
 * Provides:
 *  - startListening() / stopListening(): speech-to-text
 *  - speak(text): text-to-speech
 *  - isListening, isSupported, transcript
 *
 * This intentionally avoids any backend dependency for voice -- it runs
 * entirely client-side using SpeechRecognition / speechSynthesis, which is
 * ideal for a hackathon demo (no API keys, no latency, works offline-ish).
 * Note: browser support varies (best in Chrome/Edge); Safari/Firefox support
 * is partial or absent as of this writing.
 */
export function useSpeech(languageCode = 'en-IN') {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(true)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setIsSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = languageCode

    recognition.onresult = (event) => {
      let text = ''
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript
      }
      setTranscript(text)
    }

    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
    }
  }, [languageCode])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return
    setTranscript('')
    setIsListening(true)
    try {
      recognitionRef.current.start()
    } catch {
      
    }
  }, [])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return
    recognitionRef.current.stop()
    setIsListening(false)
  }, [])

  const speak = useCallback(
    (text) => {
      if (!window.speechSynthesis) return
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = languageCode
      window.speechSynthesis.speak(utterance)
    },
    [languageCode]
  )

  return { isListening, transcript, isSupported, startListening, stopListening, speak }
}
