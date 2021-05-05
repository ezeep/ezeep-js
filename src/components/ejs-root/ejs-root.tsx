import { Component, Host, State, Listen, Method, h } from '@stencil/core'

@Component({
  tag: 'ejs-root',
  styleUrl: 'ejs-root.scss',
  shadow: true,
})
export class EjsRoot {
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

  /**
   *
   * Render method
   *
   */

  render() {
    return <Host>{this.printOpen ? <ejs-print /> : null}</Host>
  }
}
