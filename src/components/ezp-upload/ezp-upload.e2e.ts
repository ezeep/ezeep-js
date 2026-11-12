import { E2EPage } from '@stencil/core/testing'
import {
  chooseFiles,
  click,
  fileNames,
  openPrinting,
  removeFiles,
  textOf,
} from '../../testing/mock-backend'

/**
 * End-to-end (real headless browser): the upload card, as rendered by
 * `<ezp-printing trigger="file">` (which also initialises the translations).
 */

const UPLOAD = 'ezp-printing >>> ezp-upload'
const LIST = `${UPLOAD} >>> #file-list`
// Rows are plain descendants of the list (no shadow boundary in between).
const ROW = `${LIST} .file`

const isDisabled = (page: E2EPage, id: string) =>
  page.$eval(`${UPLOAD} >>> ${id}`, (el: any) => el.disabled as boolean)

const rows = (page: E2EPage) =>
  page.$$eval(ROW, (elements) =>
    elements.map((row) => ({
      type: row.querySelector('.file-type')!.textContent!.trim(),
      name: (row.querySelector('ezp-file-name') as any).name as string,
      size: (row.querySelector('.file-size') as any).text as string,
    })),
  )

/** Fire a drag event carrying files at the upload card, like a drag from the desktop. */
async function drag(page: E2EPage, type: string, names: string[] = []): Promise<void> {
  await page.$eval(
    UPLOAD,
    (host, eventType, fileNames) => {
      const data = new DataTransfer()
      ;(fileNames as string[]).forEach((name) => data.items.add(new File(['dropped'], name)))
      host.dispatchEvent(
        new DragEvent(eventType as string, {
          dataTransfer: data,
          bubbles: true,
          cancelable: true,
          composed: true,
        }),
      )
    },
    type,
    names,
  )
  await page.waitForChanges()
}

const isDragging = (page: E2EPage) =>
  page.$eval(UPLOAD, (host) => host.classList.contains('dragging'))

describe('ezp-upload (e2e)', () => {
  afterAll(removeFiles)

  it('starts empty: prompts for files and keeps the actions disabled', async () => {
    const page = await openPrinting()

    expect(await textOf(page, `${UPLOAD} >>> #choose`)).toBe('Choose files')
    expect(await textOf(page, `${UPLOAD} >>> #drag-hint`)).toBe('or drag files here')
    expect(await textOf(page, `${UPLOAD} >>> #formats`)).toBe('PDF, DOCX, PNG, JPG, XLSX')
    expect(await isDisabled(page, '#continue')).toBe(true)
    expect(await isDisabled(page, '#clear')).toBe(true)
    expect(await page.find(LIST)).toBeNull()
  })

  it('"Choose files" opens the native file picker', async () => {
    const page = await openPrinting()

    const [chooser] = await Promise.all([
      page.waitForFileChooser(),
      click(page, `${UPLOAD} >>> #choose`),
    ])

    expect(chooser.isMultiple()).toBe(true)
  })

  it('lists picked files with their type, name and size', async () => {
    const page = await openPrinting()
    const uploaded = await page.spyOnEvent('uploadFile')

    await chooseFiles(page, 'report.pdf', 'Quarterly numbers.xlsx')

    expect(await rows(page)).toEqual([
      { type: 'PDF', name: 'report.pdf', size: '25 B' },
      { type: 'XLSX', name: 'Quarterly numbers.xlsx', size: '37 B' },
    ])
    expect(uploaded).toHaveReceivedEventTimes(1)
    expect(await page.find(`${UPLOAD} >>> #dropzone`)).toBeNull()
    expect(await isDisabled(page, '#continue')).toBe(false)
    expect(await isDisabled(page, '#clear')).toBe(false)
  })

  it('labels a file without an extension generically', async () => {
    const page = await openPrinting()

    await chooseFiles(page, 'README')

    expect((await rows(page))[0].type).toBe('FILE')
  })

  it('adds further picks to the selection instead of replacing it', async () => {
    const page = await openPrinting()

    await chooseFiles(page, 'one.pdf')
    await chooseFiles(page, 'two.pdf')
    // The same file again is a second row, not a no-op.
    await chooseFiles(page, 'one.pdf')

    expect(await fileNames(page, LIST)).toEqual(['one.pdf', 'two.pdf', 'one.pdf'])
  })

  it('"Add more files" opens the file picker again', async () => {
    const page = await openPrinting()
    await chooseFiles(page, 'one.pdf')

    const [chooser] = await Promise.all([
      page.waitForFileChooser(),
      click(page, `${UPLOAD} >>> #add-more`),
    ])

    expect(chooser).toBeTruthy()
  })

  it('removes a single file and returns to the prompt when the last one goes', async () => {
    const page = await openPrinting()
    await chooseFiles(page, 'one.pdf', 'two.pdf', 'three.pdf')

    // Remove the middle row.
    await click(page, `${ROW}:nth-child(2) .file-remove`)
    expect(await fileNames(page, LIST)).toEqual(['one.pdf', 'three.pdf'])

    await click(page, `${ROW}:nth-child(1) .file-remove`)
    await click(page, `${ROW}:nth-child(1) .file-remove`)

    expect(await page.find(`${UPLOAD} >>> #dropzone`)).not.toBeNull()
    expect(await isDisabled(page, '#continue')).toBe(true)
  })

  it('"Remove files" clears the selection and ends the flow', async () => {
    const page = await openPrinting()
    const finished = await page.spyOnEvent('printFinished')
    await chooseFiles(page, 'one.pdf', 'two.pdf')

    await click(page, `${UPLOAD} >>> #clear`)

    expect(await page.find(`${UPLOAD} >>> #dropzone`)).not.toBeNull()
    expect(finished).toHaveReceivedEventTimes(1)

    // The card is reusable afterwards.
    await chooseFiles(page, 'again.pdf')
    expect(await fileNames(page, LIST)).toEqual(['again.pdf'])
  })

  it('"Continue to print options" hands the files on to sign-in', async () => {
    const page = await openPrinting()
    const continued = await page.spyOnEvent('uploadContinue')
    await chooseFiles(page, 'report.pdf')

    expect(await textOf(page, `${UPLOAD} >>> #continue`)).toBe('Continue to print options')
    await click(page, `${UPLOAD} >>> #continue`)

    expect(continued).toHaveReceivedEventTimes(1)
    expect(await page.find('ezp-printing >>> ezp-auth')).not.toBeNull()
  })

  describe('drag and drop', () => {
    it('highlights the card while files are dragged over it and accepts the drop', async () => {
      const page = await openPrinting()

      await drag(page, 'dragenter')
      expect(await isDragging(page)).toBe(true)

      await drag(page, 'drop', ['dropped.pdf', 'dropped.png'])

      expect(await isDragging(page)).toBe(false)
      expect(await fileNames(page, LIST)).toEqual(['dropped.pdf', 'dropped.png'])
    })

    it('drops add to an existing selection, under a drop overlay', async () => {
      const page = await openPrinting()
      await chooseFiles(page, 'picked.pdf')

      await drag(page, 'dragenter')
      expect(await page.find(`${UPLOAD} >>> #drop-overlay`)).not.toBeNull()
      // The list stays mounted underneath the overlay.
      expect(await fileNames(page, LIST)).toEqual(['picked.pdf'])

      await drag(page, 'drop', ['dropped.pdf'])

      expect(await page.find(`${UPLOAD} >>> #drop-overlay`)).toBeNull()
      expect(await fileNames(page, LIST)).toEqual(['picked.pdf', 'dropped.pdf'])
    })

    it('drops the highlight when the drag leaves the card', async () => {
      const page = await openPrinting()

      await drag(page, 'dragenter')
      await drag(page, 'dragleave')

      expect(await isDragging(page)).toBe(false)
    })

    it('drops the highlight when the drag ends elsewhere on the page', async () => {
      const page = await openPrinting()

      await drag(page, 'dragenter')
      await page.evaluate(() => window.dispatchEvent(new DragEvent('dragend')))
      await page.waitForChanges()

      expect(await isDragging(page)).toBe(false)
    })

    it('claims the drop so the browser does not navigate to the file', async () => {
      const page = await openPrinting()

      const prevented = await page.$eval(UPLOAD, (host) => {
        const over = new DragEvent('dragover', {
          dataTransfer: new DataTransfer(),
          bubbles: true,
          cancelable: true,
          composed: true,
        })
        host.dispatchEvent(over)
        return over.defaultPrevented
      })

      expect(prevented).toBe(true)
    })
  })
})
