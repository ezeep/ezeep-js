import { Component, Host, State, Listen, Method, h, Prop } from '@stencil/core'
import authStore, { sendCodeToParentWindow } from '../../services/auth'
import { EzpPrintService } from '../../services/print'


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
  @Prop() custom: boolean
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

  @Listen('printShow')
  listenPrintShow() {
    this.printOpen = true;
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
    const printService = new EzpPrintService(this.redirecturi, this.clientid);
    let accessToken = authStore.state.accessToken

    if (accessToken === '') {
      accessToken = sessionStorage.getItem('access_token')
      authStore.state.accessToken = accessToken
    }

    if (sessionStorage.getItem('isAuthorized')) {
      authStore.state.isAuthorized = !!sessionStorage.getItem('isAuthorized');
      this.authOpen = !authStore.state.isAuthorized;
    }
    printService
      .getConfig(authStore.state.accessToken)
      .catch(() => {
        authStore.state.isAuthorized = false;
      })
  }

  componentWillLoad() {
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
      <Host>
        {this.authOpen ? (
          <ezp-auth clientID={this.clientid} redirectURI={this.redirecturi}></ezp-auth>
        ) : this.printOpen ? (
          <ezp-printer-selection clientID={this.clientid} redirectURI={this.redirecturi} />
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
