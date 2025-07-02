import {
  Component,
  Host,
  Listen,
  Event,
  EventEmitter,
  State,
  h,
  Prop,
  Fragment,
} from '@stencil/core'
import i18next from 'i18next'
import authStore from '../../services/auth'
import printStore, { EzpPrintService } from '../../services/print'
import userStore, { EzpUserService } from '../../services/user'
import { Printer, PrinterConfig, PrinterProperties } from '../../shared/types'
import { managePaperDimensions, poll, removeEmptyStrings } from '../../utils/utils'
import { PAPER_ID, validatePageRange, formatPageRange } from '../../utils/utils'

@Component({
  tag: 'ezp-printer-selection',
  styleUrl: 'ezp-printer-selection.scss',
  shadow: true,
})
export class EzpPrinterSelection {
  private fileExtension = ''
  private printService: EzpPrintService
  public duplexOptions = [
    {
      id: 1,
      title: i18next.t('printer_selection.duplex_none'),
    },
    {
      id: 2,
      title: i18next.t('printer_selection.duplex_long'),
    },
    {
      id: 3,
      title: i18next.t('printer_selection.duplex_short'),
    },
  ]
  public ColorOptions = [
    {
      id: 1,
      title: i18next.t('printer_selection.color_color'),
    },
    {
      id: 2,
      title: i18next.t('printer_selection.color_grayscale'),
    },
  ]
  private printButton?: HTMLEzpTextButtonElement

  /**
   *
   * Properties
   *
   */
  @Prop() clientID: string
  @Prop() redirectURI: string
  @Prop({ mutable: true }) filename: string
  @Prop() fileurl: string
  @Prop({ mutable: true }) filetype: string
  @Prop({ mutable: true }) fileid: string
  @Prop() files: File[]
  @Prop() hidemenu: boolean = false
  @Prop() hideheader: boolean = false
  @Prop() seamless: boolean

  /**
   *
   * States
   *
   */
  @State() loading: boolean = true
  @State() printProcessing: boolean = false
  @State() pageRangeInvalid: boolean = false
  @State() uploading: boolean = false
  @State() preparingUpload: boolean = false
  @State() printSuccess: boolean = false
  @State() printFailed: boolean = false
  @State() notSupported: boolean = false
  @State() noPrinters: boolean = false
  @State() userMenuOpen: boolean = false
  @State() printStopped: boolean = false
  @State() userName: string
  @State() printers: Printer[]
  @State() selectedPrinter: Printer
  @State() printerConfig: PrinterConfig[]
  @State() selectedPrinterConfig: PrinterConfig = {
    Default: {
      Color: '',
      Duplex: '',
      Paper: '',
      Orientation: '',
      Resolution: '',
      Tray: '',
    },
    OrientationsSupported: [],
    PaperFormats: [],
    Resolutions: [],
    DuplexSupported: false,
    Color: false,
    Trays: [],
  }

  // needs to be initialised with empty strings
  @State() selectedProperties: PrinterProperties = {
    paper: '',
    paperid: '',
    color: false,
    duplex: true,
    duplexmode: 1,
    orientation: 1,
    copies: '',
    resolution: 0,
    paperlength: 0,
    paperwidth: 0,
    defaultSource: '',
    trayname: '',
    PageRanges: '',
  }

  @State() paperid: number | string
  @State() currentFileIndex: number = 0
  @State() totalFiles: number = 0
  @State() failedFiles: string[] = []
  @State() successfulFiles: string[] = []
  @State() partialSuccess: boolean = false

  /**
   *
   * Events
   *
   */

  /** Description... */
  @Event() printCancel: EventEmitter<MouseEvent>

  /** Description... */
  @Event() printSubmit: EventEmitter<MouseEvent>

  @Event() logout: EventEmitter<MouseEvent>

  /**
   *
   * Listeners
   *
   */

  @Listen('inputValueChanged')
  listenInputValueChanged(event: CustomEvent) {
    this.setSelectedProperties(event.detail)
  }

  @Listen('selectSelection')
  listenSelectSelection(event: CustomEvent) {
    this.setSelectedProperties(event.detail)
  }

  @Listen('stepperChanged')
  listenStepperChanged(event: CustomEvent) {
    this.selectedProperties.copies = event.detail
  }

  @Listen('userMenuClosure')
  listenUserMenuClosure() {
    this.userMenuOpen = false
  }

  @Listen('logoutEmitter')
  listenLogout() {
    this.printCancel.emit()
    this.logout.emit()
  }

  @Listen('statusCancel')
  listenStatusCancel(event: CustomEvent) {
    if (event.detail === 'print-processing') {
      this.printStopped = true
      this.printProcessing = false
      // Abort the print request
      this.printService.abortPrint()
    }
  }

  @Listen('statusClose')
  listenStatusClose(event: CustomEvent) {
    switch (event.detail) {
      case 'print-success':
        this.printSuccess = false
        this.partialSuccess = false
        this.failedFiles = []
        this.successfulFiles = []
        this.printCancel.emit()
        break
      case 'print-failed':
        this.printProcessing = false
        this.printFailed = false
        this.failedFiles = []
        this.successfulFiles = []
        break
      case 'no-printers':
        this.noPrinters = false
        break
    }
  }

  @Listen('statusRetry')
  listenStatusRetry(event: CustomEvent) {
    switch (event.detail) {
      case 'not-supported':
        this.printCancel.emit()
        break
      case 'print-failed':
        this.printFailed = false
        this.printProcessing = false
        this.handlePrint()
        break
    }
  }

  /**
   *
   * Private methods
   *
   */

  /** Description... */
  private handleCancel = () => {
    this.failedFiles = []
    this.successfulFiles = []
    this.partialSuccess = false
    this.printCancel.emit()
  }

  private validateData = (data) => {
    if (data.jobstatus === 0) {
      this.printSuccess = true
      this.printProcessing = false
      return true
    }
    return false
  }
  private POLL_INTERVAL = 2000
  private MAX_POLL_ATTEMPTS = Infinity

  /** Description... */
  private handlePrint = async () => {
    this.printButton.blur()
    this.printProcessing = true
    this.failedFiles = []
    this.successfulFiles = []
    this.partialSuccess = false
    // we have to initialse this obj with empty strings to display the select component
    // but don't want to send any attributes with empty strings to the API
    if (
      this.selectedPrinterConfig.Trays &&
      this.selectedPrinterConfig.Trays.length >= 0 &&
      this.selectedPrinterConfig.Trays[0] == null
    ) {
      delete this.selectedProperties.trayname
      delete this.selectedProperties.defaultSource
    }
    let cleanPrintProperties: PrinterProperties = removeEmptyStrings(this.selectedProperties)
    cleanPrintProperties = managePaperDimensions(cleanPrintProperties)
    if (cleanPrintProperties.PageRanges)
      cleanPrintProperties.PageRanges = formatPageRange(cleanPrintProperties.PageRanges)

    // put it in store for further use
    printStore.state.fileUrl = this.fileurl
    printStore.state.fileID = this.fileid
    printStore.state.fileType = this.filetype
    printStore.state.printerID = this.selectedPrinter.id
    printStore.state.printerProperties = this.selectedProperties
    printStore.state.fileName = this.filename

    if (this.fileurl) {
      this.printService
        .printFileByUrl(
          authStore.state.accessToken,
          this.fileurl,
          this.filetype,
          this.selectedPrinter.id,
          cleanPrintProperties,
          this.filename
        )
        .then((response) => {
          if (response.status === 200 && this.selectedPrinter.is_queue) {
            this.printProcessing = false
            this.printSuccess = true
          }

          if (response.status === 412) {
            response.json().then((data) => (this.fileid = data.fileid))
            this.printService.printByFileID(
              authStore.state.accessToken,
              this.fileid,
              this.filetype,
              this.selectedPrinter.id,
              cleanPrintProperties,
              this.filename
            )
          } else {
            return response.json()
          }
        })
        .then((data) => {
          if (data.code === 804) {
            this.printFailed = true
            this.printProcessing = false
          }
          if (data.jobid) {
            printStore.state.jobID = data.jobid
            poll({
              fn: this.printService.getPrintStatus,
              validate: this.validateData,
              interval: this.POLL_INTERVAL,
              maxAttempts: this.MAX_POLL_ATTEMPTS,
            }).catch((err) => {
              console.warn(err)
              this.printFailed = true
              this.printProcessing = false
            })
          } else {
            this.printFailed = true
            this.printProcessing = false
          }
        })
        .catch((error) => {
          console.log(error)
          this.printFailed = true
          this.printProcessing = false
        })
    }

    if (this.files && this.files.length > 0) {
      await this.handleFiles(this.files, cleanPrintProperties)
    }

    localStorage.setItem('properties', JSON.stringify(this.selectedProperties))
    localStorage.setItem('printer', JSON.stringify(this.selectedPrinter))

    this.printStopped = false
  }

  private handleUserMenu = () => {
    this.userMenuOpen = true
  }

  private getPropertiesFromLocalStorage() {
    if (localStorage.getItem('properties')) {
      this.selectedProperties = JSON.parse(localStorage.getItem('properties'))
    }

    if (localStorage.getItem('printer')) {
      const savedPrinter = JSON.parse(localStorage.getItem('printer'))
      if (this.printers.some((printer) => printer.id === savedPrinter.id)) {
        this.selectedPrinter = savedPrinter
      } else {
        this.selectedPrinter = { id: '', location: '', name: '', is_queue: false }
        localStorage.removeItem('printer')
        localStorage.removeItem('properties')
      }
    } else {
      this.selectedPrinter = { id: '', location: '', name: '', is_queue: false }
    }

    this.setPaperid()
  }

  private setPaperid() {
    this.paperid = this.selectedProperties.paperid
  }

  private getUserInfo() {
    const userService = new EzpUserService()
    return userService.getUserInfo().then((user) => {
      userStore.state.user = user
      this.userName = userStore.state.user.display_name
    })
  }

  private async setSelectedProperties(eventDetails: {
    type: string
    id: string
    title: string
    is_queue: boolean
    value?: any
  }) {
    switch (eventDetails.type) {
      case 'printer':
        this.selectedPrinter.id = eventDetails.id
        this.selectedPrinter.name = eventDetails.title
        this.selectedPrinter.is_queue = eventDetails.is_queue
        await this.printService
          .getPrinterProperties(authStore.state.accessToken, this.selectedPrinter.id)
          .then((data) => {
            this.selectedPrinterConfig = { ...this.selectedPrinterConfig, ...data[0] }

            this.selectedProperties.color =
              this.selectedPrinterConfig.Default?.Color == 'color' ? true : false
            this.selectedProperties.orientation = this.selectedPrinterConfig.Default?.Orientation
            this.selectedProperties.resolution = this.selectedPrinterConfig.Default?.Resolution

            let defaultPaper = this.selectedPrinterConfig.PaperFormats?.find(
              (obj) => obj.Default === true
            )
            this.selectedProperties.paper = defaultPaper?.Name
            this.selectedProperties.paperid = defaultPaper?.Id

            let defaultSource = this.selectedPrinterConfig.Trays?.find(
              (obj) => obj.Default === true
            )
            if (
              this.selectedPrinterConfig.Trays &&
              this.selectedPrinterConfig.Trays.length >= 1 &&
              this.selectedPrinterConfig.Trays[0] != null
            ) {
              this.selectedProperties.trayname = defaultSource?.Name
              this.selectedProperties.defaultSource = defaultSource?.Index
            }

            if (
              this.selectedPrinterConfig.Trays &&
              this.selectedPrinterConfig.Trays.length >= 0 &&
              this.selectedPrinterConfig.Trays[0] == null
            ) {
              delete this.selectedProperties.trayname
              delete this.selectedProperties.defaultSource
            }

            this.selectedProperties.duplex = this.selectedPrinterConfig?.DuplexSupported
            this.selectedProperties.duplexmode = this.selectedPrinterConfig?.DuplexMode
            delete this.selectedProperties.PageRanges
          })
        // this.setDefaultPaperFormat()
        break
      case 'color':
        this.selectedProperties.color =
          eventDetails.title == i18next.t('printer_selection.color_color') ? true : false
        break
      case 'orientation':
        this.selectedProperties.orientation = eventDetails.id
        break
      case 'format':
        this.selectedProperties.paper = eventDetails.title
        this.selectedProperties.paperid = eventDetails.id
        break
      case 'quality':
        this.selectedProperties.resolution = eventDetails.title
        break
      case 'length':
        this.selectedProperties.paperlength = eventDetails.value
        break
      case 'width':
        this.selectedProperties.paperwidth = eventDetails.value
        break
      case 'tray':
        if (
          this.selectedPrinterConfig.Trays &&
          this.selectedPrinterConfig.Trays.length >= 0 &&
          this.selectedPrinterConfig.Trays[0] == null
        ) {
          delete this.selectedProperties.trayname
          delete this.selectedProperties.defaultSource
        }
        if (
          this.selectedPrinterConfig.Trays &&
          this.selectedPrinterConfig.Trays.length >= 1 &&
          this.selectedPrinterConfig.Trays[0] != null
        ) {
          this.selectedProperties.trayname = eventDetails.title
          this.selectedProperties.defaultSource = eventDetails.id
        }
        break
      case 'paper_ranges':
        this.selectedProperties.PageRanges = eventDetails.value
        this.pageRangeInvalid = !validatePageRange(this.selectedProperties.PageRanges)
        break
      case 'duplex':
        if (
          eventDetails.title == i18next.t('printer_selection.duplex_none') ||
          eventDetails.title == i18next.t('printer_selection.duplex_long') ||
          eventDetails.title == i18next.t('printer_selection.duplex_short')
        ) {
          this.selectedProperties.duplex = true
        } else {
          this.selectedProperties.duplex = false
        }
        this.selectedProperties.duplexmode = eventDetails.id
        break
      default:
        break
    }

    this.setPaperid()
  }

  async handleFiles(files: File[], printPorperties) {
    this.totalFiles = files.length
    this.currentFileIndex = 0
    this.failedFiles = []
    this.successfulFiles = []

    // Process each file individually
    for (let i = 0; i < files.length; i++) {
      this.currentFileIndex = i
      const file = files[i]

      try {
        await this.processSingleFile(file, printPorperties)
        this.successfulFiles.push(file.name)
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error)
        this.failedFiles.push(file.name)
        // Continue with the next file instead of stopping
      }
    }

    // Determine final status based on results
    if (this.failedFiles.length === 0) {
      // All files processed successfully
      this.printSuccess = true
      this.partialSuccess = false
      this.printProcessing = false
    } else if (this.successfulFiles.length === 0) {
      // All files failed
      this.printFailed = true
      this.partialSuccess = false
      this.printProcessing = false
    } else {
      // Some files succeeded, some failed - show partial success
      this.printSuccess = true
      this.partialSuccess = true
      this.printProcessing = false
    }
  }

  private async processSingleFile(file: File, printProperties: any) {
    this.preparingUpload = true
    const response = await this.printService.prepareFileUpload(authStore.state.accessToken)
    this.preparingUpload = false

    const fileid = response.fileid
    const sasUri = response.sasUri
    const filetype = this.getFileExtension(file.name)

    this.uploading = true

    try {
      // Upload the file
      const res = await this.printService.uploadBlobFiles(sasUri, file)

      if (res._response.status === 201) {
        // Print the file
        const data = await this.printService.printByFileID(
          authStore.state.accessToken,
          fileid,
          filetype,
          this.selectedPrinter.id,
          printProperties,
          file.name
        )

        if (data.code === 804) {
          throw new Error(`Print failed for file: ${file.name}`)
        }

        if (data.jobid) {
          printStore.state.jobID = data.jobid
          // Wait for this print job to complete before processing the next file
          await this.waitForPrintCompletion()
        } else {
          throw new Error(`No job ID returned for file: ${file.name}`)
        }
      } else {
        throw new Error(`Upload failed for file: ${file.name}`)
      }
    } catch (error) {
      this.uploading = false
      throw error
    }

    this.uploading = false
  }

  private async waitForPrintCompletion(): Promise<void> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const data = await this.printService.getPrintStatus()
          if (data.jobstatus === 0) {
            resolve()
          } else if (data.jobstatus === 1) {
            // Still processing, continue polling
            setTimeout(poll, this.POLL_INTERVAL)
          } else {
            reject(new Error('Print job failed'))
          }
        } catch (error) {
          reject(error)
        }
      }
      poll()
    })
  }

  private getFileExtension(filename: string): string {
    const extension = filename.split('.').pop()
    return extension ? extension.toLowerCase() : ''
  }

  private validateFileType = async (name: string): Promise<boolean> => {
    const extension = name.split('.').pop()
    this.fileExtension = extension.toLowerCase()

    return printStore.state.supportedFileExtensions.includes(`${this.fileExtension}`)
  }

  setDefaultPaperFormat() {
    let format: string
    const language = navigator.language

    if (language === 'en-US') {
      format = 'Letter'
    } else if (language === 'my') {
      format = 'Letter'
    } else {
      format = 'A4'
    }

    if (this.selectedPrinterConfig.PaperFormats?.find((el) => el.Name.includes(format))) {
      this.selectedProperties.paper = this.selectedPrinterConfig.PaperFormats?.find((el) =>
        el.Name.includes(format)
      ).Name
      this.selectedProperties.paperid = this.selectedPrinterConfig.PaperFormats?.find((el) =>
        el.Name.includes(format)
      ).Id
    } else {
      this.selectedProperties.paper = this.selectedPrinterConfig.PaperFormats[0]?.Name
      this.selectedProperties.paperid = this.selectedPrinterConfig.PaperFormats[0]?.Id
    }
    this.setPaperid()
  }

  /**
   *
   * Lifecycle methods
   *
   */

  /** Description... */
  async connectedCallback() {
    this.printService = new EzpPrintService(this.redirectURI, this.clientID)
    this.printService.registerFetchInterceptor()
    await this.getUserInfo()

    await this.printService
      .getPrinterList(authStore.state.accessToken)
      .then((printers: Printer[]) => {
        this.printers = printers

        if (!(this.printers.length > 0)) {
          this.noPrinters = true
        }
      })

    this.getPropertiesFromLocalStorage()

    // if printer is stored from previous print, get the config to enable property selection
    if (this.selectedPrinter.id != '') {
      await this.printService
        .getPrinterProperties(authStore.state.accessToken, this.selectedPrinter.id)
        .then((data) => {
          this.selectedPrinterConfig = data[0]
          this.selectedProperties.color =
            this.selectedPrinterConfig.Default?.Color == 'color' ? true : false
          this.selectedProperties.orientation = this.selectedPrinterConfig.Default?.Orientation
          this.selectedProperties.resolution = this.selectedPrinterConfig.Default?.Resolution

          let defaultPaper = this.selectedPrinterConfig.PaperFormats?.find(
            (obj) => obj.Default === true
          )
          this.selectedProperties.paper = defaultPaper?.Name
          this.selectedProperties.paperid = defaultPaper?.Id

          let defaultSource = this.selectedPrinterConfig.Trays?.find((obj) => obj.Default === true)
          if (
            this.selectedPrinterConfig.Trays &&
            this.selectedPrinterConfig.Trays.length >= 1 &&
            this.selectedPrinterConfig.Trays[0] != null
          ) {
            this.selectedProperties.trayname = defaultSource?.Name
            this.selectedProperties.defaultSource = defaultSource?.Index
          }

          if (
            this.selectedPrinterConfig.Trays &&
            this.selectedPrinterConfig.Trays.length >= 0 &&
            this.selectedPrinterConfig.Trays[0] == null
          ) {
            delete this.selectedProperties.trayname
            delete this.selectedProperties.defaultSource
          }

          this.selectedProperties.duplex = this.selectedPrinterConfig?.DuplexSupported
          this.selectedProperties.duplexmode = this.selectedPrinterConfig?.DuplexMode
          delete this.selectedProperties.PageRanges
        })
      if (this.selectedProperties.paper === '') {
        this.setDefaultPaperFormat()
      }
    }

    await (await this.printService.getConfig(authStore.state.accessToken))
      .json()
      .then((response) => {
        printStore.state.supportedFileExtensions = response.System.FILEEXT
      })

    await this.printService
      .getAllPrinterProperties(authStore.state.accessToken)
      .then((printerConfig: PrinterConfig[]) => {
        this.printerConfig = printerConfig
      })

    if (this.files && this.files.length > 0) {
      // Validate all files
      const validationPromises = this.files.map((file) => this.validateFileType(file.name))
      const validationResults = await Promise.all(validationPromises)
      const allValid = validationResults.every((valid) => valid)
      this.notSupported = !allValid
    }

    this.loading = false
  }

  /**
   *
   * Render method
   *
   */

  render() {
    return this.loading ? (
      <ezp-status
        processing
        description={i18next.t('printer_selection.loading')}
        instance="loading"
      />
    ) : (
      <Host class={{ seamless: this.seamless }}>
        <div id="box" data-backdrop-surface>
          {!this.printStopped && (
            <>
              {this.printProcessing ? (
                <ezp-status
                  processing
                  description={
                    this.preparingUpload
                      ? i18next.t('printer_selection.prepare_upload')
                      : this.uploading
                      ? this.totalFiles > 1
                        ? `${i18next.t('printer_selection.uploading')} (${
                            this.currentFileIndex + 1
                          }/${this.totalFiles})`
                        : i18next.t('printer_selection.uploading')
                      : this.totalFiles > 1
                      ? `${i18next.t('printer_selection.print_processing')} (${
                          this.currentFileIndex + 1
                        }/${this.totalFiles})`
                      : i18next.t('printer_selection.print_processing')
                  }
                  instance="print-processing"
                  cancel
                />
              ) : this.selectedPrinter.is_queue && this.printSuccess ? (
                <ezp-status
                  icon="checkmark-alt"
                  description={
                    this.totalFiles > 1
                      ? this.failedFiles.length > 0
                        ? `${i18next.t('printer_selection.pull_print_success')} (${
                            this.successfulFiles.length
                          }/${this.totalFiles} files)`
                        : `${i18next.t('printer_selection.pull_print_success')} (${
                            this.totalFiles
                          } files)`
                      : i18next.t('printer_selection.pull_print_success')
                  }
                  instance="print-success"
                  close
                />
              ) : this.printSuccess ? (
                <ezp-status
                  icon={this.partialSuccess ? 'exclamation-mark' : 'checkmark-alt'}
                  description={
                    this.totalFiles > 1
                      ? this.partialSuccess
                        ? `${i18next.t('printer_selection.print_success')} (${
                            this.successfulFiles.length
                          }/${this.totalFiles} files) - ${this.failedFiles.length} failed`
                        : `${i18next.t('printer_selection.print_success')} (${
                            this.totalFiles
                          } files)`
                      : i18next.t('printer_selection.print_success')
                  }
                  instance="print-success"
                  close
                />
              ) : this.printFailed ? (
                <ezp-status
                  icon="exclamation-mark"
                  description={i18next.t('printer_selection.print_failed')}
                  instance="print-failed"
                  close
                  retry
                />
              ) : this.notSupported ? (
                <ezp-status
                  icon="exclamation-mark"
                  description={i18next.t('printer_selection.not_supported')}
                  instance="not-supported"
                  retry
                />
              ) : this.noPrinters ? (
                <ezp-status
                  icon="exclamation-mark"
                  description={i18next.t('printer_selection.no_printers')}
                  instance="no-printers"
                  close
                />
              ) : null}
            </>
          )}
          {!this.hideheader && (
            <div id="header">
              <ezp-label
                weight="heavy"
                text={i18next.t('printer_selection.print') + `${!this.notSupported ? ':' : ''}`}
              />
              <ezp-label
                text={
                  !this.notSupported
                    ? this.files && this.files.length > 1
                      ? `${this.files.length} files selected`
                      : this.filename
                    : ''
                }
                ellipsis
              />
              {!this.hidemenu && (
                <ezp-icon-button
                  level="tertiary"
                  icon="menu"
                  id="toggle-menu"
                  type="button"
                  onClick={this.handleUserMenu}
                />
              )}
            </div>
          )}
          <div id="body">
            <div id="printer">
              <ezp-select
                label={i18next.t('printer_selection.printer')}
                icon="printer"
                placeholder={
                  this.printers.length > 0
                    ? i18next.t('printer_selection.select_printer')
                    : i18next.t('printer_selection.no_printers')
                }
                toggleFlow="vertical"
                optionFlow="vertical"
                options={this.printers.map((printer) => ({
                  id: printer.id,
                  title: printer.name,
                  meta: printer.location !== '' ? printer.location : '',
                  type: 'printer',
                  is_queue: printer.is_queue,
                }))}
                preSelected={this.selectedPrinter.id ? this.selectedPrinter.name : null}
                disabled={!(this.printers.length > 0)}
              />
            </div>
            <div id="options">
              <ezp-select
                label={i18next.t('printer_selection.color')}
                icon="color"
                placeholder={i18next.t('printer_selection.select_color')}
                toggleFlow="horizontal"
                options={this.ColorOptions?.map((option) => ({
                  id: option.id,
                  title: option.title,
                  meta: '',
                  type: 'color',
                }))}
                preSelected={
                  this.selectedPrinter.id && this.selectedPrinterConfig.Default?.Color == 'color'
                    ? i18next.t('printer_selection.color_color')
                    : i18next.t('printer_selection.color_grayscale')
                }
                disabled={!this.selectedPrinterConfig.ColorSupported}
              />
              <ezp-select
                label={i18next.t('printer_selection.duplex')}
                icon="duplex"
                placeholder={i18next.t('printer_selection.select_duplex')}
                toggleFlow="horizontal"
                options={this.duplexOptions?.map((option) => ({
                  id: option.id,
                  title: option.title,
                  meta: '',
                  type: 'duplex',
                }))}
                preSelected={
                  this.selectedPrinter.id &&
                  this.selectedPrinterConfig.Default?.Duplex == 'duplex_simplex'
                    ? i18next.t('printer_selection.duplex_none')
                    : this.selectedPrinterConfig.Default?.Duplex == 'duplex_vertical'
                    ? i18next.t('printer_selection.duplex_long')
                    : this.selectedPrinterConfig.Default?.Duplex == 'duplex_horizontal'
                    ? i18next.t('printer_selection.duplex_short')
                    : null
                }
                disabled={!this.selectedPrinterConfig.DuplexSupported}
              />
              <ezp-select
                label={i18next.t('printer_selection.size')}
                icon="size"
                placeholder={i18next.t('printer_selection.select_size')}
                toggleFlow="horizontal"
                optionFlow="horizontal"
                options={
                  this.selectedPrinterConfig.PaperFormats &&
                  this.selectedPrinterConfig.PaperFormats.map((format) => ({
                    id: format.Id,
                    title: format.Name,
                    meta: `${format.XRes} x ${format.YRes}`,
                    type: 'format',
                  }))
                }
                preSelected={
                  this.selectedPrinter.id &&
                  this.selectedPrinterConfig.PaperFormats?.find((el) =>
                    el.Name.includes(this.selectedPrinterConfig.Default?.Paper)
                  )
                    ? this.selectedPrinterConfig.Default?.Paper
                    : null
                }
                disabled={!(this.selectedPrinterConfig.PaperFormats?.length > 0)}
              />
              {this.paperid == PAPER_ID ? (
                <>
                  <ezp-input
                    icon="width"
                    suffix="mm"
                    value={this.selectedProperties.paperwidth}
                    eventType="width"
                    type="number"
                    label={i18next.t('printer_selection.width')}
                  />
                  <ezp-input
                    icon="height"
                    suffix="mm"
                    value={this.selectedProperties.paperlength}
                    eventType="length"
                    type="number"
                    label={i18next.t('printer_selection.length')}
                  />
                </>
              ) : null}
              <ezp-select
                label={i18next.t('printer_selection.orientation')}
                icon="orientation"
                placeholder={i18next.t('printer_selection.select_orientation')}
                toggleFlow="horizontal"
                options={this.selectedPrinterConfig.OrientationsSupported.map(
                  (orientation, index) => ({
                    id: index + 1,
                    title: i18next.t(`printer_selection.orientation_${orientation}`),
                    meta: '',
                    type: 'orientation',
                  })
                )}
                preSelected={this.selectedPrinter.id ? this.selectedProperties.orientation : null}
                disabled={!(this.selectedPrinterConfig.OrientationsSupported.length > 0)}
              />
              <ezp-select
                label={i18next.t('printer_selection.quality')}
                icon="quality"
                placeholder={i18next.t('printer_selection.select_quality')}
                toggleFlow="horizontal"
                options={this.selectedPrinterConfig.Resolutions?.map((option, index) => ({
                  id: index,
                  title: option,
                  meta: '',
                  type: 'quality',
                }))}
                preSelected={
                  this.selectedPrinter.id &&
                  this.selectedPrinterConfig.Resolutions?.includes(
                    this.selectedPrinterConfig.Default.Resolution
                  )
                    ? this.selectedPrinterConfig.Default.Resolution
                    : null
                }
                disabled={!(this.selectedPrinterConfig.Resolutions?.length > 0)}
              />
              {this.selectedPrinterConfig.Trays &&
              this.selectedPrinterConfig.Trays.length >= 1 &&
              this.selectedPrinterConfig.Trays[0] != null ? (
                <ezp-select
                  label={i18next.t('printer_selection.trays')}
                  icon="trays"
                  placeholder={i18next.t('printer_selection.select_trays')}
                  toggleFlow="horizontal"
                  optionFlow="horizontal"
                  options={
                    this.selectedPrinterConfig.Trays &&
                    this.selectedPrinterConfig.Trays.length >= 1 &&
                    this.selectedPrinterConfig.Trays.map((trays) => ({
                      title: trays.Name,
                      id: trays.Index,
                      meta: '',
                      type: 'tray',
                    }))
                  }
                  preSelected={
                    this.selectedPrinter.id &&
                    this.selectedPrinterConfig.Trays?.find((el) =>
                      el.Name.includes(this.selectedPrinterConfig.Default.Tray)
                    )
                      ? this.selectedPrinterConfig.Default.Tray
                      : null
                  }
                />
              ) : null}
              <ezp-input
                icon="paper_range"
                suffix=""
                placeholder="1-2,4-5,8"
                value={this.selectedProperties.PageRanges}
                eventType="paper_ranges"
                type="text"
                label={i18next.t('printer_selection.page_ranges')}
              />
            </div>
            <ezp-stepper label={i18next.t('printer_selection.copies')} max={10} icon="copies" />
          </div>
          <div id="footer">
            <ezp-text-button
              type="button"
              level="secondary"
              onClick={this.handleCancel}
              label={i18next.t('button_actions.cancel')}
              class="action"
              id="cancel"
            />
            <ezp-text-button
              disabled={
                this.selectedPrinter.id === '' || this.printProcessing || this.pageRangeInvalid
              }
              type="button"
              onClick={this.handlePrint}
              label={i18next.t('button_actions.print')}
              ref={(button) => (this.printButton = button)}
              class="action"
              id="print"
            />
          </div>
          {!this.hidemenu && <ezp-user-menu open={this.userMenuOpen} name={this.userName} />}
        </div>
      </Host>
    )
  }
}
