import { Component, Host, State, Listen, Method, h, Prop } from '@stencil/core'
import { sendCodeToParentWindow } from '../../services/auth'

@Component({
  tag: 'ejs-root',
  styleUrl: 'ejs-root.scss',
  shadow: true,
})
export class EjsRoot {
  @Prop() clientid: string
  @Prop() redirecturi: string
  /**
   *
   * States
   *
   */

  /** Description... */
  @State() printOpen: boolean = false

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

  /**
   *
   * Public methods
   *
   */

  /** Description... */
  @Method()
  async openPrint() {
    this.printOpen = true
  }

  /** Description... */
  @Method()
  async closePrint() {
    this.printOpen = false
  }

  componentWillLoad() {
    sendCodeToParentWindow();
  }

  /**
   *
   * Render method
   *
   */

  render() {
    return (
      <Host>
        {this.printOpen ? (
          <ejs-print clientID={this.clientid} redirectURI={this.redirecturi} />
        ) : null}
      </Host>
    )
  }
}
