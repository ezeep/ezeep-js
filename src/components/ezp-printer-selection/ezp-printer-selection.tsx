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
  @Prop() fileid: string

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
  @State() printerConfig: PrinterConfig[]
  @State() selectedPrinterConfig: PrinterConfig = {
    "Collate": true,
    "Color": true,
    "Driver": "TP Output Gateway",
    "DuplexMode": 1,
    "DuplexSupported": true,
    "Id": "f0c0f30c-e9ff-4e11-9181-2417fabeb23f",
    "Location": "",
    "MediaSupported": [
        "Auto",
        "Letter",
        "Legal",
        "Executive",
        "A4",
        "A5",
        "B5 (JIS)",
        "Umschlag 10",
        "Umschlag DL",
        "Umschlag C5",
        "Umschlag C6",
        "Umschlag Monarch",
        "Jap. Postkarte",
        "A6",
        "JIS Chou Nr. 2 119x277 mm",
        "4x6Zoll",
        "5x7 Zoll",
        "8x10Zoll",
        "Ofuku hagaki",
        "10x15 cm",
        "13x18 cm",
        "Karteikarte 3 x 5\"",
        "Karteikarte 4x6 Zoll"
    ],
    "MediaSupportedId": [
        0,
        1,
        5,
        7,
        9,
        11,
        13,
        20,
        27,
        28,
        31,
        37,
        43,
        70,
        119,
        120,
        121,
        122,
        123,
        124,
        125,
        126,
        127
    ],
    "Name": "HP DeskJet 3630 series",
    "OrientationsSupported": [
        "portrait",
        "landscape"
    ],
    "OrientationsSupportedId": [
        1,
        2
    ],
    "PaperFormats": [
        {
            "Id": 0,
            "Name": "Auto",
            "XRes": 0,
            "YRes": 0
        },
        {
            "Id": 1,
            "Name": "Letter",
            "XRes": 2159,
            "YRes": 2794
        },
        {
            "Id": 5,
            "Name": "Legal",
            "XRes": 2159,
            "YRes": 3556
        },
        {
            "Id": 7,
            "Name": "Executive",
            "XRes": 1841,
            "YRes": 2667
        },
        {
            "Id": 9,
            "Name": "A4",
            "XRes": 2100,
            "YRes": 2970
        },
        {
            "Id": 11,
            "Name": "A5",
            "XRes": 1480,
            "YRes": 2100
        },
        {
            "Id": 13,
            "Name": "B5 (JIS)",
            "XRes": 1820,
            "YRes": 2570
        },
        {
            "Id": 20,
            "Name": "Umschlag 10",
            "XRes": 1047,
            "YRes": 2413
        },
        {
            "Id": 27,
            "Name": "Umschlag DL",
            "XRes": 1100,
            "YRes": 2200
        },
        {
            "Id": 28,
            "Name": "Umschlag C5",
            "XRes": 1620,
            "YRes": 2290
        },
        {
            "Id": 31,
            "Name": "Umschlag C6",
            "XRes": 1140,
            "YRes": 1620
        },
        {
            "Id": 37,
            "Name": "Umschlag Monarch",
            "XRes": 984,
            "YRes": 1905
        },
        {
            "Id": 43,
            "Name": "Jap. Postkarte",
            "XRes": 1000,
            "YRes": 1480
        },
        {
            "Id": 70,
            "Name": "A6",
            "XRes": 1050,
            "YRes": 1480
        },
        {
            "Id": 119,
            "Name": "JIS Chou Nr. 2 119x277 mm",
            "XRes": 1109,
            "YRes": 1460
        },
        {
            "Id": 120,
            "Name": "4x6Zoll",
            "XRes": 1016,
            "YRes": 1524
        },
        {
            "Id": 121,
            "Name": "5x7 Zoll",
            "XRes": 1270,
            "YRes": 1778
        },
        {
            "Id": 122,
            "Name": "8x10Zoll",
            "XRes": 2032,
            "YRes": 2540
        },
        {
            "Id": 123,
            "Name": "Ofuku hagaki",
            "XRes": 2000,
            "YRes": 1479
        },
        {
            "Id": 124,
            "Name": "10x15 cm",
            "XRes": 1016,
            "YRes": 1524
        },
        {
            "Id": 125,
            "Name": "13x18 cm",
            "XRes": 1270,
            "YRes": 1778
        },
        {
            "Id": 126,
            "Name": "Karteikarte 3 x 5\"",
            "XRes": 762,
            "YRes": 1270
        },
        {
            "Id": 127,
            "Name": "Karteikarte 4x6 Zoll",
            "XRes": 1016,
            "YRes": 1524
        }
    ],
    "Resolutions": [
        "Auto",
        "600",
        "1200"
    ],
    "TPUID": 1
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

    const validateData = (data) => {
      if (data.jobstatus === 0) {
        this.printInProgress = false
        return true
      }
      return false
    }
    const POLL_INTERVAL = 2000

    this.printInProgress = true

    // we have to initialse this obj with empty strings to display the select component
    // but don't want to send any attributes with empty strings to the API
    removeEmptyStrings(this.selectedProperties)

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
          response.json().then(data => this.fileid = data.fileid)
          this.printService.printByFileID(
            authStore.state.accessToken,
            this.fileid,
            this.filetype,
            this.selectedPrinter.id,
            this.selectedProperties,
            this.filename).finally(() => this.printInProgress = false)
        } else {
          return response.json()
        }
      })
      .then((data) => {
        if (data.jobid) {
          printStore.state.jobID = data.jobid
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
      .catch(error => {
        console.log(error)
        this.printInProgress = false
      })
    } else if (this.fileid) {
      this.printService.printByFileID(
        authStore.state.accessToken,
        this.fileid,
        this.filetype,
        this.selectedPrinter.id,
        this.selectedProperties,
        this.filename
      )
      .then((response) => response.json())
      .then((data) => {
        if (data.jobid) {
          printStore.state.jobID = data.jobid
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
      .catch(error => {
        console.log(error)
        this.printInProgress = false
      })
    }

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

  private async setSelectedProperties(eventDetails: { type: string; id: string; title: string }) {
    switch (eventDetails.type) {
      case 'printer':
        this.selectedPrinter.id = eventDetails.id
        this.selectedPrinter.name = eventDetails.title
        await this.printService.getPrinterProperties(authStore.state.accessToken, this.selectedPrinter.id).then(data => this.selectedPrinterConfig = data[0])
        console.log('selected printer config:')
        console.log(this.selectedPrinterConfig)
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

  handleFiles(files: FileList){
    console.log(files)
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
        this.printerConfig = printerConfig
        console.log(this.printerConfig)
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
                  meta:
                    printer.location !== ''
                      ? printer.location
                      : i18next.t('printer_selection.unknown_location'),
                  type: 'printer',
                }))}
                preSelected={this.selectedPrinter.name}
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
                        }
                      ]
                }
                preSelected={this.previouslySelectedProperties.color}
              />
              <ezp-select
                label={i18next.t('printer_selection.orientation')}
                icon="orientation"
                placeholder={i18next.t('printer_selection.select_orientation')}
                toggleFlow="horizontal"
                options={this.selectedPrinterConfig.OrientationsSupported.map((orientation, index) => ({
                  id: index,
                  title: i18next.t(`printer_selection.orientation_${orientation}`),
                  meta: '',
                  type: 'orientation',
                }))}
                preSelected={this.previouslySelectedProperties.orientation}
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
                preSelected={this.previouslySelectedProperties.paper}
              />
              <ezp-select
                label={i18next.t('printer_selection.quality')}
                icon="quality"
                toggleFlow="horizontal"
                options={this.selectedPrinterConfig.Resolutions.map((option, index) => ({
                  id: index,
                  title: option,
                  meta: '',
                  type: 'quality',
                }))}
                preSelected={
                  !this.previouslySelectedProperties.resolution
                    ? this.selectedPrinterConfig.Resolutions[0]
                    : this.previouslySelectedProperties.resolution
                }
              />
              {this.selectedPrinterConfig.DuplexSupported ? (
                <ezp-select
                  label={i18next.t('printer_selection.duplex')}
                  icon="duplex"
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
              ) : null}
            </div>
            <ezp-stepper label="Copies" max={10} icon="copies" />
          </div>
          <div>
            <input type="file" onChange={ (e: Event & {target: HTMLInputElement} ) => this.handleFiles(e.target.files)} />
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
