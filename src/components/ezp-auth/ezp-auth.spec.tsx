import { newSpecPage } from '@stencil/core/testing'
import { EzpAuth } from './ezp-auth'
import authStore from '../../services/auth'

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
