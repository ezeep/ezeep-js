import { Component, Host, Prop, h } from '@stencil/core'
import { IconButtonLevelTypes, IconButtonTypeTypes, IconNameTypes } from './../../shared/types'

@Component({
  tag: 'ejs-icon-button',
  styleUrl: 'ejs-icon-button.scss',
  shadow: true,
})
export class EjsIconButton {
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
  @Prop() icon: IconNameTypes = 'circle'

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
          <ejs-icon name={this.icon}></ejs-icon>
        </TagType>
      </Host>
    )
  }
}
