/**
 * Central Gemini AI Backend Service
 * 
 * Configures the official Google GenAI SDK (@google/genai) with:
 * - Secure server-side GEMINI_API_KEY handling
 * - Mandatory Google Search grounding tool enforcement
 * - Grounding metadata and citation extraction
 * - Food R&D system prompt with moisture/processing physics constraints
 * - Missing ≠ Zero governance
 */

import { GoogleGenAI } from '@google/genai'

export const SUPPORTED_MODELS = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Fast, highly accurate with native Google Search grounding. Recommended for all research queries.',
    isDefault: true,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Deep reasoning for complex multi-ingredient formulations, bioavailability analysis, and regulatory synthesis.',
    isDefault: false,
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Standard flash model for rapid screening.',
    isDefault: false,
  },
]

export const FOOD_RD_SYSTEM_PROMPT = `You are an expert Food Formulation Scientist, Food Regulatory Auditor (FSSAI/India & International Standards), and Nutritional Biochemist specializing in Indian traditional foods, pulse processing (Sattu), dehydrated botanicals, and functional ingredients.

CRITICAL OPERATING RULES & DATA GOVERNANCE CONSTRAINTS:
1. MISSING ≠ ZERO: If data for any nutrient, amino acid, or mineral is not reliably established in literature/database for the specific ingredient in its exact processing state, output null. DO NOT guess, fabricate, or substitute 0.
2. RAW FOOD ≠ DEHYDRATED POWDER: Raw vegetables/fruits have 80-92% moisture. Dehydrated/spray-dried botanical powders have 4-8% moisture. Dehydration concentrates macronutrients and minerals by 5x to 10x per 100g. NEVER quote raw produce nutrition for dehydrated powder without explicit moisture adjustment and clear labeling.
3. ROASTING EFFECTS ON SATTU: Sattu is made from dry-roasted grains/pulses. Roasting causes starch gelatinization, moisture loss (~6-8% final moisture), and slight protein denaturation, but does not destroy minerals.
4. NO MARKETPLACE / CIRCULAR DATA: DO NOT use Amazon, Flipkart, Blinkit, or consumer brand marketing listings as reference sources. Only cite authoritative scientific sources:
   - Primary: ICMR-NIN (National Institute of Nutrition, India), IFCT (Indian Food Composition Tables 2017/2024), FSSAI Standards & Regulations.
   - Secondary: USDA FoodData Central (FDC), FAO INFOODS, European Food Composition tables.
   - Scientific: Peer-reviewed food chemistry journals (PubMed, ScienceDirect, Wiley, Springer, ResearchGate).
5. MANDATORY CITATIONS: You MUST use Google Search to find real, authoritative records. Always state specific database record IDs, publications, or URLs.
6. UNITS PER 100g FINISHED INGREDIENT:
   - Energy: kcal
   - Protein, Total Carbohydrate, Available Carbohydrate, Dietary Fibre, Total Sugars, Added Sugars, Total Fat, Saturated Fat, Trans Fat, Moisture, Ash: g / 100g
   - Cholesterol, Sodium, Calcium, Iron, Potassium, Magnesium: mg / 100g
   - Folate, Vitamin C: mcg or mg as noted (explicitly specify unit)
   - Amino Acids: g / 100g of sample or g / 100g of protein (explicitly specify)

FORMAT OUTPUT AS CLEAN STRUCTURED JSON matching the requested schema.`

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      'GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in your environment variables or .env.local file.'
    )
  }
  return new GoogleGenAI({ apiKey: apiKey.trim() })
}

export function classifyDomain(url) {
  if (!url || typeof url !== 'string') return 'UNKNOWN'
  const u = url.toLowerCase()
  if (
    u.includes('doi.org') ||
    u.includes('ncbi.nlm.nih.gov') ||
    u.includes('pubmed') ||
    u.includes('sciencedirect') ||
    u.includes('springer') ||
    u.includes('wiley') ||
    u.includes('nature.com') ||
    u.includes('researchgate') ||
    u.includes('tandfonline') ||
    u.includes('frontiersin')
  ) {
    return 'PEER_REVIEWED'
  }
  if (
    u.includes('.gov') ||
    u.includes('.nic.in') ||
    u.includes('fssai') ||
    u.includes('icmr') ||
    u.includes('nin.res.in') ||
    u.includes('usda.gov') ||
    u.includes('fao.org')
  ) {
    return 'GOVERNMENT'
  }
  if (u.includes('ifct2017.com') || u.includes('fooddatacentral') || u.includes('nal.usda.gov')) {
    return 'DATABASE'
  }
  if (u.includes('spec') || u.includes('coa') || u.includes('supplier')) {
    return 'SUPPLIER'
  }
  return 'COMMERCIAL'
}

export function calculateQualityScore(domainType) {
  switch (domainType) {
    case 'GOVERNMENT':
    case 'PEER_REVIEWED':
      return 5
    case 'DATABASE':
      return 4
    case 'SUPPLIER':
      return 3
    case 'COMMERCIAL':
      return 2
    default:
      return 1
  }
}

/**
 * Extracts grounding citations, search queries, and source metadata from Gemini response candidate.
 */
export function extractGroundingInfo(candidate) {
  const metadata = candidate?.groundingMetadata || {}
  const webQueries = metadata.webSearchQueries || []
  const rawChunks = metadata.groundingChunks || []
  const supports = metadata.groundingSupports || []

  const citations = []
  const seenUrls = new Set()

  rawChunks.forEach((chunk, index) => {
    const web = chunk.web
    if (web && web.uri) {
      if (!seenUrls.has(web.uri)) {
        seenUrls.add(web.uri)
        const domainType = classifyDomain(web.uri)
        const qualityScore = calculateQualityScore(domainType)
        citations.push({
          index: index + 1,
          uri: web.uri,
          title: web.title || web.uri,
          domainType,
          qualityScore,
        })
      }
    }
  })

  // Calculate grounding coverage score (0 to 100)
  let groundingScore = 0
  if (citations.length > 0) {
    const highQualityCount = citations.filter((c) => c.qualityScore >= 4).length
    groundingScore = Math.min(100, (citations.length * 20) + (highQualityCount * 15))
  }

  const isGrounded = citations.length > 0
  const searchEntryPointHtml = metadata.searchEntryPoint?.renderedContent || ''

  return {
    isGrounded,
    status: isGrounded ? 'GROUNDED' : 'UNGROUNDED',
    groundingScore,
    citations,
    webSearchQueries: webQueries,
    searchEntryPointHtml,
    supportsCount: supports.length,
  }
}
