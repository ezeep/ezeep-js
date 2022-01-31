import { Component, Host, Prop, Event, EventEmitter, h } from '@stencil/core'
import { initi18n } from '../../utils/utils'
import i18next from 'i18next'

@Component({
  tag: 'ezp-alert',
  styleUrl: 'ezp-alert.scss',
  shadow: true,
})
export class EzpAlert {
  /**
   *
   * Events
   *
   */

  @Event() alertClose: EventEmitter

  /**
   *
   * Properties
   *
   */

  @Prop() heading: string
  @Prop() description: string

  /**
   *
   * Lifecycle methods
   *
   */

  componentWillLoad() {
    initi18n()
  }

  /**
   *
   * Private methods
   *
   */

  private handleClose = () => {
    this.alertClose.emit()
  }

  /**
   *
   * Render method
   *
   */

  render() {
    return (
      <Host>
        <div id="container">
          <div id="header">
            <ezp-icon-button
              level="tertiary"
              icon="close"
              type="button"
              onClick={this.handleClose}
            />
          </div>
          <div id="body">
            <ezp-label text={this.heading} />
            <ezp-label text={this.description} />
          </div>
          <div id="footer">
            <ezp-text-button
              type="button"
              level="primary"
              onClick={this.handleClose}
              label={i18next.t('button_actions.close')}
            />
          </div>
        </div>
      </Host>
    )
  }
}
