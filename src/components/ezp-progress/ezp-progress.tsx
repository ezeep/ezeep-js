import { Component, Host, Prop, h } from '@stencil/core'

@Component({
  tag: 'ezp-progress',
  styleUrl: 'ezp-progress.scss',
  shadow: true,
})
export class EzpProgress {
  /**
   *
   * Properties
   *
   */

  /** Status... */
  @Prop() status: string = 'Status...'

  /**
   *
   * Render method
   *
   */

  render() {
    return (
      <Host>
        <div id="box">
          <svg id="indicator" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
            <circle id="track" cx="22" cy="22" r="16" />
            <circle id="value" cx="22" cy="22" r="16" />
          </svg>
          <ezp-typo-body id="status" level="secondary" weight="strong">
            {this.status}
          </ezp-typo-body>
        </div>
      </Host>
    )
  }
}
