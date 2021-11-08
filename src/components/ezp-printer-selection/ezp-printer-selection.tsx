import { Component, Host, Listen, Event, EventEmitter, State, h, Prop } from '@stencil/core'
import i18next from 'i18next'
import authStore from '../../services/auth'
import printStore, { EzpPrintService } from '../../services/print'
import userStore, { EzpUserService } from '../../services/user'
import { Printer, PrinterConfig, PrinterProperties } from '../../shared/types'
import { initi18n, poll, removeEmptyStrings } from '../../utils/utils'
import options from '../../data/options.json'

@Component({
  tag: 'ezp-printer-selection',
  styleUrl: 'ezp-printer-selection.scss',
  shadow: true,
})
export class EzpPrinterSelection {
  // private user: PrintUserType

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
  private qualityOptions = [
    {
      id: 1,
      title: 'Draft',
    },
    {
      id: 2,
      title: 'Normal',
    },
    {
      id: 3,
      title: 'Best',
    },
  ]

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
  @State() options = options
  @State() printInProgress: boolean = false
  @State() userMenuOpen: boolean = false
  @State() userName: string
  @State() printers: Printer[]
  @State() selectedPrinter: Printer = { id: '', location: '', name: '' }
  @State() printerConfig: PrinterConfig
  // needs to be initialised with empty strings
  @State() selectedProperties: PrinterProperties = {
    paper: '',
    paperid: '',
    color: '',
    duplex: '',
    duplexmode: '',
    orientation: '',
    copies: '',
    resolution: '',
  }
  @State() previouslySelectedProperties: PrinterProperties = {
    paper: '',
    paperid: '',
    color: '',
    duplex: '',
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
        this.selectedPrinter.id,
        // we have to initialse this obj with empty strings to display the select component
        // but don't want to send any attributes with empty strings to the API
        removeEmptyStrings(this.selectedProperties),
        this.filename
      )
      .then((data) => {
        if (data.jobid) {
          printStore.state.jobID = data.jobid
          const POLL_INTERVAL = 2000
          const validateData = (data) => {
            if (data.jobstatus === 0) {
              this.printInProgress = false
              return true
            }
            return false
          }
          poll({
            fn: this.printService.getPrintStatus,
            validate: validateData,
            interval: POLL_INTERVAL,
            maxAttempts: 10,
          })
            .then(data)
            .catch((err) => {
              console.warn(err)
              this.printInProgress = false
            })
        } else {
          this.printInProgress = false
        }
      })
    localStorage.setItem('properties', JSON.stringify(this.selectedProperties))
    localStorage.setItem('printer', JSON.stringify(this.selectedPrinter))
    localStorage.setItem(
      'previouslySelectedProperties',
      JSON.stringify(this.previouslySelectedProperties)
    )
    // this.printSubmit.emit()
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

  private setSelectedProperties(eventDetails: { type: string; id: string; title: string }) {
    switch (eventDetails.type) {
      case 'printer':
        this.selectedPrinter.id = eventDetails.id
        this.selectedPrinter.name = eventDetails.title
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
      default:
        break
    }
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
    await this.printService
      .getPrinterList(authStore.state.accessToken)
      .then((printers: Printer[]) => {
        this.printers = printers
      })
    await this.printService
      .getAllPrinterProperties(authStore.state.accessToken)
      .then((printerConfig: PrinterConfig[]) => {
        this.printerConfig = printerConfig[0]
      })
    this.loading = false
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
      <Host exportparts="test: hello">
        {this.printInProgress ? (
          <ezp-progress status={i18next.t('printer_selection.print_in_progress')}></ezp-progress>
        ) : null}
        <div id="container" data-backdrop-surface>
          <div id="header">
            <ezp-label weight="heavy" text={i18next.t('printer_selection.print') + ':'} />
            <ezp-label text={this.filename} />
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
                placeholder={i18next.t('printer_selection.select_printer')}
                toggleFlow="vertical"
                optionFlow="vertical"
                options={this.printers.map((printer) => ({
                  id: printer.id,
                  title: printer.name,
                  meta: printer.location,
                  type: 'printer',
                }))}
                preSelected={this.selectedPrinter.name}
              />
            </div>
            <div id="options">
              <ezp-select
                label={i18next.t('printer_selection.color')}
                placeholder={i18next.t('printer_selection.select_color')}
                toggleFlow="horizontal"
                options={
                  this.printerConfig.Color
                    ? [
                        {
                          id: 1,
                          title: i18next.t('printer_selection.color_color'),
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
                preSelected={this.previouslySelectedProperties.color}
              />
              <ezp-select
                label={i18next.t('printer_selection.orientation')}
                placeholder={i18next.t('printer_selection.select_orientation')}
                toggleFlow="horizontal"
                options={this.printerConfig.OrientationsSupported.map((orientation, index) => ({
                  id: this.printerConfig.OrientationsSupportedId[index],
                  title: i18next.t(`printer_selection.orientation_${orientation}`),
                  meta: '',
                  type: 'orientation',
                }))}
                preSelected={this.previouslySelectedProperties.orientation}
              />
              <ezp-select
                label={i18next.t('printer_selection.size')}
                placeholder={i18next.t('printer_selection.select_size')}
                toggleFlow="horizontal"
                optionFlow="horizontal"
                options={this.printerConfig.PaperFormats.map((format) => ({
                  id: format.Id,
                  title: i18next.t(`printer_selection.format_${format.Name}`),
                  meta: `${format.XRes} x ${format.YRes}`,
                  type: 'format',
                }))}
                preSelected={this.previouslySelectedProperties.paper}
              />
              <ezp-select
                label={i18next.t('printer_selection.quality')}
                toggleFlow="horizontal"
                options={this.qualityOptions.map((option) => ({
                  id: option.id,
                  title: option.title,
                  meta: '',
                  type: 'quality',
                }))}
                preSelected={
                  !this.previouslySelectedProperties.resolution
                    ? 'Normal'
                    : this.previouslySelectedProperties.resolution
                }
              />
              <ezp-select
                label={i18next.t('printer_selection.duplex')}
                toggleFlow="horizontal"
                options={this.duplexOptions.map((option) => ({
                  id: option.id,
                  title: option.title,
                  meta: '',
                  type: 'duplex',
                }))}
                preSelected={
                  !this.previouslySelectedProperties.duplex
                    ? 'None'
                    : this.previouslySelectedProperties.duplexmode
                }
              />
              <ezp-stepper label="Copies" max={10} />
            </div>
          </div>
          <div id="footer">
            <ezp-text-button
              type="button"
              level="secondary"
              onClick={this.handleCancel}
              label={i18next.t('button_actions.cancel')}
            />
            <ezp-text-button
              type="button"
              onClick={this.handlePrint}
              label={i18next.t('button_actions.print')}
            />
          </div>
          <ezp-user-menu open={this.userMenuOpen} name={this.userName} />
        </div>
      </Host>
    )
  }
}
