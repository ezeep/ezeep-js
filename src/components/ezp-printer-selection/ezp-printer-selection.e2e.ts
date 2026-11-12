import { E2EPage } from '@stencil/core/testing'
import {
  BLOB_HOST,
  PRINTERS,
  SELECT,
  click,
  currentStatus,
  fileNames,
  getCalls,
  getStorage,
  goToPrintOptions,
  jsonBody,
  openPrinting,
  pause,
  pickOption,
  removeFiles,
  selectValue,
  textOf,
  updateBackend,
  waitForCall,
  waitForInstance,
  waitForPrintOptions,
} from '../../testing/mock-backend'

/**
 * End-to-end (real headless browser, faked network): the print options card
 * and everything that happens after "Print". Reached the way a user reaches it
 * — through `<ezp-printing>` — so i18n, the stores and the session are real.
 */

const OPTIONS = 'ezp-printing >>> ezp-printer-selection'
const STATUS = `${OPTIONS} >>> ezp-status`
const UPLOAD_LIST = 'ezp-printing >>> ezp-upload >>> #file-list'
// `eventType` is a property, not an attribute, so the inputs are told apart by
// position: the page range is always last; width and length precede it.
const INPUTS = `${OPTIONS} >>> #options > ezp-input`
const PAGE_RANGE = `${OPTIONS} >>> #options > ezp-input:last-of-type >>> #input`
/** `ezp-input` reports a change 500 ms after the last keystroke. */
const DEBOUNCE = 600

const printButtonDisabled = (page: E2EPage) =>
  page.$eval(`${OPTIONS} >>> #print`, (el) => (el as HTMLButtonElement).disabled)

/** Click a footer button of the status card by its position. */
const clickStatusAction = (page: E2EPage, action: 'primary' | 'secondary') =>
  click(page, `${STATUS} >>> ezp-text-button.${action}`)

describe('ezp-printer-selection (e2e)', () => {
  afterAll(removeFiles)

  describe('loading the print options', () => {
    it('lists the files and offers the printers without preselecting one', async () => {
      const page = await openPrinting({ signedIn: true })
      await goToPrintOptions(page, 'report.pdf', 'invoice.docx')

      expect(await textOf(page, `${OPTIONS} >>> #files-badge`)).toBe('2 files')
      expect(await fileNames(page, `${OPTIONS} >>> #files-list`)).toEqual([
        'report.pdf',
        'invoice.docx',
      ])

      // Several printers and no history: the user has to choose.
      expect(await selectValue(page, SELECT.printer)).toBe('Select a printer')
      expect(await printButtonDisabled(page)).toBe(true)
      expect(await currentStatus(page)).toBeNull()

      // Loaded with the access token obtained from the persisted refresh token.
      const [printerCall] = await getCalls(page, 'GetPrinter')
      expect(printerCall.headers.authorization).toBe('Bearer access-token-1')
    })

    it('starts on the only printer when there is nothing to choose between', async () => {
      const page = await openPrinting({ signedIn: true, printers: [PRINTERS[0]] })
      await goToPrintOptions(page)

      expect(await selectValue(page, SELECT.printer)).toBe('Office Laser')
      expect(await selectValue(page, SELECT.size)).toBe('A4')
      expect(await selectValue(page, SELECT.color)).toBe('Color')
      expect(await printButtonDisabled(page)).toBe(false)
    })

    it('restores the printer and settings of the last print', async () => {
      const page = await openPrinting({
        signedIn: true,
        storage: {
          printer: JSON.stringify(PRINTERS[0]),
          printerSettings: JSON.stringify({
            'printer-1': {
              color: false,
              duplex: true,
              duplexmode: 2,
              paper: 'Letter',
              paperid: 1,
              orientation: 2,
              resolution: '300x300',
              trayname: 'Tray 2',
              defaultSource: 2,
            },
          }),
        },
      })
      await goToPrintOptions(page)

      expect(await selectValue(page, SELECT.printer)).toBe('Office Laser')
      expect(await selectValue(page, SELECT.color)).toBe('Grayscale')
      expect(await selectValue(page, SELECT.duplex)).toBe('flip on long side')
      expect(await selectValue(page, SELECT.size)).toBe('Letter')
      expect(await selectValue(page, SELECT.orientation)).toBe('Landscape')
      expect(await selectValue(page, SELECT.quality)).toBe('300x300')
      expect(await selectValue(page, SELECT.tray)).toBe('Tray 2')
    })

    it('forgets a saved printer the user no longer has', async () => {
      const page = await openPrinting({
        signedIn: true,
        storage: {
          printer: JSON.stringify({
            id: 'gone',
            name: 'Old Printer',
            location: '',
            is_queue: false,
          }),
        },
      })
      await goToPrintOptions(page)

      expect(await selectValue(page, SELECT.printer)).toBe('Select a printer')
      expect(await getStorage(page, 'printer')).toBeNull()
    })

    it('tells the user when they have no printers, and closing ends the flow', async () => {
      const page = await openPrinting({ signedIn: true, printers: [] })
      const finished = await page.spyOnEvent('printFinished')
      await goToPrintOptions(page)

      expect(await currentStatus(page)).toBe('no-printers')
      expect(await textOf(page, `${STATUS} >>> #description`)).toBe('No printers found.')

      await clickStatusAction(page, 'primary')

      expect(await page.find(OPTIONS)).toBeNull()
      expect(finished).toHaveReceivedEventTimes(1)
    })

    it('stays usable when the printer list cannot be loaded', async () => {
      const page = await openPrinting({ signedIn: true, failing: ['GetPrinter'] })
      await goToPrintOptions(page)

      // Not stuck on "Loading My Printers…": the card renders with a way out.
      expect(await currentStatus(page)).toBe('no-printers')
      expect(await page.find(`${OPTIONS} >>> #cancel`)).not.toBeNull()
    })

    it('rejects a file type the print API does not support', async () => {
      const page = await openPrinting({ signedIn: true, fileExtensions: 'pdf;docx' })
      const finished = await page.spyOnEvent('printFinished')
      await goToPrintOptions(page, 'archive.zip')

      expect(await currentStatus(page)).toBe('not-supported')
      expect(await textOf(page, `${STATUS} >>> #description`)).toBe(
        'The selected file type is not supported.',
      )
      // The unsupported file is not presented as about to be printed.
      expect(await page.find(`${OPTIONS} >>> #files-card`)).toBeNull()

      // "Retry" sends the user back to pick another file.
      await clickStatusAction(page, 'primary')
      expect(await page.find(OPTIONS)).toBeNull()
      expect(finished).toHaveReceivedEventTimes(1)
      expect(await page.find('ezp-printing >>> ezp-upload >>> #dropzone')).not.toBeNull()
    })
  })

  describe('choosing print settings', () => {
    it('loads a printer’s capabilities when it is picked and applies its defaults', async () => {
      const page = await openPrinting({ signedIn: true })
      await goToPrintOptions(page)

      await pickOption(page, SELECT.printer, 'Office Laser')

      const propertyCalls = await getCalls(page, 'GetPrinterProperties')
      expect(propertyCalls.some((call) => call.query === '?id=printer-1')).toBe(true)

      expect(await selectValue(page, SELECT.printer)).toBe('Office Laser')
      expect(await selectValue(page, SELECT.color)).toBe('Color')
      expect(await selectValue(page, SELECT.duplex)).toBe('None')
      expect(await selectValue(page, SELECT.size)).toBe('A4')
      expect(await selectValue(page, SELECT.orientation)).toBe('Portrait')
      expect(await selectValue(page, SELECT.quality)).toBe('600x600')
      expect(await selectValue(page, SELECT.tray)).toBe('Tray 1')
      expect(await printButtonDisabled(page)).toBe(false)
    })

    it('disables what a basic printer cannot do and hides the tray option', async () => {
      const page = await openPrinting({ signedIn: true })
      await goToPrintOptions(page)

      await pickOption(page, SELECT.printer, 'Lobby Inkjet')

      const isDisabled = (select: string) =>
        page.$eval(`${OPTIONS} >>> ${select}`, (el: any) => el.disabled as boolean)
      expect(await isDisabled(SELECT.color)).toBe(true)
      expect(await isDisabled(SELECT.duplex)).toBe(true)
      expect(await isDisabled(SELECT.quality)).toBe(true)
      expect(await isDisabled(SELECT.size)).toBe(false)
      // Five selects: printer + color, duplex, size, orientation, quality — no tray.
      expect((await page.$$(`${OPTIONS} >>> ezp-select`)).length).toBe(6)
    })

    it('sends the chosen settings with the print job', async () => {
      const page = await openPrinting({ signedIn: true })
      await goToPrintOptions(page, 'report.pdf')

      await pickOption(page, SELECT.printer, 'Office Laser')
      await pickOption(page, SELECT.color, 'Grayscale')
      await pickOption(page, SELECT.duplex, 'flip on short side')
      await pickOption(page, SELECT.size, 'Letter')
      await pickOption(page, SELECT.orientation, 'Landscape')
      await pickOption(page, SELECT.quality, '300x300')
      await pickOption(page, SELECT.tray, 'Tray 2')

      // Two copies, via the stepper's + button.
      await click(page, `${OPTIONS} >>> ezp-stepper >>> button[aria-label="Increase Copies"]`)

      // Page ranges are typed with commas and sent with semicolons.
      const range = await page.find(PAGE_RANGE)
      await range.type('1-2,5')
      await pause(DEBOUNCE)
      await page.waitForChanges()

      await click(page, `${OPTIONS} >>> #print`)
      await waitForInstance(page, 'ezp-status', 'print-success')

      const [print] = await getCalls(page, 'Print')
      expect(print.method).toBe('POST')
      expect(print.headers['content-type']).toBe('application/json')
      expect(jsonBody(print)).toEqual({
        fileid: 'file-1',
        type: 'pdf',
        printerid: 'printer-1',
        alias: 'report.pdf',
        properties: {
          color: false,
          duplex: true,
          duplexmode: 3,
          paper: 'Letter',
          paperid: 1,
          orientation: 2,
          resolution: '300x300',
          trayname: 'Tray 2',
          defaultSource: 2,
          copies: 2,
          PageRanges: '1-2;5',
        },
      })
    })

    it('blocks printing while the page range is invalid', async () => {
      const page = await openPrinting({ signedIn: true, printers: [PRINTERS[0]] })
      await goToPrintOptions(page)

      const range = await page.find(PAGE_RANGE)
      await range.type('5-2')
      await pause(DEBOUNCE)
      await page.waitForChanges()
      expect(await printButtonDisabled(page)).toBe(true)

      // Fixing the range re-enables Print.
      await range.press('Backspace')
      await range.press('Backspace')
      await range.press('Backspace')
      await range.type('2-5')
      await pause(DEBOUNCE)
      await page.waitForChanges()
      expect(await printButtonDisabled(page)).toBe(false)
    })

    it('asks for width and length when the custom paper size is chosen', async () => {
      const page = await openPrinting({ signedIn: true, printers: [PRINTERS[0]] })
      await goToPrintOptions(page)

      expect((await page.$$(INPUTS)).length).toBe(1)

      await pickOption(page, SELECT.size, 'Custom')

      expect((await page.$$(INPUTS)).length).toBe(3)
      const labels = await page.$$eval(INPUTS, (inputs) => inputs.map((el: any) => el.label))
      expect(labels).toEqual(['Width', 'Length', 'Page Ranges'])
    })
  })

  describe('printing uploaded files', () => {
    it('uploads the file, prints it, reports success and remembers the selection', async () => {
      const page = await openPrinting({ signedIn: true, printers: [PRINTERS[0]] })
      const finished = await page.spyOnEvent('printFinished')
      await goToPrintOptions(page, 'report.pdf')

      await click(page, `${OPTIONS} >>> #print`)
      await waitForInstance(page, 'ezp-status', 'print-success')

      expect(await textOf(page, `${STATUS} >>> #description`)).toBe('Successfully printed.')
      expect(await textOf(page, `${STATUS} >>> #subtext`)).toBe(
        'Your document is on its way to the printer.',
      )

      // The whole backend conversation, in order.
      const journey = (await getCalls(page))
        .map((call) => (call.host === BLOB_HOST ? 'BlobUpload' : call.path))
        .filter((step) =>
          ['/sfapi/PrepareUpload/', 'BlobUpload', '/sfapi/Print/', '/sfapi/Status/'].includes(step),
        )
      expect(journey).toEqual([
        '/sfapi/PrepareUpload/',
        'BlobUpload',
        '/sfapi/Print/',
        '/sfapi/Status/',
      ])

      const [upload] = await getCalls(page, 'BlobUpload')
      expect(upload.method).toBe('PUT')
      expect(upload.path).toBe('/uploads/file-1')
      // Blob storage is authorised by the SAS URL alone: no bearer token leaks to it.
      expect(upload.headers.authorization).toBeUndefined()

      const [status] = await getCalls(page, 'Status')
      expect(status.query).toBe('?id=job-1')

      // Remembered for the next print.
      expect(JSON.parse((await getStorage(page, 'printer'))!).id).toBe('printer-1')
      expect(JSON.parse((await getStorage(page, 'printerSettings'))!)['printer-1'].paper).toBe('A4')

      // Closing the success card ends the flow and resets the upload card.
      await clickStatusAction(page, 'primary')
      expect(await page.find(OPTIONS)).toBeNull()
      expect(finished).toHaveReceivedEventTimes(1)
      expect(await page.find('ezp-printing >>> ezp-upload >>> #dropzone')).not.toBeNull()
    })

    it('keeps polling while the job is processing', async () => {
      const page = await openPrinting({
        signedIn: true,
        printers: [PRINTERS[0]],
        statusResponses: [
          { body: { jobstatus: 1246, jobstatusstring: 'PROCESSING' } },
          { body: { jobstatus: 0, jobstatusstring: 'PRINTED' } },
        ],
      })
      await goToPrintOptions(page)

      await click(page, `${OPTIONS} >>> #print`)
      await waitForInstance(page, 'ezp-status', 'print-processing')
      expect(await printButtonDisabled(page)).toBe(true)

      await waitForInstance(page, 'ezp-status', 'print-success')
      expect((await getCalls(page, 'Status')).length).toBe(2)
    })

    it('prints several files one after another', async () => {
      const page = await openPrinting({ signedIn: true, printers: [PRINTERS[0]] })
      await goToPrintOptions(page, 'one.pdf', 'two.docx', 'three.png')

      await click(page, `${OPTIONS} >>> #print`)
      await waitForInstance(page, 'ezp-status', 'print-success')

      expect(await textOf(page, `${STATUS} >>> #description`)).toBe(
        'Successfully printed. (3 files)',
      )

      const prints = (await getCalls(page, 'Print')).map(jsonBody)
      expect(prints.map((body) => [body.fileid, body.alias, body.type])).toEqual([
        ['file-1', 'one.pdf', 'pdf'],
        ['file-2', 'two.docx', 'docx'],
        ['file-3', 'three.png', 'png'],
      ])
      expect((await getCalls(page, 'BlobUpload')).length).toBe(3)
    })

    it('reports a partial success when only some files print', async () => {
      const page = await openPrinting({
        signedIn: true,
        printers: [PRINTERS[0]],
        // First file is rejected by the print API, the second goes through.
        printResponses: [{ body: { code: 804 } }, { body: { jobid: 'job-2' } }],
      })
      await goToPrintOptions(page, 'broken.pdf', 'fine.pdf')

      await click(page, `${OPTIONS} >>> #print`)
      await waitForInstance(page, 'ezp-status', 'print-success')

      expect(await textOf(page, `${STATUS} >>> #description`)).toContain('1/2 files')
      expect(await textOf(page, `${STATUS} >>> #description`)).toContain('1 failed')
      // No "on its way" reassurance when part of the job failed.
      expect(await page.find(`${STATUS} >>> #subtext`)).toBeNull()
    })

    it('reports a failure when every file fails', async () => {
      const page = await openPrinting({
        signedIn: true,
        printers: [PRINTERS[0]],
        printResponses: [{ body: { code: 804 } }],
      })
      await goToPrintOptions(page, 'one.pdf', 'two.pdf')

      await click(page, `${OPTIONS} >>> #print`)
      await waitForInstance(page, 'ezp-status', 'print-failed')

      expect(await textOf(page, `${STATUS} >>> #description`)).toBe('Print failed')
    })

    it('lets the user retry a failed print', async () => {
      const page = await openPrinting({
        signedIn: true,
        printers: [PRINTERS[0]],
        statusResponses: [{ body: { jobstatus: 3011, jobstatusstring: 'FAILED' } }],
      })
      await goToPrintOptions(page)

      await click(page, `${OPTIONS} >>> #print`)
      await waitForInstance(page, 'ezp-status', 'print-failed')

      // The printer recovers; "Retry" runs the whole upload + print again.
      await updateBackend(page, {
        statusResponses: [{ body: { jobstatus: 0, jobstatusstring: 'PRINTED' } }],
      })
      await clickStatusAction(page, 'primary')
      await waitForInstance(page, 'ezp-status', 'print-success')

      expect((await getCalls(page, 'Print')).length).toBe(2)
    })

    it('closing a failed print returns to the options with the files kept', async () => {
      const page = await openPrinting({
        signedIn: true,
        printers: [PRINTERS[0]],
        printResponses: [{ body: { code: 804 } }],
      })
      await goToPrintOptions(page, 'report.pdf')

      await click(page, `${OPTIONS} >>> #print`)
      await waitForInstance(page, 'ezp-status', 'print-failed')
      await clickStatusAction(page, 'secondary')

      expect(await currentStatus(page)).toBeNull()
      expect(await fileNames(page, `${OPTIONS} >>> #files-list`)).toEqual(['report.pdf'])
      expect(await printButtonDisabled(page)).toBe(false)
    })

    it('fails the print when the upload to blob storage fails', async () => {
      const page = await openPrinting({
        signedIn: true,
        printers: [PRINTERS[0]],
        failing: ['PrepareUpload'],
      })
      await goToPrintOptions(page)

      await click(page, `${OPTIONS} >>> #print`)
      await waitForInstance(page, 'ezp-status', 'print-failed')

      expect((await getCalls(page, 'Print')).length).toBe(0)
    })

    it('announces a pull-print job as ready to be released', async () => {
      const page = await openPrinting({ signedIn: true, printers: [PRINTERS[2]] })
      await goToPrintOptions(page)

      await click(page, `${OPTIONS} >>> #print`)
      await waitForInstance(page, 'ezp-status', 'print-success')

      expect(await textOf(page, `${STATUS} >>> #description`)).toBe('Ready to be released.')
    })

    it('shows a driver error for a pull-print queue that rejects the job', async () => {
      const page = await openPrinting({
        signedIn: true,
        printers: [PRINTERS[2]],
        printResponses: [{ body: { code: 503 } }],
      })
      await goToPrintOptions(page)

      await click(page, `${OPTIONS} >>> #print`)
      await waitForInstance(page, 'ezp-status', 'print-failed')
    })

    it('walks the status through preparing, uploading and printing', async () => {
      const page = await openPrinting({
        signedIn: true,
        printers: [PRINTERS[0]],
        statusResponses: [
          { body: { jobstatus: 1246, jobstatusstring: 'PROCESSING' } },
          { body: { jobstatus: 0, jobstatusstring: 'PRINTED' } },
        ],
      })
      await goToPrintOptions(page)
      // Slow the backend down so each stage stays on screen long enough to see.
      await updateBackend(page, { delay: 300 })

      await click(page, `${OPTIONS} >>> #print`)

      const stages: string[] = []
      for (;;) {
        // Card and text in one read, so the two cannot be from different stages.
        const [instance, text] = await page.$eval(STATUS, (el: any) => [
          el.instance as string,
          el.description as string,
        ])
        if (instance === 'print-success') break
        // The upload percentage moves; the stage is what matters.
        const stage = text.replace(/ \(\d+%\)$/, '')
        if (stage && stages[stages.length - 1] !== stage) stages.push(stage)
        await pause(20)
      }

      // "Uploading…" ends with the upload: while the job is submitted and
      // polled, the card says it is printing.
      expect(stages).toEqual(['Preparing…', 'Uploading…', 'Printing…'])
    })

    it('lets the user cancel a print in progress', async () => {
      const page = await openPrinting({
        signedIn: true,
        printers: [PRINTERS[0]],
        statusResponses: [{ body: { jobstatus: 1246, jobstatusstring: 'PROCESSING' } }],
      })
      await goToPrintOptions(page)

      await click(page, `${OPTIONS} >>> #print`)
      await waitForInstance(page, 'ezp-status', 'print-processing')

      await clickStatusAction(page, 'secondary')

      // Back on the options, ready to print again.
      expect(await currentStatus(page)).toBeNull()
      expect(await printButtonDisabled(page)).toBe(false)
    })
  })

  describe('printing a document by URL', () => {
    const byUrl = {
      trigger: 'button',
      hidelogin: true,
      fileurl: 'https://files.e2e.test/doc.pdf',
      filetype: 'pdf',
      filename: 'doc.pdf',
    }

    const openByUrl = async (options: Parameters<typeof openPrinting>[0] = {}) => {
      const page = await openPrinting({
        signedIn: true,
        printers: [PRINTERS[0]],
        ...options,
        attrs: byUrl,
      })
      await click(page, 'ezp-printing >>> #print-trigger')
      await waitForPrintOptions(page)
      return page
    }

    it('prints straight from the URL without uploading anything', async () => {
      const page = await openByUrl()
      expect(await textOf(page, `${OPTIONS} >>> #files-badge`)).toBe('1 file')

      await click(page, `${OPTIONS} >>> #print`)
      await waitForInstance(page, 'ezp-status', 'print-success')

      const [print] = await getCalls(page, 'Print')
      expect(jsonBody(print)).toMatchObject({
        fileurl: 'https://files.e2e.test/doc.pdf',
        type: 'pdf',
        printerid: 'printer-1',
        alias: 'doc.pdf',
      })
      expect((await getCalls(page, 'PrepareUpload')).length).toBe(0)
      expect((await getCalls(page, 'BlobUpload')).length).toBe(0)
    })

    it('reports a rejected job as failed', async () => {
      const page = await openByUrl({ printResponses: [{ body: { code: 804 } }] })

      await click(page, `${OPTIONS} >>> #print`)
      await waitForInstance(page, 'ezp-status', 'print-failed')
    })

    it('reprints by file id when the URL upload has expired', async () => {
      const page = await openByUrl({
        printResponses: [
          { status: 412, body: { fileid: 'fresh-file' } },
          { body: { jobid: 'job-9' } },
        ],
      })

      await click(page, `${OPTIONS} >>> #print`)
      await waitForInstance(page, 'ezp-status', 'print-success')

      const prints = (await getCalls(page, 'Print')).map(jsonBody)
      expect(prints.length).toBe(2)
      expect(prints[1].fileid).toBe('fresh-file')
      expect(prints[1].fileurl).toBeUndefined()
      await waitForCall(page, 'Status')
      expect((await getCalls(page, 'Status'))[0].query).toBe('?id=job-9')
    })

    it('ends the flow when the options are cancelled, as there is no upload step to go back to', async () => {
      const page = await openByUrl()
      const finished = await page.spyOnEvent('printFinished')

      await click(page, `${OPTIONS} >>> #cancel`)

      expect(await page.find(OPTIONS)).toBeNull()
      expect(finished).toHaveReceivedEventTimes(1)
    })
  })

  describe('leaving the print options', () => {
    it('cancel returns to the upload card with the files still selected', async () => {
      const page = await openPrinting({ signedIn: true })
      const finished = await page.spyOnEvent('printFinished')
      await goToPrintOptions(page, 'report.pdf')

      await click(page, `${OPTIONS} >>> #cancel`)

      expect(await page.find(OPTIONS)).toBeNull()
      expect(await fileNames(page, UPLOAD_LIST)).toEqual(['report.pdf'])
      // Backing out of the options is not the end of the flow.
      expect(finished).toHaveReceivedEventTimes(0)
    })

    it('the header close button behaves like cancel', async () => {
      const page = await openPrinting({ signedIn: true })
      await goToPrintOptions(page, 'report.pdf')

      await click(page, `${OPTIONS} >>> #close`)

      expect(await page.find(OPTIONS)).toBeNull()
      expect(await fileNames(page, UPLOAD_LIST)).toEqual(['report.pdf'])
    })

    it('hides the header and menu when the host asks for it', async () => {
      const page = await openPrinting({
        signedIn: true,
        attrs: { hideheader: true, hidemenu: true },
      })
      await goToPrintOptions(page)

      expect(await page.find(`${OPTIONS} >>> #header`)).toBeNull()
      expect(await page.find(`${OPTIONS} >>> ezp-user-menu`)).toBeNull()
    })
  })
})
