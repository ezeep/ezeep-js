import authStore, { EzpAuthorizationService } from './auth'

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
