import authStore, {
  EzpAuthorizationService,
  hasTokenProvider,
  usesProvidedToken,
  sendCodeToParentWindow,
  setTokenProvider,
} from './auth'

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

  it('generates a code verifier (43-128 chars) and persists it', () => {
    const service = newService()
    service.generateCodeVerifier()

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

  it('getAccessToken exchanges the auth code and persists tokens', async () => {
    authStore.state.code = 'auth-code'
    authStore.state.codeVerifier = 'verifier-x'
    fetchMock.mockReturnValue(tokenResponse({ access_token: 'AT', refresh_token: 'RT' }))

    await expect(newService().getAccessToken()).resolves.toBe(true)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://account.ezeep.com/oauth/access_token/')
    expect(init.method).toBe('POST')
    expect(init.body).toContain('grant_type=authorization_code')
    expect(init.body).toContain('code=auth-code')
    expect(init.body).toContain('code_verifier=verifier-x')
    expect(authStore.state.accessToken).toBe('AT')
    expect(authStore.state.refreshToken).toBe('RT')
    expect(authStore.state.isAuthorized).toBe(true)
    // Access token is in-memory only; refresh token + isAuthorized are persisted.
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBe('RT')
    expect(localStorage.getItem('isAuthorized')).toBe('true')
  })

  it('getAccessToken reports a rejected code and persists nothing', async () => {
    authStore.state.code = 'expired-code'
    authStore.state.accessToken = ''
    authStore.state.isAuthorized = false
    localStorage.clear()
    fetchMock.mockReturnValue(tokenResponse({ error: 'invalid_grant' }))

    await expect(newService().getAccessToken()).resolves.toBe(false)

    expect(authStore.state.accessToken).toBe('')
    expect(authStore.state.isAuthorized).toBe(false)
    expect(localStorage.getItem('refreshToken')).toBeNull()
  })

  it.each([
    ['another OAuth error', { error: 'server_error' }, 'Token endpoint error: server_error'],
    ['a body without tokens or error', {}, 'Token endpoint error: unexpected response'],
  ])(
    'getAccessToken rejects on %s, so it is not mistaken for a refused code',
    async (_, body, message) => {
      authStore.state.code = 'auth-code'
      authStore.state.accessToken = ''
      authStore.state.isAuthorized = false
      fetchMock.mockReturnValue(tokenResponse(body))

      await expect(newService().getAccessToken()).rejects.toThrow(message)

      expect(authStore.state.accessToken).toBe('')
      expect(authStore.state.isAuthorized).toBe(false)
    },
  )

  it('getAccessToken rejects when the request itself fails', async () => {
    fetchMock.mockReturnValue(Promise.reject(new TypeError('Failed to fetch')))

    await expect(newService().getAccessToken()).rejects.toThrow('Failed to fetch')
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

describe('EzpAuthorizationService renewAccessToken', () => {
  const owner = {}
  let fetchMock: jest.Mock

  const tokenResponse = (body: unknown) =>
    Promise.resolve({ json: () => Promise.resolve(body) }) as unknown as Promise<Response>

  beforeEach(() => {
    authStore.state.authApiHostUrl = 'account.ezeep.com'
    authStore.state.accessToken = ''
    authStore.state.refreshToken = ''
    authStore.state.isAuthorized = false
    localStorage.clear()
    fetchMock = jest.fn().mockReturnValue(tokenResponse({ access_token: 'AT', refresh_token: 'RT' }))
    global.fetch = fetchMock as unknown as typeof fetch
  })

  afterEach(() => setTokenProvider(owner))

  it('without a provider, refreshes with the stored refresh token as before', async () => {
    authStore.state.refreshToken = 'old-RT'

    await newService().renewAccessToken()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][1].body).toContain('refresh_token=old-RT')
    expect(authStore.state.accessToken).toBe('AT')
  })

  it('still takes a provider declared without parameters', async () => {
    const provider: () => Promise<string | null> = async () => 'HOST'
    setTokenProvider(owner, provider)

    await newService().renewAccessToken()

    expect(authStore.state.accessToken).toBe('HOST')
  })

  it('puts the provider’s token in memory only, without the token endpoint', async () => {
    setTokenProvider(owner, () => Promise.resolve('HOST'))

    await newService().renewAccessToken()

    expect(hasTokenProvider()).toBe(true)
    expect(authStore.state.accessToken).toBe('HOST')
    expect(authStore.state.isAuthorized).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()
    for (const key of ['access_token', 'refreshToken', 'isAuthorized']) {
      expect(localStorage.getItem(key)).toBeNull()
    }
  })

  it('asks the provider once for callers that come while it is answering', async () => {
    let answer: (token: string) => void = () => undefined
    const provider = jest.fn(() => new Promise<string>((resolve) => (answer = resolve)))
    setTokenProvider(owner, provider)

    const first = newService().renewAccessToken()
    const second = newService().renewAccessToken()
    answer('HOST')
    await Promise.all([first, second])

    expect(provider).toHaveBeenCalledTimes(1)
    // Settled: the next caller asks again.
    const third = newService().renewAccessToken()
    answer('HOST-2')
    await third
    expect(provider).toHaveBeenCalledTimes(2)
    expect(authStore.state.accessToken).toBe('HOST-2')
  })

  it('drops the provider’s earlier token when it answers null', async () => {
    let next: () => Promise<string | null> = () => Promise.resolve('HOST')
    setTokenProvider(owner, () => next())
    await newService().renewAccessToken()

    next = () => Promise.resolve(null)
    await newService().renewAccessToken()

    expect(authStore.state.accessToken).toBe('')
    expect(authStore.state.isAuthorized).toBe(false)
    // No session of the widget's own to fall back to.
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('keeps the provider’s earlier token when it rejects, until the next answer', async () => {
    let next: () => Promise<string | null> = () => Promise.resolve('HOST')
    setTokenProvider(owner, () => next())
    await newService().renewAccessToken()

    // Say the host's token source fails for a moment while the print options are open.
    next = () => Promise.reject(new Error('offline'))
    await newService().renewAccessToken()

    expect(authStore.state.accessToken).toBe('HOST')
    expect(authStore.state.isAuthorized).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()

    next = () => Promise.resolve('HOST-2')
    await newService().renewAccessToken()
    expect(authStore.state.accessToken).toBe('HOST-2')
  })

  it('keeps the provider’s earlier token when it does not answer in time', async () => {
    jest.useFakeTimers()
    try {
      let hang = false
      setTokenProvider(owner, () => (hang ? new Promise<string>(() => undefined) : Promise.resolve('HOST')))
      await newService().renewAccessToken()

      hang = true
      const renewed = newService().renewAccessToken()
      await jest.advanceTimersByTimeAsync(20_001)
      await renewed

      expect(authStore.state.accessToken).toBe('HOST')
      expect(authStore.state.isAuthorized).toBe(true)
      expect(fetchMock).not.toHaveBeenCalled()
    } finally {
      jest.useRealTimers()
    }
  })

  it('falls back to a stored session of its own when the provider rejects and no token is held', async () => {
    authStore.state.refreshToken = 'own-RT'
    setTokenProvider(owner, () => Promise.reject(new Error('offline')))

    await newService().renewAccessToken()

    // As for `null`: there was no token to keep.
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][1].body).toContain('refresh_token=own-RT')
    expect(authStore.state.accessToken).toBe('AT')
  })

  it('stops waiting for a provider that does not answer, and asks it again next time', async () => {
    jest.useFakeTimers()
    try {
      let answer: (token: string) => void = () => undefined
      const provider = jest.fn(() => new Promise<string>((resolve) => (answer = resolve)))
      setTokenProvider(owner, provider)

      let settled = false
      const renewed = newService()
        .renewAccessToken()
        .then(() => (settled = true))
      // A host may take some 15 seconds for a silent refresh in a hidden iframe.
      await jest.advanceTimersByTimeAsync(19_999)
      expect(settled).toBe(false)
      await jest.advanceTimersByTimeAsync(40_001)
      expect(settled).toBe(true)
      await renewed

      // No token was held, so this is the same as `null`: no token, and no
      // session of the widget's own to refresh.
      expect(authStore.state.accessToken).toBe('')
      expect(authStore.state.isAuthorized).toBe(false)
      expect(fetchMock).not.toHaveBeenCalled()

      // An answer after the wait is over does not count.
      answer('LATE')
      await jest.advanceTimersByTimeAsync(1)
      expect(authStore.state.accessToken).toBe('')
      expect(authStore.state.isAuthorized).toBe(false)

      // The next renewal asks the provider again instead of waiting on the old call.
      const next = newService().renewAccessToken()
      expect(provider).toHaveBeenCalledTimes(2)
      answer('HOST')
      await next
      expect(authStore.state.accessToken).toBe('HOST')
    } finally {
      jest.useRealTimers()
    }
  })

  it('keeps the host’s token when a refresh started before the provider lands after it', async () => {
    authStore.state.refreshToken = 'own-RT'
    let land: () => void = () => undefined
    fetchMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          land = () =>
            resolve({ json: () => Promise.resolve({ access_token: 'OWN-AT', refresh_token: 'OWN-RT2' }) })
        }),
    )
    // The load-time check, on a browser that still holds a session of the
    // widget's own, possibly for another account.
    const ownRefresh = newService().renewAccessToken()

    // The host sets its provider meanwhile, and the element's watcher checks.
    let hostAnswer: string | null = 'HOST'
    setTokenProvider(owner, () => Promise.resolve(hostAnswer))
    await newService().renewAccessToken()
    expect(authStore.state.accessToken).toBe('HOST')

    land()
    await ownRefresh

    expect(authStore.state.accessToken).toBe('HOST')
    expect(localStorage.getItem('isAuthorized')).toBeNull()
    // The old refresh token is spent; the rotated one keeps the fallback alive.
    expect(authStore.state.refreshToken).toBe('OWN-RT2')
    expect(localStorage.getItem('refreshToken')).toBe('OWN-RT2')

    // The host's user signs out: the widget's own session takes over.
    hostAnswer = null
    fetchMock.mockReturnValue(tokenResponse({ access_token: 'AT', refresh_token: 'RT' }))
    await newService().renewAccessToken()
    expect(fetchMock.mock.calls[1][1].body).toContain('refresh_token=OWN-RT2')
    expect(authStore.state.accessToken).toBe('AT')
  })

  /** Hold every token grant back; the test answers each with `pending[i](body)`. */
  const holdGrants = () => {
    const pending: Array<(body: unknown) => void> = []
    fetchMock.mockImplementation(
      () => new Promise((resolve) => pending.push((body) => resolve({ json: () => Promise.resolve(body) }))),
    )
    return pending
  }
  /** How many grants were sent with this refresh token. */
  const grantsWith = (refreshToken: string) =>
    fetchMock.mock.calls.filter(
      ([, init]) => new URLSearchParams(String(init.body)).get('refresh_token') === refreshToken,
    ).length

  it('keeps the token of a provider that replaced the one a fallback refresh started under', async () => {
    authStore.state.refreshToken = 'own-RT'
    const pending = holdGrants()
    // Nobody is signed in on the host: the widget falls back to its own session.
    setTokenProvider(owner, () => Promise.resolve(null))
    const fallback = newService().renewAccessToken()
    await new Promise((resolve) => setTimeout(resolve))
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // The host's user signs in, and the host assigns a new function.
    setTokenProvider(owner, () => Promise.resolve('HOST'))
    await newService().renewAccessToken()
    expect(authStore.state.accessToken).toBe('HOST')

    pending[0]({ access_token: 'OWN-AT', refresh_token: 'OWN-RT2' })
    await fallback

    expect(authStore.state.accessToken).toBe('HOST')
    expect(localStorage.getItem('isAuthorized')).toBeNull()
    // The old refresh token is spent; the rotated one keeps the fallback alive.
    expect(authStore.state.refreshToken).toBe('OWN-RT2')
    expect(localStorage.getItem('refreshToken')).toBe('OWN-RT2')
  })

  it('joins the load-time refresh when a provider set meanwhile answers null', async () => {
    authStore.state.refreshToken = 'own-RT'
    const pending = holdGrants()
    // The load-time check, before the host has set its provider.
    const loadTime = newService().renewAccessToken()
    // The host sets a provider, nobody is signed in there, and the element's
    // watcher checks again.
    setTokenProvider(owner, () => Promise.resolve(null))
    const recheck = newService().renewAccessToken()
    await new Promise((resolve) => setTimeout(resolve))

    // One grant with the refresh token, not one for each caller.
    expect(grantsWith('own-RT')).toBe(1)
    pending.forEach((answer, i) =>
      answer(i === 0 ? { access_token: 'OWN-AT', refresh_token: 'OWN-RT2' } : { error: 'invalid_grant' }),
    )
    await Promise.all([loadTime, recheck])

    // The provider has no token, so the widget's own session is the fallback.
    expect(authStore.state.accessToken).toBe('OWN-AT')
    expect(authStore.state.isAuthorized).toBe(true)
    expect(authStore.state.refreshToken).toBe('OWN-RT2')
  })

  it('shares a grant only between callers with the same refresh token', async () => {
    authStore.state.refreshToken = 'own-RT'
    const pending = holdGrants()
    const service = newService()

    const first = service.refreshTokens()
    const again = service.refreshTokens()
    // Say the host page hands in another refresh token (`setAuthRefreshToken`).
    authStore.state.refreshToken = 'other-RT'
    const other = service.refreshTokens()
    await new Promise((resolve) => setTimeout(resolve))

    expect(grantsWith('own-RT')).toBe(1)
    expect(grantsWith('other-RT')).toBe(1)
    pending[0]({ access_token: 'OWN-AT', refresh_token: 'OWN-RT2' })
    pending[1]({ access_token: 'OTHER-AT', refresh_token: 'OTHER-RT2' })
    await Promise.all([first, again, other])
  })

  it('falls back to a session of the widget’s own when the provider has none', async () => {
    authStore.state.accessToken = 'OWN'
    authStore.state.refreshToken = 'own-RT'
    authStore.state.isAuthorized = true
    setTokenProvider(owner, () => Promise.resolve(null))

    const renewed = newService().renewAccessToken()
    // The widget's own token stays usable while it is being refreshed.
    await Promise.resolve()
    expect(authStore.state.accessToken).toBe('OWN')
    await renewed

    expect(fetchMock.mock.calls[0][1].body).toContain('refresh_token=own-RT')
    expect(authStore.state.accessToken).toBe('AT')
  })

  it('ignores the answer of a provider that was withdrawn while it was asked', async () => {
    let answer: (token: string) => void = () => undefined
    setTokenProvider(owner, () => new Promise<string>((resolve) => (answer = resolve)))

    const renewed = newService().renewAccessToken()
    setTokenProvider(owner)
    answer('HOST')
    await renewed

    expect(authStore.state.accessToken).toBe('')
    // Nothing stored to refresh with: the token endpoint is left alone.
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refreshes a stored session of its own when the provider is withdrawn while asked', async () => {
    authStore.state.refreshToken = 'own-RT'
    let answer: (token: string) => void = () => undefined
    setTokenProvider(owner, () => new Promise<string>((resolve) => (answer = resolve)))

    const renewed = newService().renewAccessToken()
    setTokenProvider(owner)
    answer('HOST')
    await renewed

    // As without a provider: an empty token is refreshed from the stored session.
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][1].body).toContain('refresh_token=own-RT')
    expect(authStore.state.accessToken).toBe('AT')
  })

  it('gives the caller the new provider’s token when it was replaced while asked', async () => {
    let answerOld: (token: string) => void = () => undefined
    let answerNew: (token: string) => void = () => undefined
    const replaced = jest.fn(() => new Promise<string>((resolve) => (answerOld = resolve)))
    const current = jest.fn(() => new Promise<string>((resolve) => (answerNew = resolve)))
    setTokenProvider(owner, replaced)

    // A flow's check is waiting on this one.
    let settled = false
    const renewed = newService()
      .renewAccessToken()
      .then(() => {
        settled = true
        return authStore.state.accessToken
      })
    // The host assigns a new function, which is asked straight away (the
    // element's watcher re-checks), and answers after the replaced one.
    setTokenProvider(owner, current)
    const recheck = newService().renewAccessToken()
    answerOld('OLD')
    await new Promise((resolve) => setTimeout(resolve))

    // Not done without a token: the flow waits for the new provider.
    expect(settled).toBe(false)
    answerNew('NEW')
    expect(await renewed).toBe('NEW')
    await recheck
    expect(authStore.state.isAuthorized).toBe(true)
    // Both callers shared the one question to the new provider.
    expect(current).toHaveBeenCalledTimes(1)
  })

  it('withdrawing the provider drops its token, but not one of the widget’s own', async () => {
    setTokenProvider(owner, () => Promise.resolve('HOST'))
    await newService().renewAccessToken()

    setTokenProvider(owner)

    expect(hasTokenProvider()).toBe(false)
    expect(authStore.state.accessToken).toBe('')
    expect(authStore.state.isAuthorized).toBe(false)

    authStore.state.accessToken = 'OWN'
    authStore.state.isAuthorized = true
    setTokenProvider(owner, () => Promise.resolve('HOST'))
    setTokenProvider(owner)
    expect(authStore.state.accessToken).toBe('OWN')
  })

  it('tells when the token in use is the one the provider gave', async () => {
    // Without a provider, the widget's own session.
    authStore.state.accessToken = 'OWN'
    expect(usesProvidedToken()).toBe(false)

    setTokenProvider(owner, () => Promise.resolve('HOST'))
    await newService().renewAccessToken()
    expect(usesProvidedToken()).toBe(true)

    // The provider has no token now, and the widget's own session takes over.
    authStore.state.refreshToken = 'own-RT'
    setTokenProvider(owner, () => Promise.resolve(null))
    await newService().renewAccessToken()
    expect(authStore.state.accessToken).toBe('AT')
    expect(usesProvidedToken()).toBe(false)

    // Withdrawn after it gave a token.
    setTokenProvider(owner, () => Promise.resolve('HOST'))
    await newService().renewAccessToken()
    setTokenProvider(owner)
    expect(usesProvidedToken()).toBe(false)
  })

  it('keeps asking the provider of an element that is still there', async () => {
    const other = {}
    setTokenProvider(other, () => Promise.resolve('OTHER'))
    setTokenProvider(owner, () => Promise.resolve('HOST'))

    // The most recent one is asked; once it is gone, the other one is.
    await newService().renewAccessToken()
    expect(authStore.state.accessToken).toBe('HOST')
    setTokenProvider(owner)
    await newService().renewAccessToken()
    expect(authStore.state.accessToken).toBe('OTHER')

    setTokenProvider(other)
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
