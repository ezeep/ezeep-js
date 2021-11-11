import { createStore } from '@stencil/store'
import authStore from './auth'

export class EzpUserService {
  getUserInfo() {
    return fetch(`https://${authStore.state.authApiHostUrl}/v1/users/me`, {
      headers: {
        Authorization: 'Bearer ' + authStore.state.accessToken,
        'Content-Type': 'application/json',
      },
      method: 'GET',
    }).then((response) => {
      return response.json()
    })
  }
}

const userStore = createStore({
  user: null,
  theme: '',
})

export default userStore
