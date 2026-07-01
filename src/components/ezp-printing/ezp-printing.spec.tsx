import { newSpecPage } from '@stencil/core/testing'
import { EzpPrinting } from './ezp-printing'
import authStore from '../../services/auth'

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

describe('ezp-printing public methods', () => {
  beforeEach(stubEnvironment)

  it('getAuthUri builds a PKCE authorization URL', async () => {
    const { el } = await setup('trigger="button"')
    const uri = await el.getAuthUri()
    const url = new URL(uri)
    expect(url.pathname).toBe('/oauth/authorize/')
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    expect(url.searchParams.get('code_challenge')).toBeTruthy()
  })

  it('logOut revokes the token, clears the session and closes the flow', async () => {
    const { el } = await setup('trigger="button"')
    localStorage.setItem('access_token', 'AT')
    localStorage.setItem('refreshToken', 'RT')
    authStore.state.refreshToken = 'RT'
    el.printOpen = true

    await el.logOut()

    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(el.printOpen).toBe(false)
  })

  it('checkAuth marks the session authorized when GetConfiguration is OK', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({}) }) as unknown as typeof fetch
    const { el } = await setup('trigger="button"')

    const authorized = await el.checkAuth()

    expect(authorized).toBe(true)
    expect(authStore.state.isAuthorized).toBe(true)
  })

  it('checkAuth reports unauthorized when GetConfiguration fails', async () => {
    const { el } = await setup('trigger="button"')
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 401, json: () => Promise.resolve({}) }) as unknown as typeof fetch

    const authorized = await el.checkAuth()

    expect(authorized).toBe(false)
    expect(authStore.state.isAuthorized).toBe(false)
  })

  it('getSasUri returns the SAS URI when the upload is prepared', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ sasUri: 'https://blob/sas', fileid: 'f1' }),
    }) as unknown as typeof fetch
    const { el } = await setup('trigger="button"')

    const uri = await el.getSasUri()

    expect(uri).toBe('https://blob/sas')
    expect(el.onlyGetSasUri).toBe(true)
  })

  it('getSasUri opens the auth dialog and returns nothing when preparing fails', async () => {
    const { el } = await setup('trigger="button"')
    global.fetch = jest.fn().mockRejectedValue(new Error('network')) as unknown as typeof fetch

    const uri = await el.getSasUri()

    expect(uri).toBeUndefined()
    expect(el.authOpen).toBe(true)
  })

  it('watchFileData turns a raw data string into a File named after filename', async () => {
    const { el } = await setup('trigger="button"')
    el.filename = 'report.pdf'

    el.watchFileData('PDFDATA', '')

    expect(el.files).toHaveLength(1)
    expect(el.files[0].name).toBe('report.pdf')
  })

  it('setAuthRefreshToken stores the token and attempts a refresh', async () => {
    const { el } = await setup('trigger="button"')
    global.fetch = jest.fn().mockResolvedValue({ json: () => Promise.resolve({}) }) as unknown as typeof fetch

    await el.setAuthRefreshToken('injected-RT')

    expect(authStore.state.refreshToken).toBe('injected-RT')
    expect(localStorage.getItem('refreshToken')).toBe('injected-RT')
    expect(global.fetch).toHaveBeenCalled()
  })

  it('listenUserCancel closes auth and clears the selected files', async () => {
    const { page, el } = await setup('trigger="file"')
    el.listenUploadFile({ detail: [new File(['x'], 'report.pdf')] })
    await page.waitForChanges()
    expect(el.authOpen).toBe(true)

    el.listenUserCancel()
    await page.waitForChanges()
    expect(el.authOpen).toBe(false)
    expect(el.files).toEqual([])
    expect(el.filename).toBe('')
  })

  it('normalizes protocol-prefixed API host props down to the hostname', async () => {
    await setup('trigger="button" authapihosturl="https://auth.example.com"')
    expect(authStore.state.authApiHostUrl).toBe('auth.example.com')
  })
})
