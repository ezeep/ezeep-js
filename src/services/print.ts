import { createStore } from '@stencil/store'
import authStore from './auth'
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
import { authGetJson, bearer, refreshAccessToken } from './http'
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

  registerFetchInterceptor() {
    fetchIntercept.register({
      request: (url, config) => {
        // Modify the url or config here
        return [url, config]
      },
      requestError: (error) => {
        // Called when an error occured during another 'request' interceptor call
        return Promise.reject(error)
      },
      // check for response status here
      response: (response) => {
        if (response.status === 401 && authStore.state.refreshToken !== '') {
          // Kick off a (shared, single-flight) refresh so the next request
          // carries a valid token. GET helpers additionally retry themselves;
          // this covers POSTs that don't go through `authGetJson`.
          refreshAccessToken()
        }
        // Modify the reponse object
        return response
      },
      responseError: (error) => {
        // Handle a fetch error
        return Promise.reject(error)
      },
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
      accessToken
    )
  }

  getAllPrinterProperties(accessToken: string) {
    return authGetJson<PrinterConfig[]>(
      `https://${this.printingApi}/sfapi/GetPrinterProperties/`,
      accessToken
    )
  }

  printFileByUrl(
    accessToken: string,
    fileUrl: string,
    fileType: string,
    printerID: string,
    properties: PrinterProperties,
    filename?: string,
    printAndDelete?: boolean
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
      this.abortController
    )
  }

  abortPrint() {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }

  /**
   * Shared POST to the `Print` endpoint. Returns the raw response.
   *
   * Takes the `AbortController` (rather than an `AbortSignal`) deliberately:
   * naming the `AbortSignal` type explicitly surfaces a global-declaration
   * conflict between `@types/node` and the DOM lib. Reading `.signal` as a
   * property avoids it. (Resolved properly when `@types/node` is bumped.)
   */
  private printRequest(
    accessToken: string,
    body: Record<string, unknown>,
    controller?: AbortController
  ) {
    return fetch(`https://${this.printingApi}/sfapi/Print/`, {
      method: 'POST',
      headers: {
        ...bearer(accessToken),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller?.signal,
    })
  }

  printByFileID(
    accessToken: string,
    fileID: string,
    fileType: string,
    printerID: string,
    properties: PrinterProperties,
    filename?: string,
    printAndDelete?: boolean
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
      accessToken
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
      authStore.state.accessToken
    )
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
