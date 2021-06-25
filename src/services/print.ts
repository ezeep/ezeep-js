import { createStore } from '@stencil/store'
import config from './../utils/config.json'
import authStore, { EzpAuthorizationService } from './auth'
import fetchIntercept from 'fetch-intercept'
export class EzpPrintService {
  constructor(redirectURI: string, clientID: string) {
    this.redirectURI = redirectURI
    this.clientID = clientID
    this.checkRefreshToken()
    this.registerFetchInterceptor()
  }

  clientID: string
  redirectURI: string

  private checkRefreshToken() {
    if (authStore.state.refreshToken !== '') {
      return
    }
    if (sessionStorage.getItem('refreshToken') === null) {
      authStore.state.refreshToken = ''
    } else {
      authStore.state.refreshToken = sessionStorage.getItem('refreshToken')
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
        console.log(data)
      })
  }

  getAllPrinterProperties(accessToken: string) {
    return fetch(`${config.printingApiDev}/GetPrinterProperties/`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    })
      .then((response) => {
        return response.json()
      })
      .then((data) => {
        console.log(data)
      })
  }

  printFileByUrl(
    accessToken: string,
    fileUrl: string,
    fileType: string,
    printerID: string,
    filename?: string,
    printAndDelete?: boolean,
    paperSize?: string,
    paperID?: number,
    color?: boolean,
    duplex?: boolean,
    duplexmode?: number,
    orientation?: number,
    copies?: number,
    resolution?: string
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
        properties: {
          ...(paperSize && { paper: paperSize }),
          ...(paperID && { paperid: paperID }),
          ...(color && { color: color }),
          ...(duplex && { duplex: duplex }),
          ...(duplexmode && { duplexmode: duplexmode }),
          ...(orientation && { orientation: orientation }),
          ...(copies && { copies: copies }),
          ...(resolution && { resolution: resolution }),
        },
      })
    }).then(response => response.json()).then(data => console.log(data))
  }
}

const printStore = createStore({
  printers: [],
  config: [],
})

export default printStore
