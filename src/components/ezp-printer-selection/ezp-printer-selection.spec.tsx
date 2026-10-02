import { EzpPrinterSelection } from './ezp-printer-selection'
import printStore, { EzpPrintService } from '../../services/print'
import { EzpUserService } from '../../services/user'
import { initi18n } from '../../utils/utils'
import { storage } from '../../shared/storage'

// Exercises the pure status-description logic directly (the full component's
// connectedCallback makes several network calls, out of scope here).
describe('ezp-printer-selection upload progress', () => {
  beforeAll(() => initi18n('en'))

  it('surfaces the upload percentage while uploading a single file', () => {
    const el = new EzpPrinterSelection() as any
    el.uploading = true
    el.totalFiles = 1
    printStore.state.uploadProgress = 42

    const description = el.processingDescription()
    expect(description).toContain('42%')
  })

  it('surfaces file count and percentage while uploading multiple files', () => {
    const el = new EzpPrinterSelection() as any
    el.uploading = true
    el.totalFiles = 3
    el.currentFileIndex = 1
    printStore.state.uploadProgress = 60.4

    const description = el.processingDescription()
    expect(description).toContain('2/3')
    expect(description).toContain('60%') // rounded
  })

  it('does not show a percentage once uploading is done', () => {
    const el = new EzpPrinterSelection() as any
    el.uploading = false
    el.totalFiles = 1

    expect(el.processingDescription()).not.toContain('%')
  })
})

describe('ezp-printer-selection timeout classification', () => {
  it('treats a polling-budget exhaustion as a timeout (job may still finish)', () => {
    const el = new EzpPrinterSelection() as any
    expect(el.isTimeoutError(new Error('Exceeded max attempts.'))).toBe(true)
    expect(el.isTimeoutError(new Error('Print job timed out after 300 status checks'))).toBe(true)
  })

  it('does not treat an outright print failure as a timeout', () => {
    const el = new EzpPrinterSelection() as any
    expect(el.isTimeoutError(new Error('Print job failed: rejected'))).toBe(false)
    expect(el.isTimeoutError(new Error('Hub printer driver error: no driver'))).toBe(false)
  })
})

describe('ezp-printer-selection print button guard', () => {
  const ready = () => {
    const el = new EzpPrinterSelection() as any
    el.selectedPrinter = { id: 'p1', name: 'Printer' }
    el.printProcessing = false
    el.pageRangeInvalid = false
    return el
  }

  it('enables Print once a printer is selected', () => {
    expect(ready().printDisabled).toBe(false)
  })

  it('disables Print without a printer', () => {
    const el = ready()
    el.selectedPrinter = { id: '', name: '' }
    expect(el.printDisabled).toBe(true)
  })

  it('disables Print while a job is processing', () => {
    const el = ready()
    el.printProcessing = true
    expect(el.printDisabled).toBe(true)
  })

  it('disables Print when the page range is invalid', () => {
    const el = ready()
    el.pageRangeInvalid = true
    expect(el.printDisabled).toBe(true)
  })
})

describe('ezp-printer-selection remembering the last printer', () => {
  const printer = (id: string) => ({ id, name: `Printer ${id}`, location: '', is_queue: false })

  beforeEach(() => localStorage.clear())

  it('preselects the saved printer when the user still has it', () => {
    storage.setPrinter(printer('p2'))
    const el = new EzpPrinterSelection() as any
    el.printers = [printer('p1'), printer('p2')]

    el.selectInitialPrinter()

    expect(el.selectedPrinter.id).toBe('p2')
  })

  it('resets the selection when the saved printer is gone from the list', () => {
    storage.setPrinter(printer('gone'))
    storage.setPrinterSettings('gone', { color: true })
    const el = new EzpPrinterSelection() as any
    el.printers = [printer('p1'), printer('p2')]

    el.selectInitialPrinter()

    expect(el.selectedPrinter.id).toBe('')
    expect(storage.getPrinter()).toBeNull()
    // The settings stay, ready for the day that printer is shared again.
    expect(storage.getPrinterSettings('gone')).toEqual({ color: true })
  })

  it('remembers the printer settings after a print, but not copies or ranges', () => {
    const el = new EzpPrinterSelection() as any
    el.selectedPrinter = printer('p1')
    el.selectedProperties = {
      color: false,
      duplexmode: 2,
      paper: 'Letter',
      paperid: 1,
      orientation: 2,
      resolution: '300 dpi',
      trayname: 'Tray 2',
      defaultSource: 2,
      copies: 4,
      PageRanges: '1-3',
    }

    el.rememberSelection()

    const saved = storage.getPrinterSettings('p1')!
    expect(saved.paper).toBe('Letter')
    expect(saved.duplexmode).toBe(2)
    expect(saved.trayname).toBe('Tray 2')
    expect('copies' in saved).toBe(false)
    expect('PageRanges' in saved).toBe(false)
    expect(storage.getPrinter()!.id).toBe('p1')
  })

  it('saves nothing when no printer was selected', () => {
    const el = new EzpPrinterSelection() as any
    el.selectedPrinter = { id: '', name: '', location: '', is_queue: false }

    el.rememberSelection()

    expect(storage.getPrinter()).toBeNull()
  })

  it('starts with no printer when nothing was ever saved', () => {
    const el = new EzpPrinterSelection() as any
    el.printers = [printer('p1'), printer('p2')]

    el.selectInitialPrinter()

    expect(el.selectedPrinter.id).toBe('')
  })
})

describe('ezp-printer-selection with a single printer', () => {
  const printer = (id: string) => ({ id, name: `Printer ${id}`, location: '', is_queue: false })

  beforeEach(() => localStorage.clear())

  it('selects the only printer, so there is nothing to pick', () => {
    const el = new EzpPrinterSelection() as any
    el.printers = [printer('only')]

    el.selectInitialPrinter()

    expect(el.selectedPrinter.id).toBe('only')
  })

  it('selects the only printer even when the saved one is gone', () => {
    storage.setPrinter(printer('gone'))
    const el = new EzpPrinterSelection() as any
    el.printers = [printer('only')]

    el.selectInitialPrinter()

    expect(el.selectedPrinter.id).toBe('only')
    expect(storage.getPrinter()).toBeNull()
  })

  it('still prefers the saved printer when it is the only one', () => {
    storage.setPrinter(printer('only'))
    const el = new EzpPrinterSelection() as any
    el.printers = [printer('only')]

    el.selectInitialPrinter()

    expect(el.selectedPrinter.id).toBe('only')
  })

  it('selects nothing when the user has no printers at all', () => {
    const el = new EzpPrinterSelection() as any
    el.printers = []

    el.selectInitialPrinter()

    expect(el.selectedPrinter.id).toBe('')
  })
})

describe('ezp-printer-selection load failures', () => {
  const printer = (id: string) => ({ id, name: `Printer ${id}`, location: '', is_queue: false })

  beforeEach(() => localStorage.clear())
  afterEach(() => jest.restoreAllMocks())

  /** connectedCallback with every network call stubbed. */
  function loadable(overrides: Record<string, any> = {}) {
    jest.spyOn(EzpUserService.prototype, 'getUserInfo').mockResolvedValue({} as any)
    jest
      .spyOn(EzpPrintService.prototype, 'registerFetchInterceptor')
      .mockImplementation(() => undefined)
    jest
      .spyOn(EzpPrintService.prototype, 'getPrinterList')
      .mockResolvedValue([printer('only')] as any)
    jest
      .spyOn(EzpPrintService.prototype, 'getPrinterProperties')
      .mockResolvedValue([{ ColorSupported: true }] as any)
    jest.spyOn(EzpPrintService.prototype, 'getAllPrinterProperties').mockResolvedValue([] as any)
    jest
      .spyOn(EzpPrintService.prototype, 'getConfig')
      .mockResolvedValue({ json: () => Promise.resolve({ System: { FILEEXT: ['pdf'] } }) } as any)

    for (const [method, impl] of Object.entries(overrides)) {
      jest.spyOn(EzpPrintService.prototype, method as any).mockImplementation(impl as any)
    }
    return new EzpPrinterSelection() as any
  }

  it('leaves the dialog loading-free when the properties call fails', async () => {
    // The loading status has no close button, so a throw here would strand the
    // user — and auto-select makes this reachable on a first-ever print.
    const el = loadable({ getPrinterProperties: () => Promise.reject(new Error('network')) })

    await el.connectedCallback()

    expect(el.loading).toBe(false)
    // No half-configured printer is left selected.
    expect(el.selectedPrinter.id).toBe('')
  })

  it('survives a printer-properties response with no properties in it', async () => {
    const el = loadable({ getPrinterProperties: () => Promise.resolve([]) })

    await el.connectedCallback()

    expect(el.loading).toBe(false)
    expect(el.selectedPrinter.id).toBe('')
  })

  it('leaves the dialog loading-free when the printer list fails', async () => {
    const el = loadable({ getPrinterList: () => Promise.reject(new Error('network')) })

    await el.connectedCallback()

    expect(el.loading).toBe(false)
    // Renderable: the list is an array, and the user gets a closeable state.
    expect(el.printers).toEqual([])
    expect(el.noPrinters).toBe(true)
  })

  it('opens without calling files unsupported when the extension list fails', async () => {
    const el = loadable({ getConfig: () => Promise.reject(new Error('network')) })
    el.files = [new File(['x'], 'a.pdf')]

    await el.connectedCallback()

    expect(el.loading).toBe(false)
    // Without the list every file compares as unsupported, so validation is
    // skipped rather than telling the user their document cannot be printed.
    expect(el.notSupported).toBe(false)
  })

  it('keeps the saved printer when the list fails, so its settings stay reachable', async () => {
    // A failed list is not evidence the printer is gone. Clearing it would also
    // orphan a pre-upgrade settings blob, which is only found via that printer.
    storage.setPrinter(printer('saved'))
    storage.setPrinterSettings('saved', { color: true })
    const el = loadable({ getPrinterList: () => Promise.reject(new Error('network')) })

    await el.connectedCallback()

    expect(el.loading).toBe(false)
    expect(storage.getPrinter()!.id).toBe('saved')
    expect(storage.getPrinterSettings('saved')).toEqual({ color: true })
    expect(el.selectedPrinter.id).toBe('')
  })

  it('treats an error body in place of the printer list as a failure', async () => {
    // The API answers a failed request with {code, message}, which is truthy
    // and survives `?? []`, then breaks on `.some`.
    storage.setPrinter(printer('saved'))
    const el = loadable({
      getPrinterList: () => Promise.resolve({ code: 401, message: 'Unauthorized' }),
    })

    await el.connectedCallback()

    expect(el.loading).toBe(false)
    expect(el.printers).toEqual([])
    expect(el.noPrinters).toBe(true)
    expect(storage.getPrinter()!.id).toBe('saved')
  })

  it('drops a hand-picked printer whose properties fail, so Print cannot fire', async () => {
    const el = loadable()
    await el.connectedCallback()
    // Start from a printer that loaded fine.
    expect(el.selectedPrinter.id).toBe('only')

    jest
      .spyOn(EzpPrintService.prototype, 'getPrinterProperties')
      .mockRejectedValue(new Error('network'))
    el.printers = [printer('only'), printer('other')]
    await el.setSelectedProperties({
      type: 'printer',
      id: 'other',
      title: 'Printer other',
      is_queue: false,
    })

    // Leaving it selected would print with the previous printer's capabilities
    // and then save them under this printer's id.
    expect(el.selectedPrinter.id).toBe('')
    expect(el.printDisabled).toBe(true)
  })

  it("keeps Print disabled until the picked printer's capabilities arrive", async () => {
    const el = loadable()
    await el.connectedCallback()
    el.printers = [printer('only'), printer('other')]

    let release: (value: any) => void
    jest
      .spyOn(EzpPrintService.prototype, 'getPrinterProperties')
      .mockReturnValue(new Promise((resolve) => (release = resolve)) as any)

    const picking = el.setSelectedProperties({
      type: 'printer',
      id: 'other',
      title: 'Printer other',
      is_queue: false,
    })

    // The selection is set, but the properties still hold blank defaults —
    // printing now would send them and save them as this printer's settings.
    expect(el.selectedPrinter.id).toBe('other')
    expect(el.printDisabled).toBe(true)

    release!([{ ColorSupported: true }])
    await picking

    expect(el.printDisabled).toBe(false)
  })

  it('replaces the config when switching printers rather than merging it', async () => {
    const el = loadable()
    await el.connectedCallback()
    el.selectedPrinterConfig = {
      ColorSupported: true,
      Trays: [{ Default: true, Index: 1, Name: 'Tray 1' }],
    }
    el.printers = [printer('only'), printer('other')]

    jest
      .spyOn(EzpPrintService.prototype, 'getPrinterProperties')
      .mockResolvedValue([{ ColorSupported: false }] as any)
    await el.setSelectedProperties({
      type: 'printer',
      id: 'other',
      title: 'Printer other',
      is_queue: false,
    })

    expect(el.selectedPrinter.id).toBe('other')
    // The previous printer's trays must not survive the switch.
    expect(el.selectedPrinterConfig.Trays).toBeUndefined()
    expect(el.selectedPrinterConfig.ColorSupported).toBe(false)
  })

  it('keeps the auto-selected printer when its properties load', async () => {
    const el = loadable()

    await el.connectedCallback()

    expect(el.loading).toBe(false)
    expect(el.selectedPrinter.id).toBe('only')
    expect(el.selectedPrinterConfig.ColorSupported).toBe(true)
  })
})
