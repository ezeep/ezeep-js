import { Component, Host, State, Listen, Method, h, Prop } from '@stencil/core'
import { sendCodeToParentWindow } from '../../services/auth'

@Component({
  tag: 'ezp-printing',
  styleUrl: 'ezp-printing.scss',
  shadow: true,
})
export class EzpPrinting {
  @Prop() clientid: string;
  @Prop() redirecturi: string;
  @Prop() filename: string;
  @Prop() fileurl: string;
  @Prop() custom: boolean;
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
        <ezp-icon-button
          id="print-trigger"
          icon="printer"
          slot="trigger"
          type="button"
          onClick={() => this.openPrint()}
        ></ezp-icon-button>
        {this.printOpen ? (
          <ezp-printer-selection clientID={this.clientid} redirectURI={this.redirecturi} />
        ) : null}
      </Host>
    )
  }
}
