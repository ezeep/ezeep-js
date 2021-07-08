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
export type TypoBodyLevelTypes = 'primary' | 'secondary'
export type TypoHeadingLevelTypes =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'quaternary'
  | 'quinary'
  | 'senary'
export type TypoHeadingTagTypes = 1 | 2 | 3 | 4 | 5 | 6
export type TypoParagraphLevelTypes = 'primary' | 'secondary' | 'tertiary'
export type TypoWeightTypes = 'soft' | 'strong' | 'heavy'
export interface PrinterProperties {
  paper?: string
  paperid?: string
  color?: boolean | string
  duplex?: boolean| string
  duplexmode?: number| string
  orientation?: number| string
  copies?: number| string
  resolution?: string
}

export interface Printer {
  name: string
  id: string
}

export interface PaperFormat {
  id: number
  name: string
  xRes: number
  yRes: number
}
export interface PrinterConfig {
  collate: boolean
  color: boolean
  driver: string
  duplexMode: number
  duplexSupported: boolean
  id: string
  location: string
  mediaSupported: Array<string>
  mediaSupportedId: Array<number>
  name: string
  orientationsSupported: Array<string>
  orientationsSupportedId: Array<number>
  paperFormats: Array<PaperFormat>
  resolutions: Array<string>
  tpuid: number
}