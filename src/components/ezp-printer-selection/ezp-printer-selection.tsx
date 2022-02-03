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
import { initi18n, poll, removeEmptyStrings } from '../../utils/utils'
import options from '../../data/options.json'
import { BlobUploadCommonResponse } from '@azure/storage-blob'

@Component({
  tag: 'ezp-printer-selection',
  styleUrl: 'ezp-printer-selection.scss',
  shadow: true,
})
export class EzpPrinterSelection {
  private sasUri = ''
  private fileExtension = ''
  private printService: EzpPrintService
  private duplexOptions = [
    {
      id: 1,
      title: 'None',
    },
    {
      id: 2,
      title: 'Long edge binding',
    },
    {
      id: 3,
      title: 'Short edge binding',
    },
  ]
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
  @Prop() file: File
  @Prop() hidelogout: boolean

  /**
   *
   * States
   *
   */
  @State() loading: boolean = true
  @State() options = options
  @State() printProcessing: boolean = false
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
    OrientationsSupported: [],
    PaperFormats: [],
    Resolutions: [],
    DuplexSupported: false,
    Color: false,
  }

  // needs to be initialised with empty strings
  @State() selectedProperties: PrinterProperties = {
    paper: '',
    paperid: '',
    color: false,
    duplex: false,
    duplexmode: '',
    orientation: '',
    copies: '',
    resolution: '',
  }

  @State() previouslySelectedProperties: PrinterProperties = {
    paper: '',
    paperid: '',
    color: false,
    duplex: false,
    duplexmode: '',
    orientation: '',
    copies: '',
    resolution: '',
  }
  /**
   *
   * Events
   *
   */

  /** Description... */
  @Event() printCancel: EventEmitter<MouseEvent>

  /** Description... */
  @Event() printSubmit: EventEmitter<MouseEvent>

  /**
   *
   * Listeners
   *
   */

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
  }

  @Listen('statusCancel')
  listenStatusCancel(event: CustomEvent) {
    if (event.detail === 'print-processing') {
      this.printStopped = true
      this.printProcessing = false
      window.stop()
    }
  }

  @Listen('statusClose')
  listenStatusClose(event: CustomEvent) {
    switch (event.detail) {
      case 'print-success':
        this.printSuccess = false
        break
      case 'print-failed':
        this.printProcessing = false
        this.printFailed = false
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

  /** Description... */
  private handlePrint = async () => {
    this.printProcessing = true

    // we have to initialse this obj with empty strings to display the select component
    // but don't want to send any attributes with empty strings to the API
    this.selectedProperties = removeEmptyStrings(this.selectedProperties)
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
          this.selectedProperties,
          this.filename
        )
        .then((response) => {
          if (response.status === 412) {
            response.json().then((data) => (this.fileid = data.fileid))
            this.printService.printByFileID(
              authStore.state.accessToken,
              this.fileid,
              this.filetype,
              this.selectedPrinter.id,
              this.selectedProperties,
              this.filename
            )
          } else {
            return response.json()
          }
        })
        .then((data) => {
          if (data.jobid) {
            printStore.state.jobID = data.jobid
            poll({
              fn: this.printService.getPrintStatus,
              validate: this.validateData,
              interval: this.POLL_INTERVAL,
              maxAttempts: 10,
            }).catch((err) => {
              console.warn(err)
            })
          } else {
            this.printFailed = true
          }
        })
        .catch((error) => {
          console.log(error)
          this.printFailed = true
        })
    }

    if (this.file) {
      await this.handleFiles(this.file)
    }

    localStorage.setItem('properties', JSON.stringify(this.selectedProperties))
    localStorage.setItem('printer', JSON.stringify(this.selectedPrinter))
    localStorage.setItem(
      'previouslySelectedProperties',
      JSON.stringify(this.previouslySelectedProperties)
    )

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
      this.selectedPrinter = JSON.parse(localStorage.getItem('printer'))
    } else {
      this.selectedPrinter = { id: '', location: '', name: '' }
    }

    if (localStorage.getItem('previouslySelectedProperties')) {
      this.previouslySelectedProperties = JSON.parse(
        localStorage.getItem('previouslySelectedProperties')
      )
    }
  }

  private getUserInfo() {
    const userService = new EzpUserService()
    return userService.getUserInfo().then((user) => {
      userStore.state.user = user
      this.userName = userStore.state.user.display_name
    })
  }

  private async setSelectedProperties(eventDetails: { type: string; id: string; title: string }) {
    switch (eventDetails.type) {
      case 'printer':
        this.selectedPrinter.id = eventDetails.id
        this.selectedPrinter.name = eventDetails.title
        await this.printService
          .getPrinterProperties(authStore.state.accessToken, this.selectedPrinter.id)
          .then((data) => (this.selectedPrinterConfig = data[0]))
        break
      case 'color':
        this.selectedProperties.color = !!eventDetails.id
        this.previouslySelectedProperties.color = eventDetails.title
        break
      case 'orientation':
        this.selectedProperties.orientation = eventDetails.id
        this.previouslySelectedProperties.orientation = eventDetails.title
        break
      case 'format':
        this.selectedProperties.paper = eventDetails.title
        this.selectedProperties.paperid = eventDetails.id
        this.previouslySelectedProperties.paper = eventDetails.title
        this.previouslySelectedProperties.paperid = eventDetails.id
        break
      case 'quality':
        this.selectedProperties.resolution = eventDetails.title
        this.previouslySelectedProperties.resolution = eventDetails.title
        break
      case 'duplex':
        if (eventDetails.title === 'None') {
          this.selectedProperties.duplex = false
        } else {
          this.selectedProperties.duplex = true
        }
        this.selectedProperties.duplexmode = eventDetails.id
        this.previouslySelectedProperties.duplexmode = eventDetails.id
        break
      default:
        break
    }
  }

  async handleFiles(file: File) {
    const response = await this.printService.prepareFileUpload(authStore.state.accessToken)

    this.fileid = response.fileid
    this.sasUri = response.sasUri
    this.filetype = file.type
    let res: BlobUploadCommonResponse
    try {
      res = await this.printService.uploadBlobFiles(this.sasUri, file)
    } catch (error) {
      this.printProcessing = false
      this.printFailed = true
    }

    if (res._response.status === 201) {
      this.printService
        .printByFileID(
          authStore.state.accessToken,
          this.fileid,
          this.fileExtension,
          this.selectedPrinter.id,
          this.selectedProperties,
          this.filename
        )
        .then((data) => {
          if (data.jobid) {
            printStore.state.jobID = data.jobid
            poll({
              fn: this.printService.getPrintStatus,
              validate: this.validateData,
              interval: this.POLL_INTERVAL,
              maxAttempts: 10,
            }).catch((err) => {
              console.log(err)
              this.printFailed = true
            })
          } else {
            this.printFailed = true
          }
        })
        .catch((error) => {
          console.log(error)
          this.printFailed = true
        })
    } else {
      this.printFailed = true
    }
  }

  private validateFileType = async (name: string): Promise<boolean> => {
    const extension = name.split('.').pop()
    this.fileExtension = extension

    return printStore.state.supportedFileExtensions.includes(`${extension}`)
  }

  /**
   *
   * Lifecycle methods
   *
   */

  /** Description... */
  async componentWillLoad() {
    initi18n()
    this.loading = true
    this.getPropertiesFromLocalStorage()
    this.getUserInfo()
    this.printService = new EzpPrintService(this.redirectURI, this.clientID)

    await (await this.printService.getConfig(authStore.state.accessToken))
      .json()
      .then((response) => {
        printStore.state.supportedFileExtensions = response.System.FILEEXT
      })

    await this.printService
      .getPrinterList(authStore.state.accessToken)
      .then((printers: Printer[]) => {
        this.printers = printers

        if (!(this.printers.length > 0)) {
          this.noPrinters = true
        }
      })

    await this.printService
      .getAllPrinterProperties(authStore.state.accessToken)
      .then((printerConfig: PrinterConfig[]) => {
        this.printerConfig = printerConfig
      })

    if (this.file) {
      await this.validateFileType(this.filename).then((valid) => {
        this.notSupported = !valid ? true : false
      })
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
      <Host>
        <div id="container" data-backdrop-surface>
          {!this.printStopped && (
            <>
              {this.printProcessing ? (
                <ezp-status
                  processing
                  description={i18next.t('printer_selection.print_processing')}
                  instance="print-processing"
                  cancel
                />
              ) : this.printSuccess ? (
                <ezp-status
                  icon="checkmark-alt"
                  description={i18next.t('printer_selection.print_success')}
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
          <div id="header">
            <ezp-label
              weight="heavy"
              text={i18next.t('printer_selection.print') + `${!this.notSupported ? ':' : ''}`}
            />
            <ezp-label text={!this.notSupported ? this.filename : ''} />
            <ezp-icon-button
              level="tertiary"
              icon="menu"
              id="toggle-menu"
              type="button"
              onClick={this.handleUserMenu}
            />
          </div>
          <div id="content">
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
                  meta:
                    printer.location !== ''
                      ? printer.location
                      : i18next.t('printer_selection.unknown_location'),
                  type: 'printer',
                }))}
                preSelected={this.selectedPrinter ? this.selectedPrinter.name : null}
                disabled={!(this.printers.length > 0)}
              />
            </div>
            <div id="options">
              <ezp-select
                label={i18next.t('printer_selection.color')}
                icon="color"
                placeholder={i18next.t('printer_selection.select_color')}
                toggleFlow="horizontal"
                options={
                  this.selectedPrinterConfig.Color
                    ? [
                        {
                          id: 1,
                          title: i18next.t('printer_selection.color_color'),
                          meta: '',
                          type: 'color',
                        },
                        {
                          id: 0,
                          title: i18next.t('printer_selection.color_grayscale'),
                          meta: '',
                          type: 'color',
                        },
                      ]
                    : [
                        {
                          id: 0,
                          title: i18next.t('printer_selection.color_grayscale'),
                          meta: '',
                          type: 'color',
                        },
                      ]
                }
                preSelected={
                  this.previouslySelectedProperties.color
                    ? this.previouslySelectedProperties.color
                    : this.selectedPrinterConfig.Color
                    ? i18next.t('printer_selection.color_grayscale')
                    : null
                }
                disabled={!this.selectedPrinterConfig.Color}
              />
              <ezp-select
                label={i18next.t('printer_selection.orientation')}
                icon="orientation"
                placeholder={i18next.t('printer_selection.select_orientation')}
                toggleFlow="horizontal"
                options={this.selectedPrinterConfig.OrientationsSupported.map(
                  (orientation, index) => ({
                    id: index,
                    title: i18next.t(`printer_selection.orientation_${orientation}`),
                    meta: '',
                    type: 'orientation',
                  })
                )}
                preSelected={
                  this.previouslySelectedProperties.orientation
                    ? this.previouslySelectedProperties.orientation
                    : this.selectedPrinterConfig.OrientationsSupported.length > 0
                    ? i18next.t(
                        `printer_selection.orientation_${this.selectedPrinterConfig.OrientationsSupported[0]}`
                      )
                    : null
                }
                disabled={!(this.selectedPrinterConfig.OrientationsSupported.length > 0)}
              />
              <ezp-select
                label={i18next.t('printer_selection.size')}
                icon="size"
                placeholder={i18next.t('printer_selection.select_size')}
                toggleFlow="horizontal"
                optionFlow="horizontal"
                options={this.selectedPrinterConfig.PaperFormats.map((format) => ({
                  id: format.Id,
                  title: format.Name,
                  meta: `${format.XRes} x ${format.YRes}`,
                  type: 'format',
                }))}
                preSelected={
                  this.previouslySelectedProperties.paper
                    ? this.previouslySelectedProperties.paper
                    : this.selectedPrinterConfig.PaperFormats.length > 0
                    ? this.selectedPrinterConfig.PaperFormats[0].Name
                    : null
                }
                disabled={!(this.selectedPrinterConfig.PaperFormats.length > 0)}
              />
              <ezp-select
                label={i18next.t('printer_selection.quality')}
                icon="quality"
                placeholder={i18next.t('printer_selection.select_quality')}
                toggleFlow="horizontal"
                options={this.selectedPrinterConfig.Resolutions.map((option, index) => ({
                  id: index,
                  title: option,
                  meta: '',
                  type: 'quality',
                }))}
                preSelected={
                  this.previouslySelectedProperties.resolution
                    ? this.previouslySelectedProperties.resolution
                    : this.selectedPrinterConfig.Resolutions.length > 0
                    ? this.selectedPrinterConfig.Resolutions[0]
                    : null
                }
                disabled={!(this.selectedPrinterConfig.Resolutions.length > 0)}
              />
              <ezp-select
                label={i18next.t('printer_selection.duplex')}
                icon="duplex"
                placeholder={i18next.t('printer_selection.select_duplex')}
                toggleFlow="horizontal"
                options={this.duplexOptions.map((option) => ({
                  id: option.id,
                  title: option.title,
                  meta: '',
                  type: 'duplex',
                }))}
                preSelected={
                  this.previouslySelectedProperties.duplex
                    ? this.previouslySelectedProperties.duplex
                    : this.selectedPrinterConfig.DuplexSupported
                    ? 'None'
                    : null
                }
                disabled={!this.selectedPrinterConfig.DuplexSupported}
              />
            </div>
            <ezp-stepper label="Copies" max={10} icon="copies" />
          </div>
          <div id="footer">
            <ezp-text-button
              type="button"
              level="secondary"
              onClick={this.handleCancel}
              label={i18next.t('button_actions.cancel')}
            />
            <ezp-text-button
              disabled={this.selectedPrinter.id === ''}
              type="button"
              onClick={this.handlePrint}
              label={i18next.t('button_actions.print')}
            />
          </div>
          <ezp-user-menu hidelogout={this.hidelogout} open={this.userMenuOpen} name={this.userName} />
        </div>
      </Host>
    )
  }
}
