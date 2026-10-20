import { newSpecPage } from '@stencil/core/testing'
import { EzpUpload } from './ezp-upload'
import { EzpTextButton } from '../ezp-text-button/ezp-text-button'

async function setup() {
  const page = await newSpecPage({ components: [EzpUpload], html: `<ezp-upload></ezp-upload>` })
  return { page, up: page.rootInstance as any }
}

function dropEvent(files: File[]) {
  return {
    preventDefault: () => undefined,
    stopPropagation: () => undefined,
    dataTransfer: { files },
  } as unknown as DragEvent
}

describe('ezp-upload', () => {
  it('handleDrop stores dropped files and emits the selection', async () => {
    const { page, up } = await setup()
    const emitted: File[][] = []
    page.root!.addEventListener('uploadFile', ((e: CustomEvent<File[]>) => {
      emitted.push(e.detail)
    }) as EventListener)

    up.handleDrop(dropEvent([new File(['x'], 'a.pdf')]))
    await page.waitForChanges()

    expect(up.selectedFiles.map((f: File) => f.name)).toEqual(['a.pdf'])
    expect(up.dragging).toBe(false)
    expect(emitted[0]).toHaveLength(1)
  })

  it('handleDrop appends to the existing selection', async () => {
    const { up } = await setup()
    up.handleDrop(dropEvent([new File(['1'], 'a.pdf')]))
    up.handleDrop(dropEvent([new File(['2'], 'b.pdf')]))
    expect(up.selectedFiles.map((f: File) => f.name)).toEqual(['a.pdf', 'b.pdf'])
  })

  it('removeFile drops the file at the given index and re-emits', async () => {
    const { up } = await setup()
    up.handleDrop(dropEvent([new File(['1'], 'a.pdf'), new File(['2'], 'b.pdf')]))
    up.removeFile({ preventDefault: () => undefined, stopPropagation: () => undefined }, 0)
    expect(up.selectedFiles.map((f: File) => f.name)).toEqual(['b.pdf'])
  })

  it('dragenter / dragleave toggle the dragging state', async () => {
    const { up } = await setup()
    up.handleDragEnter()
    expect(up.dragging).toBe(true)
    up.handleDragLeave()
    expect(up.dragging).toBe(false)
  })

  it('printCancel clears the current selection', async () => {
    const { up } = await setup()
    up.form = { reset: () => undefined }
    up.handleDrop(dropEvent([new File(['1'], 'a.pdf')]))
    up.listenPrintCancel()
    expect(up.selectedFiles).toEqual([])
  })

  it('handleContinue emits uploadContinue with the selection, and is a no-op when empty', async () => {
    const { page, up } = await setup()
    const advanced: File[][] = []
    page.root!.addEventListener('uploadContinue', ((e: CustomEvent<File[]>) => {
      advanced.push(e.detail)
    }) as EventListener)

    // No files yet -> must not advance.
    up.handleContinue()
    expect(advanced).toHaveLength(0)

    up.handleDrop(dropEvent([new File(['1'], 'a.pdf')]))
    up.handleContinue()
    expect(advanced).toHaveLength(1)
    expect(advanced[0].map((f: File) => f.name)).toEqual(['a.pdf'])
  })

  it('handleCancel emits printCancel so the host closes the flow', async () => {
    const { page, up } = await setup()
    let cancels = 0
    page.root!.addEventListener('printCancel', () => {
      cancels++
    })

    up.handleDrop(dropEvent([new File(['1'], 'a.pdf')]))
    up.handleCancel()
    expect(cancels).toBe(1)
  })

  it('handleCancel is a no-op when there are no files', async () => {
    const { page, up } = await setup()
    let cancels = 0
    page.root!.addEventListener('printCancel', () => {
      cancels++
    })

    up.handleCancel()
    expect(cancels).toBe(0)
  })

  it('swaps the dropzone for a file list once files are added', async () => {
    const { page, up } = await setup()
    const shadow = () => page.root!.shadowRoot!

    expect(shadow().querySelector('#dropzone')).not.toBeNull()
    expect(shadow().querySelector('#files')).toBeNull()

    up.handleDrop(dropEvent([new File(['1'], 'a.pdf'), new File(['2'], 'b.docx')]))
    await page.waitForChanges()

    expect(shadow().querySelector('#dropzone')).toBeNull()
    const types = Array.from(shadow().querySelectorAll('.file-type')).map((el) => el.textContent)
    expect(types).toEqual(['PDF', 'DOCX'])
    expect(shadow().querySelector('#add-more')).not.toBeNull()
  })

  it('lays the drop overlay over the file list while a drag is in progress', async () => {
    const { page, up } = await setup()
    up.handleDrop(dropEvent([new File(['1'], 'a.pdf')]))
    await page.waitForChanges()
    const row = page.root!.shadowRoot!.querySelector('.file')

    up.handleDragEnter()
    await page.waitForChanges()

    // The row under the pointer must stay connected, or its dragleave never
    // reaches the host and the drag depth never returns to zero.
    expect(page.root!.shadowRoot!.querySelector('#drop-overlay')).not.toBeNull()
    expect(page.root!.shadowRoot!.querySelector('.file')).toBe(row)
    expect(row!.isConnected).toBe(true)
  })

  it('keeps the empty-state prompt mounted while a drag is in progress', async () => {
    const { page, up } = await setup()
    const prompt = page.root!.shadowRoot!.querySelector('#dropzone-prompt')

    up.handleDragEnter()
    await page.waitForChanges()

    expect(page.root!.shadowRoot!.querySelector('#dropzone-prompt')).toBe(prompt)
    expect(page.root!.shadowRoot!.querySelector('#dropzone-title')).not.toBeNull()
  })

  it('clearing the selection also ends a stuck drag', async () => {
    const { page, up } = await setup()
    up.form = { reset: () => undefined }
    up.handleDrop(dropEvent([new File(['1'], 'a.pdf')]))
    up.handleDragEnter()
    up.listenPrintCancel()
    await page.waitForChanges()

    expect(up.dragging).toBe(false)
    expect(page.root!.classList.contains('dragging')).toBe(false)

    // A later drag starts balanced again.
    up.handleDragEnter()
    up.handleDragLeave()
    expect(up.dragging).toBe(false)
  })

  it('a drag that ends elsewhere on the page resets the drop state', async () => {
    const { page, up } = await setup()
    up.handleDragEnter()
    up.handleDragEnter()
    window.dispatchEvent(new Event('dragend'))
    await page.waitForChanges()

    expect(up.dragging).toBe(false)
  })

  it('keeps the drop overlay while the pointer crosses child elements', async () => {
    const { page, up } = await setup()
    up.handleDrop(dropEvent([new File(['1'], 'a.pdf')]))

    // Entering a child fires before leaving the previous one.
    up.handleDragEnter()
    up.handleDragEnter()
    up.handleDragLeave()
    await page.waitForChanges()

    expect(up.dragging).toBe(true)
    expect(page.root!.shadowRoot!.querySelector('#drop-overlay')).not.toBeNull()

    up.handleDragLeave()
    await page.waitForChanges()

    expect(up.dragging).toBe(false)
    expect(page.root!.shadowRoot!.querySelector('#drop-overlay')).toBeNull()
    expect(page.root!.shadowRoot!.querySelector('#files')).not.toBeNull()
  })

  it('removing a file keeps the remaining rows in order', async () => {
    const { page, up } = await setup()
    up.handleDrop(dropEvent([new File(['1'], 'a.pdf'), new File(['2'], 'b.pdf')]))
    await page.waitForChanges()

    const remove = page.root!.shadowRoot!.querySelectorAll('.file-remove')[0] as HTMLButtonElement
    remove.click()
    await page.waitForChanges()

    const names = Array.from(page.root!.shadowRoot!.querySelectorAll('.file-name')).map((el) =>
      el.getAttribute('name'),
    )
    expect(names).toEqual(['b.pdf'])
    expect(up.selectedFiles.map((f: File) => f.name)).toEqual(['b.pdf'])
  })

  it('Remove files is disabled until files are added', async () => {
    const page = await newSpecPage({
      components: [EzpUpload, EzpTextButton],
      html: `<ezp-upload></ezp-upload>`,
    })
    const up = page.rootInstance as any
    const clear = () => page.root!.shadowRoot!.querySelector('#clear') as any

    expect(clear().disabled).toBe(true)

    up.handleDrop(dropEvent([new File(['1'], 'a.pdf')]))
    await page.waitForChanges()
    expect(clear().disabled).toBe(false)
  })
})

/** A list whose top edge sits at 100, with 30px rows ending at `bottoms`. */
function scrolledList(bottoms: number[]) {
  const row = (bottom: number) => ({
    getBoundingClientRect: () => ({ top: bottom - 30, bottom }),
  })
  const list = { getBoundingClientRect: () => ({ top: 100 }), children: bottoms.map(row) }
  return { currentTarget: list } as unknown as Event
}

describe('ezp-upload file list', () => {
  const files = (count: number) =>
    Array.from({ length: count }, (_, i) => new File(['x'], `Document_${i + 1}.pdf`))

  it('renders every file inside the scrollable list, with Add more below it', async () => {
    const { page, up } = await setup()
    up.handleDrop(dropEvent(files(12)))
    await page.waitForChanges()
    const shadow = page.root!.shadowRoot!

    // The list caps its own height, so all rows live in it, not in the card.
    expect(shadow.querySelectorAll('#files > #file-list > .file')).toHaveLength(12)
    // Kept out of the scroller, so it stays in reach however long the list is.
    expect(shadow.querySelector('#files > #add-more')).not.toBeNull()
  })

  it('anchors the names outside the scroller, so their tooltips are not clipped', async () => {
    const { page, up } = await setup()
    up.handleDrop(dropEvent(files(6)))
    await page.waitForChanges()
    const shadow = page.root!.shadowRoot!

    const rows = Array.from(shadow.querySelectorAll('#file-list > .file'))
    expect(rows.every((row) => row.hasAttribute('data-tooltip-row'))).toBe(true)
    const names = Array.from(shadow.querySelectorAll('#file-list ezp-file-name'))
    expect(names.every((name) => name.getAttribute('anchor') === 'parent')).toBe(true)
    // Only the topmost row in view opens downwards.
    expect(names.map((name) => name.getAttribute('placement'))).toEqual([
      'bottom',
      ...Array(5).fill('top'),
    ])
  })

  it('opens downwards from whichever row is topmost once scrolled', async () => {
    const { page, up } = await setup()
    up.handleDrop(dropEvent(files(8)))
    // What the scroll handler settles on with three rows scrolled out of view.
    up.firstVisibleFile = 3
    await page.waitForChanges()

    const placements = Array.from(
      page.root!.shadowRoot!.querySelectorAll('#file-list ezp-file-name'),
    ).map((name) => name.getAttribute('placement'))
    expect(placements[3]).toBe('bottom')
    expect(placements.filter((p) => p === 'bottom')).toHaveLength(1)
  })

  it('tracks the topmost row in view as the list scrolls', async () => {
    const { up } = await setup()

    // The first two rows are scrolled out; the third shows its lower half.
    up.handleFilesScroll(scrolledList([40, 100, 130, 160]))
    expect(up.firstVisibleFile).toBe(2)

    up.handleFilesScroll(scrolledList([120, 150]))
    expect(up.firstVisibleFile).toBe(0)
  })

  it('starts a fresh selection back at the top of the list', async () => {
    const { up } = await setup()
    up.form = { reset: () => undefined }
    up.handleDrop(dropEvent(files(8)))
    up.firstVisibleFile = 3

    up.listenPrintCancel()

    expect(up.firstVisibleFile).toBe(0)
  })
})
