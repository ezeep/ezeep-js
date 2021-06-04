import { Component, Host, h, Prop, State } from '@stencil/core';
import { EjsAuthorizationService } from '../../services/auth';
// import authStore from '../../services/auth'
@Component({
  tag: 'ejs-auth',
  styleUrl: 'ejs-auth.css',
  shadow: true,
})
export class EjsAuth {
  @Prop({mutable: true}) clientID: string;
  @Prop({mutable: true}) redirectURI: string;
  @State() auth: EjsAuthorizationService;
  @State() authURI: string;
  @State() accessToken: string;
  

  async componentWillLoad() {
    this.auth = new EjsAuthorizationService(this.redirectURI, this.clientID);

    if (sessionStorage.getItem('isAuthorized')) {
      this.auth.isAuthorized = !!sessionStorage.getItem('isAuthorized');
     /*  this.accessToken = authStore.state.accessToken;
      console.log(this.accessToken); */
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
    }).then(response => response.json()).then(data => console.log(data));
  }

  getPrinterList() {
    fetch('https://printapi.dev.azdev.ezeep.com/sfapi/GetPrinter/', {
      method: 'GET',
      headers: {
        'Authorization' : 'Bearer ' + sessionStorage.getItem('access_token')
      }
    }).then(response => response.json()).then(data => console.log(data));
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
          <button onClick={this.getPrinterList}>get printers</button>
        </Host>
      )
    }
  }
}
