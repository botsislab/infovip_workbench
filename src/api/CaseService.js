import axios from 'axios'

export default {

  getCase (caseId) {
    return axios.get('/api/case/' + caseId)
  },

  getCaseLists () {
    return axios.get('/api/case_lists')
  },

  getCaseList (caseListId) {
    return axios.get('/api/case_lists/' + caseListId)
  },

  deleteCaseList (caseListId) {
    return axios.delete('/api/case_lists/' + caseListId)
  },

  getCaseListCases (caseListId, searchQuery) {
    let url = '/api/case_lists/' + caseListId + '/cases'
    if (typeof searchQuery !== 'undefined') url += '?query=' + searchQuery

    return axios.get(url)
  },

  getCaseListFeatures (caseListId, searchQuery) {
    let url = '/api/case_lists/' + caseListId + '/temporal_features'
    if (typeof searchQuery !== 'undefined') url += '?query=' + searchQuery

    return axios.get(url)
  },

  getCaseLabels (caseId) {
    return axios.get('/api/case/' + caseId + '/labels')
  },

  getArticles (query) {
    return axios.get('/api/articles/' + query)
  },

  createCaseList (formData) {
    return axios.post('/api/case_lists',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
  },

  updateCaseList (caseList) {
    return axios.post('/api/case_lists/' + caseList.id, caseList)
  },

  excludeCase (payload) {
    return axios.post('/api/exclude_case', payload)
  },

  includeCase (payload) {
    return axios.post('/api/include_case', payload)
  },

  getAllReports () {
    return axios.get('/api/cases')
  }
}
