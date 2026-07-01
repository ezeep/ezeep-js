import authStore, { EzpAuthorizationService, sendCodeToParentWindow } from './auth'

const REDIRECT = 'https://app.example.com/callback'
const CLIENT = 'client-123'

function newService() {
  // The constructor builds URLs from the auth host, so seed it first.
  authStore.state.authApiHostUrl = 'account.ezeep.com'
  return new EzpAuthorizationService(REDIRECT, CLIENT)
}

describe('EzpAuthorizationService — PKCE', () => {
  beforeEach(() => {
    authStore.state.codeVerifier = ''
  })

  it('generates a spec-compliant code verifier (43-128 chars, base64url charset)', () => {
    const service = newService()
    service.generateCodeVerifier()

    expect(service.codeVerifier).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(service.codeVerifier.length).toBeGreaterThanOrEqual(43)
    expect(service.codeVerifier.length).toBeLessThanOrEqual(128)
    // It is persisted to the store for reuse across the redirect.
    expect(authStore.state.codeVerifier).toBe(service.codeVerifier)
  })

  it('reuses an existing verifier from the store instead of regenerating', () => {
    authStore.state.codeVerifier = 'existing-verifier-value'
    const service = newService()
    service.generateCodeVerifier()
    expect(service.codeVerifier).toBe('existing-verifier-value')
  })

  it('produces fresh entropy on each generation', () => {
    const a = newService()
    a.generateCodeVerifier()
    authStore.state.codeVerifier = ''
    const b = newService()
    b.generateCodeVerifier()
    expect(a.codeVerifier).not.toBe(b.codeVerifier)
  })

  it('derives an S256 challenge as url-safe base64 with no padding', async () => {
    const service = newService()
    await service.generateCodeChallenge('a-known-verifier')

    expect(service.codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(service.codeChallenge).not.toContain('=')
    // SHA-256 (32 bytes) -> base64url is 43 chars.
    expect(service.codeChallenge.length).toBe(43)
  })

  it('is deterministic: the same verifier always yields the same challenge', async () => {
    const a = newService()
    await a.generateCodeChallenge('same-input')
    const b = newService()
    await b.generateCodeChallenge('same-input')
    expect(a.codeChallenge).toBe(b.codeChallenge)
  })
})

describe('EzpAuthorizationService — buildAuthURI', () => {
  it('builds an authorization URL with the PKCE params', async () => {
    const service = newService()
    service.generateCodeVerifier()
    await service.generateCodeChallenge(service.codeVerifier)
    service.buildAuthURI()

    const url = new URL(authStore.state.authUri)
    expect(url.origin).toBe('https://account.ezeep.com')
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('client_id')).toBe(CLIENT)
    expect(url.searchParams.get('redirect_uri')).toBe(REDIRECT)
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    expect(url.searchParams.get('code_challenge')).toBe(service.codeChallenge)
  })
})

describe('EzpAuthorizationService — token exchange', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    authStore.state.authApiHostUrl = 'account.ezeep.com'
    authStore.state.accessToken = ''
    authStore.state.refreshToken = ''
    authStore.state.isAuthorized = false
    localStorage.clear()
    fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch
  })

  const tokenResponse = (body: unknown) =>
    Promise.resolve({ json: () => Promise.resolve(body) }) as unknown as Promise<Response>

  it('getAccessToken exchanges the auth code and persists tokens everywhere', async () => {
    authStore.state.code = 'auth-code'
    authStore.state.codeVerifier = 'verifier-x'
    fetchMock.mockReturnValue(tokenResponse({ access_token: 'AT', refresh_token: 'RT' }))

    await newService().getAccessToken()

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://account.ezeep.com/oauth/access_token/')
    expect(init.method).toBe('POST')
    expect(init.body).toContain('grant_type=authorization_code')
    expect(init.body).toContain('code=auth-code')
    expect(init.body).toContain('code_verifier=verifier-x')
    expect(authStore.state.accessToken).toBe('AT')
    expect(authStore.state.refreshToken).toBe('RT')
    expect(authStore.state.isAuthorized).toBe(true)
    expect(localStorage.getItem('access_token')).toBe('AT')
    expect(localStorage.getItem('refreshToken')).toBe('RT')
    expect(localStorage.getItem('isAuthorized')).toBe('true')
  })

  it('refreshTokens uses the refresh grant and stores the rotated tokens', async () => {
    authStore.state.refreshToken = 'old-RT'
    fetchMock.mockReturnValue(tokenResponse({ access_token: 'AT2', refresh_token: 'RT2' }))

    await newService().refreshTokens()

    const [, init] = fetchMock.mock.calls[0]
    expect(init.body).toContain('grant_type=refresh_token')
    expect(init.body).toContain('refresh_token=old-RT')
    expect(authStore.state.accessToken).toBe('AT2')
    expect(authStore.state.refreshToken).toBe('RT2')
    expect(authStore.state.isAuthorized).toBe(true)
  })

  it('does not authorize when the token response has no access_token', async () => {
    authStore.state.refreshToken = 'RT'
    fetchMock.mockReturnValue(tokenResponse({ error: 'invalid_grant' }))

    await newService().refreshTokens()

    expect(authStore.state.accessToken).toBe('')
    expect(authStore.state.isAuthorized).toBe(false)
  })

  it('revokeRefreshToken posts the token to the revoke endpoint', () => {
    authStore.state.refreshToken = 'RT'
    fetchMock.mockReturnValue(Promise.resolve({}) as unknown as Promise<Response>)

    newService().revokeRefreshToken()

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://account.ezeep.com/oauth/revoke/')
    expect(init.method).toBe('POST')
    expect(init.body).toContain('token=RT')
  })

  it('revokeRefreshToken is a no-op without a refresh token', () => {
    authStore.state.refreshToken = ''
    newService().revokeRefreshToken()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('sendCodeToParentWindow', () => {
  afterEach(() => {
    ;(window as any).opener = null
    ;(window as any).location.search = ''
  })

  it('relays the auth code to the opener and closes the popup', () => {
    authStore.state.redirectUri = 'https://app/cb'
    const postMessage = jest.fn()
    ;(window as any).opener = { postMessage }
    ;(window as any).close = jest.fn()
    ;(window as any).location.search = '?code=THE_CODE'

    sendCodeToParentWindow()

    expect(postMessage).toHaveBeenCalledWith('THE_CODE', 'https://app/cb')
    expect(window.close).toHaveBeenCalled()
  })

  it('does nothing when the window has no opener', () => {
    ;(window as any).opener = null
    ;(window as any).close = jest.fn()
    ;(window as any).location.search = '?code=THE_CODE'

    sendCodeToParentWindow()

    expect(window.close).not.toHaveBeenCalled()
  })
})
