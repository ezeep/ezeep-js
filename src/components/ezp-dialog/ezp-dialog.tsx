import { Component, Host, Prop, Event, EventEmitter, h } from '@stencil/core'
import i18next from 'i18next'
import { IconNameTypes, IconSizeTypes } from '../../shared/types'

@Component({
  tag: 'ezp-dialog',
  styleUrl: 'ezp-dialog.scss',
  shadow: true,
})
export class EzpDialog {
  /**
   *
   * Events
   *
   */

  @Event() dialogClose: EventEmitter
  @Event() dialogAction: EventEmitter

  /**
   *
   * Properties
   *
   */

  @Prop() heading: string
  @Prop() description: string
  @Prop() action: string = i18next.t('button_actions.close')
  @Prop() iconName?: IconNameTypes
  @Prop() iconSize: IconSizeTypes = 'large'
  @Prop() iconFramed: boolean = true
  @Prop() instance: string

  /**
   *
   * Lifecycle methods
   *
   */

  componentWillLoad() {
  }

  /**
   *
   * Private methods
   *
   */

  private handleClose = () => {
    this.dialogClose.emit(this.instance)
  }

  private handleAction = () => {
    this.dialogAction.emit(this.instance)
  }

  /**
   *
   * Render method
   *
   */

  render() {
    return (
      <Host>
        <div id="box">
          <div id="header">
            <ezp-icon-button
              level="tertiary"
              icon="close"
              type="button"
              onClick={this.handleClose}
            />
          </div>
          <div id="body">
            {this.iconName && (
              <ezp-icon name={this.iconName} size={this.iconSize} framed={this.iconFramed} />
            )}
            <div id="text">
              <ezp-label text={this.heading} weight="heavy" />
              <ezp-label text={this.description} />
            </div>
          </div>
          <div id="footer">
            <ezp-text-button
              type="button"
              level="primary"
              onClick={this.handleAction}
              label={this.action}
            />
          </div>
        </div>
      </Host>
    )
  }
}
