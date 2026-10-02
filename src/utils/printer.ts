import { PrinterConfig, PrinterProperties } from '../shared/types'
import {
  JobStatus,
  PROCESSING_JOB_STATUSES,
  FAILED_JOB_STATUSES,
  HUB_DRIVER_ERROR_CODES,
  PAPER_ID,
} from '../shared/constants'

/** Duplex modes the dialog offers: none, long edge, short edge. */
const DUPLEX_MODES = [1, 2, 3]

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
  properties: PrinterProperties,
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

/**
 * Carry the settings the user last printed with on this printer over the
 * printer's own defaults, dropping anything the printer can no longer do.
 *
 * Capabilities change between sessions — a printer loses a tray, an admin
 * swaps the paper formats — and a stale value would otherwise be sent to the
 * API or shown as a selection that isn't in the list. Each field is therefore
 * only restored if the current config still offers it; everything else stays
 * on the default `applyPrinterDefaults` just put in place. Copies and page
 * ranges are never part of `saved`, so they are never restored.
 */
export function applySavedProperties(
  config: PrinterConfig,
  saved: PrinterProperties | null,
  properties: PrinterProperties,
): PrinterProperties {
  applyPrinterDefaults(config, properties)
  if (!saved) return properties

  if (config.ColorSupported && typeof saved.color === 'boolean') {
    properties.color = saved.color
  }

  if (config.DuplexSupported && DUPLEX_MODES.includes(Number(saved.duplexmode))) {
    properties.duplex = true
    properties.duplexmode = Number(saved.duplexmode)
  }

  const paper = config.PaperFormats?.find((format) => format.Id === Number(saved.paperid))
  if (paper) {
    properties.paper = paper.Name
    properties.paperid = paper.Id
    // Only meaningful for the custom format, which carries its own dimensions.
    if (paper.Id === PAPER_ID) {
      properties.paperwidth = saved.paperwidth
      properties.paperlength = saved.paperlength
    }
  }

  // Orientations are offered as 1-based positions in `OrientationsSupported`.
  const orientation = Number(saved.orientation)
  if (orientation >= 1 && orientation <= (config.OrientationsSupported?.length ?? 0)) {
    properties.orientation = orientation
  }

  if (typeof saved.resolution === 'string' && config.Resolutions?.includes(saved.resolution)) {
    properties.resolution = saved.resolution
  }

  if (hasTrays(config)) {
    const tray = config.Trays?.find((option) => option?.Index === Number(saved.defaultSource))
    if (tray) {
      properties.trayname = tray.Name
      properties.defaultSource = tray.Index
    }
  }

  return properties
}

/**
 * The slice of the current selection worth remembering for next time: what the
 * print dialog offers per printer, minus copies and page ranges, which belong
 * to the one document being printed rather than to the printer.
 */
export function pickRememberedProperties(properties: PrinterProperties): PrinterProperties {
  const { color, duplex, duplexmode, paper, paperid, paperwidth, paperlength } = properties
  const { orientation, resolution, trayname, defaultSource } = properties

  return {
    color,
    duplex,
    duplexmode,
    paper,
    paperid,
    paperwidth,
    paperlength,
    orientation,
    resolution,
    trayname,
    defaultSource,
  }
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
