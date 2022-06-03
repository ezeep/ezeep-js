import { createStore } from '@stencil/store'
import { encodeFormData } from '../utils/utils'

export class EzpAuthorizationService {
  constructor(redirectURI: string, clientID: string) {
    this.redirectURI = redirectURI
    this.clientID = clientID

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
    const base64Digest = btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
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

  getAccessToken() {
    return fetch(this.accessTokenURL, {
      credentials: 'include',
      headers: {
        Authorization: 'Basic ' + btoa(this.clientID + ':'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
      body: encodeFormData({
        grant_type: 'authorization_code',
        scope: 'printing',
        code: authStore.state.code,
        redirect_uri: this.redirectURI,
        code_verifier: authStore.state.codeVerifier,
      }),
    })
      .then((response) => {
        return response.json() // parse response
      })
      .then((data) => {
        // actual object
        if (data.access_token) {
          authStore.state.isAuthorized = true
          this.isAuthorized = authStore.state.isAuthorized
          localStorage.setItem('isAuthorized', this.isAuthorized.toString())

          this.accessToken = data.access_token
          localStorage.setItem('access_token', this.accessToken)
          authStore.state.accessToken = this.accessToken

          this.refreshToken = data.refresh_token
          localStorage.setItem('refreshToken', this.refreshToken)
          authStore.state.refreshToken = this.refreshToken
        }
      })
  }

  refreshTokens() {
    fetch(this.accessTokenURL, {
      credentials: 'include',
      headers: {
        Authorization: 'Basic ' + btoa(this.clientID + ':'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
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
          this.accessToken = data.access_token
          localStorage.setItem('access_token', this.accessToken)
          authStore.state.accessToken = this.accessToken

          this.refreshToken = data.refresh_token
          localStorage.setItem('refreshToken', this.refreshToken)
          authStore.state.refreshToken = this.refreshToken

          authStore.state.isAuthorized = true
        }
      })
  }

  revokeRefreshToken() {
    fetch(`https://${this.oauthUrl}/oauth/revoke/`, {
      credentials: 'include',
      headers: {
        Authorization: 'Basic ' + btoa(this.clientID + ':'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
      body: encodeFormData({
        token: authStore.state.refreshToken,
      }),
    }).then((response) => {
      console.log(response)
    }).catch((error) => {
      console.log(error)
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
  authUri: ''
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
