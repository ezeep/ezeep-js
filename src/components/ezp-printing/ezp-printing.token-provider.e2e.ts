import { E2EPage } from '@stencil/core/testing'
import {
  PRINTERS,
  PRINT_HOST,
  chooseFiles,
  click,
  getCalls,
  getPopup,
  getStorage,
  openPrinting,
  postAuthCode,
  providerCalls,
  releaseProvider,
  removeFiles,
  setProvider,
  waitFor,
  waitForCall,
  waitForInstance,
  waitForPrintOptions,
  waitForProviderCall,
} from '../../testing/mock-backend'

/**
 * End-to-end (real headless browser, faked network): `<ezp-printing>` given a
 * `tokenProvider` by a host page that already has an access token for its
 * signed-in user. The widget then uses that token instead of its own sign-in.
 */

const AUTH = 'ezp-printing >>> ezp-auth'
const UPLOAD = 'ezp-printing >>> ezp-upload'
const OPTIONS = 'ezp-printing >>> ezp-printer-selection'
const DIALOG_ACTION = `${AUTH} >>> ezp-dialog >>> #footer ezp-text-button`

const HOST_TOKEN = 'host-token-1'
const byUrl = {
  fileurl: 'https://files.e2e.test/doc.pdf',
  filetype: 'pdf',
  filename: 'doc.pdf',
}

/** Call a public method of the component from the host page. */
const call = <T = unknown>(page: E2EPage, method: string, ...args: unknown[]): Promise<T> =>
  page.$eval(
    'ezp-printing',
    (el: any, name, params) => el[name as string](...(params as unknown[])),
    method,
    args,
  ) as Promise<T>

/** Pick a file on the upload card and press "Continue". */
async function continueWith(page: E2EPage, name = 'report.pdf'): Promise<void> {
  await chooseFiles(page, name)
  await click(page, `${UPLOAD} >>> #continue`)
}

/**
 * Note, on every frame from now on, what the sign-in step shows: `status`, or
 * `dialog:<instance>`. Catches a screen that was up for a single frame.
 */
async function watchSignInStep(page: E2EPage): Promise<void> {
  await page.evaluate(() => {
    const seen = new Set<string>()
    ;(window as any).__ezpSignInScreens = seen
    const look = () => {
      const auth = document.querySelector('ezp-printing')?.shadowRoot?.querySelector('ezp-auth')
      const root = auth?.shadowRoot
      if (root) {
        root.querySelectorAll('ezp-dialog').forEach((el: any) => seen.add(`dialog:${el.instance}`))
        if (root.querySelector('ezp-status')) seen.add('status')
      }
      requestAnimationFrame(look)
    }
    look()
  })
}

const signInScreens = (page: E2EPage): Promise<string[]> =>
  page.evaluate(() => Array.from((window as any).__ezpSignInScreens as Set<string>))

/** Status of a `fetch` the host page makes itself. */
const hostFetch = (page: E2EPage, url: string): Promise<number> =>
  page.evaluate((target: string) => fetch(target).then((response) => response.status), url)

describe('ezp-printing with a host token provider (e2e)', () => {
  afterAll(removeFiles)

  it('prints with the host’s token: no popup, no token endpoint, nothing stored', async () => {
    const page = await openPrinting({
      hostTokens: [HOST_TOKEN],
      tokenProvider: { answer: HOST_TOKEN },
      printers: [PRINTERS[0]],
      attrs: { hidelogin: true },
    })

    await continueWith(page)
    await waitForPrintOptions(page)
    await click(page, `${OPTIONS} >>> #print`)
    await waitForInstance(page, 'ezp-status', 'print-success')

    expect((await getPopup(page)).opens).toBe(0)
    expect(await getCalls(page, 'AccessToken')).toEqual([])
    for (const key of ['refreshToken', 'isAuthorized', 'access_token']) {
      expect(await getStorage(page, key)).toBeNull()
    }
    for (const route of ['GetPrinter', 'PrepareUpload', 'Print', 'Status']) {
      const calls = await getCalls(page, route)
      expect(calls.length).toBeGreaterThan(0)
      calls.forEach((made) => expect(made.headers.authorization).toBe(`Bearer ${HOST_TOKEN}`))
    }
  })

  it('waits for a provider that is still answering when "Continue" is pressed', async () => {
    // Nobody was signed in on the host when the page loaded.
    const page = await openPrinting({
      hostTokens: [HOST_TOKEN],
      tokenProvider: { answer: null },
      attrs: { hidelogin: true },
    })
    await setProvider(page, { answer: HOST_TOKEN, hold: true })
    const asked = await providerCalls(page)
    await watchSignInStep(page)

    await continueWith(page)
    await waitForProviderCall(page, asked + 1)
    await waitFor(page, `${AUTH} >>> ezp-status`)

    // Undecided: no popup, which hidelogin would otherwise open straight away.
    expect((await getPopup(page)).opens).toBe(0)
    expect(await page.find(OPTIONS)).toBeNull()

    await setProvider(page, { hold: false })
    await releaseProvider(page)
    await waitForPrintOptions(page)

    expect((await getPopup(page)).opens).toBe(0)
    expect(await signInScreens(page)).toEqual(['status'])
    const [printers] = await getCalls(page, 'GetPrinter')
    expect(printers.headers.authorization).toBe(`Bearer ${HOST_TOKEN}`)
  })

  it('shows only the processing status until the provider answers, without hidelogin', async () => {
    const page = await openPrinting({
      hostTokens: [HOST_TOKEN],
      tokenProvider: { answer: null },
      printers: [PRINTERS[0]],
    })
    await setProvider(page, { answer: HOST_TOKEN, hold: true })
    const asked = await providerCalls(page)
    await watchSignInStep(page)

    await continueWith(page)
    await waitForProviderCall(page, asked + 1)
    await waitFor(page, `${AUTH} >>> ezp-status`)

    // Undecided: the sign-in dialog would ask a user who may well be signed in.
    expect(await page.find(`${AUTH} >>> ezp-dialog`)).toBeNull()
    expect(await signInScreens(page)).toEqual(['status'])

    await setProvider(page, { hold: false })
    await releaseProvider(page)
    // Signed in now. Without hidelogin the dialog asks to continue, as for any
    // signed-in user, and its button goes straight on.
    await waitForInstance(page, 'ezp-dialog', 'login')
    expect(await signInScreens(page)).toEqual(['status', 'dialog:login'])
    await click(page, DIALOG_ACTION)
    await waitForPrintOptions(page)
    expect((await getPopup(page)).opens).toBe(0)
  })

  it('waits for a provider the host replaced while it was being asked', async () => {
    const page = await openPrinting({
      hostTokens: [HOST_TOKEN],
      tokenProvider: { answer: null },
      printers: [PRINTERS[0]],
      attrs: { hidelogin: true },
    })
    await setProvider(page, { answer: HOST_TOKEN, hold: true })
    const asked = await providerCalls(page)
    await continueWith(page)
    await waitForProviderCall(page, asked + 1)

    // The host assigns a new function, say after an organization switch or on
    // a re-render, and it answers after the one it replaced.
    await page.$eval(
      'ezp-printing',
      (el: any, token) =>
        (el.tokenProvider = () => new Promise((resolve) => setTimeout(() => resolve(token), 1500))),
      HOST_TOKEN,
    )
    await releaseProvider(page)

    // Whichever comes first: the pop-up, or the print options.
    await page.waitForFunction(
      () =>
        (window as any).__ezpMock.popupOpens > 0 ||
        !!document.querySelector('ezp-printing')!.shadowRoot!.querySelector('ezp-printer-selection'),
    )
    expect((await getPopup(page)).opens).toBe(0)
    await waitForPrintOptions(page)
    const [printers] = await getCalls(page, 'GetPrinter')
    expect(printers.headers.authorization).toBe(`Bearer ${HOST_TOKEN}`)
  })

  it.each([
    ['answers null', null],
    ['rejects', 'reject' as const],
  ])('signs in as usual when the provider %s and nothing is stored', async (_, answer) => {
    const page = await openPrinting({ tokenProvider: { answer }, printers: [PRINTERS[0]] })

    expect(await call<boolean>(page, 'checkAuth')).toBe(false)
    await continueWith(page)
    await waitForInstance(page, 'ezp-dialog', 'login')
    expect((await getPopup(page)).opens).toBe(0)
    expect(await getCalls(page, 'AccessToken')).toEqual([])

    await click(page, DIALOG_ACTION)
    expect((await getPopup(page)).opens).toBe(1)

    // The widget's own session carries the flow from here.
    await postAuthCode(page)
    await waitForPrintOptions(page)
    const [printers] = await getCalls(page, 'GetPrinter')
    expect(printers.headers.authorization).toMatch(/^Bearer access-token-\d+$/)
  })

  it('uses the token the provider gives when the next flow starts', async () => {
    const page = await openPrinting({
      hostTokens: ['host-token-a', 'host-token-b'],
      tokenProvider: { answer: 'host-token-a' },
      attrs: { hidelogin: true },
    })
    await continueWith(page)
    await waitForPrintOptions(page)
    await click(page, `${OPTIONS} >>> #cancel`)

    // Say the host's user switched organization in between.
    await setProvider(page, { answer: 'host-token-b' })
    await click(page, `${UPLOAD} >>> #continue`)
    await waitForCall(page, 'GetPrinter', 2)
    await waitForPrintOptions(page)

    const printers = await getCalls(page, 'GetPrinter')
    expect(printers.map((made) => made.headers.authorization)).toEqual([
      'Bearer host-token-a',
      'Bearer host-token-b',
    ])
  })

  it('asks the provider again after a 401 from the print API, not from other hosts', async () => {
    const page = await openPrinting({
      hostTokens: [HOST_TOKEN],
      tokenProvider: { answer: HOST_TOKEN },
      attrs: { hidelogin: true },
    })
    // The 401 handling is in place while the print options are open.
    await continueWith(page)
    await waitForPrintOptions(page)
    const asked = await providerCalls(page)

    expect(await hostFetch(page, 'https://elsewhere.e2e.test/api/me')).toBe(401)
    expect(await providerCalls(page)).toBe(asked)

    expect(await hostFetch(page, `https://${PRINT_HOST}/sfapi/GetPrinter/`)).toBe(401)
    await waitForProviderCall(page, asked + 1)
  })

  it('trigger="custom" with hidelogin goes straight to the print options', async () => {
    const page = await openPrinting({
      hostTokens: [HOST_TOKEN],
      tokenProvider: { answer: HOST_TOKEN },
      attrs: { trigger: 'custom', hidelogin: true, ...byUrl },
    })
    await watchSignInStep(page)

    await call(page, 'open')
    await waitForPrintOptions(page)

    expect(await signInScreens(page)).not.toContain('dialog:login')
    expect(await page.find(AUTH)).toBeNull()
    expect((await getPopup(page)).opens).toBe(0)
  })

  it('takes a provider set after the widget has loaded', async () => {
    const page = await openPrinting({ hostTokens: [HOST_TOKEN], attrs: { trigger: 'custom' } })
    expect(await call<boolean>(page, 'checkAuth')).toBe(false)

    await page.$eval(
      'ezp-printing',
      (el: any, token) => (el.tokenProvider = () => Promise.resolve(token)),
      HOST_TOKEN,
    )

    expect(await call<boolean>(page, 'checkAuth')).toBe(true)
    expect(await getStorage(page, 'isAuthorized')).toBe('false')
  })

  it('goes back to its own sign-in when the provider is taken away', async () => {
    const page = await openPrinting({
      hostTokens: [HOST_TOKEN],
      tokenProvider: { answer: HOST_TOKEN },
    })
    expect(await call<boolean>(page, 'checkAuth')).toBe(true)

    await page.$eval('ezp-printing', (el: any) => (el.tokenProvider = undefined))
    const asked = await providerCalls(page)

    // The host's token is gone from memory with it.
    expect(await call<boolean>(page, 'checkAuth')).toBe(false)
    await continueWith(page)
    await waitForInstance(page, 'ezp-dialog', 'login')
    expect(await providerCalls(page)).toBe(asked)
  })

  it('logOut() revokes nothing, and the next flow asks the provider again', async () => {
    const page = await openPrinting({
      hostTokens: [HOST_TOKEN],
      tokenProvider: { answer: HOST_TOKEN },
      attrs: { hidelogin: true },
    })

    await call(page, 'logOut')
    expect(await getCalls(page, 'Revoke')).toEqual([])

    await continueWith(page)
    await waitForPrintOptions(page)
  })
})

describe('ezp-printing sign-in, without a token provider (e2e)', () => {
  afterAll(removeFiles)

  it('trigger="custom" with hidelogin goes straight on for a stored session', async () => {
    const page = await openPrinting({
      signedIn: true,
      attrs: { trigger: 'custom', hidelogin: true, ...byUrl },
    })
    await watchSignInStep(page)

    await call(page, 'open')
    await waitForPrintOptions(page)

    expect(await signInScreens(page)).not.toContain('dialog:login')
    expect((await getPopup(page)).opens).toBe(0)
  })

  it('trigger="custom" with hidelogin still asks a signed-out user to sign in', async () => {
    const page = await openPrinting({ attrs: { trigger: 'custom', hidelogin: true, ...byUrl } })

    await call(page, 'open')
    await waitForInstance(page, 'ezp-dialog', 'login')

    // The popup needs the user's click on the dialog.
    expect((await getPopup(page)).opens).toBe(0)
  })

  it('logOut() signs out at once, without waiting for the access token to expire', async () => {
    const page = await openPrinting({ signedIn: true })
    expect(await call<boolean>(page, 'checkAuth')).toBe(true)

    await call(page, 'logOut')

    expect(await call<boolean>(page, 'checkAuth')).toBe(false)
  })
})
