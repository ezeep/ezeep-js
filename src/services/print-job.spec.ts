import {
  fileExtension,
  waitForJobCompletion,
  uploadAndPrintFile,
  PrintApi,
  PrintJobContext,
} from './print-job'

function mockService(overrides: Partial<PrintApi> = {}): PrintApi {
  return {
    prepareFileUpload: jest.fn().mockResolvedValue({ fileid: 'f1', sasUri: 'sas://x' }),
    uploadBlobFiles: jest.fn().mockResolvedValue({ _response: { status: 201 } }),
    printByFileID: jest.fn().mockResolvedValue({ jobid: 'j1' }),
    getPrintStatus: jest.fn().mockResolvedValue({ jobstatus: 0 }),
    ...overrides,
  }
}

function context(service: PrintApi, isQueue = false): PrintJobContext {
  return {
    service,
    accessToken: 'tok',
    printerId: 'printer-1',
    isQueue,
    properties: { copies: 1 },
    pollIntervalMs: 0,
  }
}

const aFile = () => new File(['data'], 'Report.PDF')

describe('fileExtension', () => {
  it('returns the lower-cased extension', () => {
    expect(fileExtension('Report.PDF')).toBe('pdf')
    expect(fileExtension('a.b.docx')).toBe('docx')
  })
  it('handles names without an extension', () => {
    expect(fileExtension('')).toBe('')
  })
})

describe('waitForJobCompletion', () => {
  it('resolves immediately on success', async () => {
    const getStatus = jest.fn().mockResolvedValue({ jobstatus: 0 })
    await expect(waitForJobCompletion(getStatus, false, 0)).resolves.toBeUndefined()
    expect(getStatus).toHaveBeenCalledTimes(1)
  })

  it('keeps polling while processing, then resolves', async () => {
    const getStatus = jest
      .fn()
      .mockResolvedValueOnce({ jobstatus: 1246 }) // processing
      .mockResolvedValueOnce({ jobstatus: 129 }) // processing
      .mockResolvedValueOnce({ jobstatus: 0 }) // success
    await waitForJobCompletion(getStatus, false, 0)
    expect(getStatus).toHaveBeenCalledTimes(3)
  })

  it('throws on a terminal failure status', async () => {
    const getStatus = jest.fn().mockResolvedValue({ jobstatus: 3011, jobstatusstring: 'boom' })
    await expect(waitForJobCompletion(getStatus, false, 0)).rejects.toThrow(
      'Print job failed: boom',
    )
  })

  it('throws a hub-driver error for queue printers', async () => {
    const getStatus = jest.fn().mockResolvedValue({ jobstatus: 412 })
    await expect(waitForJobCompletion(getStatus, true, 0)).rejects.toThrow(
      'Hub printer driver error',
    )
  })
})

describe('uploadAndPrintFile', () => {
  it('prepares, uploads, prints and waits — firing progress hooks in order', async () => {
    const service = mockService()
    const preparing: boolean[] = []
    const uploading: boolean[] = []
    let jobId = ''

    await uploadAndPrintFile(context(service), aFile(), {
      onPreparing: (v) => preparing.push(v),
      onUploading: (v) => uploading.push(v),
      onJobId: (id) => (jobId = id),
    })

    expect(preparing).toEqual([true, false])
    expect(uploading).toEqual([true, false])
    expect(jobId).toBe('j1')
    expect(service.printByFileID).toHaveBeenCalledWith(
      'tok',
      'f1',
      'pdf',
      'printer-1',
      { copies: 1 },
      'Report.PDF',
    )
  })

  it('throws when the blob upload does not return 201', async () => {
    const service = mockService({
      uploadBlobFiles: jest.fn().mockResolvedValue({ _response: { status: 500 } }),
    })
    await expect(uploadAndPrintFile(context(service), aFile())).rejects.toThrow('Upload failed')
    expect(service.printByFileID).not.toHaveBeenCalled()
  })

  it('throws on a rejected print (code 804)', async () => {
    const service = mockService({ printByFileID: jest.fn().mockResolvedValue({ code: 804 }) })
    await expect(uploadAndPrintFile(context(service), aFile())).rejects.toThrow('Print failed')
  })

  it('throws a hub-driver error for a queue printer driver code', async () => {
    const service = mockService({ printByFileID: jest.fn().mockResolvedValue({ code: 412 }) })
    await expect(uploadAndPrintFile(context(service, true), aFile())).rejects.toThrow(
      'Hub printer driver error',
    )
  })

  it('throws when no job id is returned', async () => {
    const service = mockService({ printByFileID: jest.fn().mockResolvedValue({}) })
    await expect(uploadAndPrintFile(context(service), aFile())).rejects.toThrow(
      'No job ID returned',
    )
  })

  it('always clears the uploading state, even on failure', async () => {
    const service = mockService({ printByFileID: jest.fn().mockResolvedValue({ code: 804 }) })
    const uploading: boolean[] = []
    await expect(
      uploadAndPrintFile(context(service), aFile(), { onUploading: (v) => uploading.push(v) }),
    ).rejects.toThrow()
    expect(uploading).toEqual([true, false])
  })
})
