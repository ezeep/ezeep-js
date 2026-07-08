import i18next from 'i18next'
import { initi18n } from './utils'

/**
 * Safety net for the i18next integration: verifies init + translation + language
 * switching + dotted-key handling (nsSeparator is disabled). Guards the i18next
 * major upgrade — behaviour must be identical before and after.
 */
describe('initi18n', () => {
  it('initialises i18next and translates a known English key', () => {
    initi18n('en')
    expect(i18next.t('button_actions.cancel')).toBe('Cancel')
    expect(i18next.t('printer_selection.print')).toBe('Print')
  })

  it('switches to German when that language is requested', () => {
    initi18n('de')
    expect(i18next.t('button_actions.cancel')).toBe('Abbrechen')
  })

  it('returns a plain string (dotted keys are not treated as namespaces)', () => {
    initi18n('en')
    const value = i18next.t('button_actions.close')
    expect(typeof value).toBe('string')
    expect(value).toBe('Close')
  })
})
