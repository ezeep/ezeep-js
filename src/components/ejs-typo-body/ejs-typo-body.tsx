import { Component, Host, Prop, h } from '@stencil/core'
import { TypoWeightTypes, TypoParagraphLevelTypes } from './../../shared/types'

@Component({
  tag: 'ejs-typo-body',
  styleUrl: 'ejs-typo-body.scss',
  shadow: true,
})
export class EjsTypoBody {
  /** Description... */
  @Prop() level: TypoParagraphLevelTypes = 'primary'

  /** Description... */
  @Prop() weight: TypoWeightTypes = 'soft'

  render() {
    return (
      <Host class={`${this.level} ${this.weight}`}>
        <div>
          <slot></slot>
        </div>
      </Host>
    )
  }
}
