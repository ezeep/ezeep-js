import { Component, Host, Event, EventEmitter, Prop, h } from '@stencil/core'

@Component({
  tag: 'ejs-print',
  styleUrl: 'ejs-print.scss',
  shadow: true,
})
export class EjsPrint {
  /** Description... */
  @Prop() withBackdrop: boolean = true

  /** Description... */
  @Event() printCancel: EventEmitter<MouseEvent>

  /** Description... */
  @Event() printSubmit: EventEmitter<MouseEvent>

  private handleCancel = () => {
    this.printCancel.emit()
  }

  private handlePrint = () => {
    this.printSubmit.emit()
  }

  render() {
    return (
      <Host>
        {this.withBackdrop ? <div id="backdrop" onClick={this.handleCancel} /> : null}
        <div id="dialog">
          <ejs-typo-body>Printer Details</ejs-typo-body>
          <button onClick={this.handleCancel}>Cancel</button>
          <button onClick={this.handlePrint}>Print</button>
        </div>
      </Host>
    )
  }
}
