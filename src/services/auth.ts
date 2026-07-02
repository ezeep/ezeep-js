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
        // eslint-disable-next-line no-console
        console.log('[ezp:diag] token exchange response: access_token=', !!data.access_token, data)
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
