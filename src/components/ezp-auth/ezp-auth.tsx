import { Component, Host, h, Prop, State } from '@stencil/core'
import { EzpAuthorizationService } from '../../services/auth'
import authStore from '../../services/auth'
@Component({
  tag: 'ezp-auth',
  styleUrl: 'ezp-auth.css',
  shadow: true,
})
export class EzpAuth {
  @Prop({ mutable: true }) clientID: string;
  @Prop({ mutable: true }) redirectURI: string;
  @State() auth: EzpAuthorizationService;
  @State() authURI: string;
  @State() accessToken: string;
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
    this.auth.getAccessToken();
  }

  async componentWillLoad() {
    this.auth = new EzpAuthorizationService(this.redirectURI, this.clientID);
    if (authStore.state.isAuthorized === false) {
      this.auth.generateCodeVerifier();
      await this.auth.generateCodeChallenge(authStore.state.codeVerifier);
      this.auth.buildAuthURI();
    }
  }

  getConfiguration() {
    fetch('https://printapi.dev.azdev.ezeep.com/sfapi/GetConfiguration/', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + authStore.state.accessToken,
      },
    })
      .then((response) => response.json())
      .then((data) => console.log(data))
  }

  getPrinterList() {
    fetch('https://printapi.dev.azdev.ezeep.com/sfapi/GetPrinter/', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + authStore.state.accessToken,
      },
    })
      .then((response) => response.json())
      .then((data) => console.log(data))
  }

  render() {
    if (authStore.state.isAuthorized === false) {
      return (
        <Host>
          <button onClick={() => { this.openSignInWindow(this.auth.authURI.toString(), 'ezeep Login') }} >Login</button>
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

