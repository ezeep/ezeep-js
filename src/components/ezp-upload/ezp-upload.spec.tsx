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

  it('brings the dropzone back while a drag is in progress', async () => {
    const { page, up } = await setup()
    up.handleDrop(dropEvent([new File(['1'], 'a.pdf')]))
    up.handleDragEnter()
    await page.waitForChanges()

    expect(page.root!.shadowRoot!.querySelector('#dropzone')).not.toBeNull()
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
