import { Component, Host, State, Listen, Method, h } from '@stencil/core'

@Component({
  tag: 'ejs-root',
  styleUrl: 'ejs-root.scss',
  shadow: true,
})
export class EjsRoot {
  @State() printOpen: boolean = false

  @Listen('printCancel')
  listenCancel() {
    this.printOpen = false
  }

  @Listen('printSubmit')
  listenPrint() {
    this.printOpen = false
  }

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

  render() {
    return <Host>{this.printOpen ? <ejs-print /> : null}</Host>
  }
}
