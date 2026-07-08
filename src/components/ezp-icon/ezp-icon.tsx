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

  /** Description... */
  @Prop() framed: boolean = false

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
      .catch(() => {
        // Missing/unfetchable glyph — render nothing rather than crash.
      })
  }

  /**
   *
   * Render method
   *
   */

  render() {
    return (
      // Decorative: icons here always sit next to a label or live-region text,
      // so hide them from the accessibility tree to avoid double announcements.
      <Host class={`${this.size} ${this.framed ? 'framed' : ''}`} aria-hidden="true">
        <div id="glyph" innerHTML={this.glyph} />
      </Host>
    )
  }
}
