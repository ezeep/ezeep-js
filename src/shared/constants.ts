/**
 * Centralised magic numbers used across the print/auth flow.
 *
 * These previously appeared as inline literals in `ezp-printer-selection`,
 * `print.ts` and `utils.ts`, with the same job-status codes duplicated across
 * three separate state machines. Keep them here so the meaning is explicit and
 * there is a single source of truth.
 */

/** Print-job status codes returned by `sfapi/Status`. */
export enum JobStatus {
  Success = 0,
  /** Job accepted / spooling — keep polling. */
  Processing = 1246,
  /** Job rendering — keep polling. */
  Rendering = 129,
  Failed = 3011,
  /** Generic failure. */
  Error = 2,
}

/** Status codes that mean "still working — keep polling". */
export const PROCESSING_JOB_STATUSES: readonly number[] = [
  JobStatus.Processing,
  JobStatus.Rendering,
]

/** Status codes that mean "terminal failure". */
export const FAILED_JOB_STATUSES: readonly number[] = [JobStatus.Failed, JobStatus.Error]

/**
 * Status/error codes that, for hub (queue) printers, indicate the print driver
 * is missing or misconfigured rather than a transient failure. Surfaced to the
 * user as a distinct "driver error" message.
 */
export const HUB_DRIVER_ERROR_CODES: readonly number[] = [412, 500, 503, 1048579]

/** `Print` response `code` meaning the upload expired and a fileid re-print is required. */
export const FILE_EXPIRED_STATUS = 412

/** `Print` response `code` meaning the job was rejected outright. */
export const PRINT_REJECTED_CODE = 804

/** Successful Azure Blob upload (`uploadData`) HTTP status. */
export const BLOB_UPLOAD_CREATED = 201

/** Paper-format id that represents a custom (user-defined width/length) size. */
export const PAPER_ID = 256

/** Print-status polling cadence and bounds. */
export const POLL_INTERVAL_MS = 2000
/**
 * Overall polling budget before a still-processing job is treated as failed.
 * Prevents polling the status endpoint indefinitely on a stuck job (only hub
 * printers had a timeout before). Generous — 10 minutes — to tolerate slow
 * server-side rendering of large documents.
 */
export const POLL_TIMEOUT_MS = 10 * 60 * 1000
export const MAX_POLL_ATTEMPTS = Math.ceil(POLL_TIMEOUT_MS / POLL_INTERVAL_MS)
/** Fallback timeout for hub printers so the UI never hangs indefinitely. */
export const HUB_TIMEOUT_MS = 30000

/** How often the access token is proactively refreshed, in seconds. */
export const TOKEN_REFRESH_INTERVAL_S = 1800
