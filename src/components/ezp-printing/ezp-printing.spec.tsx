import { newSpecPage } from '@stencil/core/testing'
import i18next from 'i18next'
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
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 401,
    json: () => Promise.resolve({}),
  }) as unknown as typeof fetch
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
async function authSucceeds(el: any) {
  el.listenAuthCancel()
  // listenAuthSuccess is async (it syncs the account language before opening).
  await el.listenAuthSuccess()
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

    // Files are chosen in ezp-upload, which emits `uploadFile` to sync the
    // selection without leaving the upload step yet.
    el.listenUploadFile({ detail: [new File(['x'], 'report.pdf')] })
    await page.waitForChanges()
    expect(el.authOpen).toBe(false)
    expect(el.filename).toBe('report.pdf')

    // Confirming the selection (`uploadContinue`) advances to the auth dialog.
    el.listenUploadContinue({ detail: [new File(['x'], 'report.pdf')] })
    await page.waitForChanges()
    expect(el.authOpen).toBe(true)
    expect(html(page)).toContain('ezp-auth')

    // Auth succeeds with a document present -> printer selection opens.
    await authSucceeds(el)
    await page.waitForChanges()
    expect(el.printOpen).toBe(true)
    expect(el.authOpen).toBe(false)
    expect(html(page)).toContain('ezp-printer-selection')
  })

  it('shows the "no document" dialog when auth succeeds without a file', async () => {
    const { page, el } = await setup('trigger="button"')

    await authSucceeds(el) // filename is still ''
    await page.waitForChanges()
    expect(el.noDocumentOpen).toBe(true)
    expect(el.printOpen).toBe(false)
    expect(html(page)).toContain('ezp-dialog')
  })

  it('printCancel closes the flow and clears the selected files', async () => {
    const { page, el } = await setup('trigger="file"')
    el.listenUploadFile({ detail: [new File(['x'], 'report.pdf')] })
    await authSucceeds(el)
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

  it('userCancel discards the pending files and ends the flow for the host', async () => {
    const { page, el } = await setup('trigger="file"')
    el.listenUploadContinue({ detail: [new File(['x'], 'report.pdf')] })
    await page.waitForChanges()
    expect(el.authOpen).toBe(true)

    let finished = false
    page.root!.addEventListener('printFinished', (() => (finished = true)) as EventListener)

    el.listenUserCancel()
    await page.waitForChanges()
    expect(el.authOpen).toBe(false)
    expect(el.files).toEqual([])
    expect(el.filename).toBe('')
    expect(finished).toBe(true)
  })

  it('authCancel closes the auth dialog', async () => {
    const { page, el } = await setup('trigger="file"')
    el.listenUploadContinue({ detail: [new File(['x'], 'report.pdf')] })
    await page.waitForChanges()
    expect(el.authOpen).toBe(true)

    el.listenAuthCancel()
    await page.waitForChanges()
    expect(el.authOpen).toBe(false)
  })

  it('dismisses the no-document dialog on its close action', async () => {
    const { page, el } = await setup('trigger="button"')
    await authSucceeds(el)
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
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    }) as unknown as typeof fetch
    const { el } = await setup('trigger="button"')

    const authorized = await el.checkAuth()

    expect(authorized).toBe(true)
    expect(authStore.state.isAuthorized).toBe(true)
  })

  it('refreshes the in-memory access token from the refresh token on reload', async () => {
    const { el } = await setup('trigger="button"')
    // Simulate a fresh page load: no in-memory access token, but a persisted
    // refresh token. checkAuth should silently obtain a new access token.
    authStore.state.accessToken = ''
    authStore.state.refreshToken = 'stored-RT'
    authStore.state.authApiHostUrl = 'account.ezeep.com'

    const urls: string[] = []
    global.fetch = jest.fn().mockImplementation((url: string) => {
      urls.push(url)
      if (url.includes('/oauth/access_token/')) {
        return Promise.resolve({
          json: () => Promise.resolve({ access_token: 'new-AT', refresh_token: 'new-RT' }),
        })
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) })
    }) as unknown as typeof fetch

    await el.checkAuth()

    expect(urls.some((u) => u.includes('/oauth/access_token/'))).toBe(true)
    expect(authStore.state.accessToken).toBe('new-AT')
    // The refreshed access token is NOT written to localStorage.
    expect(localStorage.getItem('access_token')).toBeNull()
  })

  it('checkAuth reports unauthorized when GetConfiguration fails', async () => {
    const { el } = await setup('trigger="button"')
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({}),
    }) as unknown as typeof fetch

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

  it('getSasUri refreshes an empty access token before calling the API', async () => {
    const { el } = await setup('trigger="button"')
    // Simulate a reload: no in-memory access token, but a persisted refresh token.
    authStore.state.accessToken = ''
    authStore.state.refreshToken = 'RT'
    authStore.state.authApiHostUrl = 'account.ezeep.com'

    const urls: string[] = []
    global.fetch = jest.fn().mockImplementation((url: string) => {
      urls.push(url)
      if (url.includes('/oauth/access_token/')) {
        return Promise.resolve({
          json: () => Promise.resolve({ access_token: 'fresh-AT', refresh_token: 'RT2' }),
        })
      }
      // prepareFileUpload
      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve({ sasUri: 'https://blob/sas', fileid: 'f1' }),
      })
    }) as unknown as typeof fetch

    const uri = await el.getSasUri()

    // The token refresh must happen before the SAS request (no empty bearer).
    expect(urls[0]).toContain('/oauth/access_token/')
    expect(uri).toBe('https://blob/sas')
  })

  it('getSasUri swallows a transient refresh failure and still resolves', async () => {
    const { el } = await setup('trigger="button"')
    authStore.state.accessToken = ''
    authStore.state.refreshToken = 'RT'
    // Refresh and the subsequent prepare both fail (transient hiccup).
    global.fetch = jest.fn().mockRejectedValue(new Error('network')) as unknown as typeof fetch

    // Must not throw out of getSasUri; falls through to the auth dialog.
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
    global.fetch = jest
      .fn()
      .mockResolvedValue({ json: () => Promise.resolve({}) }) as unknown as typeof fetch

    await el.setAuthRefreshToken('injected-RT')

    expect(authStore.state.refreshToken).toBe('injected-RT')
    expect(localStorage.getItem('refreshToken')).toBe('injected-RT')
    expect(global.fetch).toHaveBeenCalled()
  })

  it('listenUserCancel closes auth and clears the selected files', async () => {
    const { page, el } = await setup('trigger="file"')
    el.listenUploadContinue({ detail: [new File(['x'], 'report.pdf')] })
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

  it('disconnectedCallback clears the refresh interval and colour-scheme listener', async () => {
    const clearSpy = jest.spyOn(global, 'clearInterval')
    const { el } = await setup('trigger="button"')
    el.refreshTokensPeriodically(1800)
    const intervalId = el.tokenRefreshInterval
    // Spy on the actual stored MediaQueryList (mock-doc provides matchMedia).
    const removeSpy = jest.spyOn(el.systemAppearanceQuery, 'removeEventListener')

    el.disconnectedCallback()

    expect(clearSpy).toHaveBeenCalledWith(intervalId)
    expect(removeSpy).toHaveBeenCalledWith('change', el.systemAppearanceListener)
    clearSpy.mockRestore()
    removeSpy.mockRestore()
  })
})

describe('ezp-printing language sync', () => {
  beforeEach(stubEnvironment)

  it('adopts the account preferred_language from /v1/users/me', async () => {
    const { el } = await setup('trigger="button"')
    authStore.state.accessToken = 'AT'
    authStore.state.authApiHostUrl = 'account.ezeep.com'
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/v1/users/me')) {
        return Promise.resolve({ json: () => Promise.resolve({ preferred_language: 'de' }) })
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) })
    }) as unknown as typeof fetch

    await el.syncPreferredLanguage()

    expect(i18next.language).toBe('de')
  })

  it('leaves an explicit language prop untouched (no user lookup)', async () => {
    const { el } = await setup('trigger="button" language="en"')
    authStore.state.accessToken = 'AT'
    const fetchSpy = jest.fn()
    global.fetch = fetchSpy as unknown as typeof fetch

    await el.syncPreferredLanguage()

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(i18next.language).toBe('en')
  })
})
