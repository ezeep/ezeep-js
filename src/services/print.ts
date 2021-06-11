export class EzpPrintService {
  getPrinterList(accessToken: string) {
    return fetch('https://printapi.dev.azdev.ezeep.com/sfapi/GetPrinter/', {
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
