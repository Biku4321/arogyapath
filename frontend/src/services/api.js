import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
})

/**
 * Send the latest symptom text + conversation history to the backend for
 * triage assessment. Returns { tier, matched_red_flags, suggested_specialty,
 * explanation, is_followup_question }.
 *
 * @param {string} symptomText
 * @param {Array}  conversationHistory
 * @param {string} languageCode  BCP-47 code, e.g. "hi-IN" (optional, defaults to "en-IN")
 */
export async function assessSymptoms(symptomText, conversationHistory, languageCode = 'en-IN') {
  const { data } = await client.post('/api/triage/assess', {
    symptom_text: symptomText,
    conversation_history: conversationHistory,
    language_code: languageCode,
  })
  return data
}

/**
 * Fetch nearby facilities, optionally filtered by specialty.
 */
export async function getNearbyFacilities(lat, lng, specialty, limit = 5) {
  const { data } = await client.get('/api/facilities/nearby', {
    params: { lat, lng, specialty, limit },
  })
  return data
}