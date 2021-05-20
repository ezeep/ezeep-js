import { Component, Host, h, Prop } from '@stencil/core';

@Component({
  tag: 'ejs-auth',
  styleUrl: 'ejs-auth.css',
  shadow: true,
})
export class EjsAuth {

  @Prop() clientID: string;
  @Prop() redirectURI: string;
  code: string;
  authURI = new URL('https://account.ezeep.com/oauth/authorize');
  urlParams = new URLSearchParams();
  isAuthorized = false;
  accessTokenURl = 'https://account.ezeep.com/oauth/access_token';
  codeVerifier: string;
  codeChallenge: string;

  getCode(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('code')) {
      this.code = urlParams.get('code');
      return true;
    } else {
      return false;
    }
  }

  generateCodeVerifier() {
    const arr = new Uint8Array(128);
    const randomValueArray = crypto.getRandomValues(arr);
    const codeVerifier = btoa(randomValueArray.toString()).substr(0, 128);
    console.log(this.codeVerifier);
    return codeVerifier;
  }

  async generateCodeChallenge(codeVerifier: string) {
    const encoder = new TextEncoder;
    const codeData = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', codeData);
    const base64Digest = btoa(String.fromCharCode.apply(null, new Uint8Array(digest)));

    return base64Digest
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  buildAuthURI(): void {
    this.urlParams.append('response_type', 'code');
    this.urlParams.append('client_id', this.clientID);
    this.urlParams.append('redirect_uri', this.redirectURI);
    this.authURI.search = this.urlParams.toString();
  }

  getAccessToken() {
    fetch(this.accessTokenURl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(this.clientID)
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        scope: 'printing',
        code: this.code,
        redirect_uri: this.redirectURI
      })
    }
    )
      .then(response => console.log(response.json()));
  }

  componentWillLoad() {
    if (this.getCode()) {
      this.getAccessToken();
    } else {
      this.buildAuthURI();
    }

  }

  render() {
    if (!this.isAuthorized) {
      return (
        <Host>
          <a class="button" href={this.authURI.toString()}>Login</a>
          <button onClick={this.generateCodeVerifier}>generateCodeVerifier</button>
        </Host>
      );
    } else {
      return (
        <Host>
          <p>Logged in!</p>
        </Host>
      )
    }

  }

}
