import { Component, Host, Prop, h } from '@stencil/core'

@Component({
  tag: 'ezp-backdrop',
  styleUrl: 'ezp-backdrop.scss',
  shadow: true,
})
export class EzpBackdrop {
  /**
   *
   * Properties
   *
   */

  @Prop() hide: boolean = false
  /**
   *
   * Render method
   *
   */

  render() {
    return <Host class={{ 'should-hide': this.hide }} />
  }
}
