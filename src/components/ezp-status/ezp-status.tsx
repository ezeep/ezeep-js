import { Component, Host, Prop, Event, EventEmitter, h } from '@stencil/core'
import { IconNameTypes } from '../../shared/types'
import { subscribeToLanguageChange } from '../../utils/utils'
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
  @Prop() subtext?: string
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

  @Event() statusCancel: EventEmitter<string>
  @Event() statusClose: EventEmitter<string>
  @Event() statusRetry: EventEmitter<string>

  private unsubscribeLanguage?: () => void

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

  connectedCallback() {
    this.unsubscribeLanguage = subscribeToLanguageChange(this)
  }

  disconnectedCallback() {
    this.unsubscribeLanguage?.()
  }

  /**
   *
   * Render method
   *
   */

  render() {
    return (
      // Live region so screen readers announce status changes (loading,
      // processing, success, error) as they render.
      <Host role="status" aria-live="polite">
        <div id="box">
          {this.processing ? (
            <svg
              id="indicator"
              viewBox="0 0 42 42"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle id="track" cx="21" cy="21" r="18" />
              <circle id="value" cx="21" cy="21" r="18" />
            </svg>
          ) : this.icon ? (
            <div id="icon">
              <div id="icon-inner">
                <ezp-icon name={this.icon} />
              </div>
            </div>
          ) : null}
          <ezp-label id="description" weight="heavy" text={this.description} />
          {this.subtext && (
            <ezp-label id="subtext" level="secondary" text={this.subtext} />
          )}
          {(this.cancel || this.close || this.retry) && (
            <div id="footer">
              {this.cancel && (
                <ezp-text-button
                  class="action secondary"
                  level="secondary"
                  onClick={this.handleCancel}
                  label={
                    typeof this.cancel === 'string'
                      ? this.cancel
                      : i18next.t('button_actions.cancel')
                  }
                />
              )}
              {this.close && (
                <ezp-text-button
                  class={`action ${this.retry ? 'secondary' : 'primary'}`}
                  level={this.retry ? 'secondary' : 'primary'}
                  onClick={this.handleClose}
                  label={
                    typeof this.close === 'string' ? this.close : i18next.t('button_actions.close')
                  }
                />
              )}
              {this.retry && (
                <ezp-text-button
                  class="action primary"
                  level="primary"
                  onClick={this.handleRetry}
                  label={
                    typeof this.retry === 'string' ? this.retry : i18next.t('button_actions.retry')
                  }
                />
              )}
            </div>
          )}
        </div>
      </Host>
    )
  }
}
