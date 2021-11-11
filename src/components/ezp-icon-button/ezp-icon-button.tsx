import { Component, Host, Prop, h } from '@stencil/core'
import { IconButtonLevelTypes, IconButtonTypeTypes, IconNameTypes } from '../../shared/types'

@Component({
  tag: 'ezp-icon-button',
  styleUrl: 'ezp-icon-button.scss',
  shadow: true,
})
export class EzpIconButton {
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
  @Prop() icon!: IconNameTypes

  /** Description... */
  @Prop() level: IconButtonLevelTypes = 'primary'

  /** Description... */
  @Prop() type: IconButtonTypeTypes

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
        <TagType id="button" {...attributes}>
          <ezp-icon name={this.icon} />
        </TagType>
      </Host>
    )
  }
}
