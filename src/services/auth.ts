import { createStore } from '@stencil/store'

export class EjsAuthorizationService {
  constructor(redirectURI: string, clientID: string) {
    this.redirectURI = redirectURI
    this.clientID = clientID
  }

  clientID: string
  redirectURI: string
  code: string
  authURI = new URL('https://account.dev.azdev.ezeep.com/oauth/authorize/')
  urlParams = new URLSearchParams()
  isAuthorized = false
  accessTokenURl = 'https://account.dev.azdev.ezeep.com/oauth/access_token/'
  codeVerifier: string
  codeChallenge: string
  accessToken: string
  refreshToken: string

  generateCodeVerifier() {
    if (authStore.state.codeVerifier !== '') {
      this.codeVerifier = authStore.state.codeVerifier;
    } else {
      const arr = new Uint8Array(128);
      const randomValueArray = crypto.getRandomValues(arr);
      const codeVerifier = btoa(randomValueArray.toString()).substr(0, 128);
      this.codeVerifier = codeVerifier;
      authStore.state.codeVerifier = this.codeVerifier;
    }
  }

  async generateCodeChallenge(codeVerifier: string) {
    const encoder = new TextEncoder();
    const codeData = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', codeData);
    const base64Digest = btoa(String.fromCharCode.apply(null, new Uint8Array(digest)));
    this.codeChallenge = base64Digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  buildAuthURI() {
    this.urlParams.append('response_type', 'code');
    this.urlParams.append('client_id', this.clientID);
    this.urlParams.append('redirect_uri', this.redirectURI);
    this.urlParams.append('code_challenge', this.codeChallenge);
    this.urlParams.append('code_challenge_method', 'S256');
    this.authURI.search = this.urlParams.toString();
  }

  encodeFormData(data: { [x: string]: string | number | boolean }): string {
    return Object.keys(data)
      .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
      .join('&');
  }

  getAccessToken() {
    fetch(this.accessTokenURl, {
      headers: {
        Authorization: 'Basic ' + btoa(this.clientID + ':'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
      body: this.encodeFormData({
        grant_type: 'authorization_code',
        scope: 'printing',
        code: this.code,
        redirect_uri: this.redirectURI,
        code_verifier: this.codeVerifier,
      }),
    })
      .then((response) => {
        return response.json(); // parse response
      })
      .then((data) => {
        // actual object
        if (data.access_token) {
          authStore.state.isAuthorized = true;
          // sessionStorage.setItem('isAuthorized', this.isAuthorized.toString())

          this.accessToken = data.access_token;
          // sessionStorage.setItem('access_token', this.accessToken)
          authStore.state.accessToken = this.accessToken;

          this.refreshToken = data.refresh_token;
          // sessionStorage.setItem('refreshToken', this.refreshToken)
          authStore.state.refreshToken = this.refreshToken;
        }
      })
  }

  getRefreshToken() {}
}

const authStore = createStore({
  codeVerifier: '',
  accessToken: '',
  refreshToken: '',
  isAuthorized: false
})

export default authStore;

export function sendCodeToParentWindow() {
  // get the URL parameters which will include the auth code
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (window.opener) {
    // send them to the opening window
    window.opener.postMessage(code);
    window.close();
  }
};
