/**
 * AI Research Client Service
 * 
 * Handles client-to-server communication with serverless /api/ai endpoints,
 * manages local research query history and user AI preferences.
 */

const HISTORY_STORAGE_KEY = 'nutrition-app-v3-ai-research-history'
const SETTINGS_STORAGE_KEY = 'nutrition-app-v3-ai-settings'

export const DEFAULT_AI_SETTINGS = {
  selectedModel: 'gemini-2.5-flash',
  temperature: 0.2,
  autoSaveHistory: true,
  maxHistoryItems: 50,
}

export const RESEARCH_MODES = [
  {
    id: 'GENERAL_QUERY',
    label: 'General R&D Query',
    description: 'Freeform food science, formulation, and nutritional chemistry research',
    icon: '🔬',
  },
  {
    id: 'NUTRIENT_LOOKUP',
    label: 'Nutrient Profile Lookup',
    description: 'Find full nutritional specs per 100g for a whole, roasted, or powdered ingredient',
    icon: '📊',
  },
  {
    id: 'INGREDIENT_IDENTIFICATION',
    label: 'Botanical & Processing Audit',
    description: 'Identify exact botanical taxon, dehydration state, and processing effects',
    icon: '🌱',
  },
  {
    id: 'CLAIM_EVIDENCE',
    label: 'Claim Regulatory & Clinical Evidence',
    description: 'Search ICMR-NIN, FSSAI regulations, and peer-reviewed trials for health claims',
    icon: '📜',
  },
  {
    id: 'PROCESSING_EFFECTS',
    label: 'Roasting & Dehydration Physics',
    description: 'Analyze moisture loss, Maillard reactions, heat labile vitamins, and mineral retention',
    icon: '🔥',
  },
  {
    id: 'AMINO_ACID_PROFILE',
    label: 'Amino Acid & Protein Quality',
    description: 'Retrieve complete 18 amino acid profile and DIAAS/PDCAAS estimates',
    icon: '🧬',
  },
  {
    id: 'ALLERGEN_CROSS_CONTAMINATION',
    label: 'Allergen & Cross-Contact Audit',
    description: 'Audit Schedule II statutory allergens and grain milling cross-contact risks',
    icon: '⚠️',
  },
  {
    id: 'RECIPE_OPTIMIZATION',
    label: 'Formulation Optimization Advice',
    description: 'Formulation suggestions to boost protein, minimize sodium, or improve balance',
    icon: '✨',
  },
]

export const QUICK_TEMPLATES = [
  {
    label: 'Dehydrated Beetroot Powder vs Raw',
    mode: 'NUTRIENT_LOOKUP',
    ingredientId: 'beetroot-powder',
    query: 'What is the complete nutritional profile per 100g of dehydrated beetroot powder (Beta vulgaris) with 6-8% moisture? Provide energy, protein, total carb, available carb, dietary fibre, total sugar, fat, iron, potassium, calcium, and sodium with citations from IFCT, USDA, or peer-reviewed literature.',
  },
  {
    label: 'Kulthi (Horsegram) Sattu Nutrition',
    mode: 'NUTRIENT_LOOKUP',
    ingredientId: 'kulthi-sattu',
    query: 'Provide complete nutritional composition and 18 amino acid profile per 100g for roasted Horsegram flour / Kulthi Sattu (Macrotyloma uniflorum) according to ICMR-NIN / IFCT 2017.',
  },
  {
    label: 'Moringa Leaf Powder Mineral Density',
    mode: 'PROCESSING_EFFECTS',
    ingredientId: 'moringa-powder',
    query: 'Analyze the nutrient concentration of shade-dried Moringa oleifera leaf powder per 100g compared to fresh leaves, focusing on protein, iron, calcium, vitamin C degradation, and moisture retention.',
  },
  {
    label: 'Triphala Powder Fiber & Bioactives',
    mode: 'NUTRIENT_LOOKUP',
    ingredientId: 'triphala-powder',
    query: 'Nutritional breakdown and dietary fiber fraction for traditional Triphala powder (1:1:1 Amalaki, Haritaki, Bibhitaki) per 100g with peer-reviewed source references.',
  },
  {
    label: 'Sattu Roasting Glycemic & Starch Impact',
    mode: 'PROCESSING_EFFECTS',
    ingredientId: 'chana-sattu-base',
    query: 'What are the scientific physical and biochemical effects of sand roasting on Bengal gram (Cicer arietinum) starch gelatinization, resistant starch, dietary fibre availability, and glycemic index in Chana Sattu?',
  },
]

/**
 * Loads AI settings from localStorage.
 */
export function loadAISettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (raw) {
      return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(raw) }
    }
  } catch (err) {
    console.warn('Failed to load AI settings from localStorage:', err)
  }
  return { ...DEFAULT_AI_SETTINGS }
}

/**
 * Saves AI settings to localStorage (never stores API keys).
 */
export function saveAISettings(settings) {
  try {
    const safeSettings = {
      selectedModel: settings.selectedModel || DEFAULT_AI_SETTINGS.selectedModel,
      temperature: typeof settings.temperature === 'number' ? settings.temperature : DEFAULT_AI_SETTINGS.temperature,
      autoSaveHistory: settings.autoSaveHistory !== false,
      maxHistoryItems: settings.maxHistoryItems || 50,
    }
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(safeSettings))
  } catch (err) {
    console.warn('Failed to save AI settings to localStorage:', err)
  }
}

/**
 * Loads research query history from localStorage.
 */
export function loadResearchHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (err) {
    console.warn('Failed to load research history from localStorage:', err)
  }
  return []
}

/**
 * Saves a research query result to history.
 */
export function saveResearchToHistory(item) {
  try {
    const history = loadResearchHistory()
    const settings = loadAISettings()
    const updated = [item, ...history.filter((h) => h.id !== item.id)].slice(0, settings.maxHistoryItems || 50)
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.warn('Failed to save research history:', err)
    return []
  }
}

/**
 * Clears research history from localStorage.
 */
export function clearResearchHistory() {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY)
  } catch (err) {
    console.warn('Failed to clear research history:', err)
  }
}

/**
 * Fetches available models from /api/ai/models.
 */
export async function fetchAvailableModels() {
  try {
    const res = await fetch('/api/ai/models', { method: 'GET' })
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    const data = await res.json()
    return data
  } catch (err) {
    console.error('fetchAvailableModels error:', err)
    return {
      models: [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', isDefault: true },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      ],
      hasApiKey: false,
    }
  }
}

/**
 * Tests Gemini API connection via /api/ai/test.
 */
export async function testAIConnection(model = 'gemini-2.5-flash') {
  try {
    const res = await fetch('/api/ai/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model }),
    })
    const data = await res.json()
    return data
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to reach AI test endpoint',
    }
  }
}

/**
 * Executes a grounded Food R&D research query via /api/ai/research.
 */
export async function executeAIResearch({
  query,
  mode = 'GENERAL_QUERY',
  ingredientId = '',
  ingredientName = '',
  targetNutrients = [],
  model = 'gemini-2.5-flash',
  temperature = 0.2,
}) {
  const res = await fetch('/api/ai/research', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      mode,
      ingredientId,
      ingredientName,
      targetNutrients,
      model,
      temperature,
    }),
  })

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new Error(errBody.error || `Server responded with status ${res.status}`)
  }

  const result = await res.json()
  return result
}
