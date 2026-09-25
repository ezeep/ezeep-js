import { Component, Host, Listen, Event, EventEmitter, State, h } from '@stencil/core'
import { subscribeToLanguageChange } from '../../utils/utils'
import i18next from 'i18next'

/** File formats advertised to the user as supported for printing. */
const SUPPORTED_FORMATS = ['PDF', 'DOCX', 'PNG', 'JPG', 'XLSX']

@Component({
  tag: 'ezp-upload',
  styleUrl: 'ezp-upload.scss',
  shadow: true,
})
export class EzpUpload {
  private input?: HTMLInputElement
  private form?: HTMLFormElement
  private unsubscribeLanguage?: () => void

  connectedCallback() {
    this.unsubscribeLanguage = subscribeToLanguageChange(this)
  }

  disconnectedCallback() {
    this.unsubscribeLanguage?.()
  }

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

  /** Keeps the parent's file state in sync as the selection changes. */
  @Event() uploadFile: EventEmitter<File[]>

  /** Fired when the user confirms the selection and wants to move on to print options. */
  @Event() uploadContinue: EventEmitter<File[]>

  /** Fired when the user cancels, closing the print flow in the host app. */
  @Event() printCancel: EventEmitter<MouseEvent>

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
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy'
    }
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
    const files = Array.from(event.dataTransfer?.files ?? [])
    // Add new files to existing selection instead of replacing
    this.selectedFiles = [...this.selectedFiles, ...files]
    this.uploadFile.emit(this.selectedFiles)
  }

  @Listen('printCancel', { target: 'document' })
  listenPrintCancel() {
    this.form?.reset()
    this.selectedFiles = []
  }

  /**
   *
   * Private methods
   *
   */

  /** Opens the native file picker from our own buttons. */
  private openPicker = () => {
    this.input?.click()
  }

  private handleInput = () => {
    const files = Array.from(this.input?.files ?? [])
    // Add new files to existing selection instead of replacing
    this.selectedFiles = [...this.selectedFiles, ...files]
    this.uploadFile.emit(this.selectedFiles)
    // Reset the input so the same file can be selected again
    if (this.input) {
      this.input.value = ''
    }
  }

  private removeFile = (event: MouseEvent, index: number) => {
    event.preventDefault()
    event.stopPropagation()
    this.selectedFiles = this.selectedFiles.filter((_, i) => i !== index)
    this.uploadFile.emit(this.selectedFiles)
    // Reset the input so it's ready for new selections
    if (this.input) {
      this.input.value = ''
    }
  }

  private handleCancel = () => {
    if (this.selectedFiles.length === 0) return
    // Closing is the host's call: the event bubbles to `ezp-printing`, which
    // ends the print flow. It also reaches the document, where our own
    // `printCancel` listener resets the form and the selection.
    this.printCancel.emit()
  }

  private handleContinue = () => {
    if (this.selectedFiles.length === 0) return
    this.uploadContinue.emit(this.selectedFiles)
  }

  /** Extract a short, upper-cased file-type label from the file name. */
  private fileType(name: string): string {
    const extension = name.split('.').pop()
    return extension && extension !== name ? extension.toUpperCase() : i18next.t('upload.file_type_fallback')
  }

  /** Human-readable file size (matches the mockup's "14.6 KB" style). */
  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    const units = ['KB', 'MB', 'GB']
    let size = bytes / 1024
    let unit = 0
    while (size >= 1024 && unit < units.length - 1) {
      size /= 1024
      unit++
    }
    return `${size.toFixed(1)} ${units[unit]}`
  }

  /**
   *
   * Render method
   *
   */

  render() {
    const hasFiles = this.selectedFiles.length > 0
    // While a drag is in progress the dropzone always takes over, so there is
    // a target to drop onto even once files have been picked.
    const showDropzone = !hasFiles || this.dragging

    return (
      <Host class={{ dragging: this.dragging }}>
        <form id="form" ref={(form) => (this.form = form)}>
          <input
            type="file"
            name="input"
            id="input"
            multiple
            aria-label={i18next.t('upload.choose_files')}
            ref={(input) => (this.input = input)}
            onInput={this.handleInput}
          />

          <div id="modal">
            <div id="body">
              {showDropzone && (
                <div id="dropzone">
                  <ezp-icon id="dropzone-icon" name="cloud-upload" />

                  {this.dragging ? (
                    <ezp-label
                      id="dropzone-title"
                      level="primary"
                      weight="heavy"
                      text={i18next.t('upload.dropzone_title')}
                    />
                  ) : (
                    <div id="dropzone-prompt">
                      <ezp-text-button
                        id="choose"
                        type="button"
                        onClick={this.openPicker}
                        label={i18next.t('upload.choose_files')}
                      />
                      <ezp-label
                        id="drag-hint"
                        level="secondary"
                        weight="strong"
                        text={i18next.t('upload.drag_hint')}
                      />
                      <ezp-label
                        id="formats"
                        level="tertiary"
                        text={SUPPORTED_FORMATS.join(', ')}
                      />
                    </div>
                  )}
                </div>
              )}

              {!showDropzone && (
                <div id="files">
                  {this.selectedFiles.map((file, index) => (
                    <div key={index} class="file">
                      <span class="file-type">{this.fileType(file.name)}</span>
                      <div class="file-details">
                        <ezp-label class="file-name" ellipsis weight="heavy" text={file.name} />
                        <ezp-label
                          class="file-size"
                          level="tertiary"
                          text={this.formatSize(file.size)}
                        />
                      </div>
                      <button
                        type="button"
                        class="file-remove"
                        aria-label={i18next.t('upload.remove_file')}
                        onClick={(event) => this.removeFile(event, index)}
                      >
                        <ezp-icon name="close" />
                      </button>
                    </div>
                  ))}
                  <button type="button" id="add-more" onClick={this.openPicker}>
                    <ezp-icon name="plus" />
                    <ezp-label level="secondary" weight="heavy" text={i18next.t('upload.add_more')} />
                  </button>
                </div>
              )}
            </div>

            <div id="footer">
              <ezp-text-button
                id="clear"
                type="button"
                level="secondary"
                disabled={!hasFiles}
                onClick={this.handleCancel}
                label={i18next.t('upload.remove_files')}
                class="action"
              />
              <ezp-text-button
                id="continue"
                type="button"
                disabled={!hasFiles}
                onClick={this.handleContinue}
                label={i18next.t('upload.continue')}
                class="action"
              />
            </div>
          </div>
        </form>
      </Host>
    )
  }
}
