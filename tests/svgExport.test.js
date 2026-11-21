import { describe, it, expect } from 'vitest'
import {
  dataToVectorSvg,
  supportsVectorSvg,
  escapeXml,
} from '../src/svgExportUtils'
import { DEFAULT_DATA } from '../src/constants'

describe('Native Vector SVG Export (CorelDRAW / Print)', () => {
  it('supports FSSAI and FDA statutory templates only', () => {
    expect(supportsVectorSvg('fssai')).toBe(true)
    expect(supportsVectorSvg('fda')).toBe(true)
    expect(supportsVectorSvg('compact')).toBe(false)
    expect(() => dataToVectorSvg(DEFAULT_DATA, 'compact', 111)).toThrow()
  })

  it('generates pure vector SVG for FSSAI with exact physical mm width and zero bitmaps', () => {
    const svg = dataToVectorSvg(DEFAULT_DATA, 'fssai', 111)

    expect(svg.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(svg).toContain('width="111mm"')
    expect(svg).toMatch(/height="\d+(\.\d+)?mm"/)
    expect(svg).toContain('viewBox="0 0 420 ')
    expect(svg).not.toContain('<foreignObject')
    expect(svg).not.toContain('<image')
    expect(svg).not.toContain('data:image/')
    expect(svg).toContain('<text ')
    expect(svg).toContain('<line ')
    expect(svg).toContain('<rect ')
    expect(svg).toContain('Nutritional Information')
    expect(svg).toContain('Per 100g*')
    expect(svg).toContain('Per 25 g')
    expect(svg).toContain('% RDA**')
    expect(svg).toContain('Energy (kcal)')
    expect(svg).toContain('Carbohydrates (g)')
    expect(svg).toContain('>394.0</text>')
    expect(svg).toContain('>22.5</text>')
  })

  it('supports 80mm and 140mm physical size presets', () => {
    const smallSvg = dataToVectorSvg(DEFAULT_DATA, 'fssai', 80)
    const largeSvg = dataToVectorSvg(DEFAULT_DATA, 'fssai', 140)

    expect(smallSvg).toContain('width="80mm"')
    expect(largeSvg).toContain('width="140mm"')
  })

  it('generates pure vector SVG for FDA with Calories, % Daily Value, and indented rows', () => {
    const svg = dataToVectorSvg(DEFAULT_DATA, 'fda', 111)

    expect(svg).toContain('width="111mm"')
    expect(svg).not.toContain('<foreignObject')
    expect(svg).not.toContain('<image')
    expect(svg).toContain('Amount per serving')
    expect(svg).toContain('Calories')
    expect(svg).toContain('99') // 394 * 25 / 100 = 98.5 -> 99
    expect(svg).toContain('% Daily Value*')
    expect(svg).toContain('Total Fat')
    expect(svg).toContain('Added Sugars')
  })

  it('preserves Missing != Zero contract by rendering null nutrients as em-dash', () => {
    const partialData = {
      ...DEFAULT_DATA,
      transFat: null,
      sodium: null,
    }
    const svg = dataToVectorSvg(partialData, 'fssai', 111)

    expect(svg).toContain('>—</text>')
    expect(svg).not.toContain('null')
    expect(svg).not.toContain('undefined')
  })

  it('escapes XML special characters safely without corrupting font-family attributes', () => {
    expect(escapeXml('A & B <10g> "test"')).toBe('A &amp; B &lt;10g&gt; &quot;test&quot;')
    const fssaiSvg = dataToVectorSvg({ ...DEFAULT_DATA, servingSize: '25g & 1 scoop' }, 'fssai', 111)
    const fdaSvg = dataToVectorSvg({ ...DEFAULT_DATA, servingSize: '25g & 1 scoop' }, 'fda', 111)
    expect(fssaiSvg).toContain('25g &amp; 1 scoop')
    expect(fssaiSvg).toContain('font-family="Arial-Black"')
    expect(fssaiSvg).toContain('font-family="ArialMT"')
    expect(fssaiSvg).not.toMatch(/font-family="[^"]*&apos;/)
    expect(fdaSvg).not.toMatch(/font-family="[^"]*&apos;/)
  })
})
