import { createStore } from '@stencil/store'
import authStore from './auth'
import { authGetJson } from './http'

export class EzpUserService {
  getUserInfo() {
    return authGetJson(
      `https://${authStore.state.authApiHostUrl}/v1/users/me`,
      authStore.state.accessToken
    )
  }
}

const userStore = createStore({
  user: null,
  theme: '',
  appearance: '',
})

export default userStore
