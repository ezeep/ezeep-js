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

  private clearSelection = () => {
    this.form?.reset()
    this.selectedFiles = []
    this.uploadFile.emit(this.selectedFiles)
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

    return (
      <Host class={{ dragging: this.dragging }}>
        <form id="form" ref={(form) => (this.form = form)}>
          <input
            type="file"
            name="input"
            id="input"
            multiple
            aria-label={i18next.t('upload.description')}
            ref={(input) => (this.input = input)}
            onInput={this.handleInput}
          />

          <div id="modal">
            <div id="header">
              <ezp-label id="heading" weight="heavy" text={i18next.t('upload.heading')} />
              <ezp-icon-button
                icon="close"
                type="button"
                level="tertiary"
                onClick={this.clearSelection}
              />
            </div>

            <div id="dropzone">
              {hasFiles && (
                <div id="thumbs">
                  {this.selectedFiles.map((file, index) => (
                    <div key={index} class="thumb">
                      <button
                        type="button"
                        class="thumb-remove"
                        aria-label={i18next.t('button_actions.close')}
                        onClick={(event) => this.removeFile(event, index)}
                      >
                        <ezp-icon name="close" />
                      </button>
                      <div class="thumb-icon">
                        <ezp-icon name="file" />
                      </div>
                      <ezp-label class="thumb-name" ellipsis text={file.name} />
                      <ezp-label
                        class="thumb-meta"
                        level="tertiary"
                        weight="strong"
                        text={`${this.fileType(file.name)} · ${this.formatSize(file.size)}`}
                      />
                    </div>
                  ))}
                  <label htmlFor="input" class="thumb thumb-add">
                    <div class="thumb-add-icon">
                      <ezp-icon name="plus" />
                    </div>
                    <ezp-label class="thumb-name" level="tertiary" text={i18next.t('upload.add_more')} />
                  </label>
                </div>
              )}

              {!hasFiles && (
                <div id="cloud">
                  <ezp-icon name="cloud-upload" />
                </div>
              )}

              <ezp-label id="dropzone-title" weight="heavy" text={i18next.t('upload.dropzone_title')} />

              <div id="meta">
                <ezp-label level="secondary" text={i18next.t('upload.meta_leading')} />
                <label htmlFor="input" id="browse">
                  <ezp-label level="secondary" weight="strong" text={i18next.t('upload.browse')} />
                </label>
                <ezp-label level="secondary" text={i18next.t('upload.meta_multiple')} />
              </div>

              <div id="formats">
                {SUPPORTED_FORMATS.map((format) => (
                  <span class="format" key={format}>
                    {format}
                  </span>
                ))}
              </div>
            </div>

            {hasFiles && (
              <ezp-label
                id="ready"
                level="secondary"
                weight="strong"
                text={i18next.t('upload.files_ready', { count: this.selectedFiles.length })}
              />
            )}

            <div id="footer">
              <ezp-text-button
                type="button"
                level="secondary"
                onClick={this.clearSelection}
                label={i18next.t('button_actions.cancel')}
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
