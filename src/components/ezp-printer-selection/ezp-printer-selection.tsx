import { Component, Host, Listen, Event, EventEmitter, State, h, Prop } from '@stencil/core'
import i18next from 'i18next'
import authStore from '../../services/auth'
import printStore, { EzpPrintService } from '../../services/print'
import userStore, { EzpUserService } from '../../services/user'
import { Printer, PrinterConfig, PrinterProperties } from '../../shared/types'
import { capitalize, initi18n, poll } from '../../utils/utils'

@Component({
  tag: 'ezp-printer-selection',
  styleUrl: 'ezp-printer-selection.scss',
  shadow: true,
})
export class EzpPrinterSelection {
  // private user: PrintUserType

  private printer: Printer
  private printService: EzpPrintService
  private properties: PrinterProperties = { color: '', paper: '', orientation: '' }
  private printerConfig: PrinterConfig
  /**
   *
   * Properties
   *
   */
  @Prop() clientID: string
  @Prop() redirectURI: string
  @Prop() filename: string
  @Prop() fileurl: string
  @Prop() filetype: string
  /**
   *
   * States
   *
   */

  @State() loading: boolean = true
  @State() options
  @State() printInProgress: boolean = false
  @State() userMenuOpen: boolean = false
  @State() userName: string
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
    console.log(event)
    this.setPrintProperties(event.detail)
  }

  @Listen('userMenuClosure')
  listenUserMenuClosure() {
    this.userMenuOpen = false
  }

  @Listen('logoutEmitter')
  listenLogout() {
    this.printCancel.emit()
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

  /** Description... */
  private handlePrint = () => {
    this.printInProgress = true
    this.printService
      .printFileByUrl(
        authStore.state.accessToken,
        this.fileurl,
        this.filetype,
        this.printer.id,
        this.properties, //{},
        this.filename
      )
      .then((data) => {
        console.log(data)
        if (data.jobid) {
          printStore.state.jobID = data.jobid
          const POLL_INTERVAL = 2000
          const validateData = () => {
            // data
            /* if (data.jobstatus === 0) {
              this.printInProgress = false
              return true
            } */
            return false
          }
          poll({
            fn: this.printService.getPrintStatus,
            validate: validateData,
            interval: POLL_INTERVAL,
            maxAttempts: 10,
          })
            .then((data) => console.log(data))
            .catch((err) => {
              console.warn(err)
              this.printInProgress = false
            })
        }
      })
    localStorage.setItem('properties', JSON.stringify(this.properties))
    localStorage.setItem('printer', JSON.stringify(this.printer))
    // this.printSubmit.emit()
  }

  private handleUserMenu = () => {
    this.userMenuOpen = true
  }

  setPrintProperties(eventDetails) {
    if (eventDetails.title.includes('Grayscale') || eventDetails.title.includes('Color')) {
      this.properties.color = false //eventDetails.title
    } else if (
      eventDetails.title.includes('Portrait') ||
      eventDetails.title.includes('Landscape')
    ) {
      this.properties.orientation = eventDetails.title
    } else if (
      eventDetails.title.includes('Auto') ||
      eventDetails.title.includes('Letter') ||
      eventDetails.title.includes('Ledger') ||
      eventDetails.title.includes('Portrait') ||
      eventDetails.title.includes('Legal') ||
      eventDetails.title.includes('Executive') ||
      eventDetails.title.includes('A3') ||
      eventDetails.title.includes('A4') ||
      eventDetails.title.includes('A5') ||
      eventDetails.title.includes('Folio') ||
      eventDetails.title.includes('Com-10')
    ) {
      this.properties.paper = eventDetails.title
    } else {
      this.setSelectedPrinterProperties(eventDetails)
    }
  }

  async setSelectedPrinterProperties(eventDetails) {
    this.printer.id = eventDetails.id
    this.printer.name = eventDetails.title

    await this.printService
      .getPrinterProperties(authStore.state.accessToken, this.printer.id)
      .finally(() => (this.printerConfig = printStore.state.selectedPrinterProperties))

    this.printerConfig.OrientationsSupported.forEach((orientation, index) => {
      this.options.orientations[index].name = capitalize(orientation)
      this.options.orientations[index].id = index + 1
    })

    this.printerConfig.PaperFormats.forEach((paperformat, index) => {
      this.options.sizes[index].name = paperformat.Name
      this.options.sizes[index].id = paperformat.Id
      this.options.sizes[index].description = paperformat.Name
    })

    // delete all properties not supported
    this.options.sizes.length = this.printerConfig.PaperFormats.length
  }

  getPropertiesFromLocalStorage() {
    if (localStorage.getItem('properties')) {
      this.properties = JSON.parse(localStorage.getItem('properties'))
    }
    if (localStorage.getItem('printer')) {
      this.printer = JSON.parse(localStorage.getItem('printer'))
    } else {
      this.printer = { id: '', name: '' }
    }
  }

  getUserInfo() {
    const userService = new EzpUserService()
    return userService.getUserInfo().then((user) => {
      userStore.state.user = user
      this.userName = userStore.state.user.display_name
    })
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
    await Promise.all([fetch('/data/user.json'), fetch('/data/options.json')])
      .then((responses) => Promise.all(responses.map((response) => response.json())))
      .then((data) => {
        // this.user = data[0]
        this.options = data[1]
      })
    this.getUserInfo()
    this.printService = new EzpPrintService(this.redirectURI, this.clientID)
    this.printService
      .getPrinterList(authStore.state.accessToken)
      .finally(() => (this.loading = false))
    this.printService.getAllPrinterProperties(authStore.state.accessToken)
  }

  /**
   *
   * Render method
   *
   */

  render() {
    return this.loading ? (
      <ezp-progress status={i18next.t('printer_selection.loading')}></ezp-progress>
    ) : (
      <Host>
        {this.printInProgress ? (
          <ezp-progress status={i18next.t('printer_selection.print_in_progress')}></ezp-progress>
        ) : null}
        <div id="container" data-select-container>
          <div id="header">
            <cap-label weight="heavy">{i18next.t('printer_selection.print') + ':'}</cap-label>
            <cap-label>{this.filename}</cap-label>
            <ezp-icon-button
              level="tertiary"
              icon="menu"
              id="toggle-menu"
              onClick={this.handleUserMenu}
            />
          </div>
          <div id="content">
            <div id="printer">
              <ezp-select
                label={i18next.t('printer_selection.printer')}
                icon="printer"
                placeholder={i18next.t('printer_selection.select_printer')}
                toggleFlow="vertical"
                optionFlow="vertical"
                options={printStore.state.printers.map((printer) => ({
                  id: printer.id,
                  title: printer.name,
                  meta: printer.location,
                }))}
                previouslySelected={this.printer.name}
              />
            </div>
            <div id="options">
              <ezp-select
                label={i18next.t('printer_selection.color')}
                placeholder={i18next.t('printer_selection.select_color')}
                toggleFlow="horizontal"
                options={this.options.colors.map((color) => ({
                  id: color.id,
                  title: color.name,
                  meta: '',
                }))}
                previouslySelected={this.properties.color}
              />
              <ezp-select
                label={i18next.t('printer_selection.orientation')}
                placeholder={i18next.t('printer_selection.select_orientation')}
                toggleFlow="horizontal"
                options={this.options.orientations.map((orientation) => ({
                  id: orientation.id,
                  title: orientation.name,
                  meta: '',
                }))}
                previouslySelected={this.properties.orientation}
              />
              <ezp-select
                label={i18next.t('printer_selection.size')}
                placeholder={i18next.t('printer_selection.select_size')}
                toggleFlow="horizontal"
                optionFlow="horizontal"
                options={this.options.sizes.map((size) => ({
                  id: size.id,
                  title: size.name,
                  meta: size.description,
                }))}
                previouslySelected={this.properties.paper}
              />
            </div>
          </div>
          <div id="footer">
            <ezp-text-button type="button" level="secondary" onClick={this.handleCancel}>
              {i18next.t('button_actions.cancel')}
            </ezp-text-button>
            <ezp-text-button type="button" onClick={this.handlePrint}>
              {i18next.t('button_actions.print')}
            </ezp-text-button>
          </div>
          <ezp-user-menu open={this.userMenuOpen} name={this.userName} />
          {/*<ejs-progress status="Printjob in progress" />*/}
        </div>
      </Host>
    )
  }
}
