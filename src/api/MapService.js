import axios from 'axios'

// import axios from 'axios'

export default {

  getMapData () {
    return axios.get('/api/map_data')
  },

  getWorldMapData () {
    return axios.get('/api/world_map_data')
  }
}
