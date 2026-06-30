import { PrinterConfig, PrinterProperties } from '../shared/types'
import {
  JobStatus,
  PROCESSING_JOB_STATUSES,
  FAILED_JOB_STATUSES,
  HUB_DRIVER_ERROR_CODES,
} from '../shared/constants'

/**
 * Derive the default print properties for a printer from its configuration.
 *
 * This logic previously lived inline and **duplicated verbatim** in
 * `ezp-printer-selection` (in `setSelectedProperties` and `connectedCallback`).
 * It mutates `properties` in place — matching the original behaviour exactly —
 * and returns it for convenience.
 */
export function applyPrinterDefaults(
  config: PrinterConfig,
  properties: PrinterProperties
): PrinterProperties {
  properties.color = config.Default?.Color == 'color' ? true : false

  const defaultOrientation = config.Default?.Orientation
  const defaultOrientationIndex = config.Default?.OrientationIndex
  let orientationFallback: number | undefined
  if (defaultOrientation) {
    const idx = config.OrientationsSupported?.indexOf(defaultOrientation)
    if (typeof idx === 'number' && idx >= 0) orientationFallback = idx + 1
  }
  properties.orientation = defaultOrientationIndex ?? orientationFallback
  properties.resolution = config.Default?.Resolution

  const defaultPaper = config.PaperFormats?.find((obj) => obj.Default === true)
  properties.paper = defaultPaper?.Name
  properties.paperid = defaultPaper?.Id

  // `obj?.` guards against an explicit "no trays" report of `[null]`, which the
  // original inline code would crash on before reaching the guards below.
  const defaultSource = config.Trays?.find((obj) => obj?.Default === true)
  if (config.Trays && config.Trays.length >= 1 && config.Trays[0] != null) {
    properties.trayname = defaultSource?.Name
    properties.defaultSource = defaultSource?.Index
  }
  // When the printer reports an explicit "no trays" ([null]) we must not send
  // tray attributes at all.
  if (config.Trays && config.Trays.length >= 0 && config.Trays[0] == null) {
    delete properties.trayname
    delete properties.defaultSource
  }

  properties.duplex = config.DuplexSupported
  properties.duplexmode = config.DuplexMode
  delete properties.PageRanges

  return properties
}

/** Does this printer config report an explicit "no usable trays" state? */
export function hasNoTrays(config: PrinterConfig): boolean {
  return !!config.Trays && config.Trays.length >= 0 && config.Trays[0] == null
}

/** Does this printer config expose at least one selectable tray? */
export function hasTrays(config: PrinterConfig): boolean {
  return !!config.Trays && config.Trays.length >= 1 && config.Trays[0] != null
}

export type JobOutcome = 'success' | 'processing' | 'failed' | 'hub-error'

/**
 * Classify a print-job status code into a single outcome. Centralises the
 * status logic that was previously duplicated (with slightly inconsistent code
 * sets) across `validateData`, `waitForPrintCompletion` and the inline checks
 * in `handlePrint`. Unknown codes are treated as failures for safety.
 */
export function classifyJobStatus(jobstatus: number, isQueue: boolean): JobOutcome {
  if (jobstatus === JobStatus.Success) return 'success'
  if (PROCESSING_JOB_STATUSES.includes(jobstatus)) return 'processing'
  if (isQueue && HUB_DRIVER_ERROR_CODES.includes(jobstatus)) return 'hub-error'
  if (FAILED_JOB_STATUSES.includes(jobstatus)) return 'failed'
  return 'failed'
}
