import { Component, Host, Prop, h } from '@stencil/core'
import { TextButtonLevelTypes, TextButtonTypeTypes } from '../../shared/types'

@Component({
  tag: 'ezp-text-button',
  styleUrl: 'ezp-text-button.scss',
  shadow: true,
})
export class EzpTextButton {
  /**
   *
   * Properties
   *
   */

  /** Description... */
  @Prop() blank: boolean = false

  /** Description... */
  @Prop() disabled: boolean = false

  /** Description... */
  @Prop() href: string

  /** Description... */
  @Prop() level: TextButtonLevelTypes = 'primary'

  /** Description... */
  @Prop() type: TextButtonTypeTypes

  /**
   *
   * Render method
   *
   */

  render() {
    const TagType = this.type !== undefined ? 'button' : 'a'
    const attributes =
      this.type !== undefined
        ? {
            type: this.type,
            disabled: this.disabled,
          }
        : {
            href: this.href,
            target: this.blank ? '_blank' : '_self',
          }

    return (
      <Host class={`${this.level}`}>
        <TagType class="button" {...attributes}>
          <cap-label level="primary" weight="heavy">
            <slot />
          </cap-label>
        </TagType>
      </Host>
    )
  }
}
