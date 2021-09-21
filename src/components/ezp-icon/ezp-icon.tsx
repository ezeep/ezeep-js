import { Component, Host, Prop, getAssetPath, h } from '@stencil/core'
import { IconNameTypes, IconSizeTypes } from '../../shared/types'

@Component({
  tag: 'ezp-icon',
  styleUrl: 'ezp-icon.scss',
  shadow: true,
  assetsDirs: ['assets'],
})
export class EzpIcon {
  private glyph: string

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
   * Lifecycle methods
   *
   */

  async componentWillLoad() {
    await fetch(getAssetPath(`./assets/glyph-${this.name}.svg`))
      .then((response) => response.text())
      .then((result) => {
        this.glyph = result
      })
      .catch((error) => console.log(error))
  }

  /**
   *
   * Render method
   *
   */

  render() {
    return (
      <Host class={this.size}>
        <div id="glyph" innerHTML={this.glyph} />
      </Host>
    )
  }
}
