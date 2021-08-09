import { createStore } from '@stencil/store'
import authStore, { EzpAuthorizationService } from './auth'
import fetchIntercept from 'fetch-intercept'
import { /* PrinterProperties, */ PrinterConfig } from '../shared/types'
export class EzpPrintService {
  constructor(redirectURI: string, clientID: string) {
    this.redirectURI = redirectURI
    this.clientID = clientID
    this.printingApi = printStore.state.printApiHostUrl

    this.checkStoredRefreshToken()
    this.registerFetchInterceptor()
  }

  clientID: string
  redirectURI: string
  devApi: boolean
  printerConfig: PrinterConfig
  printingApi: string

  private checkStoredRefreshToken() {
    if (authStore.state.refreshToken !== '') {
      return
    }
    if (localStorage.getItem('refreshToken') === null) {
      authStore.state.refreshToken = ''
    } else {
      authStore.state.refreshToken = localStorage.getItem('refreshToken')
    }
  }

  private registerFetchInterceptor() {
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
        if (response.status === 401) {
          if (authStore.state.refreshToken === '') {
            return response
          }
          const authService = new EzpAuthorizationService(this.redirectURI, this.clientID)
          authService.refreshTokens()
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
    return fetch(`https://${this.printingApi}/sfapi/GetPrinter/`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        printStore.state.printers = data
      })
  }

  getConfig(accessToken: string) {
    return fetch(`https://${this.printingApi}/sfapi/GetConfiguration/`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    })
      .then((response) => {
        if (response.ok) {
          authStore.state.isAuthorized = true
        }
        if (!response.ok) {
          throw new Error('http status ' + response.status)
        }
        return response.json()
      })
      .then((data) => {
        printStore.state.config = data
      })
  }

  getPrinterProperties(accessToken: string, printerID: string) {
    return fetch(`https://${this.printingApi}/sfapi/GetPrinterProperties/?id=${printerID}`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    })
      .then((response) => {
        return response.json()
      })
      .then((data) => {
        this.printerConfig = data[0]
        printStore.state.selectedPrinterProperties = this.printerConfig
      })
  }

  getAllPrinterProperties(accessToken: string) {
    return fetch(`https://${this.printingApi}/sfapi/GetPrinterProperties/`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    }).then((response) => {
      return response.json()
    })
    /* .then((data) => {
        console.log(data)
      }) */
  }

  printFileByUrl(
    accessToken: string,
    fileUrl: string,
    fileType: string,
    printerID: string,
    {}, //properties: PrinterProperties,
    filename?: string,
    printAndDelete?: boolean
  ) {
    return fetch(`https://${this.printingApi}/sfapi/Print/`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileurl: fileUrl,
        type: fileType,
        printerid: printerID,
        ...(filename && { alias: filename }),
        ...(printAndDelete && { printanddelete: printAndDelete }),
        //properties,
      }),
    }).then((response) => response.json())
  }

  getPrintStatus = () => {
    return fetch(
      `https://${this.printingApi}/sfapi/Status/?id=${encodeURIComponent(printStore.state.jobID)}`,
      {
        headers: {
          Authorization: 'Bearer ' + authStore.state.accessToken,
        },
      }
    ).then((response) => response.json())
  }
}

const printStore = createStore({
  printers: [],
  config: [],
  selectedPrinterProperties: <PrinterConfig>{},
  jobID: '',
  printFinished: false,
  printApiHostUrl: '',
})

export default printStore
