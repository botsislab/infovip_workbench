import axios from 'axios'

export default {

  getFeatureCountsCausalityData () {
    return axios.get('/api/ether_features_and_causality')
  }
}
