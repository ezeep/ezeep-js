import { applyPrinterDefaults, classifyJobStatus, hasTrays, hasNoTrays } from './printer'
import { PrinterConfig, PrinterProperties } from '../shared/types'

/** A minimal "fresh" properties object, as the component initialises it. */
function freshProperties(): PrinterProperties {
  return {
    paper: '',
    paperid: '',
    color: false,
    duplex: true,
    duplexmode: 1,
    orientation: 1,
    copies: '',
    resolution: 0,
    paperlength: 0,
    paperwidth: 0,
    defaultSource: '',
    trayname: '',
    PageRanges: '',
  }
}

describe('classifyJobStatus', () => {
  it('maps success / processing / failure codes', () => {
    expect(classifyJobStatus(0, false)).toBe('success')
    expect(classifyJobStatus(1246, false)).toBe('processing')
    expect(classifyJobStatus(129, false)).toBe('processing')
    expect(classifyJobStatus(3011, false)).toBe('failed')
    expect(classifyJobStatus(2, false)).toBe('failed')
  })

  it('treats hub-driver codes as hub-error only for queue printers', () => {
    for (const code of [412, 500, 503, 1048579]) {
      expect(classifyJobStatus(code, true)).toBe('hub-error')
      // Non-queue printers fall through to a generic failure.
      expect(classifyJobStatus(code, false)).toBe('failed')
    }
  })

  it('treats unknown codes as failures for safety', () => {
    expect(classifyJobStatus(99999, false)).toBe('failed')
    expect(classifyJobStatus(99999, true)).toBe('failed')
  })
})

describe('hasTrays / hasNoTrays', () => {
  it('detects a real tray list', () => {
    const config: PrinterConfig = { Trays: [{ Default: true, Index: 1, Name: 'Tray 1' }] }
    expect(hasTrays(config)).toBe(true)
    expect(hasNoTrays(config)).toBe(false)
  })

  it('detects an explicit "no trays" ([null]) report', () => {
    const config: PrinterConfig = { Trays: [null as any] }
    expect(hasTrays(config)).toBe(false)
    expect(hasNoTrays(config)).toBe(true)
  })

  it('treats a missing Trays field as neither', () => {
    expect(hasTrays({})).toBe(false)
    expect(hasNoTrays({})).toBe(false)
  })
})

describe('applyPrinterDefaults', () => {
  it('derives color, paper, tray and duplex defaults from the config', () => {
    const config: PrinterConfig = {
      Default: { Color: 'color', Orientation: 'landscape', Resolution: '600 dpi' },
      OrientationsSupported: ['portrait', 'landscape'],
      PaperFormats: [
        { Id: 9, Name: 'A4', XRes: 210, YRes: 297, Default: true },
        { Id: 1, Name: 'Letter', XRes: 216, YRes: 279, Default: false },
      ],
      Trays: [
        { Default: false, Index: 1, Name: 'Tray 1' },
        { Default: true, Index: 2, Name: 'Tray 2' },
      ],
      DuplexSupported: true,
      DuplexMode: 2,
    }

    const props = applyPrinterDefaults(config, freshProperties())

    expect(props.color).toBe(true)
    expect(props.resolution).toBe('600 dpi')
    // 'landscape' is index 1 in OrientationsSupported -> 1-based index 2
    expect(props.orientation).toBe(2)
    expect(props.paper).toBe('A4')
    expect(props.paperid).toBe(9)
    expect(props.trayname).toBe('Tray 2')
    expect(props.defaultSource).toBe(2)
    expect(props.duplex).toBe(true)
    expect(props.duplexmode).toBe(2)
    // PageRanges is always stripped when a printer is (re)selected.
    expect(props.PageRanges).toBeUndefined()
  })

  it('prefers an explicit OrientationIndex over the supported-list lookup', () => {
    const config: PrinterConfig = {
      Default: { Orientation: 'landscape', OrientationIndex: 5 },
      OrientationsSupported: ['portrait', 'landscape'],
    }
    expect(applyPrinterDefaults(config, freshProperties()).orientation).toBe(5)
  })

  it('removes tray attributes when the printer reports no trays ([null])', () => {
    const config: PrinterConfig = { Trays: [null as any], DuplexSupported: false }
    const props = applyPrinterDefaults(config, freshProperties())
    expect('trayname' in props).toBe(false)
    expect('defaultSource' in props).toBe(false)
  })

  it('sets color to false when the default is not "color"', () => {
    const config: PrinterConfig = { Default: { Color: 'grayscale' } }
    expect(applyPrinterDefaults(config, freshProperties()).color).toBe(false)
  })
})
