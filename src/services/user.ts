import { createStore } from '@stencil/store'
import authStore from './auth'
import { authGetJson } from './http'

/**
 * Shape of the `/v1/users/me` response that the UI actually reads. The API uses
 * snake_case (`display_name`) — the only field consumed today. Indexed so other
 * fields remain accessible without being individually typed.
 */
export interface UserInfo {
  display_name: string
  /** The user's account language (e.g. "en", "de") — used to sync the UI language. */
  preferred_language?: string | null
  [key: string]: unknown
}

export class EzpUserService {
  getUserInfo() {
    return authGetJson<UserInfo>(
      `https://${authStore.state.authApiHostUrl}/v1/users/me`,
      authStore.state.accessToken,
    )
  }
}

const userStore = createStore<{
  user: UserInfo | null
  theme: string
  appearance: string
}>({
  user: null,
  theme: '',
  appearance: '',
})

export default userStore
