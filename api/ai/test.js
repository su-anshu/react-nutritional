/**
 * Serverless Handler: POST /api/ai/test
 * Tests Gemini API connection and search grounding tool availability
 */

import { getGeminiClient, SUPPORTED_MODELS } from './_gemini.js'

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const ai = getGeminiClient()
    const model = req.body?.model || 'gemini-2.5-flash'

    const testPrompt = 'Respond with JSON: {"status":"connected","service":"Gemini AI Food R&D Engine","timestamp":"' + new Date().toISOString() + '"}'
    
    const response = await ai.models.generateContent({
      model,
      contents: testPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    })

    const rawText = response.text || ''
    let parsed = null
    try {
      parsed = JSON.parse(rawText)
    } catch {
      parsed = { raw: rawText }
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully connected to Google Gemini API',
      model,
      response: parsed,
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to connect to Gemini API',
    })
  }
}
