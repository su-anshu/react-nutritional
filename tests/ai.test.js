import { describe, it, expect } from 'vitest'
import { classifyDomain, calculateQualityScore, extractGroundingInfo } from '../api/ai/_gemini.js'
import { RESEARCH_MODES, QUICK_TEMPLATES } from '../src/services/aiClient.js'
import { DOMAIN_TYPES } from '../src/data/ingredientMaster.js'

describe('Gemini AI & Google Search Grounding Engine', () => {
  it('correctly classifies government, peer-reviewed, and commercial search domains', () => {
    expect(classifyDomain('https://nin.res.in/downloads/IFCT2017.pdf')).toBe(DOMAIN_TYPES.GOVERNMENT)
    expect(classifyDomain('https://fdc.nal.usda.gov/fdc-app.html#/food-details/12345')).toBe(DOMAIN_TYPES.GOVERNMENT)
    expect(classifyDomain('https://fssai.gov.in/upload/regulations.pdf')).toBe(DOMAIN_TYPES.GOVERNMENT)
    expect(classifyDomain('https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1234567/')).toBe(DOMAIN_TYPES.PEER_REVIEWED)
    expect(classifyDomain('https://sciencedirect.com/science/article/pii/123')).toBe(DOMAIN_TYPES.PEER_REVIEWED)
    expect(classifyDomain('https://amazon.in/dp/B08XYZ')).toBe(DOMAIN_TYPES.COMMERCIAL)
  })

  it('assigns high authority scores (5/5) to government and peer-reviewed domains', () => {
    expect(calculateQualityScore(DOMAIN_TYPES.GOVERNMENT)).toBe(5)
    expect(calculateQualityScore(DOMAIN_TYPES.PEER_REVIEWED)).toBe(5)
    expect(calculateQualityScore(DOMAIN_TYPES.DATABASE)).toBe(4)
    expect(calculateQualityScore(DOMAIN_TYPES.COMMERCIAL)).toBe(2)
  })

  it('extracts grounding metadata, web citations, and computes grounding score from Gemini response', () => {
    const mockCandidate = {
      groundingMetadata: {
        webSearchQueries: ['IFCT roasted gram nutrition', 'USDA chickpea flour proximate analysis'],
        groundingChunks: [
          {
            web: {
              uri: 'https://fdc.nal.usda.gov/fdc-app.html#/food-details/173757/nutrients',
              title: 'USDA FoodData Central: Chickpea flour (besan)',
            },
          },
          {
            web: {
              uri: 'https://nin.res.in/ifct',
              title: 'Indian Food Composition Tables 2017 - ICMR-NIN',
            },
          },
        ],
        groundingSupports: [
          {
            segment: { text: 'Energy is approximately 387 kcal per 100g.' },
            groundingChunkIndices: [0, 1],
            confidenceScores: [0.95, 0.92],
          },
        ],
        searchEntryPoint: {
          renderedContent: '<div>Search results</div>',
        },
      },
    }

    const info = extractGroundingInfo(mockCandidate)
    expect(info.isGrounded).toBe(true)
    expect(info.citations.length).toBe(2)
    expect(info.citations[0].domainType).toBe(DOMAIN_TYPES.GOVERNMENT)
    expect(info.citations[0].qualityScore).toBe(5)
    expect(info.groundingScore).toBeGreaterThanOrEqual(70)
    expect(info.webSearchQueries.length).toBe(2)
    expect(info.searchEntryPointHtml).toContain('Search results')
  })

  it('marks responses with 0 citations as UNGROUNDED with groundingScore 0', () => {
    const mockCandidate = {
      groundingMetadata: {
        webSearchQueries: [],
        groundingChunks: [],
      },
    }

    const info = extractGroundingInfo(mockCandidate)
    expect(info.isGrounded).toBe(false)
    expect(info.citations.length).toBe(0)
    expect(info.groundingScore).toBe(0)
  })

  it('defines 8 specialized food science research modes', () => {
    expect(RESEARCH_MODES.length).toBe(8)
    const modeIds = RESEARCH_MODES.map((m) => m.id)
    expect(modeIds).toContain('GENERAL_QUERY')
    expect(modeIds).toContain('NUTRIENT_LOOKUP')
    expect(modeIds).toContain('INGREDIENT_IDENTIFICATION')
    expect(modeIds).toContain('CLAIM_EVIDENCE')
    expect(modeIds).toContain('PROCESSING_EFFECTS')
    expect(modeIds).toContain('AMINO_ACID_PROFILE')
    expect(modeIds).toContain('ALLERGEN_CROSS_CONTAMINATION')
    expect(modeIds).toContain('RECIPE_OPTIMIZATION')
  })

  it('provides quick templates for high priority Sattu formulations', () => {
    expect(QUICK_TEMPLATES.length).toBeGreaterThanOrEqual(4)
    expect(QUICK_TEMPLATES.some((t) => t.label.includes('Beetroot'))).toBe(true)
    expect(QUICK_TEMPLATES.some((t) => t.label.includes('Kulthi'))).toBe(true)
  })
})
