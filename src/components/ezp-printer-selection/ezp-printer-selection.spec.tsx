import { EzpPrinterSelection } from './ezp-printer-selection'
import printStore from '../../services/print'
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

    el.restoreSavedPrinter()

    expect(el.selectedPrinter.id).toBe('p2')
  })

  it('resets the selection when the saved printer is gone from the list', () => {
    storage.setPrinter(printer('gone'))
    storage.setPrinterSettings('gone', { color: true })
    const el = new EzpPrinterSelection() as any
    el.printers = [printer('p1')]

    el.restoreSavedPrinter()

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
    el.printers = [printer('p1')]

    el.restoreSavedPrinter()

    expect(el.selectedPrinter.id).toBe('')
  })
})
