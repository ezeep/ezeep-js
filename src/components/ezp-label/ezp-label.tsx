import { Component, Host, Prop, h } from '@stencil/core'
import { LabelLevelTypes, WeightTypes } from '../../shared/types'

@Component({
  tag: 'ezp-label',
  styleUrl: 'ezp-label.scss',
  shadow: true,
})
export class EzpLabel {
  /**
   *
   * Properties
   *
   */

  /** Description... */
  @Prop() ellipsis: boolean = false

  /** Description... */
  @Prop() level: LabelLevelTypes = 'secondary'

  /** Description... */
  @Prop() noWrap: boolean = false

  /** Description... */
  @Prop() text: string = 'Label'

  /** Description... */
  @Prop() weight: WeightTypes = 'soft'

  /**
   *
   * Render method
   *
   */

  render() {
    return (
      <Host
        class={`${this.level} ${this.weight} ${this.ellipsis ? 'ellipsis' : ''} ${
          this.noWrap ? 'no-wrap' : ''
        }`}
      >
        <div id="text">{this.text}</div>
      </Host>
    )
  }
}
