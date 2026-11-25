import { createStore } from '@stencil/store'
import { encodeFormData } from '../utils/utils'
import { storage } from '../shared/storage'

export class EzpAuthorizationService {
  constructor(redirectURI: string, clientID: string) {
    this.redirectURI = redirectURI
    this.clientID = clientID
    // Mirror the client id into the store so a token refresh can be triggered
    // centrally (e.g. from the fetch helper) without a service instance.
    authStore.state.clientID = clientID

    this.oauthUrl = authStore.state.authApiHostUrl
    this.authURI = new URL(`https://${this.oauthUrl}/oauth/authorize/`)
    this.accessTokenURL = `https://${this.oauthUrl}/oauth/access_token/`
  }

  clientID: string
  redirectURI: string
  oauthUrl: string
  authURI: URL
  urlParams = new URLSearchParams()
  isAuthorized = false
  accessTokenURL: string
  codeVerifier: string
  codeChallenge: string
  accessToken: string
  refreshToken: string

  generateCodeVerifier() {
    if (authStore.state.codeVerifier !== '') {
      this.codeVerifier = authStore.state.codeVerifier
    } else {
      const arr = new Uint8Array(128)
      const randomValueArray = crypto.getRandomValues(arr)
      const codeVerifier = btoa(randomValueArray.toString()).substr(0, 128)
      this.codeVerifier = codeVerifier
      authStore.state.codeVerifier = this.codeVerifier
    }
  }

  async generateCodeChallenge(codeVerifier: string) {
    const encoder = new TextEncoder()
    const codeData = encoder.encode(codeVerifier)
    const digest = await crypto.subtle.digest('SHA-256', codeData)
    const base64Digest = btoa(String.fromCharCode(...new Uint8Array(digest)))
    this.codeChallenge = base64Digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }

  buildAuthURI() {
    this.urlParams.append('response_type', 'code')
    this.urlParams.append('client_id', this.clientID)
    this.urlParams.append('redirect_uri', this.redirectURI)
    this.urlParams.append('code_challenge', this.codeChallenge)
    this.urlParams.append('code_challenge_method', 'S256')
    this.authURI.search = this.urlParams.toString()
    authStore.state.authUri = this.authURI.toString()
  }

  /** Shared auth headers for the OAuth token endpoints (Basic auth, form body). */
  private oauthHeaders() {
    return {
      Authorization: 'Basic ' + btoa(this.clientID + ':'),
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  }

  /**
   * Persist tokens. The access token is kept in memory only (auth store +
   * instance field) — it is deliberately NOT written to localStorage, so an XSS
   * on the host page can't read it. Only the refresh token (needed to re-auth
   * after a reload) and the isAuthorized hint are persisted.
   */
  private persistTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken
    authStore.state.accessToken = accessToken

    this.refreshToken = refreshToken
    authStore.state.refreshToken = refreshToken
    storage.setRefreshToken(refreshToken)

    this.isAuthorized = true
    authStore.state.isAuthorized = true
    storage.setIsAuthorized(true)
  }

  /**
   * Exchange the authorization code for tokens. Three outcomes, which callers
   * must be able to tell apart:
   *
   * - resolves `true`: tokens were issued and stored;
   * - resolves `false`: the endpoint refused *the code* (`invalid_grant` —
   *   expired, already used, wrong verifier). Trying again cannot help;
   * - rejects: nothing is known about the code — the request never completed,
   *   or the endpoint answered with any other error. Trying again may work.
   */
  getAccessToken(): Promise<boolean> {
    return fetch(this.accessTokenURL, {
      credentials: 'include',
      headers: this.oauthHeaders(),
      method: 'POST',
      body: encodeFormData({
        grant_type: 'authorization_code',
        scope: 'printing',
        code: authStore.state.code,
        redirect_uri: this.redirectURI,
        code_verifier: authStore.state.codeVerifier,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.access_token) {
          this.persistTokens(data.access_token, data.refresh_token)
          // Remember which code produced this session: it is spent now.
          authStore.state.exchangedCode = authStore.state.code
          return true
        }
        if (data.error === 'invalid_grant') return false
        // Only the endpoint's own error code is quoted — never the code,
        // verifier or anything else from the request.
        throw new Error(`Token endpoint error: ${data.error ?? 'unexpected response'}`)
      })
  }

  /**
   * Put a new access token into the store, from wherever this page gets one.
   *
   * With a host token provider (see `setTokenProvider`) the provider is asked.
   * Its token is kept in memory only; nothing is written to localStorage. When
   * it has none (`null`, or it rejects) the in-memory token is dropped, and a
   * session of the widget's own, if one is stored, is refreshed instead.
   * Without a provider this is `refreshTokens()`.
   *
   * Callers share one attempt while it runs, so a burst of them never asks
   * the provider, or spends the refresh token, more than once.
   */
  renewAccessToken(): Promise<void> {
    const provider = tokenProvider
    if (renewInFlight && renewInFlight.provider === provider) return renewInFlight.promise

    const promise: Promise<void> = (
      provider ? this.renewFromProvider(provider) : this.refreshTokens()
    ).finally(() => {
      if (renewInFlight?.promise === promise) renewInFlight = undefined
    })
    renewInFlight = { provider, promise }
    return promise
  }

  private async renewFromProvider(provider: TokenProvider): Promise<void> {
    let token: string | null = null
    try {
      token = await provider()
    } catch {
      // A provider that fails has no token to give: same as `null`.
    }
    // Replaced or removed while it was being asked: its answer no longer counts.
    if (provider !== tokenProvider) return

    if (typeof token === 'string' && token !== '') {
      providedToken = token
      authStore.state.accessToken = token
      authStore.state.isAuthorized = true
      return
    }

    // Nobody is signed in on the host: a token it gave earlier must go. One
    // from a session of the widget's own stays until the refresh below
    // replaces it, as without a provider; dropping it first would send the
    // requests made meanwhile without any token.
    if (authStore.state.accessToken === providedToken) authStore.state.accessToken = ''
    providedToken = ''
    if (authStore.state.accessToken === '') authStore.state.isAuthorized = false
    if (authStore.state.refreshToken !== '') await this.refreshTokens()
  }

  refreshTokens() {
    return fetch(this.accessTokenURL, {
      credentials: 'include',
      headers: this.oauthHeaders(),
      method: 'POST',
      body: encodeFormData({
        grant_type: 'refresh_token',
        scope: 'printing',
        refresh_token: authStore.state.refreshToken,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.access_token) {
          this.persistTokens(data.access_token, data.refresh_token)
        }
      })
  }

  revokeRefreshToken() {
    if (authStore.state.refreshToken)
      fetch(`https://${this.oauthUrl}/oauth/revoke/`, {
        credentials: 'include',
        headers: this.oauthHeaders(),
        method: 'POST',
        body: encodeFormData({
          token: authStore.state.refreshToken,
        }),
      }).catch(() => {
        // Revocation is best-effort; ignore network failures.
      })
  }
}

const authStore = createStore({
  code: '',
  /** The authorization code the current session was obtained with (in memory only). */
  exchangedCode: '',
  codeVerifier: '',
  accessToken: '',
  refreshToken: '',
  isAuthorized: false,
  devApi: false,
  authApiHostUrl: '',
  redirectUri: '',
  authUri: '',
  clientID: '',
})

export default authStore

/**
 * A host page's way to hand over the access token of its signed-in user (see
 * the `tokenProvider` property of `ezp-printing`). Resolves to `null` when
 * nobody is signed in.
 */
export type TokenProvider = () => Promise<string | null>

/**
 * The providers of the `ezp-printing` elements on the page, by element. The
 * token store is shared by all of them, so one provider is asked: the one set
 * most recently by an element that is still on the page.
 */
const tokenProviders = new Map<object, TokenProvider>()
let tokenProvider: TokenProvider | undefined
/** The token the provider gave last, to tell it apart from one of our own. */
let providedToken = ''
let renewInFlight: { provider?: TokenProvider; promise: Promise<void> } | undefined
let authCheck: Promise<unknown> | undefined

/**
 * Set, replace or (without `provider`) withdraw the token provider of `owner`.
 * Once no provider is left, a token one of them gave is dropped from memory,
 * so the widget goes back to its own sign-in.
 */
export function setTokenProvider(owner: object, provider?: TokenProvider): void {
  tokenProviders.delete(owner)
  if (typeof provider === 'function') tokenProviders.set(owner, provider)

  tokenProvider = Array.from(tokenProviders.values()).pop()
  if (tokenProvider || providedToken === '') return

  if (authStore.state.accessToken === providedToken) {
    authStore.state.accessToken = ''
    authStore.state.isAuthorized = false
  }
  providedToken = ''
}

export function hasTokenProvider(): boolean {
  return tokenProvider !== undefined
}

/**
 * The session check a flow has just started, for `ezp-auth` to wait for
 * before it decides between going straight on and asking the user to sign
 * in. Undefined once it has settled.
 */
export function pendingAuthCheck(): Promise<unknown> | undefined {
  return authCheck
}

export function setPendingAuthCheck(check: Promise<unknown>): void {
  authCheck = check
  const settle = () => {
    if (authCheck === check) authCheck = undefined
  }
  check.then(settle, settle)
}

export function sendCodeToParentWindow() {
  // get the URL parameters which will include the auth code
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  if (window.opener) {
    if (code) {
      // send them to the opening window
      window.opener.postMessage(code, authStore.state.redirectUri)
      window.close()
    }
  }
}
