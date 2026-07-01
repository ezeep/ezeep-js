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
    // Stub the auth service so the test exercises only the origin gate.
    el.auth = { getAccessToken: jest.fn().mockResolvedValue(undefined) }
    return el
  }

  it('ignores a message from an unexpected origin', async () => {
    const el = await setup()
    el.receiveMessage({ origin: 'https://evil.example', data: 'stolen-code' } as MessageEvent)
    expect(authStore.state.code).toBe('')
    expect(el.auth.getAccessToken).not.toHaveBeenCalled()
  })

  it('accepts a message from the redirect origin and exchanges the code', async () => {
    const el = await setup()
    el.receiveMessage({ origin: 'https://app.example.com', data: 'good-code' } as MessageEvent)
    expect(authStore.state.code).toBe('good-code')
    expect(el.auth.getAccessToken).toHaveBeenCalled()
  })

  it('ignores the message when redirectURI is not a valid URL', async () => {
    const el = await setup()
    el.redirectURI = 'not-a-url'
    el.receiveMessage({ origin: 'https://app.example.com', data: 'x' } as MessageEvent)
    expect(authStore.state.code).toBe('')
    expect(el.auth.getAccessToken).not.toHaveBeenCalled()
  })

  it('removes the message listener on disconnect', async () => {
    const el = await setup()
    const remove = jest.spyOn(window, 'removeEventListener')
    el.disconnectedCallback()
    expect(remove).toHaveBeenCalledWith('message', el.receiveMessage)
    remove.mockRestore()
  })
})
