import {
  applyPrinterDefaults,
  applySavedProperties,
  classifyJobStatus,
  hasTrays,
  hasNoTrays,
  pickRememberedProperties,
} from './printer'
import { PrinterConfig, PrinterProperties } from '../shared/types'
import { PAPER_ID } from '../shared/constants'

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

/** A printer that supports everything the dialog can offer. */
function capableConfig(): PrinterConfig {
  return {
    Default: {
      Color: 'color',
      Duplex: 'duplex_simplex',
      Orientation: 'portrait',
      Resolution: '600 dpi',
      Paper: 'A4',
      Tray: 'Tray 1',
    },
    ColorSupported: true,
    DuplexSupported: true,
    DuplexMode: 1,
    OrientationsSupported: ['portrait', 'landscape'],
    Resolutions: ['300 dpi', '600 dpi'],
    PaperFormats: [
      { Id: 9, Name: 'A4', XRes: 210, YRes: 297, Default: true },
      { Id: 1, Name: 'Letter', XRes: 216, YRes: 279, Default: false },
    ],
    Trays: [
      { Default: true, Index: 1, Name: 'Tray 1' },
      { Default: false, Index: 2, Name: 'Tray 2' },
    ],
  }
}

/** What the user last printed with: every setting away from the defaults. */
function savedSettings(): PrinterProperties {
  return {
    color: false,
    duplex: true,
    duplexmode: 2,
    paper: 'Letter',
    paperid: 1,
    orientation: 2,
    resolution: '300 dpi',
    trayname: 'Tray 2',
    defaultSource: 2,
  }
}

describe('pickRememberedProperties', () => {
  it('keeps the printer settings and drops the per-document ones', () => {
    const remembered = pickRememberedProperties({
      ...savedSettings(),
      copies: 7,
      PageRanges: '1-3',
    })

    expect(remembered.paper).toBe('Letter')
    expect(remembered.duplexmode).toBe(2)
    // Copies and page ranges belong to one document, not to the printer.
    expect('copies' in remembered).toBe(false)
    expect('PageRanges' in remembered).toBe(false)
  })
})

describe('applySavedProperties', () => {
  it('falls back to the printer defaults when nothing was saved', () => {
    const props = applySavedProperties(capableConfig(), null, freshProperties())

    expect(props.color).toBe(true)
    expect(props.paper).toBe('A4')
    expect(props.resolution).toBe('600 dpi')
  })

  it('restores every remembered setting the printer still supports', () => {
    const props = applySavedProperties(capableConfig(), savedSettings(), freshProperties())

    expect(props.color).toBe(false)
    expect(props.duplexmode).toBe(2)
    expect(props.paper).toBe('Letter')
    expect(props.paperid).toBe(1)
    expect(props.orientation).toBe(2)
    expect(props.resolution).toBe('300 dpi')
    expect(props.trayname).toBe('Tray 2')
    expect(props.defaultSource).toBe(2)
  })

  it('drops a paper size the printer no longer offers', () => {
    const config = capableConfig()
    config.PaperFormats = [{ Id: 9, Name: 'A4', XRes: 210, YRes: 297, Default: true }]

    const props = applySavedProperties(config, savedSettings(), freshProperties())

    expect(props.paper).toBe('A4')
    expect(props.paperid).toBe(9)
  })

  it('drops a tray the printer no longer offers', () => {
    const config = capableConfig()
    config.Trays = [{ Default: true, Index: 1, Name: 'Tray 1' }]

    const props = applySavedProperties(config, savedSettings(), freshProperties())

    expect(props.trayname).toBe('Tray 1')
    expect(props.defaultSource).toBe(1)
  })

  it('sends no tray at all to a printer that reports none', () => {
    const config = capableConfig()
    config.Trays = [null as any]

    const props = applySavedProperties(config, savedSettings(), freshProperties())

    expect('trayname' in props).toBe(false)
    expect('defaultSource' in props).toBe(false)
  })

  it('ignores colour and duplex the printer cannot do', () => {
    const config = capableConfig()
    config.ColorSupported = false
    config.DuplexSupported = false
    config.Default = { ...config.Default, Color: 'grayscale' }

    const props = applySavedProperties(
      config,
      { ...savedSettings(), color: true },
      freshProperties(),
    )

    expect(props.color).toBe(false)
    expect(props.duplexmode).toBe(config.DuplexMode)
  })

  it('ignores a resolution and orientation outside the printer capabilities', () => {
    const config = capableConfig()
    const saved = { ...savedSettings(), resolution: '1200 dpi', orientation: 9 }

    const props = applySavedProperties(config, saved, freshProperties())

    expect(props.resolution).toBe('600 dpi')
    expect(props.orientation).toBe(1)
  })

  it('restores the custom size dimensions only for the custom format', () => {
    const config = capableConfig()
    config.PaperFormats = [{ Id: PAPER_ID, Name: 'Custom', XRes: 0, YRes: 0, Default: true }]
    const saved = { ...savedSettings(), paperid: PAPER_ID, paperwidth: 120, paperlength: 300 }

    const props = applySavedProperties(config, saved, freshProperties())

    expect(props.paperwidth).toBe(120)
    expect(props.paperlength).toBe(300)
  })

  it('never brings copies or page ranges back', () => {
    const saved = { ...savedSettings(), copies: 5, PageRanges: '2-4' } as PrinterProperties
    const props = applySavedProperties(capableConfig(), saved, freshProperties())

    expect(props.copies).toBe('')
    expect('PageRanges' in props).toBe(false)
  })
})
