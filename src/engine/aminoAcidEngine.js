/**
 * Amino Acid Engine
 * 
 * Computes essential and non-essential amino acid profiles,
 * BCAA (Branched Chain Amino Acids) totals, Sulfur & Aromatic groups,
 * and protein quality percentages for fitness and nutritional analysis.
 */

import { isNumeric } from '../utils'

export const ESSENTIAL_AMINO_ACIDS = [
  { key: 'histidine', name: 'Histidine', symbol: 'His' },
  { key: 'isoleucine', name: 'Isoleucine', symbol: 'Ile', isBcaa: true },
  { key: 'leucine', name: 'Leucine', symbol: 'Leu', isBcaa: true },
  { key: 'lysine', name: 'Lysine', symbol: 'Lys' },
  { key: 'methionine', name: 'Methionine', symbol: 'Met', isSulfur: true },
  { key: 'phenylalanine', name: 'Phenylalanine', symbol: 'Phe', isAromatic: true },
  { key: 'threonine', name: 'Threonine', symbol: 'Thr' },
  { key: 'tryptophan', name: 'Tryptophan', symbol: 'Trp' },
  { key: 'valine', name: 'Valine', symbol: 'Val', isBcaa: true },
]

export const NON_ESSENTIAL_AMINO_ACIDS = [
  { key: 'alanine', name: 'Alanine', symbol: 'Ala' },
  { key: 'arginine', name: 'Arginine', symbol: 'Arg' },
  { key: 'asparticAcid', name: 'Aspartic Acid', symbol: 'Asp' },
  { key: 'cysteine', name: 'Cysteine', symbol: 'Cys', isSulfur: true },
  { key: 'glutamicAcid', name: 'Glutamic Acid', symbol: 'Glu' },
  { key: 'glycine', name: 'Glycine', symbol: 'Gly' },
  { key: 'proline', name: 'Proline', symbol: 'Pro' },
  { key: 'serine', name: 'Serine', symbol: 'Ser' },
  { key: 'tyrosine', name: 'Tyrosine', symbol: 'Tyr', isAromatic: true },
]

export const ALL_AMINO_ACIDS = [...ESSENTIAL_AMINO_ACIDS, ...NON_ESSENTIAL_AMINO_ACIDS]

/**
 * Calculates complete amino acid profile for a formulation.
 * 
 * @param {Object} recipe - Recipe with items [{ ingredientId, grams }]
 * @param {Array} ingredientMaster - Master list of ingredients
 * @param {number} totalProtein - Total protein in finished product (g/100g)
 * @returns {Object} Complete amino acid totals, BCAA, EAA, and metrics
 */
export function calculateAminoAcids(recipe, ingredientMaster = [], totalProtein = null) {
  if (!recipe || !Array.isArray(recipe.items) || recipe.items.length === 0) {
    return { hasData: false, values: {}, totals: {} }
  }

  const ingMap = new Map()
  ingredientMaster.forEach((ing) => ingMap.set(ing.id, ing))

  const totalWeight = recipe.items.reduce((sum, item) => sum + (Number(item.grams) || 0), 0)
  if (totalWeight <= 0) return { hasData: false, values: {}, totals: {} }

  const values = {}
  let anyData = false

  ALL_AMINO_ACIDS.forEach(({ key }) => {
    let weightedSum = 0
    let coveredWeight = 0

    recipe.items.forEach((item) => {
      const ing = ingMap.get(item.ingredientId)
      const grams = Number(item.grams) || 0
      if (ing && ing.aminoAcids && isNumeric(ing.aminoAcids[key])) {
        coveredWeight += grams
        weightedSum += (grams * Number(ing.aminoAcids[key])) / totalWeight
      }
    })

    if (coveredWeight > 0) {
      anyData = true
      values[key] = {
        amountPer100g: Number(weightedSum.toFixed(3)),
        coveragePct: Number(((coveredWeight / totalWeight) * 100).toFixed(1)),
      }
    } else {
      values[key] = {
        amountPer100g: null,
        coveragePct: 0,
      }
    }
  })

  // Calculate Group Totals
  const sumGroup = (list) => {
    let sum = 0
    let count = 0
    list.forEach(({ key }) => {
      if (values[key] && values[key].amountPer100g != null) {
        sum += values[key].amountPer100g
        count++
      }
    })
    return { total: count > 0 ? Number(sum.toFixed(3)) : null, count }
  }

  const eaa = sumGroup(ESSENTIAL_AMINO_ACIDS)
  const bcaa = sumGroup(ESSENTIAL_AMINO_ACIDS.filter((a) => a.isBcaa))
  const nonEaa = sumGroup(NON_ESSENTIAL_AMINO_ACIDS)
  const sulfur = sumGroup(ALL_AMINO_ACIDS.filter((a) => a.isSulfur))
  const aromatic = sumGroup(ALL_AMINO_ACIDS.filter((a) => a.isAromatic))

  // Percentages relative to total protein
  const bcaaProteinPct =
    totalProtein && totalProtein > 0 && bcaa.total != null
      ? Number(((bcaa.total / totalProtein) * 100).toFixed(1))
      : null

  const eaaProteinPct =
    totalProtein && totalProtein > 0 && eaa.total != null
      ? Number(((eaa.total / totalProtein) * 100).toFixed(1))
      : null

  return {
    hasData: anyData,
    values,
    totals: {
      totalEaa: eaa.total,
      totalBcaa: bcaa.total,
      totalNonEaa: nonEaa.total,
      totalSulfurAa: sulfur.total,
      totalAromaticAa: aromatic.total,
      bcaaProteinPct,
      eaaProteinPct,
    },
  }
}
