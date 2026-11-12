import { createHash } from 'crypto'
import { E2EPage } from '@stencil/core/testing'
import {
  AUTH_HOST,
  CLIENT_ID,
  REDIRECT_URI,
  chooseFiles,
  click,
  fileNames,
  formBody,
  getCalls,
  getPopup,
  getStorage,
  openPrinting,
  postAuthCode,
  removeFiles,
  textOf,
  updateBackend,
  waitForCall,
  waitForInstance,
  waitForPrintOptions,
} from '../../testing/mock-backend'

/**
 * End-to-end (real headless browser, faked network): signing in. The OAuth
 * popup is stood in for by a same-page window, so the real `window.open` →
 * `message` → token-exchange path runs, including its origin/source checks.
 */

const AUTH = 'ezp-printing >>> ezp-auth'
const DIALOG = `${AUTH} >>> ezp-dialog`
const DIALOG_ACTION = `${DIALOG} >>> #footer ezp-text-button`
const DIALOG_CLOSE = `${DIALOG} >>> #header ezp-icon-button`
const UPLOAD = 'ezp-printing >>> ezp-upload'
const OPTIONS = 'ezp-printing >>> ezp-printer-selection'

/** A signed-out page with one file picked and "Continue" pressed. */
async function openSignIn(options: Parameters<typeof openPrinting>[0] = {}): Promise<E2EPage> {
  const page = await openPrinting(options)
  await chooseFiles(page, 'report.pdf')
  await click(page, `${UPLOAD} >>> #continue`)
  return page
}

const dialogInstance = (page: E2EPage) =>
  page.$eval(DIALOG, (el: any) => el.instance as string).catch((): null => null)

describe('ezp-auth (e2e)', () => {
  afterAll(removeFiles)

  describe('signing in through the popup', () => {
    it('asks the user to sign in before printing', async () => {
      const page = await openSignIn()

      expect(await dialogInstance(page)).toBe('login')
      expect(await textOf(page, `${DIALOG} >>> #text`)).toBe(
        'Print with ezeep Blue Sign in with your ezeep Blue account to print.',
      )
      expect(await textOf(page, DIALOG_ACTION)).toBe('Sign in')
      // Nothing opens until the user asks for it.
      expect((await getPopup(page)).opens).toBe(0)
    })

    it('opens the authorize page with a PKCE challenge', async () => {
      const page = await openSignIn()
      await click(page, DIALOG_ACTION)

      const popup = await getPopup(page)
      expect(popup.opens).toBe(1)

      const url = new URL(popup.url!)
      expect(url.origin + url.pathname).toBe(`https://${AUTH_HOST}/oauth/authorize/`)
      expect(url.searchParams.get('response_type')).toBe('code')
      expect(url.searchParams.get('client_id')).toBe(CLIENT_ID)
      expect(url.searchParams.get('redirect_uri')).toBe(REDIRECT_URI)
      expect(url.searchParams.get('code_challenge_method')).toBe('S256')
      expect(url.searchParams.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/)
    })

    it('exchanges the code from the popup for tokens and moves on to the print options', async () => {
      const page = await openSignIn()
      await click(page, DIALOG_ACTION)
      const challenge = new URL((await getPopup(page)).url!).searchParams.get('code_challenge')

      await postAuthCode(page)
      await waitForPrintOptions(page)

      const [exchange] = await getCalls(page, 'AccessToken')
      expect(exchange.method).toBe('POST')
      expect(exchange.headers['content-type']).toBe('application/x-www-form-urlencoded')
      // Public client: the client id as Basic user, no secret.
      expect(exchange.headers.authorization).toBe(
        'Basic ' + Buffer.from(`${CLIENT_ID}:`).toString('base64'),
      )
      const form = formBody(exchange)
      expect(form).toMatchObject({
        grant_type: 'authorization_code',
        scope: 'printing',
        code: 'valid-code',
        redirect_uri: REDIRECT_URI,
      })
      // The verifier sent now must hash to the challenge sent to the authorize page.
      const expected = createHash('sha256').update(form.code_verifier).digest('base64url')
      expect(challenge).toBe(expected)

      // The API is then called with the freshly issued access token.
      const [printers] = await getCalls(page, 'GetPrinter')
      expect(printers.headers.authorization).toBe('Bearer access-token-1')
      expect(await fileNames(page, `${OPTIONS} >>> #files-list`)).toEqual(['report.pdf'])
    })

    it('persists the refresh token but never the access token', async () => {
      const page = await openSignIn()
      await click(page, DIALOG_ACTION)
      await postAuthCode(page)
      await waitForPrintOptions(page)

      expect(await getStorage(page, 'refreshToken')).toBe('refresh-token-1')
      expect(await getStorage(page, 'isAuthorized')).toBe('true')

      const everything = await page.evaluate(() => JSON.stringify({ ...localStorage }))
      expect(everything).not.toContain('access-token')
      expect(await page.evaluate(() => JSON.stringify({ ...sessionStorage }))).not.toContain(
        'access-token',
      )
    })

    it('ignores a code posted from an unexpected origin', async () => {
      const page = await openSignIn()
      await click(page, DIALOG_ACTION)

      await postAuthCode(page, { origin: 'https://evil.example' })

      expect((await getCalls(page, 'AccessToken')).length).toBe(0)
      expect(await dialogInstance(page)).toBe('login')
      expect(await page.find(OPTIONS)).toBeNull()
    })

    it('ignores a code posted by a window other than the popup', async () => {
      const page = await openSignIn()
      await click(page, DIALOG_ACTION)

      await postAuthCode(page, { fromPopup: false })

      expect((await getCalls(page, 'AccessToken')).length).toBe(0)
      expect(await dialogInstance(page)).toBe('login')
    })

    it('still accepts the genuine code after a forged one was ignored', async () => {
      const page = await openSignIn()
      await click(page, DIALOG_ACTION)

      await postAuthCode(page, { origin: 'https://evil.example', code: 'stolen' })
      await postAuthCode(page)
      await waitForPrintOptions(page)

      const exchanges = await getCalls(page, 'AccessToken')
      expect(exchanges.length).toBe(1)
      expect(formBody(exchanges[0]).code).toBe('valid-code')
    })

    it('reuses the open popup when "Sign in" is pressed again', async () => {
      const page = await openSignIn()
      await click(page, DIALOG_ACTION)
      await click(page, DIALOG_ACTION)

      // Same URL, popup still open: it is focused, not opened a second time.
      expect((await getPopup(page)).opens).toBe(1)

      // And the code is exchanged exactly once.
      await postAuthCode(page)
      await waitForPrintOptions(page)
      expect((await getCalls(page, 'AccessToken')).length).toBe(1)
    })
  })

  describe('failed code exchange', () => {
    it('stays on the sign-in dialog when the code is rejected, and a second attempt succeeds', async () => {
      const page = await openSignIn()
      await click(page, DIALOG_ACTION)

      await postAuthCode(page, { code: 'expired-code' })
      await waitForCall(page, 'AccessToken')
      await page.waitForChanges()

      // Not signed in: no print options (which could only report "no printers").
      expect(await dialogInstance(page)).toBe('login')
      expect(await page.find(OPTIONS)).toBeNull()
      expect(await getStorage(page, 'refreshToken')).toBeNull()
      expect(await getStorage(page, 'isAuthorized')).not.toBe('true')
      expect((await getCalls(page, 'GetPrinter')).length).toBe(0)

      await postAuthCode(page)
      await waitForPrintOptions(page)
      expect(await fileNames(page, `${OPTIONS} >>> #files-list`)).toEqual(['report.pdf'])
    })

    it('stays on the sign-in dialog when the token endpoint cannot be reached', async () => {
      const page = await openSignIn({ failing: ['AccessToken'] })
      await click(page, DIALOG_ACTION)

      await postAuthCode(page)
      await waitForCall(page, 'AccessToken')
      await page.waitForChanges()

      expect(await dialogInstance(page)).toBe('login')
      expect(await page.find(OPTIONS)).toBeNull()

      // Back online.
      await updateBackend(page, { failing: [] })
      await postAuthCode(page)
      await waitForPrintOptions(page)
    })

    it('with hidelogin, keeps the sign-in status up so the user can cancel', async () => {
      const page = await openSignIn({ attrs: { hidelogin: true } })

      await postAuthCode(page, { code: 'expired-code' })
      await waitForCall(page, 'AccessToken')
      await page.waitForChanges()

      expect(await page.find(OPTIONS)).toBeNull()
      expect(await textOf(page, `${AUTH} >>> ezp-status >>> #description`)).toBe('Sign in')

      await click(page, `${AUTH} >>> ezp-status >>> ezp-text-button`)
      expect(await page.find(AUTH)).toBeNull()
    })

    it('asks the user to sign in when a `code` attribute is rejected', async () => {
      const page = await openPrinting({ attrs: { trigger: 'button', code: 'expired-code' } })
      await click(page, 'ezp-printing >>> #print-trigger')
      await waitForCall(page, 'AccessToken')
      await page.waitForChanges()

      expect(await dialogInstance(page)).toBe('login')
      expect(await getStorage(page, 'refreshToken')).toBeNull()
    })
  })

  describe('backing out of sign-in', () => {
    it('closing the sign-in dialog keeps the selected files', async () => {
      const page = await openSignIn()
      const finished = await page.spyOnEvent('printFinished')

      await click(page, DIALOG_CLOSE)

      expect(await page.find(AUTH)).toBeNull()
      expect(await fileNames(page, `${UPLOAD} >>> #file-list`)).toEqual(['report.pdf'])
      expect(finished).toHaveReceivedEventTimes(0)
    })

    it('Escape closes the sign-in dialog', async () => {
      const page = await openSignIn()

      await page.keyboard.press('Escape')
      await page.waitForChanges()

      expect(await page.find(AUTH)).toBeNull()
    })
  })

  describe('already signed in', () => {
    it('goes straight to the print options without opening a popup', async () => {
      const page = await openSignIn({ signedIn: true })

      await click(page, DIALOG_ACTION)
      await waitForPrintOptions(page)

      expect((await getPopup(page)).opens).toBe(0)
      // No code exchange either: only the start-up refresh hit the token endpoint.
      const tokenCalls = await getCalls(page, 'AccessToken')
      expect(tokenCalls.map((call) => formBody(call).grant_type)).toEqual(['refresh_token'])
    })

    it('with hidelogin, skips the sign-in step altogether', async () => {
      const page = await openSignIn({ signedIn: true, attrs: { hidelogin: true } })

      await waitForPrintOptions(page)

      expect(await page.find(AUTH)).toBeNull()
      expect((await getPopup(page)).opens).toBe(0)
    })
  })

  describe('hidelogin (no sign-in dialog)', () => {
    it('opens the popup right away and shows a cancellable sign-in status', async () => {
      const page = await openSignIn({ attrs: { hidelogin: true } })

      expect((await getPopup(page)).opens).toBe(1)
      expect(await page.find(DIALOG)).toBeNull()
      expect(await textOf(page, `${AUTH} >>> ezp-status >>> #description`)).toBe('Sign in')

      await postAuthCode(page)
      await waitForPrintOptions(page)
    })

    it('cancelling sign-in discards the files and ends the flow', async () => {
      const page = await openSignIn({ attrs: { hidelogin: true } })
      const finished = await page.spyOnEvent('printFinished')

      await click(page, `${AUTH} >>> ezp-status >>> ezp-text-button`)

      expect(await page.find(AUTH)).toBeNull()
      expect(await page.find(`${UPLOAD} >>> #dropzone`)).not.toBeNull()
      expect(finished).toHaveReceivedEventTimes(1)
    })

    it('with the button trigger, cancelling just closes the sign-in status', async () => {
      const page = await openPrinting({ attrs: { trigger: 'button', hidelogin: true } })
      const finished = await page.spyOnEvent('printFinished')
      await click(page, 'ezp-printing >>> #print-trigger')

      await click(page, `${AUTH} >>> ezp-status >>> ezp-text-button`)

      expect(await page.find(AUTH)).toBeNull()
      expect(finished).toHaveReceivedEventTimes(0)
    })
  })

  describe('blocked popup', () => {
    it('explains the block and signs in on "Try again" once popups are allowed', async () => {
      const page = await openPrinting({ popup: 'blocked' })
      const blocked = await page.spyOnEvent('popupBlocked')
      await chooseFiles(page, 'report.pdf')
      await click(page, `${UPLOAD} >>> #continue`)
      await click(page, DIALOG_ACTION)

      await waitForInstance(page, 'ezp-dialog', 'popup-blocked')
      expect(blocked).toHaveReceivedEventTimes(1)
      expect(await textOf(page, DIALOG_ACTION)).toBe('Try again')

      // Still blocked: the dialog stays and the host is told again.
      await click(page, DIALOG_ACTION)
      expect(await dialogInstance(page)).toBe('popup-blocked')
      expect(blocked).toHaveReceivedEventTimes(2)

      // The user allows popups for the site.
      await updateBackend(page, { popup: 'iframe' })
      await click(page, DIALOG_ACTION)
      expect(await dialogInstance(page)).toBe('login')
      expect((await getPopup(page)).url).toContain('/oauth/authorize/')

      await postAuthCode(page)
      await waitForPrintOptions(page)
    })

    it('closing the blocked-popup dialog keeps the files when a sign-in dialog was shown', async () => {
      const page = await openPrinting({ popup: 'blocked' })
      await chooseFiles(page, 'report.pdf')
      await click(page, `${UPLOAD} >>> #continue`)
      await click(page, DIALOG_ACTION)
      await waitForInstance(page, 'ezp-dialog', 'popup-blocked')

      await click(page, DIALOG_CLOSE)

      expect(await page.find(AUTH)).toBeNull()
      expect(await fileNames(page, `${UPLOAD} >>> #file-list`)).toEqual(['report.pdf'])
    })

    it('with hidelogin, closing the blocked-popup dialog cancels the flow like the status it replaced', async () => {
      const page = await openPrinting({ popup: 'blocked', attrs: { hidelogin: true } })
      const finished = await page.spyOnEvent('printFinished')
      await chooseFiles(page, 'report.pdf')
      await click(page, `${UPLOAD} >>> #continue`)
      await waitForInstance(page, 'ezp-dialog', 'popup-blocked')

      await click(page, DIALOG_CLOSE)

      expect(await page.find(AUTH)).toBeNull()
      expect(await page.find(`${UPLOAD} >>> #dropzone`)).not.toBeNull()
      expect(finished).toHaveReceivedEventTimes(1)
    })
  })

  describe('host-managed sign-in', () => {
    it('exchanges a code handed in through the `code` attribute', async () => {
      const page = await openPrinting({ attrs: { trigger: 'button', code: 'valid-code' } })
      await click(page, 'ezp-printing >>> #print-trigger')

      await waitForCall(page, 'AccessToken')
      const [exchange] = await getCalls(page, 'AccessToken')
      expect(formBody(exchange)).toMatchObject({
        grant_type: 'authorization_code',
        code: 'valid-code',
      })
      expect((await getPopup(page)).opens).toBe(0)
      expect(await getStorage(page, 'refreshToken')).toBe('refresh-token-1')
    })
  })
})
