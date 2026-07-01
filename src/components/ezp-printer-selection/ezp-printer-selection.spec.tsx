import { EzpPrinterSelection } from './ezp-printer-selection'
import printStore from '../../services/print'
import { initi18n } from '../../utils/utils'

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
