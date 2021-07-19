import { Component, Host, h, Prop, State, Event, EventEmitter } from '@stencil/core'
import { EzpAuthorizationService } from '../../services/auth'
import authStore from '../../services/auth'
@Component({
  tag: 'ezp-auth',
  styleUrl: 'ezp-auth.scss',
  shadow: true,
})
export class EzpAuth {
  @Prop({ mutable: true }) clientID: string
  @Prop({ mutable: true }) redirectURI: string
  @Prop() hidelogin: boolean
  @State() auth: EzpAuthorizationService
  @State() authURI: string
  @State() accessToken: string

  @Event() authCancel: EventEmitter<MouseEvent>
  @Event() printShow: EventEmitter

  windowObjectReference = null
  previousUrl = null

  openSignInWindow(url: string, name: string) {
    // remove any existing event listeners
    window.removeEventListener('message', this.receiveMessage)

    // window features
    const strWindowFeatures = 'toolbar=no, menubar=no, width=600, height=7000, top=100, left=100'

    if (this.windowObjectReference === null || this.windowObjectReference.closed) {
      /* if the pointer to the window object in memory does not exist
      or if such pointer exists but the window was closed */

      this.windowObjectReference = window.open(url, name, strWindowFeatures)
    } else if (this.previousUrl !== this.auth.authURI.toString()) {
      /* if the resource to load is different,
      then we load it in the already opened secondary window and then
      we bring such window back on top/in front of its parent window. */

      this.windowObjectReference = window.open(url, name, strWindowFeatures)
      this.windowObjectReference.focus()
    } else {
      /* else the window reference must exist and the window
     is not closed; therefore, we can bring it back on top of any other
     window with the focus() method. There would be no need to re-create
     the window or to reload the referenced resource. */

      this.windowObjectReference.focus()
    }
    
    // check if the window was closed and cancel login accordingly
    let checkClosedTimer = setInterval(() => {
      if (this.windowObjectReference.closed) {
        this.handleCancel()
        clearInterval(checkClosedTimer)
      }
    }, 500)
    
    // add the listener for receiving a message from the popup
    window.addEventListener('message', (event) => this.receiveMessage(event), false)

    this.previousUrl = this.auth.authURI
  }

  receiveMessage(event) {
    this.auth.code = event.data
    this.auth.getAccessToken().finally(() => {
      this.authCancel.emit()
      this.printShow.emit()
    })
  }


  handleCancel = () => {
    this.authCancel.emit()
  }

  async componentWillLoad() {
    this.auth = new EzpAuthorizationService(this.redirectURI, this.clientID)
    if (authStore.state.isAuthorized === false) {
      this.auth.generateCodeVerifier()
      await this.auth.generateCodeChallenge(authStore.state.codeVerifier)
      this.auth.buildAuthURI()
    }

    if (this.hidelogin) {
      this.openSignInWindow(this.auth.authURI.toString(), 'ezeep Login')
    }
  }

  render() {
    return this.hidelogin ? (
      <ezp-progress status="Logging in..."></ezp-progress>
    ) : (
      <Host>
        <div id="dialog">
          <div id="header">
            <ezp-icon-button onClick={this.handleCancel} icon="cross" level="tertiary" />
          </div>
          <div id="content">
            <ezp-icon id="icon" name="rocket" size="large" />
            <ips-heading level="quaternary">Get started</ips-heading>
            <ips-label>Quis et minima quae exercitationem cumque. Mollitia maiores sint.</ips-label>
            <ezp-text-button
              id="button"
              onClick={() => {
                this.openSignInWindow(this.auth.authURI.toString(), 'ezeep Login')
              }}
            >
              Login
            </ezp-text-button>
          </div>
        </div>
      </Host>
    )
  }
}

