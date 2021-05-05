import { Component, Host, Event, EventEmitter, Prop, h } from '@stencil/core'
import { PrintUserType } from './../../shared/types'

@Component({
  tag: 'ejs-print',
  styleUrl: 'ejs-print.scss',
  shadow: true,
})
export class EjsPrint {
  private user: PrintUserType

  /**
   *
   * Properties
   *
   */

  /** Description... */
  @Prop() withBackdrop: boolean = true

  /**
   *
   * Events
   *
   */

  /** Description... */
  @Event() printCancel: EventEmitter<MouseEvent>

  /** Description... */
  @Event() printSubmit: EventEmitter<MouseEvent>

  /**
   *
   * Private methods
   *
   */

  /** Description... */
  private handleCancel = () => {
    this.printCancel.emit()
  }

  /** Description... */
  private handlePrint = () => {
    this.printSubmit.emit()
  }

  /**
   *
   * Lifecycle methods
   *
   */

  /** Description... */
  async componentWillLoad() {
    return fetch('/data/user.json')
      .then((response) => response.json())
      .then((data) => {
        this.user = data
      })
  }

  /**
   *
   * Render method
   *
   */

  render() {
    console.log(this.user)

    return (
      <Host>
        {this.withBackdrop ? <div id="backdrop" onClick={this.handleCancel} /> : null}
        <div id="dialog">
          <div id="header">
            <div id="title">
              <ejs-typo-body weight="heavy">Print</ejs-typo-body>
              <ejs-typo-body>My Document.docx</ejs-typo-body>
            </div>
          </div>
          <button onClick={this.handleCancel}>Cancel</button>
          <button onClick={this.handlePrint}>Print</button>
        </div>
      </Host>
    )
  }
}
