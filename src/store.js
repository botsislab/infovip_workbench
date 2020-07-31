import Vue from 'vue'
import Vuex from 'vuex'
import CaseService from './api/CaseService'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    statusMessage: {
      text: '',
      level: '',
      active: false
    },
    justCreatedCaseListId: 0,
    caseLists: [],
    caseListsLoaded: false,
    caseListId: 0,
    cases: [],
    caseListLoaded: false,
    filteredCases: [],
    caseSeriesTemporalFeatures: [],
    filteredCaseSeriesTemporalFeatures: [],
    hoveredFeatures: [],
    clickedFeatures: [],
    excludedCases: [],
    caseListFilter: '',
    fakeCaseListFilter: '',
    isCaseListFilterFake: false,
    minimumAllowedDate: new Date(1900, 0, 1),
    maximumAllowedDate: new Date(),
    userSelectedCases: [],
    userSelectedCasesTemporalFeatures: [],
    articles: [],
    articleQuery: null,
    caseListArticlesLoaded: false,
    currentCaseListId: null,
    articleCache: {},
    relatedPTs: {},
    showAnnotations: false,
    reportLoading: '',
    classificationColorMap: {
      'high': 'rgb(68, 119, 170)',
      'medium': 'rgb(221, 204, 119)',
      'low': 'rgb(204, 102, 119)',
      'unassessable': 'rgb(115, 115, 115)'
    }
  },
  mutations: {
    setSuccess (state, message) {
      state.statusMessage.level = 'success'
      state.statusMessage.text = message
      state.statusMessage.active = true
      setTimeout(() => { state.statusMessage.active = false }, 3000)
    },

    setError (state, payload) {
      state.statusMessage.level = 'error'

      if (typeof payload === 'string') {
        state.statusMessage.text = payload
      } else if ('message' in payload && !('response' in payload)) {
        // Manual error message
        state.statusMessage.text = payload.message
      } else {
        // Probably from service
        if (typeof payload.response.data === 'object' && 'message' in payload.response.data) {
          // Custom message from service
          // console.log('custom message from service')
          state.statusMessage.text = payload.response.data.message
        } else if (typeof payload.response.data === 'string') {
          // Unexpected HTTP error
          // console.log('unexpected http error')
          state.statusMessage.text = 'Received error from server: ' + payload.response.statusText
        }
      }
      state.statusMessage.active = true
      setTimeout(() => { state.statusMessage.active = false }, 3000)
    },

    setCaseListSelected (state, caseListId) {
      state.caseListId = caseListId
    },

    resetCaseListSelected (state) {
      state.caseListId = 0
    },

    setCaseLists (state, caseLists) {
      state.caseLists = caseLists
    },

    setCaseListsLoaded (state) {
      state.caseListsLoaded = true
    },

    resetCaseListsLoaded (state) {
      state.caseListsLoaded = false
    },

    setCurrentCaseListId (state, currentCaseListId) {
      state.currentCaseListId = parseInt(currentCaseListId)
    },

    setCaseListLoaded (state) {
      state.caseListLoaded = true
    },

    resetCaseListLoaded (state) {
      state.caseListLoaded = false
    },

    setCases (state, cases) {
      let included = cases.filter(caseObject => caseObject['exclusion_category'] === 'none')
      let excluded = cases.filter(caseObject => caseObject['exclusion_category'] !== 'none')
      state.cases = included
      state.filteredCases = included
      state.userSelectedCases = included
      state.excludedCases = excluded
      state.excludedCasesIds = excluded.map(caseObject => caseObject.case_id)
    },

    setFilteredCases (state, cases) {
      let included = cases.filter(caseObject => caseObject['exclusion_category'] === 'none')
      state.filteredCases = included
      state.userSelectedCases = included
      // Update temporal features in case this is a client-side subset
      if (state.filteredCaseSeriesTemporalFeatures.length > 0) {
        let filteredCaseIds = cases.map(caseObject => caseObject.case_id)
        let filteredFeatures = state.filteredCaseSeriesTemporalFeatures.filter(feature => {
          return filteredCaseIds.indexOf(feature.case_id) !== -1
        })
        state.caseSeriesTemporalFeatures = filteredFeatures
        state.filteredCaseSeriesTemporalFeatures = filteredFeatures
        state.userSelectedCasesTemporalFeatures = filteredFeatures
      }
    },

    setCaseSeriesTemporalFeatures (state, features) {
      let included = features.filter(feature => state.excludedCasesIds.indexOf(feature['case_id']) === -1)
      state.caseSeriesTemporalFeatures = included
      state.filteredCaseSeriesTemporalFeatures = included
      state.userSelectedCasesTemporalFeatures = included
    },

    setFilteredCaseSeriesTemporalFeatures (state, features) {
      let included = features.filter(feature => state.excludedCasesIds.indexOf(feature['case_id']) === -1)
      state.filteredCaseSeriesTemporalFeatures = included
      state.userSelectedCasesTemporalFeatures = included
    },

    setCaseListFilter (state, filter) {
      state.caseListFilter = filter
      state.isCaseListFilterFake = false
    },

    setFakeCaseListFilter (state, filter) {
      state.fakeCaseListFilter = filter
      state.isCaseListFilterFake = true
    },

    resetFilter (state) {
      state.caseListFilter = ''
      state.isCaseListFilterFake = false
      state.filteredCases = state.cases
      state.userSelectedCases = state.cases
      state.filteredCaseSeriesTemporalFeatures = state.caseSeriesTemporalFeatures
      state.userSelectedCasesTemporalFeatures = state.caseSeriesTemporalFeatures
    },

    setUserSelectedCases (state, cases) {
      state.userSelectedCases = cases
      let caseIds = cases.map(caseObject => caseObject.case_id)
      let userSelectedFeatures = state.filteredCaseSeriesTemporalFeatures.filter(feature => {
        return caseIds.indexOf(feature['case_id']) !== -1
      })
      state.userSelectedCasesTemporalFeatures = userSelectedFeatures
    },

    unsetUserSelectedCases (state) {
      state.userSelectedCases = state.filteredCases
      state.userSelectedCasesTemporalFeatures = state.filteredCaseSeriesTemporalFeatures
    },

    setHoveredFeatures (state, features) {
      state.hoveredFeatures = features
    },

    setHoveredFeature (state, feature) {
      state.hoveredFeatures.push(feature)
    },

    setTimelineClicked (state) {
      state.clickedFeatures = state.hoveredFeatures
    },

    unsetHoveredFeatures (state) {
      if (state.hoveredFeatures.length !== 0) state.hoveredFeatures = []
    },

    setClickedFeatures (state, features) {
      state.clickedFeatures = features
    },

    unsetClickedFeatures (state) {
      state.clickedFeatures = []
    },

    justCreatedCaseList (state, caseListId) {
      state.justCreatedCaseListId = caseListId
      setTimeout(() => {
        state.justCreatedCaseListId = 0
      }, 2000)
    },

    setArticles (state, { query, articles }) {
      state.articleCache[query] = articles
      state.articles = articles
      state.caseListArticlesLoaded = true
    },

    setArticleQuery (state, query) {
      state.articleQuery = query
    },

    resetCaseListArticles (state) {
      state.articles = []
      state.caseListArticlesLoaded = true
    },

    addRelatedPTs (state, relatedPTs) {
      for (let key in relatedPTs) {
        Vue.set(state.relatedPTs, key, relatedPTs[key])
      }
    },

    setShowAnnotations (state, showAnnotations) {
      state.showAnnotations = showAnnotations
    },

    setReportLoading (state, reportLoading) {
      state.reportLoading = reportLoading
    }
  },
  getters: {
    currentCaseList (state) {
      return state.caseLists.find(caseList => caseList.id === state.currentCaseListId)
    },

    selectionCriteria (state, getters) {
      return getters.currentCaseList ? getters.currentCaseList['selection_criteria'] : {}
    },

    selectionCriteriaPTs (state, getters) {
      let pts = []
      if (getters.selectionCriteria && 'Event PT:' in getters.selectionCriteria) {
        pts.push(...getters.selectionCriteria['Event PT:'].split(';').map(pt => pt.toLowerCase()))
      }
      return pts
    },

    allRelatedSelectionCriteriaPTs (state, getters) {
      let allRelated = new Set()
      getters.selectionCriteriaPTs.forEach(pt => {
        for (let key in state.relatedPTs) {
          if (state.relatedPTs[key].indexOf(pt) !== -1) {
            state.relatedPTs[key].forEach(relatedPT => {
              allRelated.add(relatedPT)
            })
          }
        }
      })
      return [...allRelated]
    },

    filteredInfo (state, getters) {
      let filteredInfo = ''

      if (state.filteredCases.length !== state.cases.length) {
        filteredInfo += state.filteredCases.length + ' reports match "' + getters.caseListFilter + '"'
      }

      return filteredInfo
    },

    caseListFilter (state, getters) {
      return state.isCaseListFilterFake ? state.fakeCaseListFilter : state.caseListFilter
    }
  },
  actions: {
    populateCaseLists ({ commit, state }) {
      commit('resetCaseListsLoaded')
      // Load group of reports
      CaseService.getCaseLists()
        .then(function (response) {
          commit('setCaseLists', response.data.reverse())
          commit('setCaseListsLoaded')
        })
        .catch(function (error) {
          commit('setError', error)
        })
    },

    populateCaseList ({ commit, state }, caseListId) {
      if (caseListId) {
        commit('setCaseListSelected', caseListId)
      } else {
        caseListId = state.currentCaseListId
      }
      commit('resetCaseListLoaded')
      // Get list of cases and store them
      let query = state.isCaseListFilterFake ? '' : state.caseListFilter
      CaseService.getCaseListCases(caseListId, query)
        .then(response => {
          // Do any client-side processing
          // TODO Add draft completeness score
          // let cases = response.data.map(caseObject => {
          //   return caseObject
          // })
          let cases = response.data

          // If we're filtering an existing set of cases, only set filtered cases
          if (state.caseListFilter && state.cases.length > 0) {
            commit('setFilteredCases', cases)
          } else {
            commit('setCases', cases)
          }
          commit('setCaseListLoaded')

          // Update features as well
          this.dispatch('populateCaseSeriesTemporalFeatures', caseListId)
        })
        .catch(error => {
          commit('setError', error)
        })
    },

    populateCaseSeriesTemporalFeatures ({ commit, state }, caseListId) {
      let query = state.isCaseListFilterFake ? '' : state.caseListFilter
      CaseService.getCaseListFeatures(caseListId, query)
        .then(response => {
          // Do any client-side processing
          // let features = response.data.map(caseObject => {
          //   return caseObject
          // })
          let features = response.data

          // If we're filtering an existing set of cases, only set filtered cases
          if (state.caseListFilter && state.cases.length > 0) {
            commit('setFilteredCaseSeriesTemporalFeatures', features)
          } else {
            commit('setCaseSeriesTemporalFeatures', features)
          }
        })
        .catch(error => {
          commit('setError', error)
        })
    },

    excludeCase (store, payload) {
      // Update case list case on server and repopulate
      // TODO Update state locally instead of reloading from service if this seems slow
      CaseService.excludeCase(payload)
        .then(() => {
          store.dispatch('populateCaseList', payload.case_list_id)
        })
        .catch(error => {
          store.commit('setError', error)
        })
    },

    includeCase (store, payload) {
      // Update case list case on server and repopulate
      // TODO Update state locally instead of reloading from service if this seems slow
      CaseService.includeCase(payload)
        .then(() => {
          store.dispatch('populateCaseList', payload.case_list_id)
        })
        .catch(error => {
          store.commit('setError', error)
        })
    },

    populateCaseListArticles ({ commit, state }, query) {
      state.caseListArticlesLoaded = false
      if (query) {
        commit('setArticleQuery', query)
        if (query in state.articleCache) {
          commit('setArticles', { query, articles: state.articleCache[query] })
        } else {
          CaseService.getArticles(query)
            .then(response => {
              commit('setArticles', { query, articles: response.data })
            })
            .catch(error => {
              commit('setError', error)
              commit('resetCaseListArticles')
            })
        }
      } else {
        commit('resetCaseListArticles')
      }
    }
  }
})
