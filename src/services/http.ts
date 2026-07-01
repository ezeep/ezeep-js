/** Authorization header for a Bearer-token request. */
export function bearer(accessToken: string): Record<string, string> {
  return { Authorization: 'Bearer ' + accessToken }
}

/** GET a URL with a Bearer token and parse the JSON body. */
export function authGetJson<T = any>(url: string, accessToken: string): Promise<T> {
  return fetch(url, {
    method: 'GET',
    headers: bearer(accessToken),
  }).then((response) => response.json())
}
