import { Component, Host, h, Prop, State, Event, EventEmitter } from '@stencil/core'
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
    if (this.hidelogin) {
      let checkClosedTimer = setInterval(() => {
        if (this.windowObjectReference.closed) {
          this.handleCancel()
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
      this.printShow.emit()
    })
  }

  handleCancel = () => {
    this.authCancel.emit()
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
      <ezp-progress status={i18next.t('login_page.login')}></ezp-progress>
    ) : (
      <Host>
        <div id="dialog">
          <div id="header">
            <ezp-icon-button onClick={this.handleCancel} icon="close" level="tertiary" />
          </div>
          <div id="content">
            <svg
              id="logo"
              width="90"
              height="90"
              viewBox="0 0 90 90"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M25.9211 72.1296L39.0613 43.8488L2.96326 7.63391L63.3276 47.3892L32.2619 24.5431L27.6516 11.4525L45.7004 29.5597L52.34 15.2706L89.3723 20.998L63.0241 20.7521L59.0129 29.385L52.4587 15.6081L63.7497 47.6674L25.7826 72.4275L20.8033 83.1445L16.7582 63.3739L30.0161 58.9423L25.9211 72.1296Z"
              />
            </svg>

            <ezp-label level="primary" weight="heavy" text={i18next.t('login_page.get_started')} />
            <ezp-label text={i18next.t('login_page.description')} />
            <ezp-text-button
              label={i18next.t('login_page.login')}
              id="button"
              onClick={() => {
                this.openSignInWindow(this.auth.authURI.toString(), 'ezeep Login')
              }}
            />
          </div>
        </div>
      </Host>
    )
  }
}
