import { Component, Host, Listen, Event, EventEmitter, State, h } from '@stencil/core'
import { PrintUserType } from './../../shared/types'

@Component({
  tag: 'ejs-print',
  styleUrl: 'ejs-print.scss',
  shadow: true,
})
export class EjsPrint {
  private user: PrintUserType
  private options

  /**
   *
   * Events
   *
   */

  @State() showBackdrop: boolean = false

  @Prop() clientID: string;
  @Prop() redirectURI: string;
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
   * Listeners
   *
   */

  @Listen('selectToggle')
  listenSelectExpand(event: CustomEvent) {
    this.showBackdrop = event.detail
  }

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
    return Promise.all([fetch('/data/user.json'), fetch('/data/options.json')])
      .then((responses) => Promise.all(responses.map((response) => response.json())))
      .then((data) => {
        this.user = data[0]
        this.options = data[1]
      })
  }

  /**
   *
   * Render method
   *
   */

  render() {
    return (
      <Host class={{ 'show-backdrop': this.showBackdrop }}>
        <div id="dialog">
          <div id="backdrop" />
          <div id="header">
            <ejs-typo-body weight="heavy">Print:</ejs-typo-body>
            <ejs-typo-body>My Document.docx</ejs-typo-body>
            <ejs-icon-button level="tertiary" icon="menu" id="toggle-menu" />
          </div>

          <div id="content">
            <div id="printer">
              <ejs-select
                label="Printer"
                icon="printer"
                placeholder="Select a printer"
                toggleFlow="vertical"
                optionFlow="vertical"
                options={this.user.organizations[0].printers.map((printer) => ({
                  id: printer.id,
                  title: printer.name,
                  meta: printer.location,
                }))}
              />
            </div>
            <div id="options">
              <ejs-select
                label="Color"
                placeholder="Select a color"
                toggleFlow="horizontal"
                optionFlow="horizontal"
                options={this.options.colors.map((color) => ({
                  id: color.id,
                  title: color.name,
                  meta: '',
                }))}
              />
              <ejs-select
                label="Orientation"
                placeholder="Select a orientation"
                toggleFlow="horizontal"
                optionFlow="horizontal"
                options={this.options.orientations.map((orientation) => ({
                  id: orientation.id,
                  title: orientation.name,
                  meta: '',
                }))}
              />
              <ejs-select
                label="Size"
                placeholder="Select a size"
                toggleFlow="horizontal"
                optionFlow="horizontal"
                options={this.options.sizes.map((size) => ({
                  id: size.id,
                  title: size.name,
                  meta: size.description,
                }))}
              />
            </div>
          </div>
          <div id="footer">
            <ejs-text-button type="button" level="secondary" onClick={this.handleCancel}>
              Cancel
            </ejs-text-button>
            <ejs-text-button type="button" onClick={this.handlePrint}>
              Print
            </ejs-text-button>
            <ejs-auth clientID={this.clientID} redirectURI={this.redirectURI}></ejs-auth>
          </div>
        </div>
      </Host>
    )
  }
}
