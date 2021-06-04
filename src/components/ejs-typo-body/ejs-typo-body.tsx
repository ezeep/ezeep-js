import { Component, Host, Prop, h } from '@stencil/core'
import { TypoWeightTypes, TypoBodyLevelTypes } from './../../shared/types'

@Component({
  tag: 'ejs-typo-body',
  styleUrl: 'ejs-typo-body.scss',
  shadow: true,
})
export class EjsTypoBody {
  /**
   *
   * Properties
   *
   */

  /** Description... */
  @Prop() level: TypoBodyLevelTypes = 'primary'

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
        <div id="body">
          <slot></slot>
        </div>
      </Host>
    )
  }
}
