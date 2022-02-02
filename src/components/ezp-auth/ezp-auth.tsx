import { Component, Host, h, Prop, State, Event, EventEmitter, Listen } from '@stencil/core'
import { EzpAuthorizationService } from '../../services/auth'
import authStore from '../../services/auth'
import i18next from 'i18next'
import { initi18n } from '../../utils/utils'

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
  @Event() authSuccess: EventEmitter

  @Listen('dialogAction')
  listenDialogAction() {
    this.openSignInWindow(this.auth.authURI.toString(), 'ezeep Login')
  }

  @Listen('dialogClose')
  listenDialogClose() {
    this.authCancel.emit()
  }

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
    if (this.hidelogin) {
      let checkClosedTimer = setInterval(() => {
        if (this.windowObjectReference.closed) {
          this.authCancel.emit()
          clearInterval(checkClosedTimer)
        }
      }, 500)
    }

    // add the listener for receiving a message from the popup
    window.addEventListener('message', (event) => this.receiveMessage(event), false)

    this.previousUrl = this.auth.authURI
  }

  receiveMessage(event) {
    this.auth.code = event.data
    this.auth.getAccessToken().finally(() => {
      this.authCancel.emit()
      this.authSuccess.emit()
    })
  }

  async componentWillLoad() {
    initi18n()
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
      <ezp-status description={i18next.t('login_page.login')}></ezp-status>
    ) : (
      <Host>
        <ezp-dialog
          heading={i18next.t('login_page.get_started')}
          description={i18next.t('login_page.description')}
          action={i18next.t('login_page.login')}
          iconName="logo"
          iconSize="huge"
          iconFramed={false}
        />
      </Host>
    )
  }
}
