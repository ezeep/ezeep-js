import { Component, Host, Prop, Event, EventEmitter, h } from '@stencil/core'
import { IconNameTypes } from '../../shared/types'
import { initi18n } from '../../utils/utils'
import i18next from 'i18next'

@Component({
  tag: 'ezp-status',
  styleUrl: 'ezp-status.scss',
  shadow: true,
})
export class EzpStatus {
  /**
   *
   * Properties
   *
   */

  @Prop() description: string = 'Description'
  @Prop() processing: boolean = false
  @Prop() instance: string
  @Prop() icon?: IconNameTypes
  @Prop() cancel?: string | boolean
  @Prop() close?: string | boolean
  @Prop() retry?: string | boolean

  /**
   *
   * Events
   *
   */

  @Event() statusCancel: EventEmitter
  @Event() statusClose: EventEmitter
  @Event() statusRetry: EventEmitter

  /**
   *
   * Private methods
   *
   */

  private handleCancel = () => {
    this.statusCancel.emit(this.instance)
  }

  private handleClose = () => {
    this.statusClose.emit(this.instance)
  }

  private handleRetry = () => {
    this.statusRetry.emit(this.instance)
  }

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
   * Render method
   *
   */

  render() {
    return (
      <Host>
        <div id="box">
          {this.processing ? (
            <svg id="indicator" viewBox="0 0 42 42" xmlns="http://www.w3.org/2000/svg">
              <circle id="track" cx="21" cy="21" r="18" />
              <circle id="value" cx="21" cy="21" r="18" />
            </svg>
          ) : this.icon ? (
            <ezp-icon name={this.icon} framed />
          ) : null}
          <ezp-label id="description" level="tertiary" weight="strong" text={this.description} />
          <div id="footer">
            {this.cancel && (
              <ezp-text-button
                level="secondary"
                small
                onClick={this.handleCancel}
                label={
                  typeof this.cancel === 'string' ? this.cancel : i18next.t('button_actions.cancel')
                }
              />
            )}
            {this.close && (
              <ezp-text-button
                level={this.retry ? 'secondary' : 'primary'}
                small
                onClick={this.handleClose}
                label={
                  typeof this.close === 'string' ? this.close : i18next.t('button_actions.close')
                }
              />
            )}
            {this.retry && (
              <ezp-text-button
                level="primary"
                small
                onClick={this.handleRetry}
                label={
                  typeof this.retry === 'string' ? this.retry : i18next.t('button_actions.retry')
                }
              />
            )}
            <slot />
          </div>
        </div>
      </Host>
    )
  }
}
