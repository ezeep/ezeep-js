import { Component, Host, Listen, Event, EventEmitter, State, h, Fragment } from '@stencil/core'
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

  @State() selectedFiles: File[] = []
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
    const files = Array.from(event.dataTransfer.files)
    // Add new files to existing selection instead of replacing
    this.selectedFiles = [...this.selectedFiles, ...files]
    this.uploadFile.emit(this.selectedFiles)
  }

  @Listen('printCancel', { target: 'document' })
  listenPrintCancel() {
    this.form.reset()
    this.selectedFiles = []
  }

  /**
   *
   * Private methods
   *
   */

  private handleInput = () => {
    const files = Array.from(this.input.files)
    // Add new files to existing selection instead of replacing
    this.selectedFiles = [...this.selectedFiles, ...files]
    this.uploadFile.emit(this.selectedFiles)
  }

  private removeFile = (index: number) => {
    this.selectedFiles = this.selectedFiles.filter((_, i) => i !== index)
    this.uploadFile.emit(this.selectedFiles)
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
                multiple
                ref={(input) => (this.input = input)}
                onInput={this.handleInput}
              />
              <ezp-label level="tertiary" text={i18next.t('upload.meta_trailing')} />
            </div>
            {this.selectedFiles.length > 0 && (
              <>
                <ezp-label level="secondary" text={i18next.t('upload.selected_files')} />
                {this.selectedFiles.map((file, index) => (
                  <ezp-label 
                    key={index} 
                    level="tertiary" 
                    text={`${file.name} ✕`}
                    onClick={() => this.removeFile(index)}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </>
            )}
          </div>
        </form>
      </Host>
    )
  }
}
