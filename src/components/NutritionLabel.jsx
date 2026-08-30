import React from 'react'
import { parseServingGrams } from '../utils'
import FssaiLabel from './templates/FssaiLabel'
import FdaLabel from './templates/FdaLabel'
import CompactLabel from './templates/CompactLabel'
import BoxedBannerLabel from './templates/BoxedBannerLabel'
import CurvedPanelLabel from './templates/CurvedPanelLabel'
import TwoToneLabel from './templates/TwoToneLabel'
import MinimalLineLabel from './templates/MinimalLineLabel'
import HeroTilesLabel from './templates/HeroTilesLabel'
import DualCardsLabel from './templates/DualCardsLabel'
import DarkPremiumLabel from './templates/DarkPremiumLabel'
import IconRowLabel from './templates/IconRowLabel'
import RdaRingLabel from './templates/RdaRingLabel'
import EditorialLabel from './templates/EditorialLabel'

const TEMPLATE_BODIES = {
  fssai:           FssaiLabel,
  fda:             FdaLabel,
  compact:         CompactLabel,
  boxed:           BoxedBannerLabel,
  'boxed-banner':  BoxedBannerLabel,
  curved:          CurvedPanelLabel,
  'curved-panel':  CurvedPanelLabel,
  twotone:         TwoToneLabel,
  'two-tone':      TwoToneLabel,
  minimal:         MinimalLineLabel,
  'minimal-line':  MinimalLineLabel,
  herotiles:       HeroTilesLabel,
  'hero-tiles':    HeroTilesLabel,
  dualcards:       DualCardsLabel,
  'dual-cards':    DualCardsLabel,
  darkpremium:     DarkPremiumLabel,
  'dark-premium':  DarkPremiumLabel,
  iconrow:         IconRowLabel,
  'icon-row':      IconRowLabel,
  rdaring:         RdaRingLabel,
  'rda-ring':      RdaRingLabel,
  editorial:       EditorialLabel,
}

export default function NutritionLabel({ data, labelRef, template = 'fssai' }) {
  const servingGrams = parseServingGrams(data.servingSize)
  const Body = TEMPLATE_BODIES[template] || FssaiLabel

  return (
    <div className={`nutrition-label template-${template}`} ref={labelRef}>
      <Body data={data} servingGrams={servingGrams} />
    </div>
  )
}
