import { Component, Host, h, Prop, State } from '@stencil/core'
import { EjsAuthorizationService } from '../../services/auth'
// import authStore from '../../services/auth'
@Component({
  tag: 'ejs-auth',
  styleUrl: 'ejs-auth.css',
  shadow: true,
})
export class EjsAuth {
  @Prop({ mutable: true }) clientID: string
  @Prop({ mutable: true }) redirectURI: string
  @State() auth: EjsAuthorizationService
  @State() authURI: string
  @State() accessToken: string
  windowObjectReference = null;
  previousUrl = null;

  openSignInWindow(url: string, name: string) {
    // remove any existing event listeners
    window.removeEventListener('message', this.receiveMessage);
    // window features
    const strWindowFeatures = 'toolbar=no, menubar=no, width=600, height=7000, top=100, left=100';

    if (this.windowObjectReference === null || this.windowObjectReference.closed) {
      /* if the pointer to the window object in memory does not exist
      or if such pointer exists but the window was closed */
      this.windowObjectReference = window.open(url, name, strWindowFeatures);
    } else if (this.previousUrl !== this.auth.authURI.toString()) {
      /* if the resource to load is different,
      then we load it in the already opened secondary window and then
      we bring such window back on top/in front of its parent window. */
      this.windowObjectReference = window.open(url, name, strWindowFeatures);
      this.windowObjectReference.focus();
    } else {
      /* else the window reference must exist and the window
     is not closed; therefore, we can bring it back on top of any other
     window with the focus() method. There would be no need to re-create
     the window or to reload the referenced resource. */
      this.windowObjectReference.focus();
    }

    // add the listener for receiving a message from the popup
    window.addEventListener('message', event => this.receiveMessage(event), false);

    this.previousUrl = this.auth.authURI;
  }

  receiveMessage(event) {
    this.auth.code = event.data;
    console.log(this.auth.code);
    this.auth.getAccessToken();
  }

  async componentWillLoad() {
    this.auth = new EjsAuthorizationService(this.redirectURI, this.clientID)

    if (sessionStorage.getItem('isAuthorized')) {
      this.auth.isAuthorized = !!sessionStorage.getItem('isAuthorized')
      /*  this.accessToken = authStore.state.accessToken;
      console.log(this.accessToken); */
    }

    if (this.auth.isAuthorized === false) {
      if (this.auth.setCodeFromURL()) {
        this.auth.codeVerifier = sessionStorage.getItem('codeVerifier')
        this.auth.getAccessToken()
      } else {
        this.auth.generateCodeVerifier()
        console.log(this.auth.codeVerifier)
        await this.auth.generateCodeChallenge(this.auth.codeVerifier)
        this.auth.buildAuthURI()
        console.log(this.auth.authURI.toString())
      }
    }
  }

  getConfiguration() {
    fetch('https://printapi.dev.azdev.ezeep.com/sfapi/GetConfiguration/', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + sessionStorage.getItem('access_token'),
      },
    })
      .then((response) => response.json())
      .then((data) => console.log(data))
  }

  getPrinterList() {
    fetch('https://printapi.dev.azdev.ezeep.com/sfapi/GetPrinter/', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + sessionStorage.getItem('access_token'),
      },
    })
      .then((response) => response.json())
      .then((data) => console.log(data))
  }

  render() {
    if (this.auth.isAuthorized === false) {
      return (
        <Host>
          <a class="button" href={this.auth.authURI.toString()}>
            Login
          </a>
          <button onClick={() => {this.openSignInWindow(this.auth.authURI.toString(),'ezeep Login')}} >Login in popup</button>
        </Host>
      )
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

