import { Component, Host, State, Listen, Method, h, Prop } from '@stencil/core'
import authStore, { sendCodeToParentWindow } from '../../services/auth'
import printStore, { EzpPrintService } from '../../services/print'
import userStore from '../../services/user'
import config from '../../shared/config.json'

@Component({
  tag: 'ezp-printing',
  styleUrl: 'ezp-printing.scss',
  shadow: true,
})
export class EzpPrinting {
  @Prop() clientid: string
  @Prop() redirecturi: string
  @Prop() filename: string
  @Prop() fileurl: string
  @Prop() filetype: string
  @Prop() custom: boolean
  @Prop() hidelogin: boolean
  @Prop() authapihosturl: string
  @Prop() printapihosturl: string

  /**
   *
   * States
   *
   */

  /** Description... */
  @State() printOpen: boolean = false
  @State() authOpen: boolean = false

  /**
   *
   * Listeners
   *
   */

  /** Description... */
  @Listen('printCancel')
  listenPrintCancel() {
    this.printOpen = false
  }

  /** Description... */
  @Listen('printSubmit')
  listenPrintSubmit() {
    this.printOpen = false
  }

  /** Description... */
  @Listen('authCancel')
  listenAuthCancel() {
    this.authOpen = false
  }

  @Listen('authShow')
  listenAuthShow() {
    this.authOpen = true
  }

  @Listen('printShow')
  listenPrintShow() {
    this.printOpen = true
  }

  /**
   *
   * Public methods
   *
   */

  @Method()
  async open() {
    if (authStore.state.isAuthorized) {
      this.printOpen = true
    } else {
      this.authOpen = true
    }
  }

  checkAuth() {
    const printService = new EzpPrintService(this.redirecturi, this.clientid)

    let accessToken = authStore.state.accessToken

    if (accessToken === '') {
      accessToken = localStorage.getItem('access_token')
      authStore.state.accessToken = accessToken
    }

    if (localStorage.getItem('isAuthorized')) {
      authStore.state.isAuthorized = !!localStorage.getItem('isAuthorized')
      this.authOpen = !authStore.state.isAuthorized
    }
    printService.getConfig(authStore.state.accessToken).catch(() => {
      authStore.state.isAuthorized = false
    })
  }

  componentWillLoad() {
    authStore.state.redirectUri = this.redirecturi

    if (this.authapihosturl) {
      authStore.state.authApiHostUrl = this.authapihosturl
    } else {
      authStore.state.authApiHostUrl = config.authApiHostUrl
    }

    if (this.printapihosturl) {
      printStore.state.printApiHostUrl = this.printapihosturl
    } else {
      printStore.state.printApiHostUrl = config.printingApiHostUrl
    }

    sendCodeToParentWindow()
    this.checkAuth()
  }

  /**
   *
   * Render method
   *
   */

  render() {
    return (
      <Host class={userStore.state.theme}>
        {this.authOpen ? (
          <ezp-auth
            clientID={this.clientid}
            redirectURI={this.redirecturi}
            hidelogin={this.hidelogin}
          ></ezp-auth>
        ) : this.printOpen ? (
          <ezp-printer-selection
            clientID={this.clientid}
            redirectURI={this.redirecturi}
            filename={this.filename}
            fileurl={this.fileurl}
            filetype={this.filetype}
          />
        ) : this.custom ? (
          <slot></slot>
        ) : (
          <ezp-icon-button
            id="print-trigger"
            icon="printer"
            slot="trigger"
            type="button"
            onClick={() => this.open()}
          ></ezp-icon-button>
        )}
      </Host>
    )
  }
}
