export type IconButtonLevelTypes = 'primary' | 'secondary' | 'tertiary'
export type IconButtonTypeTypes = 'button'
export type IconNameTypes = 'expand' | 'checkmark' | 'menu' | 'printer' | 'rocket' | 'cross'
export type IconSizeTypes = 'normal' | 'large'
export type PrintOrganizationType = { id: number; name: string; printers: PrintPrinterType[] }
export type PrintPrinterType = { id: number; name: string; location: string }
export type PrintUserType = {
  id: number
  firstName: string
  lastName: string
  email: string
  organizations: PrintOrganizationType[]
}
export type SelectFlowTypes = 'vertical' | 'horizontal'
export type SelectOptionType = { id: number; title: string; meta: string }
export type TextButtonLevelTypes = 'primary' | 'secondary' | 'tertiary'
export type TextButtonTypeTypes = 'button'
export interface PrinterProperties {
  paper?: string
  paperid?: string
  color?: boolean | string
  duplex?: boolean | string
  duplexmode?: number | string
  orientation?: number | string
  copies?: number | string
  resolution?: string
}

export interface Printer {
  name: string
  id: string
}

export interface PaperFormat {
  Id: number
  Name: string
  XRes: number
  YRes: number
}
export interface PrinterConfig {
  Collate?: boolean
  Color?: boolean
  Driver?: string
  DuplexMode?: number
  DuplexSupported?: boolean
  Id?: string
  Location?: string
  MediaSupported?: Array<string>
  MediaSupportedId?: Array<number>
  Name?: string
  OrientationsSupported?: Array<string>
  OrientationsSupportedId?: Array<number>
  PaperFormats?: Array<PaperFormat>
  Resolutions?: Array<string>
  TPUID?: number
}
