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
})
