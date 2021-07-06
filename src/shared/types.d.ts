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
  color?: boolean
  duplex?: boolean
  duplexmode?: number
  orientation?: number
  copies?: number
  resolution?: string
}

export interface Printer {
  name: string
  id: string
}
