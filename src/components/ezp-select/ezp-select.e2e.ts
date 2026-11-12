import { newE2EPage, E2EPage } from '@stencil/core/testing'

/**
 * End-to-end (real headless browser): the dropdown on its own — mouse and
 * keyboard operation, focus handling and the ARIA state that goes with it.
 */

const OPTIONS = [
  { id: 1, title: 'Portrait', meta: '', type: 'orientation' },
  { id: 2, title: 'Landscape', meta: '', type: 'orientation' },
  { id: 3, title: 'Auto', meta: 'picked by the printer', type: 'orientation' },
]

async function openSelect(attributes = ''): Promise<E2EPage> {
  const page = await newE2EPage()
  // The select measures itself against the nearest `data-backdrop-surface`.
  await page.setContent(
    `<div data-backdrop-surface style="position: relative; height: 500px; width: 400px">
       <ezp-select label="Orientation" placeholder="Select Orientation" ${attributes}></ezp-select>
     </div>`,
  )
  await page.$eval('ezp-select', (el: any, options) => (el.options = options), OPTIONS)
  await page.waitForChanges()
  return page
}

const toggleState = (page: E2EPage) =>
  page.$eval('ezp-select >>> #toggle', (el) => ({
    expanded: el.getAttribute('aria-expanded'),
    disabled: el.getAttribute('aria-disabled'),
    tabindex: el.getAttribute('tabindex'),
  }))

const shownValue = (page: E2EPage) =>
  page.$eval('ezp-select >>> #value', (el: any) => el.text as string)

/** Title of the option that has keyboard focus, or null. */
const focusedOption = (page: E2EPage) =>
  page.$eval('ezp-select', (el) => {
    const active = el.shadowRoot!.activeElement
    return active?.getAttribute('role') === 'option'
      ? ((active.querySelector('.title') as any).text as string)
      : null
  })

const isCollapsed = (page: E2EPage) =>
  page.waitForFunction(
    () => !document.querySelector('ezp-select')!.classList.contains('is-expanded'),
  )

/** The list opens with a transition; give it time before aiming a click at it. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 350))

describe('ezp-select (e2e)', () => {
  it('shows the placeholder until something is selected', async () => {
    const page = await openSelect()

    expect(await shownValue(page)).toBe('Select Orientation')
    expect(await toggleState(page)).toEqual({ expanded: 'false', disabled: 'false', tabindex: '0' })
  })

  it('shows the preselected option, matched by title or by id', async () => {
    const byTitle = await openSelect('pre-selected="Landscape"')
    expect(await shownValue(byTitle)).toBe('Landscape')

    const byId = await openSelect()
    await byId.$eval('ezp-select', (el: any) => (el.preSelected = 3))
    await byId.waitForChanges()
    expect(await shownValue(byId)).toBe('Auto')
  })

  it('falls back to the placeholder when the preselection matches no option', async () => {
    const page = await openSelect('pre-selected="Landscape"')

    await page.$eval('ezp-select', (el: any) => (el.preSelected = 'Sideways'))
    await page.waitForChanges()

    expect(await shownValue(page)).toBe('Select Orientation')
  })

  it('opens on click and selects the clicked option', async () => {
    const page = await openSelect()
    const toggled = await page.spyOnEvent('selectToggle')
    const selected = await page.spyOnEvent('selectSelection')

    await (await page.find('ezp-select >>> #toggle')).click()
    await page.waitForChanges()
    expect((await toggleState(page)).expanded).toBe('true')
    expect(toggled).toHaveReceivedEventDetail(true)

    await settle()
    await (await page.find('ezp-select >>> .option:nth-child(2)')).click()
    await isCollapsed(page)
    await page.waitForChanges()

    expect(selected).toHaveReceivedEventDetail(OPTIONS[1])
    expect(await shownValue(page)).toBe('Landscape')
    const marked = await page.$$eval('ezp-select >>> .option', (options) =>
      options.map((option) => option.getAttribute('aria-selected')),
    )
    expect(marked).toEqual(['false', 'true', 'false'])
  })

  it('closes without selecting when the backdrop is clicked', async () => {
    const page = await openSelect()
    const selected = await page.spyOnEvent('selectSelection')
    await (await page.find('ezp-select >>> #toggle')).click()
    await page.waitForChanges()
    await settle()

    await (await page.find('ezp-backdrop')).click()
    await isCollapsed(page)

    expect(selected).toHaveReceivedEventTimes(0)
    expect(await shownValue(page)).toBe('Select Orientation')
  })

  it('does not open while disabled', async () => {
    const page = await openSelect('disabled')

    expect(await toggleState(page)).toEqual({ expanded: 'false', disabled: 'true', tabindex: '-1' })
    await (await page.find('ezp-select >>> #toggle')).click()
    await page.waitForChanges()

    expect((await toggleState(page)).expanded).toBe('false')
  })

  describe('keyboard', () => {
    const focusToggle = async (page: E2EPage) => {
      await page.$eval('ezp-select >>> #toggle', (el) => (el as HTMLElement).focus())
    }

    it.each(['Enter', 'Space', 'ArrowDown'])(
      '%s opens the list and focuses the first option',
      async (key) => {
        const page = await openSelect()
        await focusToggle(page)

        await page.keyboard.press(key as any)
        await page.waitForChanges()
        await page.waitForFunction(
          () =>
            document
              .querySelector('ezp-select')!
              .shadowRoot!.activeElement?.getAttribute('role') === 'option',
        )

        expect((await toggleState(page)).expanded).toBe('true')
        expect(await focusedOption(page)).toBe('Portrait')
      },
    )

    it('arrows, Home and End move between options without leaving the list', async () => {
      const page = await openSelect()
      await focusToggle(page)
      await page.keyboard.press('Enter')
      await page.waitForFunction(
        () =>
          document.querySelector('ezp-select')!.shadowRoot!.activeElement?.getAttribute('role') ===
          'option',
      )

      await page.keyboard.press('ArrowDown')
      expect(await focusedOption(page)).toBe('Landscape')
      await page.keyboard.press('End')
      expect(await focusedOption(page)).toBe('Auto')
      // Already last: stays put.
      await page.keyboard.press('ArrowDown')
      expect(await focusedOption(page)).toBe('Auto')
      await page.keyboard.press('Home')
      expect(await focusedOption(page)).toBe('Portrait')
      await page.keyboard.press('ArrowUp')
      expect(await focusedOption(page)).toBe('Portrait')
    })

    it('Enter selects the focused option and closes the list', async () => {
      const page = await openSelect()
      const selected = await page.spyOnEvent('selectSelection')
      await focusToggle(page)
      await page.keyboard.press('Enter')
      await page.waitForFunction(
        () =>
          document.querySelector('ezp-select')!.shadowRoot!.activeElement?.getAttribute('role') ===
          'option',
      )

      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')
      await isCollapsed(page)
      await page.waitForChanges()

      expect(selected).toHaveReceivedEventDetail(OPTIONS[1])
      expect(await shownValue(page)).toBe('Landscape')
    })

    it('Escape closes the list and returns focus to the toggle', async () => {
      const page = await openSelect()
      const selected = await page.spyOnEvent('selectSelection')
      await focusToggle(page)
      await page.keyboard.press('Enter')
      await page.waitForFunction(
        () =>
          document.querySelector('ezp-select')!.shadowRoot!.activeElement?.getAttribute('role') ===
          'option',
      )

      await page.keyboard.press('Escape')
      await isCollapsed(page)

      expect(selected).toHaveReceivedEventTimes(0)
      const focused = await page.$eval('ezp-select', (el) => el.shadowRoot!.activeElement?.id)
      expect(focused).toBe('toggle')
    })

    it('options are only tabbable while the list is open', async () => {
      const page = await openSelect()
      const tabindexes = () =>
        page.$$eval('ezp-select >>> .option', (options) =>
          options.map((option) => option.getAttribute('tabindex')),
        )

      expect(await tabindexes()).toEqual(['-1', '-1', '-1'])

      await (await page.find('ezp-select >>> #toggle')).click()
      await page.waitForChanges()

      expect(await tabindexes()).toEqual(['0', '0', '0'])
    })
  })
})
