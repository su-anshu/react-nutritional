/**
 * Default Seed Formulations / Recipes for Sattu Products
 * Each recipe specifies:
 * - unique recipe ID and product display name
 * - standard serving size string and numeric serving grams
 * - items array: ingredientId and weightInGrams (should sum to 100g or batch total)
 * - product category and notes
 */

export const DEFAULT_RECIPES = [
  {
    id: 'chana-sattu',
    name: 'Pure Chana Sattu (Classic)',
    category: 'Sattu Traditional',
    servingSize: '50g',
    servingGrams: 50,
    description: '100% pure roasted Bengal gram flour. High natural protein and dietary fiber.',
    items: [
      { ingredientId: 'roasted-chana-sattu', grams: 100 },
    ],
  },
  {
    id: 'jeera-chana-sattu',
    name: 'Jeera Chana Sattu (Spiced)',
    category: 'Sattu Flavoured',
    servingSize: '50g',
    servingGrams: 50,
    description: 'Roasted Bengal gram flour blended with aromatic roasted jeera powder.',
    items: [
      { ingredientId: 'roasted-chana-sattu', grams: 97 },
      { ingredientId: 'roasted-jeera-powder', grams: 3 },
    ],
  },
  {
    id: 'pea-isolate-sattu',
    name: 'Pea Protein Fortified Sattu (Pro Boost)',
    category: 'High Protein / Fitness',
    servingSize: '40g',
    servingGrams: 40,
    description: 'Fortified with yellow pea protein isolate (80%) for fitness athletes.',
    items: [
      { ingredientId: 'roasted-chana-sattu', grams: 80 },
      { ingredientId: 'pea-protein-isolate', grams: 20 },
    ],
  },
  {
    id: 'moringa-sattu',
    name: 'Moringa Leaf Sattu (Green Vitality)',
    category: 'Superfood Blend',
    servingSize: '50g',
    servingGrams: 50,
    description: 'Nutrient-dense superfood sattu with dehydrated moringa leaves and roasted cumin.',
    items: [
      { ingredientId: 'roasted-chana-sattu', grams: 92 },
      { ingredientId: 'moringa-powder', grams: 5 },
      { ingredientId: 'iodised-salt', grams: 1 },
      { ingredientId: 'roasted-jeera-powder', grams: 2 },
    ],
  },
  {
    id: 'beetroot-sattu',
    name: 'Beetroot Sattu (Red Stamina)',
    category: 'Superfood Blend',
    servingSize: '50g',
    servingGrams: 50,
    description: 'Dehydrated beetroot with roasted gram, tangy amchur, and digestive spices.',
    items: [
      { ingredientId: 'roasted-chana-sattu', grams: 85 },
      { ingredientId: 'beetroot-powder', grams: 10 },
      { ingredientId: 'iodised-salt', grams: 1 },
      { ingredientId: 'amchur-powder', grams: 2 },
      { ingredientId: 'roasted-jeera-powder', grams: 2 },
    ],
  },
  {
    id: 'abc-sattu',
    name: 'ABC Sattu (Apple-Beetroot-Carrot)',
    category: 'Superfood Blend',
    servingSize: '50g',
    servingGrams: 50,
    description: 'Triple botanical blend: dried apple, beetroot, and carrot with warming ginger.',
    items: [
      { ingredientId: 'roasted-chana-sattu', grams: 78 },
      { ingredientId: 'apple-powder', grams: 7 },
      { ingredientId: 'beetroot-powder', grams: 7 },
      { ingredientId: 'carrot-powder', grams: 6 },
      { ingredientId: 'iodised-salt', grams: 1 },
      { ingredientId: 'ginger-powder', grams: 1 },
    ],
  },
  {
    id: 'kulthi-sattu',
    name: 'Kulthi Sattu (Horse Gram Blend)',
    category: 'Heritage Pulse Blend',
    servingSize: '50g',
    servingGrams: 50,
    description: 'Traditional roasted horse gram with roasted chana and cumin.',
    items: [
      { ingredientId: 'roasted-horsegram-flour', grams: 60 },
      { ingredientId: 'roasted-chana-sattu', grams: 38 },
      { ingredientId: 'roasted-jeera-powder', grams: 2 },
    ],
  },
  {
    id: 'makai-sattu',
    name: 'Makai Sattu (Roasted Maize Blend)',
    category: 'Heritage Grain Blend',
    servingSize: '50g',
    servingGrams: 50,
    description: 'Roasted yellow maize paired with roasted chana flour and toasted cumin.',
    items: [
      { ingredientId: 'roasted-makai-flour', grams: 60 },
      { ingredientId: 'roasted-chana-sattu', grams: 38 },
      { ingredientId: 'roasted-jeera-powder', grams: 2 },
    ],
  },
  {
    id: 'jau-sattu',
    name: 'Jau Sattu (Barley Blend)',
    category: 'Heritage Grain Blend',
    servingSize: '50g',
    servingGrams: 50,
    description: 'Roasted barley and roasted chana flour blend. CONTAINS GLUTEN.',
    items: [
      { ingredientId: 'roasted-barley-flour', grams: 60 },
      { ingredientId: 'roasted-chana-sattu', grams: 40 },
    ],
  },
  {
    id: 'triphala-sattu',
    name: 'Triphala Sattu (Digestive Wellness)',
    category: 'Ayurvedic Botanical Blend',
    servingSize: '50g',
    servingGrams: 50,
    description: 'Roasted chana sattu with traditional Triphala powder (Amla, Haritaki, Bibhitaki).',
    items: [
      { ingredientId: 'roasted-chana-sattu', grams: 93 },
      { ingredientId: 'dry-triphala-powder', grams: 5 },
      { ingredientId: 'iodised-salt', grams: 1 },
      { ingredientId: 'roasted-jeera-powder', grams: 1 },
    ],
  },
]
