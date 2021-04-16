import { Component, Host, Prop, h } from '@stencil/core'
import { TypoWeightTypes, TypoParagraphLevelTypes } from './../../shared/types'

@Component({
  tag: 'ejs-typo-paragraph',
  styleUrl: 'ejs-typo-paragraph.scss',
  shadow: true,
})
export class EjsTypoParagraph {
  /** Description... */
  @Prop() level: TypoParagraphLevelTypes = 'primary'

  /** Description... */
  @Prop() weight: TypoWeightTypes = 'soft'

  render() {
    return (
      <Host class={`${this.level} ${this.weight}`}>
        <p>
          <slot></slot>
        </p>
      </Host>
    )
  }
}
