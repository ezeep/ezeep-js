import { Component, Host, h, Prop } from '@stencil/core';

@Component({
  tag: 'ejs-auth',
  styleUrl: 'ejs-auth.css',
  shadow: true,
})
export class EjsAuth {

  @Prop() clientID: string;
  @Prop() redirectURI: string;
  @Prop({ mutable: true }) code: string;
  @Prop() authURI = new URL('https://account.dev.azdev.ezeep.com/oauth/authorize/');
  @Prop() urlParams = new URLSearchParams();
  @Prop({ mutable: true }) isAuthorized = false;
  @Prop() accessTokenURl = 'https://account.dev.azdev.ezeep.com/oauth/access_token/';
  @Prop({ mutable: true }) codeVerifier: string;
  @Prop({ mutable: true }) codeChallenge: string;
  @Prop() accessToken: string;
  @Prop() refreshToken: string;

  getCode(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('code')) {
      this.code = urlParams.get('code');
      return true;
    } else {
      return false;
    }
  }

  generateCodeVerifier(): string {
    const arr = new Uint8Array(128);
    const randomValueArray = crypto.getRandomValues(arr);
    const codeVerifier = btoa(randomValueArray.toString()).substr(0, 128);
    sessionStorage.setItem('codeVerifier', codeVerifier);
    return codeVerifier;
  }

  async generateCodeChallenge(codeVerifier: string): Promise<string> {
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
    this.urlParams.append('code_challenge', this.codeChallenge);
    this.urlParams.append('code_challenge_method', 'S256');
    this.authURI.search = this.urlParams.toString();
  }

  encodeFormData(data: { [x: string]: string | number | boolean; }): string {
    return Object.keys(data)
      .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
      .join('&');
  }

  getAccessToken() {
    fetch(this.accessTokenURl, {
      headers: {
        'Authorization': 'Basic ' + btoa(this.clientID + ':'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      body: this.encodeFormData({
        grant_type: 'authorization_code',
        scope: 'printing',
        code: this.code,
        redirect_uri: this.redirectURI,
        code_verifier: this.codeVerifier
      })
    }).then(response => {
      return response.json(); // parse response
    }).then(data => { // actual object
      if (data.access_token) {
        this.isAuthorized = true;
        sessionStorage.setItem('isAuthorized', this.isAuthorized.toString());

        this.accessToken = data.access_token;
        sessionStorage.setItem('access_token', this.accessToken)

        this.refreshToken = data.refresh_token;
        sessionStorage.setItem('refreshToken', this.refreshToken);
      }
    }); 
  }

  componentWillLoad() {
    if (sessionStorage.getItem('isAuthorized')) {
      this.isAuthorized = !!sessionStorage.getItem('isAuthorized');
    }

    if (this.isAuthorized === false) {
      if (this.getCode()) {
        this.codeVerifier = sessionStorage.getItem('codeVerifier');
        this.getAccessToken();
      } else {
        this.codeVerifier = this.generateCodeVerifier();
        this.generateCodeChallenge(this.codeVerifier)
          .then(challenge => {
            this.codeChallenge = challenge;
            this.buildAuthURI();
          })
      }
    }
  }

  render() {
    if (this.isAuthorized === false) {
      return (
        <Host>
          <a class="button" href={this.authURI.toString()}>Login</a>
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
