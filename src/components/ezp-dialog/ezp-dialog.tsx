import { Component, Host, Prop, Event, EventEmitter, Listen, h } from '@stencil/core'
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

  @Event() dialogClose: EventEmitter<string>
  @Event() dialogAction: EventEmitter<string>

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

  private box?: HTMLDivElement

  componentDidLoad() {
    // Move focus into the dialog so keyboard/screen-reader users land here.
    this.box?.focus()
  }

  /**
   *
   * Private methods
   *
   */

  @Listen('keydown', { target: 'window' })
  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.handleClose()
      return
    }
    if (event.key === 'Tab') {
      this.trapFocus(event)
    }
  }

  /** Keep Tab focus cycling inside the modal (across nested shadow roots). */
  private trapFocus(event: KeyboardEvent) {
    if (!this.box) return
    const focusable = this.collectFocusable(this.box)
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = this.deepActiveElement()

    if (!active || !focusable.includes(active as HTMLElement)) {
      // Focus is on the dialog box or escaped it — pull it to the first control.
      event.preventDefault()
      first.focus()
    } else if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  /** Tabbable elements in the flattened tree, descending into shadow roots. */
  private collectFocusable(root: ParentNode): HTMLElement[] {
    const result: HTMLElement[] = []
    const visit = (node: ParentNode) => {
      node.querySelectorAll<HTMLElement>('*').forEach((el) => {
        if (el.tabIndex >= 0 && !(el as HTMLButtonElement).disabled) result.push(el)
        if (el.shadowRoot) visit(el.shadowRoot)
      })
    }
    visit(root)
    return result
  }

  /** The truly-focused element, following activeElement through shadow roots. */
  private deepActiveElement(): Element | null {
    let el: Element | null = document.activeElement
    while (el?.shadowRoot?.activeElement) {
      el = el.shadowRoot.activeElement
    }
    return el
  }

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
        <div
          id="box"
          role="dialog"
          aria-modal="true"
          aria-label={this.heading}
          tabindex={-1}
          ref={(el) => (this.box = el)}
        >
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
