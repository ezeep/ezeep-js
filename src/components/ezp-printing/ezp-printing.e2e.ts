import { E2EPage } from '@stencil/core/testing'
import {
  AUTH_HOST,
  CLIENT_ID,
  PRINTERS,
  PRINT_HOST,
  REDIRECT_URI,
  SEEDED_REFRESH_TOKEN,
  chooseFiles,
  click,
  formBody,
  getCalls,
  getPopup,
  getStorage,
  goToPrintOptions,
  openPrinting,
  removeFiles,
  textOf,
  waitForCall,
  waitForInstance,
  waitForPrintOptions,
} from '../../testing/mock-backend'

/**
 * End-to-end (real headless browser, faked network): `<ezp-printing>` as a
 * host application sees it — its triggers, attributes, public methods, events
 * and session handling. The steps inside the flow have their own e2e files
 * (ezp-upload, ezp-auth, ezp-printer-selection).
 */

const AUTH = 'ezp-printing >>> ezp-auth'
const UPLOAD = 'ezp-printing >>> ezp-upload'
const OPTIONS = 'ezp-printing >>> ezp-printer-selection'
const NO_DOCUMENT = 'ezp-printing >>> ezp-dialog'

const hostClasses = (page: E2EPage) =>
  page.$eval('ezp-printing', (el) => Array.from(el.classList).filter((name) => name !== 'hydrated'))

/** Call a public method of the component from the host page. */
const call = <T = unknown>(page: E2EPage, method: string, ...args: unknown[]): Promise<T> =>
  page.$eval(
    'ezp-printing',
    (el: any, name, params) => el[name as string](...(params as unknown[])),
    method,
    args,
  ) as Promise<T>

describe('ezp-printing (e2e)', () => {
  afterAll(removeFiles)

  describe('triggers', () => {
    it('button: renders a print button that opens sign-in', async () => {
      const page = await openPrinting({ attrs: { trigger: 'button' } })

      expect(await page.find(UPLOAD)).toBeNull()
      await click(page, 'ezp-printing >>> #print-trigger')

      expect(await page.find(AUTH)).not.toBeNull()
      expect(await textOf(page, `${AUTH} >>> ezp-dialog >>> #text`)).toContain(
        'Print with ezeep Blue',
      )
    })

    it('file: renders the upload card', async () => {
      const page = await openPrinting({ attrs: { trigger: 'file' } })

      expect(await page.find(UPLOAD)).not.toBeNull()
      expect(await page.find('ezp-printing >>> #print-trigger')).toBeNull()
    })

    it('custom: renders the host’s own content and opens through open()', async () => {
      const page = await openPrinting({
        attrs: { trigger: 'custom' },
        slot: '<button id="host-button">Print this page</button>',
      })

      // Slotted content stays in the light DOM, owned by the host page.
      expect(await page.find('ezp-printing > #host-button')).not.toBeNull()
      expect(await page.find(UPLOAD)).toBeNull()
      expect(await page.find(AUTH)).toBeNull()

      await call(page, 'open')
      await page.waitForChanges()

      expect(await page.find(AUTH)).not.toBeNull()
    })

    it('renders nothing of its own without a trigger', async () => {
      const page = await openPrinting({ attrs: { trigger: false } })

      const children = await page.$eval('ezp-printing', (el) => el.shadowRoot!.children.length)
      expect(children).toBe(0)
    })
  })

  describe('nothing to print', () => {
    it('tells a signed-in user to select a file first', async () => {
      const page = await openPrinting({
        signedIn: true,
        attrs: { trigger: 'button', hidelogin: true },
      })
      await click(page, 'ezp-printing >>> #print-trigger')

      await waitForInstance(page, 'ezp-dialog', 'no-document-selected')
      expect(await textOf(page, `${NO_DOCUMENT} >>> #text`)).toBe(
        'No file selected Select a file first to print.',
      )
      expect(await page.find(OPTIONS)).toBeNull()

      // "OK" dismisses it.
      await click(page, `${NO_DOCUMENT} >>> #footer ezp-text-button`)
      expect(await page.find(NO_DOCUMENT)).toBeNull()
    })

    it('the dialog’s close button dismisses it too', async () => {
      const page = await openPrinting({
        signedIn: true,
        attrs: { trigger: 'button', hidelogin: true },
      })
      await click(page, 'ezp-printing >>> #print-trigger')
      await waitForInstance(page, 'ezp-dialog', 'no-document-selected')

      await click(page, `${NO_DOCUMENT} >>> #header ezp-icon-button`)

      expect(await page.find(NO_DOCUMENT)).toBeNull()
    })
  })

  describe('document handed in by the host', () => {
    it('prints `filedata` set from script under the given file name', async () => {
      const page = await openPrinting({
        signedIn: true,
        printers: [PRINTERS[0]],
        attrs: { trigger: 'custom' },
      })

      await page.$eval('ezp-printing', (el: any) => {
        el.filename = 'generated.txt'
        el.filedata = 'hello printer'
      })
      await page.waitForChanges()
      await call(page, 'open')
      await click(page, `${AUTH} >>> ezp-dialog >>> #footer ezp-text-button`)
      await waitForPrintOptions(page)

      await click(page, `${OPTIONS} >>> #print`)
      await waitForInstance(page, 'ezp-status', 'print-success')

      const [upload] = await getCalls(page, 'BlobUpload')
      expect(upload.body).toBe(`[binary ${'hello printer'.length}]`)
      const [print] = await getCalls(page, 'Print')
      expect(JSON.parse(print.body!)).toMatchObject({ alias: 'generated.txt', type: 'txt' })
    })
  })

  describe('language', () => {
    it('renders in the language given by the host', async () => {
      const page = await openPrinting({ attrs: { language: 'de' } })

      expect(await textOf(page, `${UPLOAD} >>> #choose`)).toBe('Dateien auswählen')
    })

    it('re-renders what is on screen when the language changes', async () => {
      const page = await openPrinting({ attrs: { language: 'en' } })
      expect(await textOf(page, `${UPLOAD} >>> #choose`)).toBe('Choose files')

      await page.$eval('ezp-printing', (el) => el.setAttribute('language', 'de'))
      await page.waitForChanges()

      expect(await textOf(page, `${UPLOAD} >>> #choose`)).toBe('Dateien auswählen')
    })

    it('adopts the signed-in user’s account language when the host sets none', async () => {
      const page = await openPrinting({
        signedIn: true,
        user: { display_name: 'Erika Mustermann', preferred_language: 'de' },
        attrs: { language: false },
      })

      await waitForCall(page, 'UserInfo')
      await page.waitForChanges()

      expect(await textOf(page, `${UPLOAD} >>> #choose`)).toBe('Dateien auswählen')
    })

    it('an explicit language wins over the account language', async () => {
      const page = await openPrinting({
        signedIn: true,
        user: { display_name: 'Erika Mustermann', preferred_language: 'de' },
        attrs: { language: 'en' },
      })
      await goToPrintOptions(page)

      expect(await textOf(page, `${OPTIONS} >>> #cancel`)).toBe('Cancel')
    })

    it('falls back to English for a language it has no translations for', async () => {
      const page = await openPrinting({ attrs: { language: 'fr' } })

      expect(await textOf(page, `${UPLOAD} >>> #choose`)).toBe('Choose files')
    })
  })

  describe('theming', () => {
    it('applies the theme and a fixed appearance as host classes', async () => {
      const page = await openPrinting({ attrs: { theme: 'violet', appearance: 'dark' } })

      expect(await hostClasses(page)).toEqual(['violet', 'dark'])
    })

    it('defaults to the cyan theme', async () => {
      const page = await openPrinting({ attrs: { appearance: 'light' } })

      expect(await hostClasses(page)).toEqual(['cyan', 'light'])
    })

    it('follows the system colour scheme, live, when appearance is "system"', async () => {
      const page = await openPrinting({ attrs: { appearance: 'system' } })

      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }])
      await page.waitForChanges()
      expect(await hostClasses(page)).toContain('light')

      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }])
      await page.waitForChanges()
      expect(await hostClasses(page)).toContain('dark')
      expect(await hostClasses(page)).not.toContain('light')
    })

    it('marks seamless embedding on the host and the print options', async () => {
      const page = await openPrinting({ signedIn: true, attrs: { seamless: true } })
      expect(await hostClasses(page)).toContain('seamless')

      await goToPrintOptions(page)

      const classes = await page.$eval(OPTIONS, (el) => el.classList.contains('seamless'))
      expect(classes).toBe(true)
    })
  })

  describe('API hosts', () => {
    it('accepts host names given as full URLs', async () => {
      const page = await openPrinting({
        signedIn: true,
        attrs: {
          authapihosturl: `https://${AUTH_HOST}`,
          printapihosturl: `https://${PRINT_HOST}/`,
        },
      })

      const [refresh] = await getCalls(page, 'AccessToken')
      expect(refresh.url).toBe(`https://${AUTH_HOST}/oauth/access_token/`)
      const [config] = await getCalls(page, 'GetConfiguration')
      expect(config.url).toBe(`https://${PRINT_HOST}/sfapi/GetConfiguration/`)
    })
  })

  describe('session', () => {
    it('restores a persisted session with the refresh token on load', async () => {
      const page = await openPrinting({ signedIn: true })

      const [refresh] = await getCalls(page, 'AccessToken')
      expect(formBody(refresh)).toEqual({
        grant_type: 'refresh_token',
        scope: 'printing',
        refresh_token: SEEDED_REFRESH_TOKEN,
      })
      // Refresh tokens rotate: the new one replaces the old in storage.
      expect(await getStorage(page, 'refreshToken')).toBe('refresh-token-1')
      expect(await call<boolean>(page, 'checkAuth')).toBe(true)
    })

    it('stays signed in across a page reload', async () => {
      const page = await openPrinting({ signedIn: true })

      // `E2EPage` is a puppeteer page, but its type leaves `reload` out.
      await (page as any).reload()
      await waitForCall(page, 'GetConfiguration')

      // The reload spent the rotated token, not the original one.
      const [refresh] = await getCalls(page, 'AccessToken')
      expect(formBody(refresh).refresh_token).toBe('refresh-token-1')
      expect(await call<boolean>(page, 'checkAuth')).toBe(true)
    })

    it('reports signed out when there is no session', async () => {
      const page = await openPrinting()

      expect(await call<boolean>(page, 'checkAuth')).toBe(false)
      expect(await getStorage(page, 'isAuthorized')).toBe('false')
      // No token to refresh with: the token endpoint is left alone.
      expect((await getCalls(page, 'AccessToken')).length).toBe(0)
    })

    it('reports signed out when the persisted refresh token is no longer valid', async () => {
      const page = await openPrinting({
        storage: { refreshToken: 'revoked-elsewhere', isAuthorized: 'true' },
      })

      expect(await call<boolean>(page, 'checkAuth')).toBe(false)
      expect(await getStorage(page, 'isAuthorized')).toBe('false')
    })

    it('logOut() revokes the refresh token and clears the session', async () => {
      const page = await openPrinting({ signedIn: true })

      await call(page, 'logOut')
      await waitForCall(page, 'Revoke')

      const [revoke] = await getCalls(page, 'Revoke')
      expect(revoke.method).toBe('POST')
      expect(formBody(revoke)).toEqual({ token: 'refresh-token-1' })
      expect(await getStorage(page, 'refreshToken')).toBeNull()
      expect(await getStorage(page, 'isAuthorized')).toBeNull()
    })
  })

  describe('public methods', () => {
    it('getAuthUri() builds an authorize URL for a host-managed sign-in', async () => {
      const page = await openPrinting({ attrs: { trigger: 'custom' } })

      const uri = new URL(await call<string>(page, 'getAuthUri'))

      expect(uri.origin + uri.pathname).toBe(`https://${AUTH_HOST}/oauth/authorize/`)
      expect(uri.searchParams.get('client_id')).toBe(CLIENT_ID)
      expect(uri.searchParams.get('redirect_uri')).toBe(REDIRECT_URI)
      expect(uri.searchParams.get('response_type')).toBe('code')
      expect(uri.searchParams.get('code_challenge_method')).toBe('S256')
      expect(uri.searchParams.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/)
      // Building the URL does not open anything.
      expect((await getPopup(page)).opens).toBe(0)
    })

    it('setAuthRefreshToken() signs the user in with a token obtained by the host', async () => {
      const page = await openPrinting({ attrs: { trigger: 'custom' } })
      expect(await call<boolean>(page, 'checkAuth')).toBe(false)

      // A token the backend knows, as if the host had run the OAuth flow itself.
      await page.evaluate((token) => {
        ;(window as any).__ezpMock.refreshTokens.push(token)
      }, 'host-refresh-token')
      await call(page, 'setAuthRefreshToken', 'host-refresh-token')

      expect(await call<boolean>(page, 'checkAuth')).toBe(true)
      const [refresh] = await getCalls(page, 'AccessToken')
      expect(formBody(refresh).refresh_token).toBe('host-refresh-token')
      expect(await getStorage(page, 'refreshToken')).toBe('refresh-token-1')
    })

    it('getSasUri() returns an upload URL for a signed-in user without showing UI', async () => {
      const page = await openPrinting({ signedIn: true, attrs: { trigger: 'custom' } })

      const sasUri = await call<string>(page, 'getSasUri')
      await page.waitForChanges()

      expect(sasUri).toBe('https://blob.e2e.test/uploads/file-1?sig=e2e')
      const [prepare] = await getCalls(page, 'PrepareUpload')
      expect(prepare.headers.authorization).toBe('Bearer access-token-1')
      expect(await page.find(AUTH)).toBeNull()
      expect(await page.find(OPTIONS)).toBeNull()
    })

    it('getSasUri() asks the user to sign in when the request cannot be made', async () => {
      const page = await openPrinting({
        attrs: { trigger: 'custom' },
        failing: ['PrepareUpload'],
      })

      const sasUri = await call<string | undefined>(page, 'getSasUri')
      await page.waitForChanges()

      expect(sasUri).toBeUndefined()
      expect(await page.find(AUTH)).not.toBeNull()
    })
  })

  describe('as the OAuth redirect page', () => {
    it('hands the code to the window that opened it and closes itself', async () => {
      const page = await openPrinting({ search: '?code=abc123', opener: true })

      const opener = await page.evaluate(() => (window as any).__ezpOpener)
      // Addressed to the redirect URI's origin only, never broadcast with "*".
      expect(opener.messages).toEqual([{ data: 'abc123', target: REDIRECT_URI }])
      expect(opener.closed).toBe(true)
    })

    it('does nothing when the URL carries no code', async () => {
      const page = await openPrinting({ opener: true })

      const opener = await page.evaluate(() => (window as any).__ezpOpener)
      expect(opener.messages).toEqual([])
      expect(opener.closed).toBe(false)
    })

    it('does nothing with a code when it was not opened by another window', async () => {
      const page = await openPrinting({ search: '?code=abc123' })

      // Still a normal page: the upload card is there and nothing was exchanged.
      expect(await page.find(UPLOAD)).not.toBeNull()
      expect((await getCalls(page, 'AccessToken')).length).toBe(0)
    })
  })

  describe('printFinished', () => {
    it('fires once a print job was submitted and the result dismissed', async () => {
      const page = await openPrinting({ signedIn: true, printers: [PRINTERS[0]] })
      const finished = await page.spyOnEvent('printFinished')
      await goToPrintOptions(page)

      await click(page, `${OPTIONS} >>> #print`)
      await waitForInstance(page, 'ezp-status', 'print-success')
      expect(finished).toHaveReceivedEventTimes(0)

      await click(page, `${OPTIONS} >>> ezp-status >>> ezp-text-button`)
      expect(finished).toHaveReceivedEventTimes(1)
    })

    it('reaches listeners on the document (bubbles out of the shadow DOM)', async () => {
      const page = await openPrinting()
      await page.evaluate(() => {
        document.addEventListener('printFinished', () => ((window as any).__finished = true))
      })
      await chooseFiles(page, 'report.pdf')

      await click(page, `${UPLOAD} >>> #clear`)

      expect(await page.evaluate(() => (window as any).__finished)).toBe(true)
    })
  })
})
