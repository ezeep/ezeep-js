import { createStore } from '@stencil/store'
import config from './../utils/config.json'
import authStore, { EzpAuthorizationService } from './auth'
import fetchIntercept from 'fetch-intercept'
import { PrinterProperties, PrinterConfig } from '../shared/types'
export class EzpPrintService {
  constructor(redirectURI: string, clientID: string) {
    this.redirectURI = redirectURI
    this.clientID = clientID
    this.checkRefreshToken()
    this.registerFetchInterceptor()
  }

  clientID: string
  redirectURI: string
  printerConfig: PrinterConfig

  private checkRefreshToken() {
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
    return fetch(`${config.printingApiDev}/GetPrinter/`, {
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
    return fetch(`${config.printingApiDev}/GetConfiguration/`, {
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
    return fetch(`${config.printingApiDev}/GetPrinterProperties/?id=${printerID}`, {
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
    return fetch(`${config.printingApiDev}/GetPrinterProperties/`, {
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
    properties: PrinterProperties,
    filename?: string,
    printAndDelete?: boolean
  ) {
    return fetch(`${config.printingApiDev}/Print/`, {
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
        properties,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data)
        if (data.jobid) {
          this.getPrintStatus(authStore.state.accessToken, data.jobid)
        }
      })
  }

  getPrintStatus(accessToken: string, jobID: string) {
    return fetch(`${config.printingApiDev}/Status/?id=${jobID}`, {
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    })
      .then((response) => response.json())
      .then((data) => console.log(data))
  }
}

const printStore = createStore({
  printers: [],
  config: [],
  selectedPrinterProperties: <PrinterConfig>{},
})

export default printStore
