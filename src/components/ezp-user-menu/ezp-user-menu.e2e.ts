import { E2EPage } from '@stencil/core/testing'
import {
  chooseFiles,
  click,
  formBody,
  getCalls,
  getPopup,
  getStorage,
  goToPrintOptions,
  openPrinting,
  removeFiles,
  textOf,
  waitForCall,
} from '../../testing/mock-backend'

/**
 * End-to-end (real headless browser, faked network): the user menu of the
 * print options — account links, theme, appearance and logout.
 */

const OPTIONS = 'ezp-printing >>> ezp-printer-selection'
const MENU = `${OPTIONS} >>> ezp-user-menu`
const UPLOAD = 'ezp-printing >>> ezp-upload'

const isOpen = (page: E2EPage) => page.$eval(MENU, (el) => el.classList.contains('is-open'))

const hostClasses = (page: E2EPage) =>
  page.$eval('ezp-printing', (el) =>
    Array.from(el.classList)
      .filter((name) => name !== 'hydrated')
      .sort(),
  )

async function openMenu(options: Parameters<typeof openPrinting>[0] = {}): Promise<E2EPage> {
  const page = await openPrinting({ signedIn: true, ...options })
  await goToPrintOptions(page)
  await click(page, `${OPTIONS} >>> #toggle-menu`)
  await page.waitForFunction(
    (menu: Element) => getComputedStyle(menu).opacity === '1',
    {},
    (await page.$(MENU))!,
  )
  return page
}

describe('ezp-user-menu (e2e)', () => {
  afterAll(removeFiles)

  it('opens from the header and greets the signed-in user by name', async () => {
    const page = await openMenu()

    expect(await isOpen(page)).toBe(true)
    expect(await textOf(page, `${MENU} >>> #name`)).toBe('Erika Mustermann')
  })

  it('while closed, never intercepts clicks meant for the card underneath', async () => {
    const page = await openPrinting({ signedIn: true })
    await goToPrintOptions(page)
    const pointerEvents = () => page.$eval(MENU, (el) => getComputedStyle(el).pointerEvents)

    // Checked the moment the card appears: the closed menu is still fading
    // out then (invisible, but laid over the header and the printer select).
    expect(await pointerEvents()).toBe('none')

    // So the header's close button works straight away.
    await click(page, `${OPTIONS} >>> #close`)
    expect(await page.find(OPTIONS)).toBeNull()
  })

  it('takes clicks while open', async () => {
    const page = await openMenu()

    expect(await page.$eval(MENU, (el) => getComputedStyle(el).pointerEvents)).toBe('auto')
  })

  it('closes with its close button', async () => {
    const page = await openMenu()

    await click(page, `${MENU} >>> #close`)

    expect(await isOpen(page)).toBe(false)
  })

  it('links to the account and support pages in a new, isolated tab', async () => {
    const page = await openMenu()

    const links = await page.$$eval(`${MENU} >>> a.link[href]`, (anchors) =>
      anchors.map((a) => [a.getAttribute('href'), a.getAttribute('target'), a.getAttribute('rel')]),
    )

    expect(links).toEqual([
      ['https://app.ezeep.com', '_blank', 'noopener noreferrer'],
      ['https://support.ezeep.com', '_blank', 'noopener noreferrer'],
    ])
  })

  it('switches the colour theme of the whole component', async () => {
    const page = await openMenu({ attrs: { theme: 'cyan', appearance: 'light' } })
    expect(await hostClasses(page)).toEqual(['cyan', 'light'])

    await click(page, `${MENU} >>> .swatch--violet`)

    expect(await hostClasses(page)).toEqual(['light', 'violet'])
    const selected = await page.$eval(`${MENU} >>> .swatch.selected`, (el) => el.className)
    expect(selected).toContain('swatch--violet')
  })

  it('switches between light and dark appearance', async () => {
    const page = await openMenu({ attrs: { appearance: 'light' } })

    // Tabs are: System, Light, Dark.
    await click(page, `${MENU} >>> #tabs .tab:nth-child(3)`)
    expect(await hostClasses(page)).toContain('dark')

    await click(page, `${MENU} >>> #tabs .tab:nth-child(2)`)
    expect(await hostClasses(page)).toContain('light')
    expect(await hostClasses(page)).not.toContain('dark')
  })

  it('logs out: revokes the token, clears the session and ends the flow', async () => {
    const page = await openMenu()
    const finished = await page.spyOnEvent('printFinished')

    await click(page, `${MENU} >>> a.link:not([href])`)
    await waitForCall(page, 'Revoke')

    const [revoke] = await getCalls(page, 'Revoke')
    expect(formBody(revoke)).toEqual({ token: 'refresh-token-1' })
    expect(await getStorage(page, 'refreshToken')).toBeNull()
    expect(await getStorage(page, 'isAuthorized')).not.toBe('true')

    expect(await page.find(OPTIONS)).toBeNull()
    expect(await page.find(`${UPLOAD} >>> #dropzone`)).not.toBeNull()
    expect(finished).toHaveReceivedEventTimes(1)
  })

  it('keeps the last printer and its settings through a logout', async () => {
    const printer = { id: 'printer-1', name: 'Office Laser', location: '', is_queue: false }
    const page = await openMenu({ storage: { printer: JSON.stringify(printer) } })

    await click(page, `${MENU} >>> a.link:not([href])`)
    await waitForCall(page, 'Revoke')

    // They belong to the browser profile, not to the session.
    expect(JSON.parse((await getStorage(page, 'printer'))!).id).toBe('printer-1')
  })

  it('requires a fresh sign-in after logging out', async () => {
    const page = await openMenu()
    await click(page, `${MENU} >>> a.link:not([href])`)
    await waitForCall(page, 'Revoke')

    await goToSignIn(page)

    // Signed out: "Sign in" now opens the popup instead of skipping ahead.
    expect((await getPopup(page)).opens).toBe(1)
    expect(await page.find(OPTIONS)).toBeNull()
  })
})

/** Pick a file again and press through to the sign-in dialog's action. */
async function goToSignIn(page: E2EPage): Promise<void> {
  await chooseFiles(page, 'again.pdf')
  await click(page, `${UPLOAD} >>> #continue`)
  await click(page, 'ezp-printing >>> ezp-auth >>> ezp-dialog >>> #footer ezp-text-button')
}
