import { PrinterProperties, JobStatusResponse, PrintResponse } from '../shared/types'
import { classifyJobStatus } from '../utils/printer'
import {
  BLOB_UPLOAD_CREATED,
  PRINT_REJECTED_CODE,
  HUB_DRIVER_ERROR_CODES,
  POLL_INTERVAL_MS,
  MAX_POLL_ATTEMPTS,
} from '../shared/constants'

/**
 * The slice of `EzpPrintService` this orchestrator needs. Declared structurally
 * so the print flow can be unit-tested with a plain mock, and so this module
 * has no dependency back on the service implementation.
 */
export interface PrintApi {
  prepareFileUpload(accessToken: string): Promise<{ fileid: string; sasUri: string }>
  uploadBlobFiles(sasUri: string, file: File): Promise<{ _response: { status: number } }>
  printByFileID(
    accessToken: string,
    fileID: string,
    fileType: string,
    printerID: string,
    properties: PrinterProperties,
    filename?: string,
  ): Promise<PrintResponse>
  getPrintStatus(): Promise<JobStatusResponse>
}

/** Lower-cased file extension, or '' when there is none. */
export function fileExtension(filename: string): string {
  const ext = filename.split('.').pop()
  return ext ? ext.toLowerCase() : ''
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * Poll the print status until the job reaches a terminal state. Resolves on
 * success; throws on failure, a hub-driver error, or when the polling budget is
 * exhausted (so a stuck job fails instead of polling forever). Unknown statuses
 * are treated as failures for safety.
 */
export async function waitForJobCompletion(
  getStatus: () => Promise<JobStatusResponse>,
  isQueue: boolean,
  pollIntervalMs: number = POLL_INTERVAL_MS,
  maxAttempts: number = MAX_POLL_ATTEMPTS,
): Promise<void> {
  let attempts = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const data = await getStatus()
    attempts++
    const outcome = classifyJobStatus(data.jobstatus, isQueue)

    if (outcome === 'success') return
    if (outcome === 'hub-error') {
      throw new Error('Hub printer driver error: ' + (data.jobstatusstring || data.jobstatus))
    }
    if (outcome === 'failed') {
      throw new Error('Print job failed: ' + (data.jobstatusstring || data.jobstatus))
    }
    // 'processing' — keep waiting until the polling budget is exhausted.
    if (attempts >= maxAttempts) {
      throw new Error(`Print job timed out after ${attempts} status checks`)
    }
    await sleep(pollIntervalMs)
  }
}

export interface PrintJobContext {
  service: PrintApi
  accessToken: string
  printerId: string
  isQueue: boolean
  properties: PrinterProperties
  pollIntervalMs?: number
}

/** Progress hooks so a UI can reflect the prepare/upload/job stages. */
export interface PrintJobHooks {
  onPreparing?: (value: boolean) => void
  onUploading?: (value: boolean) => void
  onJobId?: (jobId: string) => void
}

/**
 * Upload one file then print it, waiting for the job to finish. Throws (with a
 * message that includes "Hub printer driver error" for queue-driver failures) on
 * any failure, so callers can aggregate per-file outcomes.
 */
export async function uploadAndPrintFile(
  ctx: PrintJobContext,
  file: File,
  hooks: PrintJobHooks = {},
): Promise<void> {
  hooks.onPreparing?.(true)
  const response = await ctx.service.prepareFileUpload(ctx.accessToken)
  hooks.onPreparing?.(false)

  const fileid = response.fileid
  const sasUri = response.sasUri
  const filetype = fileExtension(file.name)

  hooks.onUploading?.(true)
  try {
    const res = await ctx.service.uploadBlobFiles(sasUri, file)
    if (res._response.status !== BLOB_UPLOAD_CREATED) {
      throw new Error(`Upload failed for file: ${file.name}`)
    }

    const data = await ctx.service.printByFileID(
      ctx.accessToken,
      fileid,
      filetype,
      ctx.printerId,
      ctx.properties,
      file.name,
    )

    if (data.code === PRINT_REJECTED_CODE) {
      throw new Error(`Print failed for file: ${file.name}`)
    }
    if (ctx.isQueue && data.code !== undefined && HUB_DRIVER_ERROR_CODES.includes(data.code)) {
      throw new Error(`Hub printer driver error for file: ${file.name}`)
    }
    if (!data.jobid) {
      throw new Error(`No job ID returned for file: ${file.name}`)
    }

    hooks.onJobId?.(data.jobid)
    await waitForJobCompletion(() => ctx.service.getPrintStatus(), ctx.isQueue, ctx.pollIntervalMs)
  } finally {
    hooks.onUploading?.(false)
  }
}
