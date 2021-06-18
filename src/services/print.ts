import { createStore } from '@stencil/store'
import config from './../utils/config.json'
import authStore from './auth'
export class EzpPrintService {
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
          authStore.state.isAuthorized = true;
        }
        if (!response.ok) {
          throw new Error('http status ' + response.status)
        }
        return response.json()
      })
      .then((data) => {
        printStore.state.config = data
        console.log(printStore.state.config)
      })
  }
}

const printStore = createStore({
  printers: [],
  config: [],
})

export default printStore
