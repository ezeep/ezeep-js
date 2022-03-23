import { Component, Host, Listen, Event, EventEmitter, State, h } from '@stencil/core'
import i18next from 'i18next'

@Component({
  tag: 'ezp-upload',
  styleUrl: 'ezp-upload.scss',
  shadow: true,
})
export class EzpUpload {
  private input?: HTMLInputElement
  private form?: HTMLFormElement

  /**
   *
   * States
   *
   */

  @State() dragging: boolean = false

  /**
   *
   * Events
   *
   */

  @Event() uploadFile: EventEmitter

  /**
   *
   * Listeners
   *
   */

  @Listen('dragenter')
  handleDragEnter() {
    this.dragging = true
  }

  @Listen('dragover', { passive: false })
  handleDragOver(event: DragEvent) {
    event.stopPropagation()
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  @Listen('dragleave')
  handleDragLeave() {
    this.dragging = false
  }

  @Listen('drop', { passive: false })
  handleDrop(event: DragEvent) {
    event.stopPropagation()
    event.preventDefault()

    this.dragging = false
    this.uploadFile.emit(event.dataTransfer.files)
  }

  @Listen('printCancel', { target: 'document' })
  listenPrintCancel() {
    this.form.reset()
  }

  /**
   *
   * Private methods
   *
   */

  private handleInput = () => {
    this.uploadFile.emit(this.input.files)
  }

  /**
   *
   * Render method
   *
   */

  render() {
    return (
      <Host class={{ dragging: this.dragging }}>
        <form id="form" ref={(form) => (this.form = form)}>
          <div id="header">
            <ezp-icon name="drag-drop" size="huge" framed />
            <ezp-label weight="strong" text={i18next.t('upload.description')} />
            <div id="meta">
              <ezp-label level="tertiary" text={i18next.t('upload.meta_leading')} />
              <label htmlFor="input" id="select">
                <ezp-label
                  level="tertiary"
                  weight="strong"
                  text={i18next.t('upload.meta_select')}
                />
              </label>
              <input
                type="file"
                name="input"
                id="input"
                ref={(input) => (this.input = input)}
                onInput={this.handleInput}
              />
              <ezp-label level="tertiary" text={i18next.t('upload.meta_trailing')} />
            </div>
          </div>
        </form>
      </Host>
    )
  }
}
