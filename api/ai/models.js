/**
 * Serverless Handler: GET /api/ai/models
 * Returns supported Gemini models for R&D research
 */

import { SUPPORTED_MODELS } from './_gemini.js'

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const hasApiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim())

  return res.status(200).json({
    models: SUPPORTED_MODELS,
    hasApiKey,
  })
}
