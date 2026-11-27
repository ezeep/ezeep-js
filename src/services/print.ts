import { createStore } from '@stencil/store'
import authStore, { EzpAuthorizationService, hasTokenProvider, rememberRejectedToken } from './auth'
import fetchIntercept from 'fetch-intercept'
import {
  PrinterConfig,
  PrinterProperties,
  Printer,
  PrintResponse,
  JobStatusResponse,
  PrepareUploadResponse,
} from '../shared/types'
import { AnonymousCredential, BlockBlobClient, newPipeline } from '@azure/storage-blob'
import { authGetJson, bearer } from './http'
import { storage } from '../shared/storage'

export class EzpPrintService {
  constructor(redirectURI: string, clientID: string) {
    this.redirectURI = redirectURI
    this.clientID = clientID
    this.printingApi = printStore.state.printApiHostUrl

    this.checkStoredRefreshToken()
  }

  clientID: string
  redirectURI: string
  devApi: boolean
  printerConfig: PrinterConfig
  printingApi: string
  abortController: AbortController | null = null

  private checkStoredRefreshToken() {
    if (authStore.state.refreshToken !== '') {
      return
    }
    authStore.state.refreshToken = storage.getRefreshToken() ?? ''
  }

  /**
   * Renew the access token when a request to the print API or the account
   * service is answered 401. Returns the function that removes the interceptor
   * again: `fetch-intercept` keeps every registration, so one that is never
   * removed answers each later 401 once more.
   */
  registerFetchInterceptor(): () => void {
    return fetchIntercept.register({
      response: (response) => {
        if (
          response.status === 401 &&
          (hasTokenProvider() || authStore.state.refreshToken !== '') &&
          isOwnApi(response)
        ) {
          // Before the renewal starts, so that it already tells the provider.
          rememberRejectedToken(bearerOf(response))
          this.refreshOnce()
        }
        return response
      },
    })
  }

  /**
   * One refresh at a time, shared by every interceptor on the page. Several
   * requests failing together must not each spend the same refresh token, and
   * a 401 from the token endpoint itself (also seen by the interceptor) must
   * not start the next refresh — that never ends.
   */
  private static refreshInFlight?: Promise<void>

  private refreshOnce() {
    if (EzpPrintService.refreshInFlight) return
    EzpPrintService.refreshInFlight = new EzpAuthorizationService(this.redirectURI, this.clientID)
      .renewAccessToken()
      .catch(() => {
        // Best-effort: the request that got the 401 has already failed, and
        // the next one tries again.
      })
      .finally(() => {
        EzpPrintService.refreshInFlight = undefined
      })
  }

  getPrinterList(accessToken: string) {
    return authGetJson<Printer[]>(`https://${this.printingApi}/sfapi/GetPrinter/`, accessToken)
  }

  async getConfig(accessToken: string) {
    return fetch(`https://${this.printingApi}/sfapi/GetConfiguration/`, {
      method: 'GET',
      headers: bearer(accessToken),
    })
  }

  getPrinterProperties(accessToken: string, printerID: string) {
    return authGetJson<PrinterConfig[]>(
      `https://${this.printingApi}/sfapi/GetPrinterProperties/?id=${printerID}`,
      accessToken,
    )
  }

  getAllPrinterProperties(accessToken: string) {
    return authGetJson<PrinterConfig[]>(
      `https://${this.printingApi}/sfapi/GetPrinterProperties/`,
      accessToken,
    )
  }

  printFileByUrl(
    accessToken: string,
    fileUrl: string,
    fileType: string,
    printerID: string,
    properties: PrinterProperties,
    filename?: string,
    printAndDelete?: boolean,
  ) {
    this.abortController = new AbortController()

    return this.printRequest(
      accessToken,
      {
        fileurl: fileUrl,
        type: fileType,
        printerid: printerID,
        ...(filename && { alias: filename }),
        ...(printAndDelete && { printanddelete: printAndDelete }),
        properties,
      },
      this.abortController.signal,
    )
  }

  abortPrint() {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }

  /** Shared POST to the `Print` endpoint. Returns the raw response. */
  private printRequest(accessToken: string, body: Record<string, unknown>, signal?: AbortSignal) {
    return fetch(`https://${this.printingApi}/sfapi/Print/`, {
      method: 'POST',
      headers: {
        ...bearer(accessToken),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    })
  }

  printByFileID(
    accessToken: string,
    fileID: string,
    fileType: string,
    printerID: string,
    properties: PrinterProperties,
    filename?: string,
    printAndDelete?: boolean,
  ) {
    return this.printRequest(accessToken, {
      fileid: fileID,
      type: fileType,
      printerid: printerID,
      ...(filename && { alias: filename }),
      ...(printAndDelete && { printanddelete: printAndDelete }),
      properties,
    }).then((response) => response.json() as Promise<PrintResponse>)
  }

  prepareFileUpload(accessToken: string) {
    return authGetJson<PrepareUploadResponse>(
      `https://${this.printingApi}/sfapi/PrepareUpload/`,
      accessToken,
    )
  }

  async uploadBlobFiles(sasUri: string, file: File) {
    printStore.state.uploadProgress = 0
    const pipeline = newPipeline(new AnonymousCredential(), {
      retryOptions: { maxTries: 4 },
      userAgentOptions: { userAgentPrefix: 'AdvancedSample V1.0.0' }, // Customized telemetry string
      keepAliveOptions: {
        // Keep alive is enabled by default, disable keep alive by setting false
        enable: false,
      },
    })

    const client = new BlockBlobClient(sasUri, pipeline)
    const response = await client.uploadData(file, {
      blockSize: 4 * 1024 * 1024, //4mb blocksize
      concurrency: 20,
      onProgress: (e) => {
        const progress = (100 * e.loadedBytes) / file.size
        printStore.state.uploadProgress = progress
      },
      blobHTTPHeaders: { blobContentType: 'application/octet-stream' },
    })

    return response
  }

  getPrintStatus = () => {
    return authGetJson<JobStatusResponse>(
      `https://${this.printingApi}/sfapi/Status/?id=${encodeURIComponent(printStore.state.jobID)}`,
      authStore.state.accessToken,
    )
  }
}

/**
 * Whether `response` came from the print API or the account service. The
 * interceptor patches the page's global `fetch`, so it also sees the host
 * page's own requests, and a 401 from those says nothing about our token.
 * `fetch-intercept` attaches the request, whose URL is there even when the
 * response's own is not (a response built in script has none). With neither,
 * the 401 is taken as ours, as it always was.
 */
function isOwnApi(response: Response): boolean {
  const raw = response.url || (response as Response & { request?: Request }).request?.url
  if (!raw) return true
  let host: string
  try {
    host = new URL(raw).host
  } catch {
    return true
  }
  return (
    host === hostOf(printStore.state.printApiHostUrl) ||
    host === hostOf(authStore.state.authApiHostUrl)
  )
}

/**
 * The access token a request was made with, read from the request that
 * `fetch-intercept` attaches to the response. Empty when there is none.
 */
function bearerOf(response: Response): string {
  const request = (response as Response & { request?: Request }).request
  const header = request?.headers?.get?.('Authorization') ?? ''
  return header.replace(/^Bearer /i, '')
}

/**
 * The host of a configured API address, as `URL` writes it: lower case and
 * without a default port. The address may come without a scheme and with a
 * path or a trailing slash, like `printapi.example.com/`. Requests are made
 * with it as it is; this is only for comparing.
 */
function hostOf(configured: string): string | undefined {
  if (!configured) return undefined
  try {
    return new URL(
      /^[a-z][a-z\d+.-]*:\/\//i.test(configured) ? configured : `https://${configured}`,
    ).host
  } catch {
    return undefined
  }
}

const printStore = createStore({
  printers: [],
  jobID: '',
  printFinished: false,
  printApiHostUrl: '',
  printerProperties: {},
  fileID: '',
  fileUrl: '',
  fileType: '',
  printerID: '',
  fileName: '',
  uploadProgress: 0,
  supportedFileExtensions: '',
})

export default printStore
