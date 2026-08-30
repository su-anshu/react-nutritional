/**
 * Serverless Handler: POST /api/ai/research
 * 
 * Performs grounded Food Science & Nutrition R&D research using Gemini
 * with mandatory Google Search grounding enforcement.
 */

import { getGeminiClient, FOOD_RD_SYSTEM_PROMPT, extractGroundingInfo } from './_gemini.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }

  const {
    query,
    mode = 'GENERAL_QUERY',
    ingredientId = '',
    ingredientName = '',
    targetNutrients = [],
    model = 'gemini-2.5-flash',
    temperature = 0.2,
  } = req.body || {}

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Research query is required.' })
  }

  try {
    const ai = getGeminiClient()

    let promptContext = `RESEARCH MODE: ${mode}\n`
    if (ingredientName) promptContext += `TARGET INGREDIENT: ${ingredientName} (ID: ${ingredientId})\n`
    if (targetNutrients && targetNutrients.length > 0) {
      promptContext += `TARGET NUTRIENTS TO AUDIT / EXTRACT: ${targetNutrients.join(', ')}\n`
    }

    const structuredPrompt = `${promptContext}
USER RESEARCH QUERY:
"${query.trim()}"

TASK INSTRUCTIONS:
1. Search authoritative sources (ICMR-NIN, IFCT, USDA FoodData Central, FSSAI regulations, PubMed, FAO INFOODS).
2. Distinguish between raw form vs processed/roasted/dehydrated powder. Never substitute raw produce data for dehydrated powder without explicit moisture scaling.
3. If nutrient data is missing or unverified, use null (do NOT assume 0).
4. Return a structured JSON object in your response text with this exact JSON format:
\`\`\`json
{
  "summary": "Detailed technical R&D summary explaining findings, processing impact, and scientific evidence.",
  "queryTopic": "${query.trim().replace(/"/g, '\\"')}",
  "mode": "${mode}",
  "identifiedIngredient": {
    "name": "Standard ingredient name",
    "botanicalName": "Botanical / Latin name",
    "aliases": ["Alternative names"],
    "processing": "roasted-ground | dehydrated-powder | spray-dried | isolated-powder | etc.",
    "category": "pulse | grain | superfood | spice | fruit-powder | vegetable-powder | salt | protein-isolate",
    "moistureState": "State description e.g. Dehydrated powder (5-8% moisture)"
  },
  "candidateNutrients": {
    "energy": { "value": null, "unit": "kcal", "confidence": "High | Medium | Low", "sourceReference": "" },
    "protein": { "value": null, "unit": "g", "confidence": "High | Medium | Low", "sourceReference": "" },
    "totalCarb": { "value": null, "unit": "g", "confidence": "High | Medium | Low", "sourceReference": "" },
    "availableCarb": { "value": null, "unit": "g", "confidence": "High | Medium | Low", "sourceReference": "" },
    "dietaryFiber": { "value": null, "unit": "g", "confidence": "High | Medium | Low", "sourceReference": "" },
    "totalSugar": { "value": null, "unit": "g", "confidence": "High | Medium | Low", "sourceReference": "" },
    "addedSugar": { "value": 0.0, "unit": "g", "confidence": "High", "sourceReference": "" },
    "totalFat": { "value": null, "unit": "g", "confidence": "High | Medium | Low", "sourceReference": "" },
    "saturatedFat": { "value": null, "unit": "g", "confidence": "High | Medium | Low", "sourceReference": "" },
    "transFat": { "value": 0.0, "unit": "g", "confidence": "High | Medium | Low", "sourceReference": "" },
    "cholesterol": { "value": 0.0, "unit": "mg", "confidence": "High | Medium | Low", "sourceReference": "" },
    "sodium": { "value": null, "unit": "mg", "confidence": "High | Medium | Low", "sourceReference": "" },
    "calcium": { "value": null, "unit": "mg", "confidence": "High | Medium | Low", "sourceReference": "" },
    "iron": { "value": null, "unit": "mg", "confidence": "High | Medium | Low", "sourceReference": "" },
    "potassium": { "value": null, "unit": "mg", "confidence": "High | Medium | Low", "sourceReference": "" },
    "magnesium": { "value": null, "unit": "mg", "confidence": "High | Medium | Low", "sourceReference": "" },
    "folate": { "value": null, "unit": "mcg", "confidence": "High | Medium | Low", "sourceReference": "" },
    "vitaminC": { "value": null, "unit": "mg", "confidence": "High | Medium | Low", "sourceReference": "" },
    "moisture": { "value": null, "unit": "g", "confidence": "High | Medium | Low", "sourceReference": "" },
    "ash": { "value": null, "unit": "g", "confidence": "High | Medium | Low", "sourceReference": "" }
  },
  "aminoAcids": {},
  "regulatoryAssessment": {
    "fssaiCategory": "Category standard",
    "statutoryAllergens": [],
    "notes": "Regulatory constraints or required disclaimers"
  },
  "sourcesUsed": [
    {
      "sourceName": "Database / Publication name",
      "sourceType": "IFCT | USDA | PEER_REVIEWED | GOVERNMENT | REFERENCE_DATABASE",
      "recordIdOrDoi": "",
      "year": "2024",
      "notes": ""
    }
  ]
}
\`\`\``

    const response = await ai.models.generateContent({
      model: model || 'gemini-2.5-flash',
      contents: structuredPrompt,
      config: {
        systemInstruction: FOOD_RD_SYSTEM_PROMPT,
        tools: [{ googleSearch: {} }],
        temperature: typeof temperature === 'number' ? temperature : 0.2,
      },
    })

    const candidate = response.candidates?.[0]
    const rawText = response.text || ''
    const groundingInfo = extractGroundingInfo(candidate)

    // Parse JSON block out of response
    let parsedData = null
    try {
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch && jsonMatch[1]) {
        parsedData = JSON.parse(jsonMatch[1])
      } else {
        const firstBrace = rawText.indexOf('{')
        const lastBrace = rawText.lastIndexOf('}')
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          parsedData = JSON.parse(rawText.substring(firstBrace, lastBrace + 1))
        }
      }
    } catch (parseErr) {
      console.warn('JSON parsing failed on Gemini response:', parseErr.message)
    }

    // Determine import eligibility based on grounding
    const isImportable = groundingInfo.isGrounded && groundingInfo.citations.length > 0

    return res.status(200).json({
      success: true,
      query: query.trim(),
      mode,
      model,
      status: groundingInfo.status,
      isGrounded: groundingInfo.isGrounded,
      isImportable,
      groundingScore: groundingInfo.groundingScore,
      citations: groundingInfo.citations,
      webSearchQueries: groundingInfo.webSearchQueries,
      searchEntryPointHtml: groundingInfo.searchEntryPointHtml,
      rawResponse: rawText,
      data: parsedData || {
        summary: rawText,
        queryTopic: query.trim(),
        candidateNutrients: {},
        sourcesUsed: [],
      },
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Gemini research handler error:', err)
    return res.status(500).json({
      success: false,
      error: err.message || 'Error occurred during AI research query',
    })
  }
}
