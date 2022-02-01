import { Component, Host, Prop, h } from '@stencil/core'
import { IconNameTypes } from '../../shared/types'

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
  @Prop() status: string = 'Status'

  /** Status... */
  @Prop() processing: boolean = false

  /** Status... */
  @Prop() icon?: IconNameTypes

  /**
   *
   * Render method
   *
   */

  render() {
    return (
      <Host>
        <div id="box">
          {this.processing ? (
            <svg id="indicator" viewBox="0 0 42 42" xmlns="http://www.w3.org/2000/svg">
              <circle id="track" cx="21" cy="21" r="18" />
              <circle id="value" cx="21" cy="21" r="18" />
            </svg>
          ) : this.icon ? (
            <ezp-icon name={this.icon} framed />
          ) : null}
          <ezp-label id="status" level="tertiary" weight="strong" text={this.status} />
          <div id="footer">
            <slot />
          </div>
        </div>
      </Host>
    )
  }
}
