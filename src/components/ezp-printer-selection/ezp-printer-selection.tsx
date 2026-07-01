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
import { Printer, PrinterConfig, PrinterProperties, JobStatusResponse } from '../../shared/types'
import { managePaperDimensions, poll, removeEmptyStrings } from '../../utils/utils'
import { PAPER_ID, validatePageRange, formatPageRange } from '../../utils/utils'
import { applyPrinterDefaults, classifyJobStatus, hasTrays, hasNoTrays } from '../../utils/printer'
import { uploadAndPrintFile } from '../../services/print-job'
import { storage } from '../../shared/storage'
import {
  HUB_DRIVER_ERROR_CODES,
  PRINT_REJECTED_CODE,
  FILE_EXPIRED_STATUS,
  POLL_INTERVAL_MS,
  MAX_POLL_ATTEMPTS,
  HUB_TIMEOUT_MS,
} from '../../shared/constants'

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
  @State() hubDriverError: boolean = false
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

  @State() paperid: number | string | undefined
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
        this.printFailed = false
        break
      case 'hub-driver-error':
        this.hubDriverError = false
        break
      case 'not-supported':
        this.noPrinters = false
        break
      case 'no-printers':
        this.noPrinters = false
        this.printCancel.emit()
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
      case 'hub-driver-error':
        this.hubDriverError = false
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
    this.hubDriverError = false
    this.printCancel.emit()
  }

  /** Poll `validate` callback: maps a job status to component state, returns `true` to stop polling. */
  private validateData = (data: JobStatusResponse) => {
    const outcome = classifyJobStatus(data.jobstatus, this.selectedPrinter.is_queue)
    switch (outcome) {
      case 'processing':
        return false
      case 'success':
        this.printSuccess = true
        this.printProcessing = false
        return true
      case 'hub-error':
        this.hubDriverError = true
        this.printProcessing = false
        return true
      case 'failed':
      default:
        this.printFailed = true
        this.printProcessing = false
        return true
    }
  }

  /** Description... */
  private handlePrint = async () => {
    this.printButton?.blur()
    this.printProcessing = true
    this.failedFiles = []
    this.successfulFiles = []
    this.partialSuccess = false
    this.hubDriverError = false

    // Set up timeout for hub printers to prevent infinite loading
    let hubTimeout: NodeJS.Timeout | undefined
    if (this.selectedPrinter.is_queue) {
      hubTimeout = setTimeout(() => {
        this.hubDriverError = true
        this.printProcessing = false
      }, HUB_TIMEOUT_MS)
    }

    // Resolve a print failure as either a hub-driver error or a generic failure,
    // and stop the processing/timeout state. (Collapses three identical branches.)
    const failByPrinterType = () => {
      if (this.selectedPrinter.is_queue) {
        this.hubDriverError = true
      } else {
        this.printFailed = true
      }
      this.printProcessing = false
      if (hubTimeout) clearTimeout(hubTimeout)
    }

    // we have to initialse this obj with empty strings to display the select component
    // but don't want to send any attributes with empty strings to the API
    if (hasNoTrays(this.selectedPrinterConfig)) {
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
            if (hubTimeout) clearTimeout(hubTimeout)
          }

          if (response.status === FILE_EXPIRED_STATUS) {
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
          if (data.code === PRINT_REJECTED_CODE) {
            this.printFailed = true
            this.printProcessing = false
            if (hubTimeout) clearTimeout(hubTimeout)
          } else if (this.selectedPrinter.is_queue && HUB_DRIVER_ERROR_CODES.includes(data.code)) {
            // Hub printer specific errors - likely driver not assigned
            this.hubDriverError = true
            this.printProcessing = false
            if (hubTimeout) clearTimeout(hubTimeout)
          } else if (data.jobid) {
            printStore.state.jobID = data.jobid
            poll({
              fn: this.printService.getPrintStatus,
              validate: this.validateData,
              interval: POLL_INTERVAL_MS,
              maxAttempts: MAX_POLL_ATTEMPTS,
            }).catch(() => {
              // Polling failed — for hub printers this usually means a driver issue.
              failByPrinterType()
            })
          } else {
            // No job ID returned — treat as a hub or generic failure.
            failByPrinterType()
          }
        })
        .catch(() => {
          failByPrinterType()
        })
    } else if (this.files && this.files.length > 1) {
      await this.processMultipleFiles(this.files, cleanPrintProperties)
      if (hubTimeout) clearTimeout(hubTimeout)
    } else if (this.files && this.files.length === 1) {
      // --- Begin: Consistent single file handling ---
      this.totalFiles = 1
      this.currentFileIndex = 0
      this.failedFiles = []
      this.successfulFiles = []
      try {
        await this.processSingleFile(this.files[0], cleanPrintProperties)
        this.successfulFiles.push(this.files[0].name)
        this.printSuccess = true
        this.partialSuccess = false
        this.printProcessing = false
      } catch (error) {
        this.failedFiles.push(this.files[0].name)
        this.printFailed = true
        this.partialSuccess = false
        this.printProcessing = false
        // Check if this is a hub driver error
        if (error.message && error.message.includes('Hub printer driver error')) {
          this.hubDriverError = true
        }
      }
      if (hubTimeout) clearTimeout(hubTimeout)
    }

    storage.setProperties(this.selectedProperties)
    storage.setPrinter(this.selectedPrinter)

    this.printStopped = false
  }

  private handleUserMenu = () => {
    this.userMenuOpen = true
  }

  private getPropertiesFromLocalStorage() {
    const savedProperties = storage.getProperties()
    if (savedProperties) {
      this.selectedProperties = savedProperties
    }

    const savedPrinter = storage.getPrinter()
    if (savedPrinter) {
      if (this.printers.some((printer) => printer.id === savedPrinter.id)) {
        this.selectedPrinter = savedPrinter
      } else {
        this.selectedPrinter = { id: '', location: '', name: '', is_queue: false }
        storage.clearSavedPrinter()
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
    value?: string | number
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
            applyPrinterDefaults(this.selectedPrinterConfig, this.selectedProperties)
          })
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
        if (hasNoTrays(this.selectedPrinterConfig)) {
          delete this.selectedProperties.trayname
          delete this.selectedProperties.defaultSource
        }
        if (hasTrays(this.selectedPrinterConfig)) {
          this.selectedProperties.trayname = eventDetails.title
          this.selectedProperties.defaultSource = eventDetails.id
        }
        break
      case 'paper_ranges':
        // The page-range field is a text input, so the value is always a string.
        this.selectedProperties.PageRanges = eventDetails.value as string
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

  /** Upload + print a single file, reflecting progress into component state. */
  private async processSingleFile(file: File, printProperties: PrinterProperties) {
    await uploadAndPrintFile(
      {
        service: this.printService,
        accessToken: authStore.state.accessToken,
        printerId: this.selectedPrinter.id,
        isQueue: this.selectedPrinter.is_queue,
        properties: printProperties,
        pollIntervalMs: POLL_INTERVAL_MS,
      },
      file,
      {
        onPreparing: (value) => (this.preparingUpload = value),
        onUploading: (value) => (this.uploading = value),
        onJobId: (jobId) => (printStore.state.jobID = jobId),
      }
    )
  }

  private validateFileType = async (name: string): Promise<boolean> => {
    const extension = name.split('.').pop() ?? ''
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

    const matched = this.selectedPrinterConfig.PaperFormats?.find((el) => el.Name.includes(format))
    if (matched) {
      this.selectedProperties.paper = matched.Name
      this.selectedProperties.paperid = matched.Id
    } else {
      this.selectedProperties.paper = this.selectedPrinterConfig.PaperFormats?.[0]?.Name
      this.selectedProperties.paperid = this.selectedPrinterConfig.PaperFormats?.[0]?.Id
    }
    this.setPaperid()
  }

  private async processMultipleFiles(files: File[], printProperties: PrinterProperties) {
    this.totalFiles = files.length
    this.currentFileIndex = 0
    this.failedFiles = []
    this.successfulFiles = []

    for (let i = 0; i < files.length; i++) {
      this.currentFileIndex = i
      const file = files[i]
      try {
        await this.processSingleFile(file, printProperties)
        this.successfulFiles.push(file.name)
      } catch {
        this.failedFiles.push(file.name)
        // Continue with the next file
      }
    }

    // Set UI state
    if (this.failedFiles.length === 0) {
      this.printSuccess = true
      this.partialSuccess = false
      this.printProcessing = false
    } else if (this.successfulFiles.length === 0) {
      this.printFailed = true
      this.partialSuccess = false
      this.printProcessing = false
    } else {
      this.printSuccess = true
      this.partialSuccess = true
      this.printProcessing = false
    }
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
          applyPrinterDefaults(this.selectedPrinterConfig, this.selectedProperties)
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

  /** Description shown while a print job is in progress. */
  private processingDescription(): string {
    if (this.totalFiles > 1) {
      return `${i18next.t('printer_selection.print_processing')} (${this.currentFileIndex + 1}/${
        this.totalFiles
      })`
    }
    if (this.preparingUpload) return i18next.t('printer_selection.prepare_upload')
    if (this.uploading) return i18next.t('printer_selection.uploading')
    return i18next.t('printer_selection.print_processing')
  }

  /** Description for a successful pull-print (hub/queue printer). */
  private pullPrintSuccessDescription(): string {
    const base = i18next.t('printer_selection.pull_print_success')
    if (this.totalFiles <= 1) return base
    return this.failedFiles.length > 0
      ? `${base} (${this.successfulFiles.length}/${this.totalFiles} files)`
      : `${base} (${this.totalFiles} files)`
  }

  /** Description for a successful (possibly partial) direct print. */
  private printSuccessDescription(): string {
    const base = i18next.t('printer_selection.print_success')
    const files = i18next.t('printer_selection.files')
    if (this.totalFiles <= 1) return base
    return this.partialSuccess
      ? `${base} (${this.successfulFiles.length}/${this.totalFiles} ${files} - ${this.failedFiles.length} failed`
      : `${base} (${this.totalFiles} ${files})`
  }

  /**
   * The single status card (if any) to show above the form. Replaces a deeply
   * nested 9-branch ternary; the order of checks is preserved.
   */
  private renderStatus() {
    if (this.printProcessing) {
      return (
        <ezp-status
          processing
          description={this.processingDescription()}
          instance="print-processing"
          cancel
        />
      )
    }
    if (this.selectedPrinter.is_queue && this.printSuccess) {
      return (
        <ezp-status
          icon="checkmark-alt"
          description={this.pullPrintSuccessDescription()}
          instance="print-success"
          close
        />
      )
    }
    if (this.printSuccess) {
      return (
        <ezp-status
          icon={this.partialSuccess ? 'exclamation-mark' : 'checkmark-alt'}
          description={this.printSuccessDescription()}
          instance="print-success"
          close
        />
      )
    }
    if (this.printFailed) {
      return (
        <ezp-status
          icon="exclamation-mark"
          description={i18next.t('printer_selection.print_failed')}
          instance="print-failed"
          close
          retry
        />
      )
    }
    if (this.notSupported) {
      return (
        <ezp-status
          icon="exclamation-mark"
          description={i18next.t('printer_selection.not_supported')}
          instance="not-supported"
          retry
        />
      )
    }
    if (this.hubDriverError) {
      return (
        <ezp-status
          icon="exclamation-mark"
          description={i18next.t('printer_selection.print_failed')}
          instance="hub-driver-error"
          close
          retry
        />
      )
    }
    if (this.noPrinters) {
      return (
        <ezp-status
          icon="exclamation-mark"
          description={i18next.t('printer_selection.no_printers')}
          instance="no-printers"
          close
        />
      )
    }
    return null
  }

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
          {!this.printStopped && this.renderStatus()}
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
                      ? i18next.t('printer_selection.files_selected', { count: this.files.length })
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
                    el.Name.includes(this.selectedPrinterConfig.Default?.Paper as string)
                  )
                    ? this.selectedPrinterConfig.Default?.Paper
                    : null
                }
                disabled={!((this.selectedPrinterConfig.PaperFormats?.length ?? 0) > 0)}
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
                options={this.selectedPrinterConfig.OrientationsSupported?.map(
                  (orientation, index) => ({
                    id: index + 1,
                    title: i18next.t(`printer_selection.orientation_${orientation}`),
                    meta: '',
                    type: 'orientation',
                  })
                )}
                preSelected={this.selectedPrinter.id ? this.selectedProperties.orientation : null}
                disabled={!((this.selectedPrinterConfig.OrientationsSupported?.length ?? 0) > 0)}
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
                    this.selectedPrinterConfig.Default?.Resolution as string
                  )
                    ? this.selectedPrinterConfig.Default?.Resolution
                    : null
                }
                disabled={!((this.selectedPrinterConfig.Resolutions?.length ?? 0) > 0)}
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
                    this.selectedPrinterConfig.Trays.length >= 1
                      ? this.selectedPrinterConfig.Trays.map((trays) => ({
                          title: trays.Name,
                          id: trays.Index,
                          meta: '',
                          type: 'tray',
                        }))
                      : undefined
                  }
                  preSelected={
                    this.selectedPrinter.id &&
                    this.selectedPrinterConfig.Trays?.find((el) =>
                      el.Name.includes(this.selectedPrinterConfig.Default?.Tray as string)
                    )
                      ? this.selectedPrinterConfig.Default?.Tray
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
            <ezp-stepper label={i18next.t('printer_selection.copies')} icon="copies" />
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
