import { Component, Element, Host, Method, Prop, h } from '@stencil/core'
import { LabelLevelTypes, WeightTypes } from '../../shared/types'

@Component({
  tag: 'ezp-label',
  styleUrl: 'ezp-label.scss',
  shadow: true,
})
export class EzpLabel {
  @Element() host: HTMLEzpLabelElement

  /**
   *
   * Public methods
   *
   */

  /** Whether the text is currently clipped — `ellipsis` only bites when the
   *  text outgrows the space it was given, which callers cannot tell from the
   *  props alone. Lets a caller offer the full text only when it is needed. */
  @Method()
  async isTruncated(): Promise<boolean> {
    const text = this.host.shadowRoot?.querySelector('#text')
    if (!text) return false
    // A pixel of slack: sub-pixel layout rounds scrollWidth up on its own.
    return text.scrollWidth > text.clientWidth + 1
  }

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
