import axios from 'axios'

// import axios from 'axios'

export default {

  login (credentials) {
    return axios.post('/api/login', credentials)
  },

  logout () {
    return axios.post('/api/logout')
  }
}
