export class EjsPrintService {
  getPrinterList(accessToken: string) {
    fetch('https://printapi.dev.azdev.ezeep.com/sfapi/GetPrinter/', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    })
      .then((response) => response.json())
      .then((data) => console.log(data))
  }
}
