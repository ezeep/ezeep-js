import { createStore } from '@stencil/store'
import config from './../utils/config.json'
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
        console.log(printStore.state.printers)
      })
  }
}

const printStore = createStore({
  printers: [],
})

export default printStore
