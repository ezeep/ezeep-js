import { Component, Host, h, Prop } from '@stencil/core';
import { EjsAuthorization } from '../../services/auth';

@Component({
  tag: 'ejs-auth',
  styleUrl: 'ejs-auth.css',
  shadow: true,
})
export class EjsAuth {
  @Prop({mutable: true}) clientID: string;
  @Prop({mutable: true}) redirectURI: string;
  @Prop({mutable: true}) auth: EjsAuthorization;
  @Prop({mutable: true}) authURI: string;

  

  async componentWillLoad() {
    this.auth = new EjsAuthorization(this.redirectURI, this.clientID);

    if (sessionStorage.getItem('isAuthorized')) {
      this.auth.isAuthorized = !!sessionStorage.getItem('isAuthorized');
    }

    if (this.auth.isAuthorized === false) {
      if (this.auth.setCodeFromURL()) {
        this.auth.codeVerifier = sessionStorage.getItem('codeVerifier');
        this.auth.getAccessToken();
      } else {
        this.auth.generateCodeVerifier();
        console.log(this.auth.codeVerifier);
        await this.auth.generateCodeChallenge(this.auth.codeVerifier);
        this.auth.buildAuthURI();
        console.log(this.auth.authURI.toString());
      }
    }
  }

  getConfiguration() {
    fetch('https://printapi.dev.azdev.ezeep.com/sfapi/GetConfiguration/', {
      method: 'GET',
      headers: {
        'Authorization' : 'Bearer ' + sessionStorage.getItem('access_token')
      }
    }).then( response => response.json()).then(data => console.log(data));
  }

  render() {
    if (this.auth.isAuthorized === false) {
      return (
        <Host>
          <a class="button" href={this.auth.authURI.toString()}>Login</a>
        </Host>
      );
    } else {
      return (
        <Host>
          <p>Logged in!</p>
          <button onClick={this.getConfiguration}>get config</button>
        </Host>
      )
    }
  }
}
