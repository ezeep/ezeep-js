import { newSpecPage } from '@stencil/core/testing'
import { EzpPrinting } from './ezp-printing'

/**
 * Integration test of the print-flow orchestration in <ezp-printing>: the
 * upload -> auth -> printer-selection -> finish dialog state machine, driven
 * through the same @Listen handlers the child components emit into. Network and
 * matchMedia are stubbed so this runs headless in CI. (A fully networked
 * browser journey needs a live ezeep backend and is out of scope for CI.)
 *
 * Rendering is asserted via `innerHTML.includes(tag)` rather than
 * `querySelector`, whose mock-doc implementation is unreliable for sibling
 * custom-element tags.
 */

function stubEnvironment() {
  // jsdom lacks matchMedia; componentWillLoad reads the colour scheme.
  ;(window as any).matchMedia = () => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })
  // checkAuth() calls GetConfiguration; resolve it as unauthenticated.
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: false, status: 401, json: () => Promise.resolve({}) }) as unknown as typeof fetch
}

async function setup(props: string) {
  const page = await newSpecPage({
    components: [EzpPrinting],
    html: `<ezp-printing clientid="c" redirecturi="https://app/cb" ${props}></ezp-printing>`,
  })
  return { page, el: page.rootInstance as any }
}

const html = (page: any): string => page.root!.shadowRoot!.innerHTML

// On a successful login ezp-auth emits BOTH authCancel (which closes the auth
// dialog) and authSuccess; replicate that pairing.
function authSucceeds(el: any) {
  el.listenAuthCancel()
  el.listenAuthSuccess()
}

describe('ezp-printing trigger rendering', () => {
  beforeEach(stubEnvironment)

  it('renders the file-upload trigger', async () => {
    const { page } = await setup('trigger="file"')
    expect(html(page)).toContain('ezp-upload')
  })

  it('renders the button trigger', async () => {
    const { page } = await setup('trigger="button"')
    expect(html(page)).toContain('print-trigger')
  })
})

describe('ezp-printing journey', () => {
  beforeEach(stubEnvironment)

  it('upload -> auth dialog -> printer selection', async () => {
    const { page, el } = await setup('trigger="file"')

    // A file is chosen in ezp-upload, which emits `uploadFile`.
    el.listenUploadFile({ detail: [new File(['x'], 'report.pdf')] })
    await page.waitForChanges()
    expect(el.authOpen).toBe(true)
    expect(el.filename).toBe('report.pdf')
    expect(html(page)).toContain('ezp-auth')

    // Auth succeeds with a document present -> printer selection opens.
    authSucceeds(el)
    await page.waitForChanges()
    expect(el.printOpen).toBe(true)
    expect(el.authOpen).toBe(false)
    expect(html(page)).toContain('ezp-printer-selection')
  })

  it('shows the "no document" dialog when auth succeeds without a file', async () => {
    const { page, el } = await setup('trigger="button"')

    authSucceeds(el) // filename is still ''
    await page.waitForChanges()
    expect(el.noDocumentOpen).toBe(true)
    expect(el.printOpen).toBe(false)
    expect(html(page)).toContain('ezp-dialog')
  })

  it('printCancel closes the flow and clears the selected files', async () => {
    const { page, el } = await setup('trigger="file"')
    el.listenUploadFile({ detail: [new File(['x'], 'report.pdf')] })
    authSucceeds(el)
    await page.waitForChanges()
    expect(el.printOpen).toBe(true)

    let finished = false
    page.root!.addEventListener('printFinished', (() => (finished = true)) as EventListener)

    el.listenPrintCancel()
    await page.waitForChanges()
    expect(el.printOpen).toBe(false)
    expect(el.files).toEqual([])
    expect(el.filename).toBe('')
    expect(finished).toBe(true)
  })

  it('authCancel closes the auth dialog', async () => {
    const { page, el } = await setup('trigger="file"')
    el.listenUploadFile({ detail: [new File(['x'], 'report.pdf')] })
    await page.waitForChanges()
    expect(el.authOpen).toBe(true)

    el.listenAuthCancel()
    await page.waitForChanges()
    expect(el.authOpen).toBe(false)
  })

  it('dismisses the no-document dialog on its close action', async () => {
    const { page, el } = await setup('trigger="button"')
    authSucceeds(el)
    await page.waitForChanges()
    expect(el.noDocumentOpen).toBe(true)

    el.listenDialogClose({ detail: 'no-document-selected' })
    await page.waitForChanges()
    expect(el.noDocumentOpen).toBe(false)
  })
})
