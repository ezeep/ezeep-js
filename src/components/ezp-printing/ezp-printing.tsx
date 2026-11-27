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
import authStore, {
  EzpAuthorizationService,
  TokenProvider,
  hasTokenProvider,
  rememberRejectedToken,
  sendCodeToParentWindow,
  setPendingAuthCheck,
  setTokenProvider,
} from '../../services/auth'
import printStore, { EzpPrintService } from '../../services/print'
import userStore, { EzpUserService } from '../../services/user'
import config from '../../shared/config.json'
import {
  ThemeTypes,
  AppearanceTypes,
  TriggerTypes,
  SystemAppearanceTypes,
} from './../../shared/types'
import i18next from 'i18next'
import { initi18n, subscribeToLanguageChange } from '../../utils/utils'
import { storage } from '../../shared/storage'
import { TOKEN_REFRESH_INTERVAL_S } from '../../shared/constants'

@Component({
  tag: 'ezp-printing',
  styleUrl: 'ezp-printing.scss',
  shadow: true,
})
export class EzpPrinting {
  auth: EzpAuthorizationService

  // Handles retained so they can be torn down in disconnectedCallback.
  private tokenRefreshInterval?: ReturnType<typeof setInterval>
  private systemAppearanceQuery?: MediaQueryList
  private systemAppearanceListener?: (event: MediaQueryListEvent) => void
  private unsubscribeLanguage?: () => void

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
   * Lets a host page that already has an access token for its signed-in user
   * lend it to the widget, so the user is not asked to sign in again. A
   * function returning a promise of the token, or of `null` when nobody is
   * signed in. Set it as a JS property; it has no attribute. See the readme.
   */
  @Prop() tokenProvider?: TokenProvider

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

  @Watch('tokenProvider')
  watchTokenProvider(newValue?: TokenProvider) {
    setTokenProvider(this, newValue)
    // Before the first load, componentWillLoad runs the first check.
    if (this.auth) this.checkAuth()
  }

  @Watch('filedata')
  watchFileData(newValue: string, oldValue: string) {
    if (newValue !== oldValue && newValue.length > 0) {
      const array = new Uint8Array(newValue.length)
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

  /** The host restyling a mounted component, e.g. with its own dark mode. The
   *  store is what renders — and what the user menu changes — so a later choice
   *  in the menu still applies on top of this. */
  @Watch('theme')
  watchTheme(newValue: ThemeTypes) {
    // A removed attribute goes back to the default, as on first load.
    userStore.state.theme = newValue || 'cyan'
  }

  @Watch('appearance')
  watchAppearance(newValue: AppearanceTypes) {
    userStore.state.appearance = newValue || 'system'
  }

  @Watch('language')
  watchLanguage(newValue: string, oldValue: string) {
    if (newValue !== oldValue && newValue.length > 0) {
      this.language = newValue
      // Apply the new language so any dialog opened afterwards is translated.
      i18next.changeLanguage(newValue)
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

  /** Cancel or close on the print options card. With an upload step to go
   *  back to, only the card closes: the files picked there stay picked, and
   *  removing them is the upload card's "Clear files". Without one there is
   *  nothing left to show, so it ends the flow like `printCancel`. */
  @Listen('printDismiss')
  listenPrintDismiss() {
    if (this.trigger === 'file') {
      this.printOpen = false
    } else {
      this.listenPrintCancel()
    }
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
    // Cancelling sign-in with files pending discards them, so the flow is over
    // for the host — same signal as cancelling on the upload or print step.
    this.printFinished.emit()
    this.checkAuth()
  }

  @Listen('authSuccess')
  async listenAuthSuccess() {
    // Adopt the user's account language before opening the dialog so it renders
    // in the right language (and picks up a language change made in the host app).
    await this.syncPreferredLanguage()
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
    // Keep the selection in sync as files are added/removed, but stay on the
    // upload step until the user explicitly continues (see listenUploadContinue).
    this.files = event.detail
    this.filename = this.files.length > 0 ? this.files[0].name : ''
  }

  @Listen('uploadContinue')
  listenUploadContinue(event: CustomEvent) {
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

  /**
   * Fired when the print flow reaches an end state and the host may dismiss the
   * component: a print job was submitted, or the user cancelled on the upload
   * card, the sign-in dialog (with files pending) or the print options card. A
   * cancel on the print options card returns to the upload card when there is
   * one (`trigger="file"`), so it doesn't end the flow there. It does not mean
   * a job was printed — check for that on the print API side.
   */
  @Event({
    eventName: 'printFinished',
    composed: true,
    bubbles: true,
  })
  printFinished: EventEmitter<void>

  /**
   *
   * Public methods
   *
   */

  @Method()
  async open() {
    // With a host token provider, check the session afresh: the host's user
    // may have signed in, out or switched since the last check. ezp-auth waits
    // for this check before it decides whether sign-in is needed.
    if (hasTokenProvider()) setPendingAuthCheck(this.checkAuth())
    // Always show auth dialog when files are uploaded to give users cancel option
    // Even if already authenticated, show the auth component for consistency
    this.authOpen = true
  }

  @Method()
  async logOut() {
    // Revokes a session of the widget's own. Under a host token provider there
    // is usually none, and then nothing is sent.
    this.auth.revokeRefreshToken()
    storage.clearSession()
    // The access token is in memory only: without this, the next check finds
    // it and the user is signed in again until it expires.
    authStore.state.accessToken = ''
    authStore.state.refreshToken = ''
    authStore.state.isAuthorized = false
    this.printOpen = false
  }

  /**
   * Make sure an access token is available before a token-dependent call. The
   * token is in-memory only, so after a reload it must be refreshed from the
   * persisted refresh token first. With a host token provider the provider is
   * asked every time instead, so each flow picks up the host's current token
   * (the host's user may have switched organization, say). Concurrent callers
   * share one request (see `renewAccessToken`), and a transient failure is
   * swallowed (the caller then falls through to the unauthorized path; the
   * periodic refresh and next checkAuth retry).
   */
  private ensureAccessToken(): Promise<void> {
    if (!this.auth) return Promise.resolve()
    if (
      !hasTokenProvider() &&
      (authStore.state.accessToken !== '' || authStore.state.refreshToken === '')
    ) {
      return Promise.resolve()
    }
    return this.auth.renewAccessToken().catch(() => {
      // Transient token-endpoint failure: leave the token empty.
    })
  }

  @Method()
  async getSasUri(): Promise<string> {
    this.onlyGetSasUri = true

    // Wait for a reload-time token refresh to settle so we don't call the API
    // with an empty bearer (which would spuriously open the login dialog).
    await this.ensureAccessToken()

    const printService = new EzpPrintService(this.redirecturi, this.clientid)

    const response = await printService
      .prepareFileUpload(authStore.state.accessToken)
      .catch((): null => {
        this.open()
        return null
      })

    // Keep the original public signature (Promise<string>) for backward
    // compatibility. On the prepare-failure path this resolves to undefined at
    // runtime, exactly as it always has.
    return response ? response.sasUri : (undefined as unknown as string)
  }

  @Method()
  async getAuthUri(): Promise<string> {
    this.auth.generateCodeVerifier()
    await this.auth.generateCodeChallenge(authStore.state.codeVerifier)
    this.auth.buildAuthURI()
    return authStore.state.authUri
  }

  @Method()
  async setAuthRefreshToken(refreshToken: string) {
    // Store the refresh token in the same way as the component does in self-managed auth
    authStore.state.refreshToken = refreshToken
    storage.setRefreshToken(refreshToken)

    // Use the refresh token to obtain a valid access token
    // This ensures the user doesn't see the login dialog
    await this.auth.refreshTokens()
  }

  @Method()
  async checkAuth(): Promise<boolean> {
    return this.runAuthCheck({ renew: true, mayRetry: true })
  }

  /**
   * One round of `checkAuth`. `renew` first makes sure a token is there (see
   * `ensureAccessToken`); `mayRetry` allows the one extra round after a 401
   * for the provider's token.
   */
  private async runAuthCheck({
    renew,
    mayRetry,
  }: {
    renew: boolean
    mayRetry: boolean
  }): Promise<boolean> {
    // Constructing the print service also loads any persisted refresh token.
    const printService = new EzpPrintService(this.redirecturi, this.clientid)

    // The access token is kept in memory only (never written to localStorage),
    // to limit XSS exposure. If it's missing — e.g. after a page reload — obtain
    // a fresh one from the persisted refresh token so the user stays signed in.
    // A transient refresh failure is swallowed here so checkAuth still completes
    // and reports unauthorized (rather than rejecting); getConfig below then
    // runs and the periodic refresh retries.
    if (renew) await this.ensureAccessToken()

    // With a host token provider the session is the host's: what an earlier
    // visit left in localStorage says nothing about it.
    const persistsSession = !hasTokenProvider()

    if (persistsSession && storage.hasIsAuthorized()) {
      authStore.state.isAuthorized = storage.getIsAuthorized()
    }

    const token = authStore.state.accessToken
    const status = await printService.getConfig(token).then(
      (response) => (response.ok ? 'ok' : response.status),
      (): 'failed' => 'failed',
    )
    const rejected = status === 401 && rememberRejectedToken(token)

    // The token changed while the call was out, say the host withdrew or
    // replaced its provider: this answer is about a token that has gone, and
    // must not count. Check again with the one held now. Only a token that
    // is gone asks for a new one; asking the provider on every round could
    // go on for as long as two checks keep replacing each other's token.
    if (authStore.state.accessToken !== token) {
      return this.runAuthCheck({ renew: authStore.state.accessToken === '', mayRetry })
    }

    // The API turned down the provider's token. Ask once more, now telling
    // the provider, so a fresh token from it, or a session of the widget's
    // own, gets the user through without signing in. Once only, so a
    // provider that only has rejected tokens can't keep this going.
    if (rejected && mayRetry) return this.runAuthCheck({ renew: true, mayRetry: false })

    authStore.state.isAuthorized = status === 'ok'
    if (persistsSession) storage.setIsAuthorized(authStore.state.isAuthorized)

    return authStore.state.isAuthorized
  }

  /**
   * Normalizes a URL or hostname to just the hostname without protocol
   * Accepts both "hostname" and "https://hostname" formats
   */
  private normalizeHostUrl(hostUrl: string): string {
    if (!hostUrl) {
      return hostUrl
    }

    // If it starts with http:// or https://, extract just the hostname
    try {
      if (hostUrl.startsWith('http://') || hostUrl.startsWith('https://')) {
        const url = new URL(hostUrl)
        return url.host
      }
    } catch {
      // If URL parsing fails, fall through and return the original value.
    }

    // Return as-is if it's already just a hostname
    return hostUrl
  }

  refreshTokensPeriodically(seconds: number) {
    const authService = new EzpAuthorizationService(this.redirecturi, this.clientid)
    this.tokenRefreshInterval = setInterval(() => {
      authService.renewAccessToken().catch(() => {
        // Best-effort: the next interval, or the next flow, tries again.
      })
    }, seconds * 1000)
  }

  connectedCallback() {
    this.unsubscribeLanguage = subscribeToLanguageChange(this)
    // Also on a return to the page after a move: removal withdraws it.
    if (this.tokenProvider) setTokenProvider(this, this.tokenProvider)
  }

  async componentWillLoad() {
    const systemAppearanceDark = window.matchMedia('(prefers-color-scheme: dark)')

    this.systemAppearance = systemAppearanceDark.matches ? 'dark' : 'light'

    this.systemAppearanceQuery = systemAppearanceDark
    this.systemAppearanceListener = (event: MediaQueryListEvent) => {
      this.systemAppearance = event.matches ? 'dark' : 'light'
    }
    systemAppearanceDark.addEventListener('change', this.systemAppearanceListener)

    authStore.state.redirectUri = this.redirecturi
    userStore.state.theme = this.theme
    userStore.state.appearance = this.appearance

    if (this.authapihosturl) {
      authStore.state.authApiHostUrl = this.normalizeHostUrl(this.authapihosturl)
    } else {
      authStore.state.authApiHostUrl = config.authApiHostUrl
    }

    if (this.printapihosturl) {
      printStore.state.printApiHostUrl = this.normalizeHostUrl(this.printapihosturl)
    } else {
      printStore.state.printApiHostUrl = config.printingApiHostUrl
    }

    this.auth = new EzpAuthorizationService(this.redirecturi, this.clientid)
    // Before the first check, in case it was set after connecting.
    if (this.tokenProvider) setTokenProvider(this, this.tokenProvider)

    sendCodeToParentWindow()
    initi18n(this.language)
    this.checkAuth().then(() => this.syncPreferredLanguage())
  }

  /**
   * Adopt the signed-in user's account language (`preferred_language` from
   * /v1/users/me) so the print UI matches the language chosen in the host app.
   * An explicit `language` prop always wins. Requires an access token, so it
   * runs after auth. Best-effort: on any failure the current language is kept.
   */
  private async syncPreferredLanguage(): Promise<void> {
    if (this.language) return
    if (!authStore.state.accessToken) return
    try {
      const user = await new EzpUserService().getUserInfo()
      const lang = user?.preferred_language
      if (lang && lang !== i18next.language) {
        await i18next.changeLanguage(lang)
      }
    } catch {
      // Language sync is best-effort; keep the current language on failure.
    }
  }

  componentDidLoad() {
    this.refreshTokensPeriodically(TOKEN_REFRESH_INTERVAL_S)
  }

  disconnectedCallback() {
    // Stop the periodic token refresh and the colour-scheme listener so they
    // don't leak (and keep firing) after the component is removed.
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval)
    }
    if (this.systemAppearanceQuery && this.systemAppearanceListener) {
      this.systemAppearanceQuery.removeEventListener('change', this.systemAppearanceListener)
    }
    this.unsubscribeLanguage?.()
    // A provider must not outlive its element: another widget added later
    // would otherwise go on using it.
    setTokenProvider(this)
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
          /* Out of reach while a dialog or the print options cover it: without
             this, Tab walks every control of the card behind the backdrop
             before it gets to the one on top. Seamless print options cover
             nothing — they sit below the card, which stays in use. */
          <ezp-upload
            inert={this.authOpen || this.noDocumentOpen || (this.printOpen && !this.seamless)}
          />
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
