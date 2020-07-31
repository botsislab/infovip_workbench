import axios from 'axios'

export default {

  getReportData () {
    return axios.get('/api/report_data')
  }
}
