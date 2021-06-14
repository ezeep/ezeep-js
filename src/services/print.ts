import printingApiDev from './../utils/config.json'
export class EzpPrintService {
  getPrinterList(accessToken: string) {
    return fetch(`${printingApiDev}/GetPrinter/`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        return data;
      })
  }
}
