import { createStore } from '@stencil/store'
import { encodeFormData } from '../utils/utils'
import { storage } from '../shared/storage'

/** base64url-encode raw bytes (RFC 4648 §5, no padding) for PKCE values. */
function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  // Build the binary string in a loop rather than `String.fromCharCode.apply`,
  // which overflows the call stack for large inputs.
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

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
      // High-entropy, spec-compliant PKCE verifier: 64 random bytes encoded as
      // base64url yields ~86 chars (within the 43-128 char range of RFC 7636).
      const randomBytes = crypto.getRandomValues(new Uint8Array(64))
      this.codeVerifier = base64UrlEncode(randomBytes)
      authStore.state.codeVerifier = this.codeVerifier
    }
  }

  async generateCodeChallenge(codeVerifier: string) {
    const codeData = new TextEncoder().encode(codeVerifier)
    const digest = await crypto.subtle.digest('SHA-256', codeData)
    this.codeChallenge = base64UrlEncode(new Uint8Array(digest))
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

  /** Persist tokens to the auth store, instance fields and localStorage. */
  private persistTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken
    authStore.state.accessToken = accessToken
    storage.setAccessToken(accessToken)

    this.refreshToken = refreshToken
    authStore.state.refreshToken = refreshToken
    storage.setRefreshToken(refreshToken)

    this.isAuthorized = true
    authStore.state.isAuthorized = true
    storage.setIsAuthorized(true)
  }

  getAccessToken() {
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
        }
      })
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
