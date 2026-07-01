import { Component, Host, h, Prop, State, Event, EventEmitter, Listen } from '@stencil/core'
import { EzpAuthorizationService } from '../../services/auth'
import authStore from '../../services/auth'
import i18next from 'i18next'
@Component({
  tag: 'ezp-auth',
  styleUrl: 'ezp-auth.scss',
  shadow: true,
})
export class EzpAuth {
  @Prop({ mutable: true }) clientID: string
  @Prop({ mutable: true }) redirectURI: string
  @Prop() hidelogin: boolean
  @Prop() trigger: string
  @Prop() code: string

  @State() auth: EzpAuthorizationService
  @State() authURI: string
  @State() accessToken: string

  @Event() authCancel: EventEmitter<MouseEvent>
  @Event() authSuccess: EventEmitter<void>
  @Event() userCancel: EventEmitter<void>

  @Listen('dialogAction')
  listenDialogAction() {
    this.openSignInWindow(this.auth.authURI.toString(), 'ezeep Login')
  }

  @Listen('dialogClose')
  listenDialogClose() {
    this.authCancel.emit()
  }

  @Listen('statusCancel')
  listenStatusCancel() {
    this.authCancel.emit()
  }

  oauthPopupWindow: Window | null = null
  previousUrl: string | URL | null = null

  openSignInWindow(url: string, name: string) {
    if (authStore.state.isAuthorized) {
      this.authCancel.emit()
      this.authSuccess.emit()
      return
    }

    // remove any existing event listeners
    window.removeEventListener('message', this.receiveMessage)

    // window features
    const windowFeatures = 'toolbar=no, menubar=no, width=600, height=7000, top=100, left=100'

    if (this.oauthPopupWindow === null || this.oauthPopupWindow.closed) {
      /* if the pointer to the window object in memory does not exist
      or if such pointer exists but the window was closed */

      this.oauthPopupWindow = window.open(url, name, windowFeatures)
    } else if (this.previousUrl !== this.auth.authURI.toString()) {
      /* if the resource to load is different,
      then we load it in the already opened secondary window and then
      we bring such window back on top/in front of its parent window. */

      this.oauthPopupWindow = window.open(url, name, windowFeatures)

      if (
        !this.oauthPopupWindow ||
        this.oauthPopupWindow.closed ||
        typeof this.oauthPopupWindow.closed == 'undefined'
      ) {
        alert('popup blocked')
      }

      this.oauthPopupWindow?.focus()
    } else {
      /* else the window reference must exist and the window
     is not closed; therefore, we can bring it back on top of any other
     window with the focus() method. There would be no need to re-create
     the window or to reload the referenced resource. */

      this.oauthPopupWindow.focus()
    }

    // Add the listener for receiving a message from the popup. Use the bound
    // property (not an inline arrow) so the matching removeEventListener above
    // actually removes it — otherwise a listener leaks on every sign-in.
    window.addEventListener('message', this.receiveMessage, false)

    this.previousUrl = this.auth.authURI
  }

  receiveMessage = (event: MessageEvent) => {
    authStore.state.code = event.data
    this.auth.getAccessToken().then(() => {
      this.authCancel.emit()
      this.authSuccess.emit()
    })
  }

  disconnectedCallback() {
    window.removeEventListener('message', this.receiveMessage)
  }

  async componentWillLoad() {
    this.auth = new EzpAuthorizationService(this.redirectURI, this.clientID)

    if (this.code) {
      authStore.state.code = this.code
      await this.auth.getAccessToken()
      this.authCancel.emit()
      this.authSuccess.emit()
    }

    if (authStore.state.isAuthorized === false) {
      this.auth.generateCodeVerifier()
      await this.auth.generateCodeChallenge(authStore.state.codeVerifier)
      this.auth.buildAuthURI()
    }

    if (this.hidelogin && this.trigger === 'button') {
      this.openSignInWindow(this.auth.authURI.toString(), 'ezeep Login')
    }
  }

  render() {
    return (
      <Host>
        {this.hidelogin && this.trigger === 'button' ? (
          <ezp-status description={i18next.t('login_dialog.action')} processing cancel></ezp-status>
        ) : this.hidelogin && this.trigger === 'file' ? (
          <div class="auth-actions">
            <ezp-text-button
              type="button"
              level="secondary"
              onClick={() => this.userCancel.emit()}
              label={i18next.t('button_actions.cancel')}
            />
            <ezp-text-button
              type="button"
              level="primary"
              onClick={() => this.openSignInWindow(this.auth.authURI.toString(), 'ezeep Login')}
              label={i18next.t('button_actions.select_printer')}
            />
          </div>
        ) : (
          <ezp-dialog
            heading={i18next.t('login_dialog.heading')}
            description={i18next.t('login_dialog.description')}
            action={i18next.t('login_dialog.action')}
            iconName="logo"
            iconSize="huge"
            iconFramed={false}
            instance="login"
          />
        )}
      </Host>
    )
  }
}
