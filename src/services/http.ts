import authStore, { EzpAuthorizationService } from './auth'

/** Authorization header for a Bearer-token request. */
export function bearer(accessToken: string): Record<string, string> {
  return { Authorization: 'Bearer ' + accessToken }
}

/**
 * Single-flight access-token refresh. Concurrent callers share one in-flight
 * refresh so a burst of 401s never triggers a storm of token requests. Resolves
 * to the new access token, or null if a refresh isn't possible.
 */
let refreshing: Promise<void> | null = null

export async function refreshAccessToken(): Promise<string | null> {
  if (!authStore.state.refreshToken || !authStore.state.clientID) {
    return null
  }
  if (!refreshing) {
    const auth = new EzpAuthorizationService(authStore.state.redirectUri, authStore.state.clientID)
    refreshing = Promise.resolve(auth.refreshTokens()).finally(() => {
      refreshing = null
    })
  }
  await refreshing
  return authStore.state.accessToken || null
}

/**
 * GET a URL with a Bearer token and parse the JSON body. On a 401 the token is
 * refreshed once and the request retried with the fresh token, so a request
 * landing on an expired token self-heals instead of failing the user.
 */
export async function authGetJson<T = any>(url: string, accessToken: string): Promise<T> {
  let res = await fetch(url, { method: 'GET', headers: bearer(accessToken) })

  if (res.status === 401) {
    const freshToken = await refreshAccessToken()
    if (freshToken) {
      res = await fetch(url, { method: 'GET', headers: bearer(freshToken) })
    }
  }

  return res.json()
}
