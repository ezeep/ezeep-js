import { Component, Host, Prop, getAssetPath, h } from '@stencil/core'
import { IconNameTypes, IconSizeTypes } from '../../shared/types'

@Component({
  tag: 'ezp-icon',
  styleUrl: 'ezp-icon.scss',
  shadow: true,
  assetsDirs: ['assets'],
})
export class EzpIcon {
  /**
   *
   * Properties
   *
   */

  /** Description... */
  @Prop() name!: IconNameTypes

  /** Description... */
  @Prop() size: IconSizeTypes = 'normal'

  /**
   *
   * Render method
   *
   */

  render() {
    const glyphsPath = getAssetPath('./assets/glyphs.svg')

    return (
      <Host class={this.size}>
        <svg id="glyph">
          <use xlinkHref={`${glyphsPath}#glyph-${this.name}`}></use>
        </svg>
      </Host>
    )
  }
}
