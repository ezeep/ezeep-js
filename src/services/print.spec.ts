import printStore, { EzpPrintService } from './print'
import authStore from './auth'

/** Minimal fetch Response stub exposing the fields the service reads. */
function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({ status, json: () => Promise.resolve(body) }) as unknown as Promise<Response>
}

describe('EzpPrintService request shaping', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    printStore.state.printApiHostUrl = 'printapi.test'
    authStore.state.accessToken = 'tok'
    authStore.state.refreshToken = ''
    fetchMock = jest.fn().mockReturnValue(jsonResponse({}))
    global.fetch = fetchMock as unknown as typeof fetch
  })

  it('getPrinterList GETs the printer endpoint with a bearer token', async () => {
    fetchMock.mockReturnValue(jsonResponse([{ id: 'p1' }]))
    const svc = new EzpPrintService('https://r', 'client')

    const result = await svc.getPrinterList('tok')

    expect(fetchMock).toHaveBeenCalledWith('https://printapi.test/sfapi/GetPrinter/', {
      method: 'GET',
      headers: { Authorization: 'Bearer tok' },
    })
    expect(result).toEqual([{ id: 'p1' }])
  })

  it('getPrinterProperties includes the printer id in the query string', async () => {
    const svc = new EzpPrintService('https://r', 'client')
    await svc.getPrinterProperties('tok', 'printer-9')
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://printapi.test/sfapi/GetPrinterProperties/?id=printer-9'
    )
  })

  it('printByFileID POSTs the job body as JSON and parses the response', async () => {
    fetchMock.mockReturnValue(jsonResponse({ jobid: 'j1' }))
    const svc = new EzpPrintService('https://r', 'client')

    const data = await svc.printByFileID('tok', 'file1', 'pdf', 'printer1', { copies: 2 }, 'doc.pdf')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://printapi.test/sfapi/Print/')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer tok',
      'Content-Type': 'application/json',
    })
    expect(JSON.parse(init.body)).toMatchObject({
      fileid: 'file1',
      type: 'pdf',
      printerid: 'printer1',
      alias: 'doc.pdf',
      properties: { copies: 2 },
    })
    expect(data).toEqual({ jobid: 'j1' })
  })

  it('printByFileID omits the alias when no filename is given', async () => {
    const svc = new EzpPrintService('https://r', 'client')
    await svc.printByFileID('tok', 'file1', 'pdf', 'printer1', {})
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty('alias')
  })

  it('getPrintStatus encodes the jobID and uses the stored access token', async () => {
    printStore.state.jobID = 'job 1/x'
    authStore.state.accessToken = 'stored-tok'
    fetchMock.mockReturnValue(jsonResponse({ jobstatus: 0 }))
    const svc = new EzpPrintService('https://r', 'client')

    await svc.getPrintStatus()

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://printapi.test/sfapi/Status/?id=job%201%2Fx')
    expect(init.headers).toEqual({ Authorization: 'Bearer stored-tok' })
  })

  it('printFileByUrl wires an AbortController that abortPrint() cancels', async () => {
    fetchMock.mockReturnValue(jsonResponse({ status: 200 }))
    const svc = new EzpPrintService('https://r', 'client')

    svc.printFileByUrl('tok', 'https://files/x.pdf', 'pdf', 'printer1', {})
    const init = fetchMock.mock.calls[0][1]
    expect(init.signal).toBeDefined()
    expect(init.signal.aborted).toBe(false)

    svc.abortPrint()
    expect(init.signal.aborted).toBe(true)
  })
})
