import { authGetJson, bearer } from './http'
import authStore from './auth'

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({ status, json: () => Promise.resolve(body) }) as unknown as Promise<Response>
}

describe('bearer', () => {
  it('builds the Authorization header', () => {
    expect(bearer('xyz')).toEqual({ Authorization: 'Bearer xyz' })
  })
})

describe('authGetJson 401 self-healing', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    authStore.state.authApiHostUrl = 'account.test'
    authStore.state.redirectUri = 'https://app/cb'
    authStore.state.clientID = 'client-1'
    authStore.state.refreshToken = 'refresh-1'
    authStore.state.accessToken = 'old-token'
    fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch
  })

  it('returns the body directly on success (no refresh)', async () => {
    fetchMock.mockReturnValueOnce(jsonResponse({ ok: true }))
    const result = await authGetJson('https://api/x', 'old-token')
    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('refreshes once and retries the request with the new token on 401', async () => {
    fetchMock
      .mockReturnValueOnce(jsonResponse({}, 401)) // first GET -> expired
      .mockReturnValueOnce(jsonResponse({ access_token: 'new-token', refresh_token: 'r2' })) // refresh POST
      .mockReturnValueOnce(jsonResponse({ ok: true })) // retried GET

    const result = await authGetJson('https://api/x', 'old-token')

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    // The retried GET must carry the refreshed token.
    const retryCall = fetchMock.mock.calls[2]
    expect(retryCall[0]).toBe('https://api/x')
    expect(retryCall[1].headers).toEqual({ Authorization: 'Bearer new-token' })
  })

  it('does not retry when there is no refresh token', async () => {
    authStore.state.refreshToken = ''
    fetchMock.mockReturnValueOnce(jsonResponse({ error: 'unauthorized' }, 401))
    const result = await authGetJson('https://api/x', 'old-token')
    expect(result).toEqual({ error: 'unauthorized' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
