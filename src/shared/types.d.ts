export type IconButtonLevelTypes = 'primary' | 'secondary' | 'tertiary'
export type IconButtonTypeTypes = 'button'
export type IconNameTypes = 'circle' | 'printer' | 'expand' | 'checkmark'
export type PrintOrganizationType = { id: number; name: string; printers: PrintPrinterType[] }
export type PrintPrinterType = { id: number; name: string; location: string }
export type PrintUserType = {
  id: number
  firstName: string
  lastName: string
  email: string
  organizations: PrintOrganizationType[]
}
export type SelectOptionType = { id: number; title: string; meta: string }
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
