import { newSpecPage } from '@stencil/core/testing'
import { EzpAuth } from './ezp-auth'
import authStore from '../../services/auth'

describe('ezp-auth receiveMessage', () => {
  beforeEach(() => {
    authStore.state.authApiHostUrl = 'account.ezeep.com'
    authStore.state.isAuthorized = false
    authStore.state.code = ''
    global.fetch = jest
      .fn()
      .mockResolvedValue({ json: () => Promise.resolve({}) }) as unknown as typeof fetch
  })

  it('exchanges the posted auth code for a token', async () => {
    const page = await newSpecPage({ components: [EzpAuth], html: `<ezp-auth></ezp-auth>` })
    const el = page.rootInstance as any
    el.auth = { getAccessToken: jest.fn().mockResolvedValue(undefined) }

    el.receiveMessage({ origin: 'https://app.example.com', data: 'auth-code' } as MessageEvent)

    expect(authStore.state.code).toBe('auth-code')
    expect(el.auth.getAccessToken).toHaveBeenCalled()
  })
})
