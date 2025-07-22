import {
  Component,
  Host,
  State,
  Listen,
  Method,
  h,
  Prop,
  Watch,
  EventEmitter,
  Event,
} from '@stencil/core'
import authStore, { EzpAuthorizationService, sendCodeToParentWindow } from '../../services/auth'
import printStore, { EzpPrintService } from '../../services/print'
import userStore from '../../services/user'
import config from '../../shared/config.json'
import {
  ThemeTypes,
  AppearanceTypes,
  TriggerTypes,
  SystemAppearanceTypes,
} from './../../shared/types'
import i18next from 'i18next'
import { initi18n } from '../../utils/utils'

@Component({
  tag: 'ezp-printing',
  styleUrl: 'ezp-printing.scss',
  shadow: true,
})
export class EzpPrinting {
  auth: EzpAuthorizationService

  @Prop() clientid: string
  @Prop() redirecturi: string
  @Prop({ mutable: true }) filename: string = ''
  @Prop() fileurl: string
  @Prop() filetype: string
  @Prop() custom: boolean
  @Prop() hidelogin: boolean
  @Prop() hidemenu: boolean = false
  @Prop() hideheader: boolean = false
  @Prop() authapihosturl: string
  @Prop() printapihosturl: string
  @Prop() theme: ThemeTypes = 'cyan'
  @Prop() fileid: string
  @Prop() appearance: AppearanceTypes = 'system'
  @Prop() trigger: TriggerTypes
  @Prop() language: string = ''
  @Prop() code: string
  @Prop() filedata: string
  @Prop() seamless: boolean = false

  /**
   *
   * States
   *
   */

  /** Description... */
  @State() printOpen: boolean = false
  @State() authOpen: boolean = false
  @State() onlyGetSasUri: boolean = false
  @State() noDocumentOpen: boolean = false
  @State() systemAppearance: SystemAppearanceTypes
  @State() files: File[] = []

  /** Watchers */

  @Watch('filedata')
  watchFileData(newValue: string, oldValue: string) {
    console.log(newValue)
    if (newValue !== oldValue && newValue.length > 0) {
      let array = new Uint8Array(newValue.length)
      for (let i = 0; i < newValue.length; i++) {
        array[i] = newValue.charCodeAt(i)
      }
      this.files = [new File([array], this.filename)]
    }
  }

  @Watch('filename')
  watchFilename(newValue: string, oldValue: string) {
    if (newValue !== oldValue && newValue.length > 0) {
      this.filename = newValue
    }
  }

  @Watch('fileurl')
  watchFileUrl(newValue: string, oldValue: string) {
    if (newValue !== oldValue && newValue.length > 0) {
      this.fileurl = newValue
    }
  }

  @Watch('language')
  watchLanguage(newValue: string, oldValue: string) {
    if (newValue !== oldValue && newValue.length > 0) {
      this.language = newValue
    }
  }

  /**
   *
   * Listeners
   *
   */

  /** Description... */
  @Listen('printCancel')
  listenPrintCancel() {
    this.printOpen = false
    // Clear the selected files and reset the upload component
    this.files = []
    this.filename = ''
    // Emit printCancel to reset the upload component
    const printCancelEvent = new CustomEvent('printCancel', {
      bubbles: true,
      detail: {},
    })
    document.dispatchEvent(printCancelEvent)
    this.printFinished.emit()
  }

  /** Description... */
  @Listen('printSubmit')
  listenPrintSubmit() {
    this.printOpen = false
    this.printFinished.emit()
    this.checkAuth()
  }

  /** Description... */
  @Listen('authCancel')
  listenAuthCancel() {
    this.authOpen = false
    this.checkAuth()
  }

  @Listen('userCancel')
  listenUserCancel() {
    this.authOpen = false
    // Clear the selected files and reset the upload component
    this.files = []
    this.filename = ''
    // Emit printCancel to reset the upload component
    const printCancelEvent = new CustomEvent('printCancel', {
      bubbles: true,
      detail: {},
    })
    document.dispatchEvent(printCancelEvent)
    this.checkAuth()
  }

  @Listen('authSuccess')
  listenAuthSuccess() {
    if (this.onlyGetSasUri) {
      this.printOpen = false
      this.onlyGetSasUri = false
    } else if (this.filename != '') {
      this.printOpen = true
    } else {
      this.noDocumentOpen = true
    }
  }

  @Listen('uploadFile')
  listenUploadFile(event: CustomEvent) {
    this.files = event.detail
    this.filename = this.files.length > 0 ? this.files[0].name : ''
    this.open()
  }

  @Listen('dialogClose')
  listenDialogClose(event: CustomEvent) {
    if (event.detail === 'no-document-selected') {
      this.noDocumentOpen = false
    }
  }

  @Listen('dialogAction')
  listenDialogAction(event: CustomEvent) {
    if (event.detail === 'no-document-selected') {
      this.noDocumentOpen = false
    }
  }

  @Listen('logout')
  listenLogout() {
    this.logOut()
  }

  /**
   * Events
   */

  @Event({
    eventName: 'printFinished',
    composed: true,
    bubbles: true,
  })
  printFinished: EventEmitter<any>

  /**
   *
   * Public methods
   *
   */

  @Method()
  async open() {
    // Always show auth dialog when files are uploaded to give users cancel option
    // Even if already authenticated, show the auth component for consistency
    this.authOpen = true
  }

  @Method()
  async logOut() {
    this.auth.revokeRefreshToken()
    localStorage.removeItem('properties')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('access_token')
    localStorage.removeItem('printer')
    localStorage.removeItem('isAuthorized')
    this.printOpen = false
  }

  @Method()
  async getSasUri(): Promise<string> {
    this.onlyGetSasUri = true

    const printService = new EzpPrintService(this.redirecturi, this.clientid)

    let response = await printService.prepareFileUpload(authStore.state.accessToken).catch(() => {
      this.open()
      return null
    })

    if (response) {
      const sasUri = response.sasUri
      return sasUri
    }
  }

  @Method()
  async getAuthUri(): Promise<string> {
    this.auth.generateCodeVerifier()
    await this.auth.generateCodeChallenge(authStore.state.codeVerifier)
    this.auth.buildAuthURI()
    return authStore.state.authUri
  }

  @Method()
  async checkAuth(): Promise<boolean> {
    const printService = new EzpPrintService(this.redirecturi, this.clientid)

    let accessToken = authStore.state.accessToken

    if (accessToken === '') {
      accessToken = localStorage.getItem('access_token')
      authStore.state.accessToken = accessToken
    }

    if (localStorage.getItem('isAuthorized')) {
      authStore.state.isAuthorized = localStorage.getItem('isAuthorized') === 'true'
    }

    await printService
      .getConfig(authStore.state.accessToken)
      .then((response) => {
        if (response.ok) {
          authStore.state.isAuthorized = true
        }
        if (!response.ok) {
          authStore.state.isAuthorized = false
          throw new Error('http status ' + response.status)
        }
      })
      .catch(() => {
        authStore.state.isAuthorized = false
      })

    localStorage.setItem('isAuthorized', authStore.state.isAuthorized.toString())

    return authStore.state.isAuthorized
  }

  refreshTokensPeriodically(seconds: number) {
    const authService = new EzpAuthorizationService(this.redirecturi, this.clientid)
    setInterval(() => {
      authService.refreshTokens()
    }, seconds * 1000)
  }

  async componentWillLoad() {
    const systemAppearanceDark = window.matchMedia('(prefers-color-scheme: dark)')

    this.systemAppearance = systemAppearanceDark.matches ? 'dark' : 'light'

    systemAppearanceDark.addEventListener('change', (event) => {
      this.systemAppearance = event.matches ? 'dark' : 'light'
    })

    authStore.state.redirectUri = this.redirecturi
    userStore.state.theme = this.theme
    userStore.state.appearance = this.appearance

    if (this.authapihosturl) {
      authStore.state.authApiHostUrl = this.authapihosturl
    } else {
      authStore.state.authApiHostUrl = config.authApiHostUrl
    }

    if (this.printapihosturl) {
      printStore.state.printApiHostUrl = this.printapihosturl
    } else {
      printStore.state.printApiHostUrl = config.printingApiHostUrl
    }

    this.auth = new EzpAuthorizationService(this.redirecturi, this.clientid)

    sendCodeToParentWindow()
    initi18n(this.language)
    this.checkAuth()
  }

  componentDidLoad() {
    this.refreshTokensPeriodically(1800)
  }

  /**
   *
   * Render method
   *
   */

  render() {
    return (
      <Host
        class={`${userStore.state.theme} ${
          userStore.state.appearance === 'system'
            ? this.systemAppearance
            : userStore.state.appearance
        } ${this.seamless ? 'seamless' : ''}`}
      >
        {this.trigger === 'custom' ? (
          <slot></slot>
        ) : this.trigger === 'file' ? (
          <ezp-upload />
        ) : (
          this.trigger === 'button' && (
            <ezp-icon-button
              id="print-trigger"
              icon="printer"
              slot="trigger"
              type="button"
              onClick={() => this.open()}
            ></ezp-icon-button>
          )
        )}
        {this.authOpen ? (
          <ezp-auth
            clientID={this.clientid}
            redirectURI={this.redirecturi}
            hidelogin={this.hidelogin}
            trigger={this.trigger}
            code={this.code}
          ></ezp-auth>
        ) : this.printOpen ? (
          <ezp-printer-selection
            clientID={this.clientid}
            redirectURI={this.redirecturi}
            filename={this.filename}
            fileurl={this.fileurl}
            filetype={this.filetype}
            fileid={this.fileid}
            files={this.files}
            hidemenu={this.hidemenu}
            hideheader={this.hideheader}
            seamless={this.seamless}
          />
        ) : this.noDocumentOpen ? (
          <ezp-dialog
            heading={i18next.t('no_document_dialog.heading')}
            description={i18next.t('no_document_dialog.description')}
            action={i18next.t('no_document_dialog.action')}
            iconName="question-mark"
            instance="no-document-selected"
          />
        ) : null}
        {/* <button onClick={() => this.auth.refreshTokens()}>refresh tokens</button> */}
      </Host>
    )
  }
}
