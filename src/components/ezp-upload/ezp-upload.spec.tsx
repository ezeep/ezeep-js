import { newSpecPage } from '@stencil/core/testing'
import { EzpUpload } from './ezp-upload'

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
})
