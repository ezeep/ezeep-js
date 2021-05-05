import { Component, Host, Prop, h } from '@stencil/core'
import { TypoWeightTypes, TypoParagraphLevelTypes } from './../../shared/types'

@Component({
  tag: 'ejs-typo-paragraph',
  styleUrl: 'ejs-typo-paragraph.scss',
  shadow: true,
})
export class EjsTypoParagraph {
  /**
   *
   * Properties
   *
   */

  /** Description... */
  @Prop() level: TypoParagraphLevelTypes = 'primary'

  /** Description... */
  @Prop() weight: TypoWeightTypes = 'soft'

  /**
   *
   * Render method
   *
   */

  render() {
    return (
      <Host class={`${this.level} ${this.weight}`}>
        <p id="paragraph">
          <slot></slot>
        </p>
      </Host>
    )
  }
}
