import { Component, Host, Prop, h } from '@stencil/core'
import { TypoWeightTypes, TypoHeadingLevelTypes, TypoHeadingTagTypes } from '../../shared/types'

@Component({
  tag: 'ezp-typo-heading',
  styleUrl: 'ezp-typo-heading.scss',
  shadow: true,
})
export class EzpTypoHeading {
  /**
   *
   * Properties
   *
   */

  /** Description... */
  @Prop() level: TypoHeadingLevelTypes = 'primary'

  /** Description... */
  @Prop() tag: TypoHeadingTagTypes = 1

  /** Description... */
  @Prop() weight: TypoWeightTypes = 'heavy'

  /**
   *
   * Render method
   *
   */

  render() {
    const Tag = `h${this.tag.toString()}`

    return (
      <Host class={`${this.level} ${this.weight}`}>
        <Tag id="heading">
          <slot></slot>
        </Tag>
      </Host>
    )
  }
}
