import { Component, Host, Prop, getAssetPath, h } from '@stencil/core'
import { IconNameTypes } from '../../shared/types'

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

  /**
   *
   * Render method
   *
   */

  render() {
    const glyphsPath = getAssetPath('./assets/glyphs.svg')

    return (
      <Host>
        <svg id="glyph">
          <use href={`${glyphsPath}#glyph-${this.name}`}></use>
        </svg>
      </Host>
    )
  }
}
