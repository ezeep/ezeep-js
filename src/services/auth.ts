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
   * it answers `null` the token it gave is dropped, and a session of the
   * widget's own, if one is stored, is refreshed instead. When it rejects or
   * does not answer in time, a token it gave earlier is kept; without one this
   * is the same as `null`. So is an answer with a token the API rejected
   * (see `rememberRejectedToken`), which the provider is told about. Without
   * a provider this is `refreshTokens()`.
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
    const answer = await askProvider(provider, rejectedToken ? { rejected: rejectedToken } : {})
    if (provider !== tokenProvider) {
      // Replaced or withdrawn while it was being asked, so its answer no
      // longer counts. The caller, say a flow's session check, still needs
      // what applies now. Returning without a token would have that flow ask
      // a user who is signed in on the host to sign in again.
      if (tokenProvider) return this.renewAccessToken()
      // Withdrawn. Carry on as without a provider, which refreshes an empty
      // token from a stored session of the widget's own, and only then.
      if (authStore.state.accessToken === '' && authStore.state.refreshToken !== '') {
        return this.renewAccessToken()
      }
      return
    }

    // The token the API turned down is no answer at all: taking it back would
    // shut out a session of the widget's own, even one the user has just
    // signed in to. Any other token is used, and the rejection is forgotten.
    if (
      answer.answered &&
      typeof answer.token === 'string' &&
      answer.token !== '' &&
      answer.token !== rejectedToken
    ) {
      providedToken = answer.token
      rejectedToken = ''
      authStore.state.accessToken = answer.token
      authStore.state.isAuthorized = true
      return
    }

    // A rejection or no answer in time does not say that nobody is signed in,
    // only that the host could not tell just now. A token it gave earlier may
    // well still be valid, and the open print options depend on it, so it
    // stays until the next answer replaces it; a 401 asks again. Holding no
    // such token, or only the one the API rejected, this is the same as `null`.
    if (
      !answer.answered &&
      providedToken !== '' &&
      providedToken !== rejectedToken &&
      authStore.state.accessToken === providedToken
    )
      return

    // Nobody is signed in on the host, or its token is the one the API
    // rejected: a token it gave earlier must go. One
    // from a session of the widget's own stays until the refresh below
    // replaces it, as without a provider; dropping it first would send the
    // requests made meanwhile without any token.
    if (authStore.state.accessToken === providedToken) authStore.state.accessToken = ''
    providedToken = ''
    if (authStore.state.accessToken === '') authStore.state.isAuthorized = false
    if (authStore.state.refreshToken !== '') await this.refreshTokens()
  }

  /**
   * Spend the stored refresh token for a new access token. Callers with the
   * same refresh token share one grant in flight, whatever the provider: a
   * second grant with a token that is about to be rotated would fail, and may
   * look like reuse to the server. A caller with another refresh token (one
   * the host page hands in, say) gets its own grant.
   */
  refreshTokens(): Promise<void> {
    const refreshToken = authStore.state.refreshToken
    if (grantInFlight && grantInFlight.refreshToken === refreshToken) return grantInFlight.promise

    const promise: Promise<void> = fetch(this.accessTokenURL, {
      credentials: 'include',
      headers: this.oauthHeaders(),
      method: 'POST',
      body: encodeFormData({
        grant_type: 'refresh_token',
        scope: 'printing',
        refresh_token: refreshToken,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.access_token) return
        // What the result may replace is decided now, not when the grant
        // started: a provider may have been set, replaced or answered since.
        if (
          tokenProvider &&
          providedToken !== '' &&
          authStore.state.accessToken === providedToken
        ) {
          // The store holds the host's token, and this one may be for another
          // account: it must not replace the host's. The old refresh token is
          // spent, though, so keep the new one; the widget's own session is
          // the fallback when the provider has no token.
          this.refreshToken = data.refresh_token
          authStore.state.refreshToken = data.refresh_token
          storage.setRefreshToken(data.refresh_token)
          return
        }
        this.persistTokens(data.access_token, data.refresh_token)
      })
      .finally(() => {
        if (grantInFlight?.promise === promise) grantInFlight = undefined
      })
    grantInFlight = { refreshToken, promise }
    return promise
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
 * nobody is signed in. `rejected` is set, to that token, while the API has
 * turned down the token it gave last; the widget won't use that one again.
 * A function that takes no parameters fits too.
 */
export type TokenProvider = (request: { rejected?: string }) => Promise<string | null>

/**
 * How long the widget waits for the provider before it carries on as if it
 * had rejected. A host may take some 15 seconds for a silent refresh in a
 * hidden iframe, so this leaves room for that.
 */
export const TOKEN_PROVIDER_TIMEOUT_MS = 20_000

/**
 * What the provider said: its answer, or `answered: false` when it rejected
 * or did not answer in time, which says nothing about who is signed in.
 */
type ProviderAnswer = { answered: true; token: string | null } | { answered: false }

/**
 * Ask the provider, for no longer than `TOKEN_PROVIDER_TIMEOUT_MS`. A provider
 * that never answers would otherwise hold every later renewal, which shares
 * the call in flight, for the rest of the page's life. An answer that comes
 * after the wait is over is dropped.
 */
function askProvider(
  provider: TokenProvider,
  request: { rejected?: string },
): Promise<ProviderAnswer> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<ProviderAnswer>((resolve) => {
    timer = setTimeout(() => resolve({ answered: false }), TOKEN_PROVIDER_TIMEOUT_MS)
  })
  // Called right away, as before; a provider that throws counts as one that rejects.
  let answer: Promise<string | null>
  try {
    answer = Promise.resolve(provider(request))
  } catch (error) {
    answer = Promise.reject(error)
  }
  const said = answer.then(
    (token): ProviderAnswer => ({ answered: true, token }),
    (): ProviderAnswer => ({ answered: false }),
  )
  return Promise.race([said, timeout]).finally(() => clearTimeout(timer))
}

/**
 * The providers of the `ezp-printing` elements on the page, by element. The
 * token store is shared by all of them, so one provider is asked: the one set
 * most recently by an element that is still on the page.
 */
const tokenProviders = new Map<object, TokenProvider>()
let tokenProvider: TokenProvider | undefined
/** The token the provider gave last, to tell it apart from one of our own. */
let providedToken = ''
/**
 * A token the provider gave that the print API or the account service
 * answered 401 for. Passed back to it as `rejected`, and not used again,
 * until it answers with another token.
 */
let rejectedToken = ''
let renewInFlight: { provider?: TokenProvider; promise: Promise<void> } | undefined
/** The refresh-token grant in flight, shared by callers with the same refresh token. */
let grantInFlight: { refreshToken: string; promise: Promise<void> } | undefined
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
  if (tokenProvider) return
  rejectedToken = ''
  if (providedToken === '') return

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
 * Note that the print API or the account service answered 401 to a request
 * made with `token`. When that is the token the provider gave, the next
 * renewal tells the provider so, and won't take it back. Returns whether it
 * was. A 401 for a token of the widget's own session changes nothing here.
 */
export function rememberRejectedToken(token: string): boolean {
  if (!tokenProvider || token === '' || token !== providedToken) return false
  rejectedToken = token
  return true
}

/**
 * Whether the widget is signed in with the token the provider gave, rather
 * than with a session of its own. Logging out of the widget would then last
 * only until the next flow asks the provider again.
 */
export function usesProvidedToken(): boolean {
  // Read the store first, so a component that renders this re-renders when
  // the token changes, provider or not.
  const accessToken = authStore.state.accessToken
  return tokenProvider !== undefined && providedToken !== '' && accessToken === providedToken
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
