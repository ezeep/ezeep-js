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
  formBody,
  pause,
  postAuthCode,
  providerCalls,
  providerRequests,
  releaseProvider,
  removeFiles,
  setProvider,
  updateBackend,
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
const MENU = `${OPTIONS} >>> ezp-user-menu`
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

/**
 * Wait until the flow has settled on a step, and say which: the print
 * options, the login dialog, or the sign-in pop-up.
 */
async function settledOn(page: E2EPage): Promise<'print-options' | 'login-dialog' | 'pop-up'> {
  const handle = await page.waitForFunction(
    () => {
      const root = document.querySelector('ezp-printing')!.shadowRoot!
      if (root.querySelector('ezp-printer-selection')) return 'print-options'
      if ((window as any).__ezpMock.popupOpens > 0) return 'pop-up'
      const auth = root.querySelector('ezp-auth')?.shadowRoot
      const dialogs = auth ? Array.from(auth.querySelectorAll('ezp-dialog')) : []
      return dialogs.some((el: any) => el.instance === 'login') ? 'login-dialog' : false
    },
    { timeout: 30000 },
  )
  await page.waitForChanges()
  return (await handle.jsonValue()) as 'print-options' | 'login-dialog' | 'pop-up'
}

/** Wait until every request the page has made so far has been answered. */
const allAnswered = (page: E2EPage): Promise<unknown> =>
  page.waitForFunction(
    () => ((window as any).__ezpMock.calls as Array<{ done: boolean }>).every((c) => c.done),
    { timeout: 30000 },
  )

const REJECTED = 'rejected-host-token'
const FRESH = 'fresh-host-token'

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

  it('asks for a fresh click before the sign-in pop-up when the provider has no token, with hidelogin', async () => {
    const page = await openPrinting({
      tokenProvider: { answer: null },
      printers: [PRINTERS[0]],
      attrs: { hidelogin: true },
    })
    // The provider takes its time, say for a silent refresh, and then has no token.
    await setProvider(page, { hold: true })
    const asked = await providerCalls(page)
    await watchSignInStep(page)

    await continueWith(page)
    await waitForProviderCall(page, asked + 1)
    await waitFor(page, `${AUTH} >>> ezp-status`)
    await setProvider(page, { hold: false })
    await releaseProvider(page)

    // After that wait, the click that started the flow may no longer count
    // for a pop-up. The dialog's button is a fresh one.
    await waitForInstance(page, 'ezp-dialog', 'login')
    expect((await getPopup(page)).opens).toBe(0)
    expect(await signInScreens(page)).toEqual(['status', 'dialog:login'])

    await click(page, DIALOG_ACTION)
    expect((await getPopup(page)).opens).toBe(1)
    await postAuthCode(page)
    await waitForPrintOptions(page)
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

  it('keeps the token it was given when the provider fails for a moment', async () => {
    const page = await openPrinting({
      hostTokens: [HOST_TOKEN],
      tokenProvider: { answer: HOST_TOKEN },
      attrs: { hidelogin: true },
    })
    await continueWith(page)
    await waitForPrintOptions(page)
    await click(page, `${OPTIONS} >>> #cancel`)

    // The host's token source fails when the next flow asks. Only `null`
    // says nobody is signed in, so the token the widget holds carries on.
    await setProvider(page, { answer: 'reject' })
    const asked = await providerCalls(page)
    await click(page, `${UPLOAD} >>> #continue`)
    await waitForProviderCall(page, asked + 1)
    await waitForCall(page, 'GetPrinter', 2)
    await waitForPrintOptions(page)

    expect((await getPopup(page)).opens).toBe(0)
    const printers = await getCalls(page, 'GetPrinter')
    expect(printers.map((made) => made.headers.authorization)).toEqual([
      `Bearer ${HOST_TOKEN}`,
      `Bearer ${HOST_TOKEN}`,
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

  it('hides "Log out" in the user menu while it uses the host’s token', async () => {
    const page = await openPrinting({
      hostTokens: [HOST_TOKEN],
      tokenProvider: { answer: HOST_TOKEN },
      attrs: { hidelogin: true },
    })
    await continueWith(page)
    await waitForPrintOptions(page)

    // Logging out of the widget would last only until the next flow asks the
    // provider again.
    expect(await page.find(`${MENU} >>> #links`)).not.toBeNull()
    expect(await page.find(`${MENU} >>> a.link:not([href])`)).toBeNull()
    expect(await page.$$eval(`${MENU} >>> a.link[href]`, (links) => links.length)).toBe(2)
  })

  it('keeps "Log out" for a session of its own when the provider has no token', async () => {
    const page = await openPrinting({
      signedIn: true,
      tokenProvider: { answer: null },
      attrs: { hidelogin: true },
    })
    await continueWith(page)
    await waitForPrintOptions(page)

    expect(await page.find(`${MENU} >>> a.link:not([href])`)).not.toBeNull()
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

describe('ezp-printing with a provider token the API rejects (e2e)', () => {
  afterAll(removeFiles)

  it('lets the user sign in through the pop-up, and keeps that session afterwards', async () => {
    // Say the host's cached token was revoked by a sign-out elsewhere.
    const page = await openPrinting({
      tokenProvider: { answer: REJECTED },
      printers: [PRINTERS[0]],
      attrs: { hidelogin: true },
    })

    await continueWith(page)
    // The pop-up opens straight away, or from the login dialog's button when
    // the flow had to wait for its session check.
    const step = await settledOn(page)
    expect(['pop-up', 'login-dialog']).toContain(step)
    if (step === 'login-dialog') await click(page, DIALOG_ACTION)
    expect((await getPopup(page)).opens).toBe(1)
    await postAuthCode(page)
    await waitForPrintOptions(page)
    await waitForCall(page, 'GetPrinter')
    await allAnswered(page)

    // The re-check after signing in does not put the rejected token back.
    const printers = await getCalls(page, 'GetPrinter')
    printers.forEach((made) =>
      expect(made.headers.authorization).toMatch(/^Bearer access-token-\d+$/),
    )
    const before = (await getCalls(page, 'GetConfiguration')).length
    expect(await call<boolean>(page, 'checkAuth')).toBe(true)
    const configs = (await getCalls(page, 'GetConfiguration')).slice(before)
    configs.forEach((made) =>
      expect(made.headers.authorization).toMatch(/^Bearer access-token-\d+$/),
    )
    expect(await providerRequests(page)).toContainEqual({ rejected: REJECTED })
  })

  it('uses a stored session of its own instead, without the sign-in pop-up', async () => {
    const page = await openPrinting({
      signedIn: true,
      tokenProvider: { answer: REJECTED },
      printers: [PRINTERS[0]],
      attrs: { hidelogin: true },
    })
    await watchSignInStep(page)

    await continueWith(page)
    expect(await settledOn(page)).toBe('print-options')
    await waitForPrintOptions(page)
    await waitForCall(page, 'GetPrinter')

    expect((await getPopup(page)).opens).toBe(0)
    expect(await signInScreens(page)).toEqual(['status'])
    const grants = (await getCalls(page, 'AccessToken')).map(formBody)
    expect(grants.length).toBeGreaterThan(0)
    grants.forEach((grant) => expect(grant.grant_type).toBe('refresh_token'))
    const printers = await getCalls(page, 'GetPrinter')
    printers.forEach((made) =>
      expect(made.headers.authorization).toMatch(/^Bearer access-token-\d+$/),
    )
  })

  it('takes a fresh token from a provider that was told its token was rejected', async () => {
    const page = await openPrinting({
      hostTokens: [FRESH],
      tokenProvider: { answer: REJECTED, afterRejection: FRESH },
      printers: [PRINTERS[0]],
      attrs: { hidelogin: true },
    })

    await continueWith(page)
    expect(await settledOn(page)).toBe('print-options')
    await waitForPrintOptions(page)
    await waitForCall(page, 'GetPrinter')

    expect((await getPopup(page)).opens).toBe(0)
    expect(await getCalls(page, 'AccessToken')).toEqual([])
    const printers = await getCalls(page, 'GetPrinter')
    printers.forEach((made) => expect(made.headers.authorization).toBe(`Bearer ${FRESH}`))
    const requests = await providerRequests(page)
    // Asked plainly first; then told which token the API rejected.
    expect(requests[0]).toEqual({})
    expect(requests).toContainEqual({ rejected: REJECTED })
  })

  it('checkAuth() asks the provider once more after a 401, and sends the new token', async () => {
    const page = await openPrinting({ hostTokens: [FRESH], attrs: { trigger: 'custom' } })
    await page.$eval(
      'ezp-printing',
      (el: any, rejected, fresh) =>
        (el.tokenProvider = (request?: { rejected?: string }) =>
          Promise.resolve(request?.rejected === rejected ? fresh : rejected)),
      REJECTED,
      FRESH,
    )
    // The property's watcher runs a check of its own; start from a quiet page.
    await allAnswered(page)
    await pause(200)
    const before = (await getCalls(page, 'GetConfiguration')).length

    expect(await call<boolean>(page, 'checkAuth')).toBe(true)

    const configs = (await getCalls(page, 'GetConfiguration')).slice(before)
    expect(configs.map((made) => made.headers.authorization)).toEqual([
      `Bearer ${REJECTED}`,
      `Bearer ${FRESH}`,
    ])
  })

  it('checkAuth() asks once more at most, so a provider of rejected tokens cannot loop it', async () => {
    const page = await openPrinting({ attrs: { trigger: 'custom' } })
    await page.$eval('ezp-printing', (el: any) => {
      let n = 0
      el.tokenProvider = () => Promise.resolve(`never-valid-${++n}`)
    })
    await allAnswered(page)
    await pause(200)
    const before = (await getCalls(page, 'GetConfiguration')).length

    expect(await call<boolean>(page, 'checkAuth')).toBe(false)

    expect((await getCalls(page, 'GetConfiguration')).length - before).toBe(2)
  })
})

describe('ezp-printing with a provider withdrawn during the session check (e2e)', () => {
  afterAll(removeFiles)

  /** Start a flow whose session check is slow, and wait until it has called the print API. */
  async function continueSlowly(page: E2EPage): Promise<void> {
    await chooseFiles(page, 'report.pdf')
    const sent = (await getCalls(page, 'GetConfiguration')).length
    await updateBackend(page, { delay: 1500 })
    await click(page, `${UPLOAD} >>> #continue`)
    await page.waitForFunction(
      (n: number) =>
        (window as any).__ezpMock.calls.filter((c: any) => c.route === 'GetConfiguration').length >
        n,
      {},
      sent,
    )
  }

  it('shows the sign-in step, not the print options without a token', async () => {
    const page = await openPrinting({
      hostTokens: [HOST_TOKEN],
      tokenProvider: { answer: HOST_TOKEN },
      printers: [PRINTERS[0]],
      attrs: { hidelogin: true },
    })
    await continueSlowly(page)

    // Say the host signs its user out just then.
    await page.$eval('ezp-printing', (el: any) => (el.tokenProvider = undefined))

    expect(await settledOn(page)).toBe('login-dialog')
    await allAnswered(page)
    await pause(500)
    expect(await page.find(OPTIONS)).toBeNull()
    expect(await getCalls(page, 'GetPrinter')).toEqual([])
    expect((await getPopup(page)).opens).toBe(0)
  })

  it('ends with the new provider’s token when the host replaces the provider then', async () => {
    const page = await openPrinting({
      hostTokens: [HOST_TOKEN, 'host-token-2'],
      tokenProvider: { answer: HOST_TOKEN },
      printers: [PRINTERS[0]],
      attrs: { hidelogin: true },
    })
    await continueSlowly(page)

    await page.$eval(
      'ezp-printing',
      (el: any) => (el.tokenProvider = () => Promise.resolve('host-token-2')),
    )

    expect(await settledOn(page)).toBe('print-options')
    await waitForCall(page, 'GetPrinter')
    await allAnswered(page)
    expect((await getPopup(page)).opens).toBe(0)
    const printers = await getCalls(page, 'GetPrinter')
    printers.forEach((made) => expect(made.headers.authorization).toBe('Bearer host-token-2'))
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
