import { newSpecPage } from '@stencil/core/testing'
import { EzpAuth } from './ezp-auth'
import authStore from '../../services/auth'
import { EzpDialog } from '../ezp-dialog/ezp-dialog'
import { initi18n } from '../../utils/utils'
import en from '../../data/locales/en.json'

describe('ezp-auth receiveMessage origin validation', () => {
  beforeEach(() => {
    authStore.state.authApiHostUrl = 'account.ezeep.com'
    authStore.state.isAuthorized = false
    authStore.state.code = ''
    global.fetch = jest
      .fn()
      .mockResolvedValue({ json: () => Promise.resolve({}) }) as unknown as typeof fetch
  })

  async function setup() {
    const page = await newSpecPage({ components: [EzpAuth], html: `<ezp-auth></ezp-auth>` })
    const el = page.rootInstance as any
    el.redirectURI = 'https://app.example.com/callback'
    el.auth = { getAccessToken: jest.fn().mockResolvedValue(undefined) }
    return el
  }

  it('exchanges the code when the message origin matches the redirect origin', async () => {
    const el = await setup()
    el.receiveMessage({ origin: 'https://app.example.com', data: 'auth-code' } as MessageEvent)
    expect(authStore.state.code).toBe('auth-code')
    expect(el.auth.getAccessToken).toHaveBeenCalled()
  })

  it('ignores a message from an unexpected origin', async () => {
    const el = await setup()
    el.receiveMessage({ origin: 'https://evil.example', data: 'stolen-code' } as MessageEvent)
    expect(authStore.state.code).toBe('')
    expect(el.auth.getAccessToken).not.toHaveBeenCalled()
  })

  it('fails open (still exchanges) when redirectURI is not a parseable URL', async () => {
    const el = await setup()
    el.redirectURI = 'not-a-url'
    el.receiveMessage({ origin: 'https://anything.example', data: 'code' } as MessageEvent)
    expect(authStore.state.code).toBe('code')
    expect(el.auth.getAccessToken).toHaveBeenCalled()
  })

  it('ignores a message whose source is not the popup we opened', async () => {
    const el = await setup()
    el.oauthPopupWindow = { name: 'our-popup' }
    el.receiveMessage({
      origin: 'https://app.example.com',
      source: { name: 'some-other-window' },
      data: 'forged-code',
    } as unknown as MessageEvent)
    expect(authStore.state.code).toBe('')
    expect(el.auth.getAccessToken).not.toHaveBeenCalled()
  })

  it('accepts a message whose source is the popup we opened', async () => {
    const el = await setup()
    const popup = { name: 'our-popup' }
    el.oauthPopupWindow = popup
    el.receiveMessage({
      origin: 'https://app.example.com',
      source: popup,
      data: 'auth-code',
    } as unknown as MessageEvent)
    expect(authStore.state.code).toBe('auth-code')
    expect(el.auth.getAccessToken).toHaveBeenCalled()
  })

  it('cancelling sign-in clears the selection on the file trigger, only closes on the button trigger', async () => {
    // File trigger: emit userCancel so the parent clears the pending files.
    const fileEl = await setup()
    fileEl.trigger = 'file'
    let userCancelled = false
    let authCancelled = false
    fileEl.userCancel = { emit: () => (userCancelled = true) }
    fileEl.authCancel = { emit: () => (authCancelled = true) }
    fileEl.listenStatusCancel()
    expect(userCancelled).toBe(true)
    expect(authCancelled).toBe(false)

    // Button trigger: nothing to clear, so just close the auth dialog.
    const buttonEl = await setup()
    buttonEl.trigger = 'button'
    let userCancelled2 = false
    let authCancelled2 = false
    buttonEl.userCancel = { emit: () => (userCancelled2 = true) }
    buttonEl.authCancel = { emit: () => (authCancelled2 = true) }
    buttonEl.listenStatusCancel()
    expect(authCancelled2).toBe(true)
    expect(userCancelled2).toBe(false)
  })
})

describe('ezp-auth popup-block detection', () => {
  const AUTH_URI = 'https://account.example.com/oauth/authorize'
  // Assigned in setup() before each test body runs.
  let openSpy: jest.SpyInstance
  let addListenerSpy: jest.SpyInstance

  beforeEach(() => {
    authStore.state.authApiHostUrl = 'account.ezeep.com'
    authStore.state.isAuthorized = false
    authStore.state.code = ''
    global.fetch = jest
      .fn()
      .mockResolvedValue({ json: () => Promise.resolve({}) }) as unknown as typeof fetch
  })

  afterEach(() => {
    openSpy?.mockRestore()
    addListenerSpy?.mockRestore()
  })

  // newSpecPage installs a fresh mock window, so spies go on after it.
  async function setup(popup: () => unknown = () => ({ closed: false, focus: jest.fn() })) {
    const page = await newSpecPage({
      components: [EzpAuth, EzpDialog],
      html: `<ezp-auth></ezp-auth>`,
    })
    const el = page.rootInstance as any
    // Loosely typed: the spec pokes at the shadow DOM directly.
    const root = page.root as any
    el.auth = { authURI: new URL(AUTH_URI), getAccessToken: jest.fn() }
    const blockedEvents: Event[] = []
    root.addEventListener('popupBlocked', (e: Event) => blockedEvents.push(e))
    openSpy = jest.spyOn(window, 'open').mockImplementation(popup as any)
    addListenerSpy = jest.spyOn(window, 'addEventListener')
    return { page, root, el, blockedEvents }
  }

  const messageListenerRegistered = () =>
    addListenerSpy.mock.calls.some(([type]) => type === 'message')

  it.each([
    ['returns null', () => null],
    ['returns a closed window', () => ({ closed: true, focus: jest.fn() })],
    ['returns a window without a closed flag', () => ({ focus: jest.fn() })],
  ])('flags the popup as blocked when window.open %s', async (_label, popup) => {
    const { page, el, blockedEvents } = await setup(popup)

    el.openSignInWindow(AUTH_URI, 'ezeep Login')
    await page.waitForChanges()

    expect(openSpy).toHaveBeenCalledTimes(1)
    expect(el.isPopupBlocked).toBe(true)
    expect(blockedEvents).toHaveLength(1)
    expect(messageListenerRegistered()).toBe(false)
  })

  it('also detects a block when re-opening with a different URL, closing the stale popup', async () => {
    const { el, blockedEvents } = await setup(() => null)
    // An existing, still-open popup that was pointed at a different URL.
    const stalePopup = { closed: false, focus: jest.fn(), close: jest.fn() }
    el.oauthPopupWindow = stalePopup
    el.previousUrl = 'https://account.example.com/old'

    el.openSignInWindow(AUTH_URI, 'ezeep Login')

    expect(stalePopup.close).toHaveBeenCalled()
    expect(el.oauthPopupWindow).toBeNull()
    expect(el.isPopupBlocked).toBe(true)
    expect(blockedEvents).toHaveLength(1)
    expect(messageListenerRegistered()).toBe(false)
  })

  it('only focuses an open popup that already shows the current URL', async () => {
    const popup = { closed: false, focus: jest.fn() }
    const { el } = await setup(() => popup)

    el.openSignInWindow(AUTH_URI, 'ezeep Login')
    expect(el.previousUrl).toBe(AUTH_URI)
    openSpy.mockClear()

    el.openSignInWindow(AUTH_URI, 'ezeep Login')

    expect(openSpy).not.toHaveBeenCalled()
    expect(popup.focus).toHaveBeenCalled()
    expect(el.isPopupBlocked).toBe(false)
  })

  // Closing cancels like the screen the dialog replaced: the sign-in status
  // (hidelogin) clears the file selection, the login dialog just closes.
  it.each([
    [true, 'file', 'userCancel'],
    [true, 'button', 'authCancel'],
    [false, 'file', 'authCancel'],
  ])(
    'closing the popup-blocked dialog (hidelogin=%s, %s trigger) cancels via %s',
    async (hidelogin, trigger, expectedEvent) => {
      const { page, root, el } = await setup(() => null)
      el.hidelogin = hidelogin
      el.trigger = trigger
      el.openSignInWindow(AUTH_URI, 'ezeep Login')
      await page.waitForChanges()

      const emitted: string[] = []
      root.addEventListener('userCancel', () => emitted.push('userCancel'))
      root.addEventListener('authCancel', () => emitted.push('authCancel'))

      root.shadowRoot.querySelector('ezp-dialog').dispatchEvent(
        new CustomEvent('dialogClose', {
          detail: 'popup-blocked',
          bubbles: true,
          composed: true,
        }),
      )
      await page.waitForChanges()

      expect(emitted).toEqual([expectedEvent])
      expect(el.isPopupBlocked).toBe(false)
    },
  )

  it('registers the message listener and stays unblocked when the popup opens', async () => {
    const popup = { closed: false, focus: jest.fn() }
    const { el, blockedEvents } = await setup(() => popup)

    el.openSignInWindow(AUTH_URI, 'ezeep Login')

    expect(el.oauthPopupWindow).toBe(popup)
    expect(el.isPopupBlocked).toBe(false)
    expect(blockedEvents).toHaveLength(0)
    expect(addListenerSpy).toHaveBeenCalledWith('message', el.receiveMessage, false)
  })

  it('renders the popup-blocked dialog with translated text', async () => {
    initi18n('en')
    const { page, root, el } = await setup()

    el.isPopupBlocked = true
    await page.waitForChanges()

    const dialog = root.shadowRoot.querySelector('ezp-dialog') as any
    expect(dialog.instance).toBe('popup-blocked')
    expect(dialog.heading).toBe(en.popup_blocked_dialog.heading)
    expect(dialog.description).toBe(en.popup_blocked_dialog.description)
    expect(dialog.action).toBe(en.popup_blocked_dialog.action)
    expect(dialog.iconName).toBe('exclamation-mark')
  })

  it('retries sign-in when the popup-blocked dialog action is clicked', async () => {
    const { page, root, el } = await setup(() => null)
    el.openSignInWindow(AUTH_URI, 'ezeep Login')
    await page.waitForChanges()
    expect(el.isPopupBlocked).toBe(true)

    // The user allowed popups; the retry now opens the window.
    openSpy.mockImplementation(() => ({ closed: false, focus: jest.fn() }))
    const retrySpy = jest.spyOn(el, 'handleRetry')
    const openSignInSpy = jest.spyOn(el, 'openSignInWindow')

    const dialog = root.shadowRoot.querySelector('ezp-dialog')
    dialog.dispatchEvent(
      new CustomEvent('dialogAction', { detail: 'popup-blocked', bubbles: true, composed: true }),
    )
    await page.waitForChanges()

    expect(retrySpy).toHaveBeenCalledTimes(1)
    expect(openSignInSpy).toHaveBeenCalledWith(AUTH_URI, 'ezeep Login')
    expect(el.isPopupBlocked).toBe(false)
    expect((root.shadowRoot.querySelector('ezp-dialog') as any).instance).toBe('login')
  })

  it('keeps the login dialog action opening the sign-in window', async () => {
    const { root, el } = await setup()
    const retrySpy = jest.spyOn(el, 'handleRetry')

    root.shadowRoot
      .querySelector('ezp-dialog')
      .dispatchEvent(
        new CustomEvent('dialogAction', { detail: 'login', bubbles: true, composed: true }),
      )

    expect(retrySpy).not.toHaveBeenCalled()
    expect(openSpy).toHaveBeenCalledWith(AUTH_URI, 'ezeep Login', expect.any(String))
  })
})
