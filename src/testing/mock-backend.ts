import { newE2EPage, E2EPage } from '@stencil/core/testing'
import fs from 'fs'
import os from 'os'
import path from 'path'

/**
 * Shared harness for the e2e tests (`*.e2e.ts`).
 *
 * The real print journey talks to three backends: the ezeep account API
 * (OAuth + user info), the print API (`sfapi/*`) and Azure Blob storage. None
 * of them is reachable (or wanted) from CI, so `openPrinting` replaces
 * `window.fetch` with an in-page fake before any component code runs. The
 * components, services, stores and `localStorage` are all real — only the
 * network edge is faked — and every request is recorded so a test can assert
 * on exactly what would have gone over the wire.
 */

export const AUTH_HOST = 'account.e2e.test'
export const PRINT_HOST = 'printapi.e2e.test'
export const BLOB_HOST = 'blob.e2e.test'
export const CLIENT_ID = 'e2e-client'
export const REDIRECT_URI = 'https://app.e2e.test/callback'
export const REDIRECT_ORIGIN = 'https://app.e2e.test'
/** The only authorization code the fake token endpoint accepts — and only once. */
export const VALID_CODE = 'valid-code'
/** The refresh token seeded into `localStorage` by `signedIn: true`. */
export const SEEDED_REFRESH_TOKEN = 'refresh-token-0'

export interface MockPrinter {
  id: string
  name: string
  location: string
  is_queue: boolean
}

export interface MockResponse {
  /** HTTP status, 200 when omitted. */
  status?: number
  body: unknown
}

/** One request seen by the fake backend. */
export interface RecordedCall {
  /**
   * Which endpoint the fake matched: `AccessToken`, `Revoke`, `UserInfo`,
   * `BlobUpload`, or the `sfapi` name (`GetPrinter`, `Print`, `Status`, …).
   */
  route: string
  url: string
  host: string
  path: string
  query: string
  method: string
  /** Header names are lower-cased. */
  headers: Record<string, string>
  /** String bodies verbatim; binary bodies as `[binary <bytes>]`. */
  body: string | null
  /** True once the fake has produced its response. */
  done: boolean
}

export interface MockBackendOptions {
  /** Start with a persisted session (refresh token in `localStorage`). */
  signedIn?: boolean
  printers?: MockPrinter[]
  /** Printer capabilities by printer id. */
  printerProperties?: Record<string, unknown>
  /** `System.FILEEXT` of `GetConfiguration`: the printable file extensions. */
  fileExtensions?: string
  user?: { display_name: string; preferred_language?: string | null }
  /** Answers of `sfapi/Print`, consumed in order; the last one repeats. */
  printResponses?: MockResponse[]
  /** Answers of `sfapi/Status`, consumed in order; the last one repeats. */
  statusResponses?: MockResponse[]
  /** Routes (see `route` in the fake) whose request fails at network level. */
  failing?: string[]
  /** Routes that answer with a fixed response instead, e.g. a server error. */
  errors?: Record<string, MockResponse>
  /** Extra `localStorage` entries to seed before the page loads. */
  storage?: Record<string, string>
  /**
   * What `window.open` does for the sign-in popup: `iframe` hands back a real
   * (hidden, same-page) window so the popup → opener `message` handshake can be
   * exercised; `blocked` returns null like a popup blocker.
   */
  popup?: 'iframe' | 'blocked'
  /** Milliseconds every faked response is held back, to observe busy states. */
  delay?: number
  /**
   * Access tokens the backend accepts although it did not issue them, as one
   * from the host page's own sign-in (see `tokenProvider` of `openPrinting`).
   */
  hostTokens?: string[]
}

export const PRINTERS: MockPrinter[] = [
  { id: 'printer-1', name: 'Office Laser', location: 'Berlin, 3rd floor', is_queue: false },
  { id: 'printer-2', name: 'Lobby Inkjet', location: '', is_queue: false },
  { id: 'queue-1', name: 'Pull Print Queue', location: 'Anywhere', is_queue: true },
]

const PAPER_FORMATS = [
  { Id: 9, Name: 'A4', XRes: 2100, YRes: 2970, Default: true },
  { Id: 1, Name: 'Letter', XRes: 2159, YRes: 2794, Default: false },
  { Id: 256, Name: 'Custom', XRes: 0, YRes: 0, Default: false },
]

function printerConfig(id: string, name: string, overrides: Record<string, unknown> = {}) {
  return {
    Id: id,
    Name: name,
    Default: {
      Color: 'color',
      Duplex: 'duplex_simplex',
      Orientation: 'portrait',
      OrientationIndex: 1,
      Resolution: '600x600',
      Paper: 'A4',
      Tray: 'Tray 1',
    },
    Color: true,
    ColorSupported: true,
    DuplexSupported: true,
    DuplexMode: 1,
    OrientationsSupported: ['portrait', 'landscape'],
    PaperFormats: PAPER_FORMATS,
    Resolutions: ['300x300', '600x600'],
    Trays: [
      { Index: 1, Name: 'Tray 1', Default: true },
      { Index: 2, Name: 'Tray 2', Default: false },
    ],
    ...overrides,
  }
}

export const PRINTER_PROPERTIES: Record<string, unknown> = {
  'printer-1': printerConfig('printer-1', 'Office Laser'),
  // A basic device: black & white, single-sided, no trays.
  'printer-2': printerConfig('printer-2', 'Lobby Inkjet', {
    Default: { Color: 'grayscale', Orientation: 'portrait', OrientationIndex: 1, Paper: 'A4' },
    Color: false,
    ColorSupported: false,
    DuplexSupported: false,
    Resolutions: [],
    Trays: [null],
  }),
  'queue-1': printerConfig('queue-1', 'Pull Print Queue'),
}

const DEFAULTS: Required<MockBackendOptions> = {
  signedIn: false,
  printers: PRINTERS,
  printerProperties: PRINTER_PROPERTIES,
  fileExtensions: 'pdf;docx;png;jpg;xlsx;txt',
  user: { display_name: 'Erika Mustermann', preferred_language: null },
  printResponses: [{ body: { jobid: 'job-1' } }],
  statusResponses: [{ body: { jobstatus: 0, jobstatusstring: 'PRINTED' } }],
  failing: [],
  errors: {},
  storage: {},
  popup: 'iframe',
  delay: 0,
  hostTokens: [],
}

/**
 * Runs inside the browser, before any page script. Must stay self-contained:
 * puppeteer serialises the function, so it cannot close over module scope.
 */
function installMockBackend(
  options: Required<MockBackendOptions>,
  hosts: { auth: string; print: string; blob: string; validCode: string; seededRefresh: string },
) {
  // `evaluateOnNewDocument` also runs in child frames (the fake popup).
  if (window.top !== window) return

  const mock: any = {
    options,
    calls: [],
    accessTokens: [] as string[],
    refreshTokens: [] as string[],
    issued: 0,
    codeSpent: false,
    uploads: 0,
    popup: null as Window | null,
    popupUrl: null as string | null,
    popupOpens: 0,
  }
  ;(window as any).__ezpMock = mock

  // Test files run in parallel as tabs of one browser, all on the dev server's
  // origin — so they would share one `localStorage` and trample each other's
  // session and saved printer. `sessionStorage` has the same API but is scoped
  // to the tab (and, like the real thing, survives a reload), so each page
  // gets it in place of `localStorage`.
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get: () => window.sessionStorage,
  })

  if (options.signedIn) mock.refreshTokens.push(hosts.seededRefresh)
  mock.accessTokens.push(...options.hostTokens)

  // This script runs again on a reload, but a real backend would still know
  // the refresh tokens it handed out: carry them over (tab-scoped, like above).
  const BACKEND_STATE = '__ezpBackend'
  const remembered = sessionStorage.getItem(BACKEND_STATE)
  if (remembered) Object.assign(mock, JSON.parse(remembered))
  const rememberTokens = () =>
    sessionStorage.setItem(
      BACKEND_STATE,
      JSON.stringify({ refreshTokens: mock.refreshTokens, issued: mock.issued }),
    )

  // Seed once per tab: a reload must find what the app persisted, not this.
  if (!sessionStorage.getItem('__ezpSeeded')) {
    sessionStorage.setItem('__ezpSeeded', 'true')
    if (options.signedIn) {
      localStorage.setItem('refreshToken', hosts.seededRefresh)
      localStorage.setItem('isAuthorized', 'true')
    }
    Object.keys(options.storage).forEach((key) => localStorage.setItem(key, options.storage[key]))
  }

  // Read `popup` on every call so a test can lift the block mid-flow.
  window.open = (url?: string | URL) => {
    mock.popupOpens++
    if (mock.options.popup === 'blocked') return null
    mock.popupUrl = String(url)
    if (!mock.popup || mock.popup.closed) {
      const frame = document.createElement('iframe')
      frame.style.display = 'none'
      document.body.appendChild(frame)
      mock.popup = frame.contentWindow
    }
    return mock.popup
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })

  /** Next queued answer; the last one keeps repeating. */
  const next = (queue: MockResponse[]) => (queue.length > 1 ? queue.shift()! : queue[0])

  const issueTokens = () => {
    mock.issued++
    const access = `access-token-${mock.issued}`
    const refresh = `refresh-token-${mock.issued}`
    mock.accessTokens.push(access)
    mock.refreshTokens.push(refresh)
    rememberTokens()
    return json({ access_token: access, refresh_token: refresh, token_type: 'Bearer' })
  }

  const route = (host: string, pathname: string): string => {
    if (host === hosts.blob) return 'BlobUpload'
    if (host === hosts.auth) {
      if (pathname === '/oauth/access_token/') return 'AccessToken'
      if (pathname === '/oauth/revoke/') return 'Revoke'
      if (pathname === '/v1/users/me') return 'UserInfo'
    }
    if (host === hosts.print) {
      const match = pathname.match(/^\/sfapi\/(\w+)\/$/)
      if (match) return match[1]
    }
    return 'Unknown'
  }

  const respond = (name: string, call: any, url: URL): Response => {
    if (name === 'AccessToken') {
      const form = new URLSearchParams(call.body ?? '')
      if (form.get('grant_type') === 'authorization_code') {
        // Like the real endpoint, a code works exactly once.
        if (form.get('code') !== hosts.validCode || mock.codeSpent) {
          return json({ error: 'invalid_grant' }, 400)
        }
        mock.codeSpent = true
        return issueTokens()
      }
      return mock.refreshTokens.includes(form.get('refresh_token'))
        ? issueTokens()
        : json({ error: 'invalid_grant' }, 400)
    }
    if (name === 'Revoke') {
      const token = new URLSearchParams(call.body ?? '').get('token')
      mock.refreshTokens = mock.refreshTokens.filter((value: string) => value !== token)
      rememberTokens()
      return json({})
    }
    if (name === 'BlobUpload') {
      mock.uploads++
      return new Response(null, { status: 201, headers: { ETag: `"etag-${mock.uploads}"` } })
    }

    // Everything below needs a bearer token the fake itself issued.
    const bearer = (call.headers.authorization ?? '').replace(/^Bearer /, '')
    if (!mock.accessTokens.includes(bearer)) {
      return json({ code: 401, message: 'Unauthorized' }, 401)
    }

    const current = mock.options
    switch (name) {
      case 'UserInfo':
        return json(current.user)
      case 'GetConfiguration':
        return json({ System: { FILEEXT: current.fileExtensions } })
      case 'GetPrinter':
        return json(current.printers)
      case 'GetPrinterProperties': {
        const id = url.searchParams.get('id')
        const all = current.printerProperties
        if (id === null) return json(Object.keys(all).map((key) => all[key]))
        return json(all[id] ? [all[id]] : [])
      }
      case 'PrepareUpload': {
        const n = mock.calls.filter((entry: any) => entry.path === call.path).length
        return json({
          fileid: `file-${n}`,
          sasUri: `https://${hosts.blob}/uploads/file-${n}?sig=e2e`,
        })
      }
      case 'Print': {
        const answer = next(current.printResponses)
        return json(answer.body, answer.status ?? 200)
      }
      case 'Status': {
        const answer = next(current.statusResponses)
        return json(answer.body, answer.status ?? 200)
      }
      default:
        return json({ code: 404, message: 'Not found' }, 404)
    }
  }

  const realFetch = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const url = new URL(raw, location.href)

    // The page's own origin (dev server assets) is not ours to fake.
    if (url.origin === location.origin) return realFetch(input, init)

    // `fetch-intercept` (registered by the print options) re-issues every
    // call as `fetch(new Request(...))`, so both call shapes have to be read.
    const request = input instanceof Request ? input : null
    const method = (init.method ?? request?.method ?? 'GET').toUpperCase()
    const signal = init.signal ?? request?.signal

    const headers: Record<string, string> = {}
    new Headers(init.headers ?? request?.headers ?? {}).forEach(
      (value, key) => (headers[key] = value),
    )

    const isText = /json|x-www-form-urlencoded|text/.test(headers['content-type'] ?? '')
    const binary = (bytes: number) => `[binary ${bytes}]`
    let body: string | null = null
    const payload: any = init.body
    if (typeof payload === 'string') {
      body = payload
    } else if (payload instanceof Blob || payload instanceof ArrayBuffer) {
      body = binary(payload instanceof Blob ? payload.size : payload.byteLength)
    } else if (payload && typeof payload.getReader === 'function') {
      // The blob SDK streams uploads to report progress: drain it like a server.
      const reader = payload.getReader()
      let bytes = 0
      for (;;) {
        const chunk = await reader.read()
        if (chunk.done) break
        bytes += chunk.value.byteLength
      }
      body = binary(bytes)
    } else if (request && method !== 'GET' && method !== 'HEAD') {
      const buffer = await request.clone().arrayBuffer()
      body = isText ? new TextDecoder().decode(buffer) : binary(buffer.byteLength)
    }

    const name = route(url.host, url.pathname)
    const call = {
      route: name,
      url: url.href,
      host: url.host,
      path: url.pathname,
      query: url.search,
      method,
      headers,
      body,
      done: false,
    }
    mock.calls.push(call)

    const aborted = () => new DOMException('The user aborted a request.', 'AbortError')

    try {
      // Like the real thing: an aborted request rejects, before or while waiting.
      if (signal?.aborted) throw aborted()
      if (mock.options.delay > 0) {
        await new Promise<void>((resolve, reject) => {
          const onAbort = () => {
            clearTimeout(timer)
            reject(aborted())
          }
          const timer = setTimeout(() => {
            signal?.removeEventListener('abort', onAbort)
            resolve()
          }, mock.options.delay)
          signal?.addEventListener('abort', onAbort, { once: true })
        })
      }
      if (mock.options.failing.includes(name)) throw new TypeError('Failed to fetch')
      const error = mock.options.errors[name]
      if (error) return json(error.body, error.status ?? 500)
      return respond(name, call, url)
    } finally {
      call.done = true
    }
  }
}

/**
 * A host page's `tokenProvider`, run in the page and steered from the test:
 * what it answers can be changed, and answers can be held back.
 */
export interface HostTokenProvider {
  /** What it resolves to: a token, or `null` (nobody signed in); `'reject'` rejects. */
  answer: string | null | 'reject'
  /** Hold every answer back until `releaseProvider` (set it once the page is open). */
  hold?: boolean
  /**
   * Like a caching provider that bypasses its cache when told its token was
   * rejected: asked with `rejected` equal to `answer`, it answers this from
   * then on. Without it, the provider takes no notice of `rejected`.
   */
  afterRejection?: string | null
}

/** Runs inside the browser, before any page script (see `installMockBackend`). */
function installHostProvider(initial: HostTokenProvider) {
  if (window.top !== window) return
  const host: any = Object.assign({}, initial, {
    calls: 0,
    requests: [] as unknown[],
    released: [] as Array<() => void>,
  })
  const answer = () =>
    host.answer === 'reject'
      ? Promise.reject(new Error('signed out'))
      : Promise.resolve(host.answer)
  // Each call is answered with what `answer` is once it is let go.
  host.provider = (request?: { rejected?: string }) => {
    host.calls++
    // What the widget passed, as it was at the time of the call.
    host.requests.push(request === undefined ? undefined : JSON.parse(JSON.stringify(request)))
    if (
      request?.rejected !== undefined &&
      request.rejected === host.answer &&
      host.afterRejection !== undefined
    ) {
      host.answer = host.afterRejection
    }
    if (!host.hold) return answer()
    return new Promise<void>((resolve) => host.released.push(resolve)).then(answer)
  }
  ;(window as any).__ezpHost = host
}

/** Change what the host's provider answers, or whether it holds answers back. */
export async function setProvider(page: E2EPage, patch: Partial<HostTokenProvider>): Promise<void> {
  await page.evaluate((changes) => {
    Object.assign((window as any).__ezpHost, changes)
  }, patch as any)
}

/** Let the provider's held-back answers go. */
export async function releaseProvider(page: E2EPage): Promise<void> {
  await page.evaluate(() => {
    const host = (window as any).__ezpHost
    host.released.splice(0).forEach((resolve: () => void) => resolve())
  })
  await page.waitForChanges()
}

/** How often the widget has asked the host's provider for a token. */
export async function providerCalls(page: E2EPage): Promise<number> {
  return page.evaluate(() => (window as any).__ezpHost.calls as number)
}

/** What the widget passed the provider, call by call (`undefined` for no argument). */
export async function providerRequests(page: E2EPage): Promise<unknown[]> {
  return page
    .evaluate(() =>
      ((window as any).__ezpHost.requests as unknown[]).map((request) =>
        request === undefined ? 'none' : request,
      ),
    )
    .then((requests) => requests.map((request) => (request === 'none' ? undefined : request)))
}

/** Wait until the widget has asked the provider at least `count` times. */
export async function waitForProviderCall(page: E2EPage, count = 1): Promise<void> {
  await page.waitForFunction((n: number) => (window as any).__ezpHost.calls >= n, {}, count)
}

type AttributeValue = string | boolean | undefined

export interface OpenPrintingOptions extends MockBackendOptions {
  /** `<ezp-printing>` attributes; merged over working defaults. `false`/`undefined` drops one. */
  attrs?: Record<string, AttributeValue>
  /** Light-DOM content of `<ezp-printing>` (for `trigger="custom"`). */
  slot?: string
  /** Appended to the page URL before component code runs, e.g. `?code=abc`. */
  search?: string
  /** Makes the page look like it was opened as a popup by another window. */
  opener?: boolean
  /**
   * Gives `<ezp-printing>` a `tokenProvider`, set from script the way a host
   * page would, before the component loads. Its tokens are not known to the
   * backend unless listed in `hostTokens`.
   */
  tokenProvider?: HostTokenProvider
}

function renderAttributes(attrs: Record<string, AttributeValue>): string {
  return Object.keys(attrs)
    .filter((name) => attrs[name] !== false && attrs[name] !== undefined)
    .map((name) => (attrs[name] === true ? name : `${name}="${attrs[name]}"`))
    .join(' ')
}

/**
 * Open a page holding one `<ezp-printing>` wired to the fake backend, and wait
 * for its start-up auth check to settle so a test begins from a known state.
 */
export async function openPrinting(options: OpenPrintingOptions = {}): Promise<E2EPage> {
  const { attrs = {}, slot = '', search, opener, tokenProvider, ...backend } = options
  const page = await newE2EPage()

  await page.evaluateOnNewDocument(
    installMockBackend,
    { ...DEFAULTS, ...backend },
    {
      auth: AUTH_HOST,
      print: PRINT_HOST,
      blob: BLOB_HOST,
      validCode: VALID_CODE,
      seededRefresh: SEEDED_REFRESH_TOKEN,
    },
  )

  if (search || opener) {
    await page.evaluateOnNewDocument(
      (query: string | undefined, fakeOpener: boolean | undefined) => {
        if (window.top !== window) return
        if (query) history.replaceState(null, '', query)
        if (fakeOpener) {
          const messages: unknown[] = []
          ;(window as any).__ezpOpener = { messages, closed: false }
          ;(window as any).opener = {
            postMessage: (data: unknown, target: string) => messages.push({ data, target }),
          }
          window.close = () => {
            ;(window as any).__ezpOpener.closed = true
          }
        }
      },
      search,
      opener,
    )
  }

  if (tokenProvider) await page.evaluateOnNewDocument(installHostProvider, tokenProvider as any)

  const attributes = renderAttributes({
    clientid: CLIENT_ID,
    redirecturi: REDIRECT_URI,
    authapihosturl: AUTH_HOST,
    printapihosturl: PRINT_HOST,
    language: 'en',
    trigger: 'file',
    ...attrs,
  })
  // A classic script runs as soon as it is parsed: before the (module) loader
  // has defined the element, like a host that sets the property right away.
  const providerScript = tokenProvider
    ? `<script>document.querySelector('ezp-printing').tokenProvider = window.__ezpHost.provider</script>`
    : ''
  await page.setContent(`<ezp-printing ${attributes}>${slot}</ezp-printing>${providerScript}`)

  // `checkAuth` runs un-awaited from componentWillLoad; let it finish.
  await waitForCall(page, 'GetConfiguration')
  await page.waitForChanges()
  return page
}

/** Every request the fake backend has seen, optionally narrowed to one route. */
export async function getCalls(page: E2EPage, route?: string): Promise<RecordedCall[]> {
  const calls: RecordedCall[] = await page.evaluate(() => (window as any).__ezpMock.calls)
  return route ? calls.filter((call) => call.route === route) : calls
}

/** Wait until the fake has answered at least `count` requests to `route`. */
export async function waitForCall(page: E2EPage, route: string, count = 1): Promise<void> {
  const deadline = Date.now() + 10000
  for (;;) {
    const calls = await getCalls(page, route)
    if (calls.filter((call) => call.done).length >= count) return
    if (Date.now() > deadline) {
      throw new Error(`Timed out waiting for ${count} "${route}" request(s); saw ${calls.length}`)
    }
    await new Promise((resolve) => setTimeout(resolve, 25))
  }
}

/** Change the fake backend's behaviour mid-test (e.g. queue a failing answer). */
export async function updateBackend(page: E2EPage, patch: MockBackendOptions): Promise<void> {
  await page.evaluate((changes) => {
    Object.assign((window as any).__ezpMock.options, changes)
  }, patch as any)
}

/**
 * Make the backend forget the access tokens it issued, as when one expires
 * mid-session: the next API call is answered 401. Refresh tokens stay valid
 * unless `session: 'ended'`, which drops those too (signed out everywhere).
 */
export async function expireAccessToken(
  page: E2EPage,
  session: 'renewable' | 'ended' = 'renewable',
): Promise<void> {
  await page.evaluate((ended) => {
    const mock = (window as any).__ezpMock
    mock.accessTokens = []
    if (ended) mock.refreshTokens = []
  }, session === 'ended')
}

/** What the page did with `window.open`: how often, and the last URL it asked for. */
export async function getPopup(page: E2EPage): Promise<{ opens: number; url: string | null }> {
  return page.evaluate(() => {
    const mock = (window as any).__ezpMock
    return { opens: mock.popupOpens as number, url: mock.popupUrl as string | null }
  })
}

/** JSON body of a recorded request. */
export function jsonBody(call: RecordedCall): any {
  return JSON.parse(call.body ?? 'null')
}

/** Form-encoded body of a recorded request as a plain object. */
export function formBody(call: RecordedCall): Record<string, string> {
  const result: Record<string, string> = {}
  new URLSearchParams(call.body ?? '').forEach((value, key) => (result[key] = value))
  return result
}

export async function getStorage(page: E2EPage, key: string): Promise<string | null> {
  return page.evaluate((name) => localStorage.getItem(name), key)
}

/**
 * Text a user would read inside the element matched by `selector`, following
 * nested shadow roots (labels render their text in their own shadow tree).
 * `selector` may use puppeteer's `>>>` deep combinator. Null if nothing matches.
 */
export async function textOf(page: E2EPage, selector: string): Promise<string | null> {
  const handle = await page.$(selector)
  if (!handle) return null
  return handle.evaluate((element) => {
    const read = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ''
      if (node.nodeType !== Node.ELEMENT_NODE) return ''
      const el = node as Element
      if (el.tagName === 'STYLE' || el.tagName === 'SCRIPT') return ''
      const children = Array.from((el.shadowRoot ?? el).childNodes)
      return children.map(read).join(' ')
    }
    return read(element).replace(/\s+/g, ' ').trim()
  })
}

/**
 * Wait for a `<tag>` anywhere on the page (through shadow roots) whose
 * `instance` property equals `instance`. Status cards and dialogs identify
 * themselves this way; `instance` is a property, not an attribute, so a CSS
 * selector cannot find them.
 */
export async function waitForInstance(
  page: E2EPage,
  tag: 'ezp-status' | 'ezp-dialog',
  instance: string,
  timeout = 10000,
): Promise<void> {
  await page.waitForFunction(
    (tagName: string, name: string) => {
      const search = (root: ParentNode): boolean =>
        Array.from(root.querySelectorAll('*')).some(
          (el) =>
            (el.tagName.toLowerCase() === tagName && (el as any).instance === name) ||
            (el.shadowRoot !== null && search(el.shadowRoot)),
        )
      return search(document)
    },
    { timeout },
    tag,
    instance,
  )
  await page.waitForChanges()
}

/** `instance` of the status card currently shown by the print options, or null. */
export async function currentStatus(page: E2EPage): Promise<string | null> {
  const handle = await page.$('ezp-printing >>> ezp-printer-selection >>> ezp-status')
  return handle ? handle.evaluate((el: any) => el.instance as string) : null
}

/**
 * Wait for the first element matching `selector` (which may use `>>>`).
 *
 * Polls `page.$$` rather than using `page.waitForSelector`: the latter fails to
 * see through a shadow root that also holds a `<slot>` (`trigger="custom"`),
 * timing out on an element `$$` finds straight away.
 */
export async function waitFor(page: E2EPage, selector: string, timeout = 10000) {
  const deadline = Date.now() + timeout
  for (;;) {
    const [handle] = await page.$$(selector)
    if (handle) return handle
    if (Date.now() > deadline) throw new Error(`Timed out waiting for "${selector}"`)
    await pause(25)
  }
}

/** Click through shadow DOM with a real mouse click. */
export async function click(page: E2EPage, selector: string): Promise<void> {
  const handle = await waitFor(page, selector)

  // Components load lazily. Until one has hydrated it is in the DOM but
  // `visibility: hidden`, so a click aimed at it falls through to whatever is
  // behind and is silently lost — seen on CI, where the chunk for a component
  // used for the first time arrives later than the click.
  const deadline = Date.now() + 10000
  for (;;) {
    const ready = await handle.evaluate((el) => {
      let node: Element | null = el
      while (node) {
        if (node.tagName.includes('-') && !node.classList.contains('hydrated')) return false
        const root = node.getRootNode()
        node = node.parentElement ?? (root instanceof ShadowRoot ? root.host : null)
      }
      return getComputedStyle(el).visibility === 'visible'
    })
    if (ready) break
    if (Date.now() > deadline) throw new Error(`"${selector}" never became clickable`)
    await pause(25)
  }

  // Centre it first: the print options keep a sticky footer over the bottom of
  // their scroll area, where a control counts as "in view" yet cannot be hit.
  await handle.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'center' }))
  await handle.click()
  await page.waitForChanges()
}

let scratchDir: string | undefined

/** Create real files on disk for the native file chooser. Returns their paths. */
export function createFiles(...names: string[]): string[] {
  if (!scratchDir) scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ezp-e2e-'))
  return names.map((name) => {
    const file = path.join(scratchDir!, name)
    fs.writeFileSync(file, `e2e content of ${name}`)
    return file
  })
}

/** Remove the files made by `createFiles` (call from `afterAll`). */
export function removeFiles(): void {
  if (scratchDir) fs.rmSync(scratchDir, { recursive: true, force: true })
  scratchDir = undefined
}

/** Pick files through the upload card's (hidden) native file input. */
export async function chooseFiles(page: E2EPage, ...names: string[]): Promise<void> {
  const upload = await waitFor(page, 'ezp-printing >>> ezp-upload')
  const countRows = () =>
    upload.evaluate((el) => el.shadowRoot!.querySelectorAll('#file-list .file').length)
  const before = await countRows()

  const input = await waitFor(page, 'ezp-printing >>> ezp-upload >>> #input')
  await (input as any).uploadFile(...createFiles(...names))

  // The browser delivers the `input` event on its own schedule: wait for the rows.
  await page.waitForFunction(
    (el: Element, expected: number) =>
      el.shadowRoot!.querySelectorAll('#file-list .file').length === expected,
    {},
    upload,
    before + names.length,
  )
  await page.waitForChanges()
}

/**
 * Finish the OAuth round trip the way the sign-in popup does: a `message`
 * carrying the authorization code, from the popup window, on the redirect
 * origin. `origin` and `fromPopup` let a test forge a message instead.
 */
export async function postAuthCode(
  page: E2EPage,
  { code = VALID_CODE, origin = REDIRECT_ORIGIN, fromPopup = true } = {},
): Promise<void> {
  await page.evaluate(
    (data: string, from: string, popup: boolean) => {
      const source = popup ? (window as any).__ezpMock.popup : window
      window.dispatchEvent(new MessageEvent('message', { data, origin: from, source }))
    },
    code,
    origin,
    fromPopup,
  )
  await page.waitForChanges()
}

const PRINT_OPTIONS = 'ezp-printing >>> ezp-printer-selection'

/** Wait until the print options card has loaded its printers and is usable. */
export async function waitForPrintOptions(page: E2EPage): Promise<void> {
  await waitFor(page, `${PRINT_OPTIONS} >>> #print`)
  await page.waitForChanges()
}

/** Names shown by the file list matched by `selector`, in order. */
export async function fileNames(page: E2EPage, selector: string): Promise<string[]> {
  // `ezp-file-name` renders a name in two halves (so the middle can be
  // clipped); its `name` property is the whole thing.
  return page.$$eval(`${selector} >>> ezp-file-name`, (elements) =>
    elements.map((el: any) => el.name as string),
  )
}

/**
 * From a fresh `trigger="file"` page with a persisted session: pick files and
 * walk through to the loaded print options.
 */
export async function goToPrintOptions(page: E2EPage, ...names: string[]): Promise<void> {
  await chooseFiles(page, ...(names.length > 0 ? names : ['report.pdf']))
  await click(page, 'ezp-printing >>> ezp-upload >>> #continue')
  // Signed in or not, the sign-in dialog confirms before the print options.
  await click(page, 'ezp-printing >>> ezp-auth >>> ezp-dialog >>> #footer ezp-text-button')
  await waitForPrintOptions(page)
}

/**
 * Open a dropdown of the print options and pick the option titled `title`.
 * `select` is a selector inside the card — one of `SELECT`.
 */
export async function pickOption(page: E2EPage, select: string, title: string): Promise<void> {
  const base = `${PRINT_OPTIONS} >>> ${select}`
  // A dropdown is disabled until the picked printer's capabilities are in.
  await page.waitForFunction((el: any) => el.disabled === false, {}, await waitFor(page, base))
  await click(page, `${base} >>> #toggle`)
  await waitFor(page, `${base}.is-expanded`)

  const host = await page.$(base)
  const option = await host!.evaluateHandle((el: Element, wanted: string) => {
    const options = Array.from(el.shadowRoot!.querySelectorAll('.option'))
    return options.find((entry) => (entry.querySelector('.title') as any)?.text === wanted) ?? null
  }, title)
  const element = option.asElement()
  if (!element) throw new Error(`No option titled "${title}" in ${select}`)

  // The list grows open with a CSS transition; click once it has settled.
  await new Promise((resolve) => setTimeout(resolve, 350))
  await element.evaluate((el) => (el as Element).scrollIntoView({ block: 'center' }))
  await (element as any).click()
  // Done once the list has collapsed and its backdrop (which covers the whole
  // card while it fades out) is gone, so the next click lands where intended.
  await page.waitForFunction(
    (el: Element) =>
      !el.classList.contains('is-expanded') &&
      !(el.getRootNode() as ShadowRoot).querySelector('ezp-backdrop'),
    {},
    host!,
  )
  // A long list slides over its neighbours while open and slides back on
  // close: wait until it has stopped moving.
  let previous = ''
  const deadline = Date.now() + 5000
  for (;;) {
    const box = await host!.evaluate((el) => {
      const rect = el.shadowRoot!.querySelector('#wrap')!.getBoundingClientRect()
      return [rect.top, rect.height].join()
    })
    if (box === previous) break
    if (Date.now() > deadline) throw new Error(`"${select}" never stopped moving after a pick`)
    previous = box
    await pause(100)
  }
  await page.waitForChanges()
}

/** Let a timer-driven behaviour (debounce, transition) run its course. */
export function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Selector of the nth `ezp-select` among the print options (see render order). */
export const SELECT = {
  printer: '#printer',
  color: '#options ezp-select:nth-of-type(1)',
  duplex: '#options ezp-select:nth-of-type(2)',
  size: '#options ezp-select:nth-of-type(3)',
  orientation: '#options ezp-select:nth-of-type(4)',
  quality: '#options ezp-select:nth-of-type(5)',
  tray: '#options ezp-select:nth-of-type(6)',
}

/** What a print-options dropdown currently shows (selection or placeholder). */
export async function selectValue(page: E2EPage, select: string): Promise<string | null> {
  return textOf(page, `${PRINT_OPTIONS} >>> ${select} >>> #value`)
}
