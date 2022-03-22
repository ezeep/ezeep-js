export type IconButtonLevelTypes = 'primary' | 'secondary' | 'tertiary' | 'quaternary'
export type IconButtonTypeTypes = 'button'
export type IconNameTypes =
  | 'account'
  | 'checkmark'
  | 'close'
  | 'color'
  | 'copies'
  | 'dark'
  | 'duplex'
  | 'expand'
  | 'help'
  | 'light'
  | 'logout'
  | 'menu'
  | 'minus'
  | 'orientation'
  | 'plus'
  | 'printer'
  | 'quality'
  | 'size'
  | 'system'
  | 'drag-drop'
  | 'checkmark-alt'
  | 'question-mark'
  | 'exclamation-mark'
  | 'logo'
export type IconSizeTypes = 'normal' | 'large' | 'huge'
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
export type SelectOptionType = {
  id: number | string | boolean
  title: string
  meta: string
  type?: string
}
export type TextButtonLevelTypes = 'primary' | 'secondary' | 'tertiary'
export type TextButtonTypeTypes = 'button'
export type LabelLevelTypes = 'primary' | 'secondary' | 'tertiary'
export type WeightTypes = 'soft' | 'strong' | 'heavy'
export type ThemeTypes = 'pink' | 'red' | 'orange' | 'green' | 'teal' | 'cyan' | 'blue' | 'violet'
export type AppearanceTypes = 'system' | 'light' | 'dark'
export type TriggerTypes = 'custom' | 'file' | 'button'
export type AlertType = { open: boolean; heading: string; description: string }
export type SystemAppearanceTypes = 'light' | 'dark'
export interface PrinterProperties {
  paper?: string
  paperid?: number | string
  color?: boolean | string
  duplex?: boolean | string
  duplexmode?: number | string
  orientation?: number | string
  copies?: number | string
  resolution?: string
}

export interface Printer {
  id: string
  location: string
  name: string
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

export interface User {
  azureProfile: any
  dateJoined: string
  displayName: string
  email: string
  firstName: string
  id: string
  idProfile: {
    name: string
    oid: string
    preferredUsername: string
  }
  isVerfified: boolean
  lastName: string
  roles: Array<string>
  userInvitations: any
}
