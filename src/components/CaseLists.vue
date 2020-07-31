<template>
  <div>
    <h2>Case Series</h2>
    <div class="heading" v-if="loaded && caseLists.length === 0">No Case Series have been imported yet</div>
    <div class="container-fluid">
      <div
        v-for="caseList in caseLists"
        :key="caseList.id"
        class="row case-list-item"
      >
        <div class="col">
          <router-link
            :to="'/case_list_explorer/' + caseList.id"
            class="case-series-item"
            :class="{ 'just-created': isJustCreated(caseList.id) }"
          >
            <div class="card case-list-container">
              <div class="case-list-heading">
                <button @click.prevent="deleteCaseList(caseList.id)" title="Delete case list" class="btn btn-sm delete-case-list">
                  <i class="fas fa-trash"></i>
                </button>
                <button v-if="caseListNameEditing === null" @click.prevent="caseListNameEditing = caseList.id" title="Rename case list" class="btn btn-sm rename-case-list">
                  <i class="fas fa-pencil-alt"></i>
                </button>
                <div v-if="caseList.name || caseListNameEditing === caseList.id">
                  <span v-if="caseListNameEditing === caseList.id">
                    <input class="form-control rename-input" @keyup.enter="renameCaseList(caseList, $event.target.value)" @click.prevent="" type="text" :value="caseList.name">
                  </span>
                  <span class="case-list-name" v-else>{{ caseList.name }}</span>
                  <button v-if="caseListNameEditing !== null" @click.prevent="caseListNameEditing = null" title="Cancel renaming case list" class="btn btn-sm cancel-rename-case-list">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <span class="number-of-cases">{{ caseList.number_of_cases }} Reports</span>
                <span :title="new Date(caseList.created_at).toLocaleString()">
                  (uploaded {{ getRelativeCreatedDate(caseList) }})
                </span>
              </div>
              <div v-if="productCriteria(caseList).length > 0">
                <span class="section-heading">Product Selection Criteria</span>
                <div class="selection-criteria" v-for="(criteriaPair, index) in productCriteria(caseList)" :key="'product-' + index">
                  <span class="criteria-key">
                    {{ criteriaPair['criteriaKey'] }}:
                  </span>
                  <span class="criteria-value">
                    {{ criteriaPair['criteriaValue'] }}
                  </span>
                </div>
              </div>
              <div v-else>
                <div class="section-heading">Product Selection Criteria</div>
                <span class="criteria-value">None</span>
              </div>
              <div v-if="eventCriteria(caseList).length > 0">
                <span class="section-heading">Event Selection Criteria</span>
                <div class="selection-criteria" v-for="(criteriaPair, index) in eventCriteria(caseList)" :key="'event-' + index">
                  <span class="criteria-key">
                    {{ criteriaPair['criteriaKey'] }}:
                  </span>
                  <span class="criteria-value">
                    {{ criteriaPair['criteriaValue'] }}
                  </span>
                </div>
              </div>
              <div v-else>
                <div class="section-heading">Event Selection Criteria</div>
                <span class="criteria-value">None</span>
              </div>
              <div v-if="otherSelectionCriteria(caseList).length > 0">
                <div class="section-heading">All Other Selection Criteria</div>
                <div class="selection-criteria" v-for="(criteriaPair, index) in otherSelectionCriteria(caseList)" :key="'event-' + index">
                  <span class="criteria-key">
                    {{ criteriaPair['criteriaKey'] }}:
                  </span>
                  <span class="criteria-value">
                    {{ criteriaPair['criteriaValue'] }}
                  </span>
                </div>
              </div>
              <div v-else>
                <div class="section-heading">All Other Selection Criteria</div>
                <span class="criteria-value">None</span>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CaseService from '../api/CaseService'
import util from '@/util/util'
import moment from 'moment'

export default {
  name: 'case_lists',

  data () {
    return {
      caseListNameEditing: null
    }
  },

  computed: {
    caseLists () {
      return this.$store.state.caseLists
    },

    loaded () {
      return this.$store.state.caseListsLoaded
    }
  },

  beforeRouteUpdate (to, from, next) {
    if (to.path === from.path) {
      this.reloadCaseLists()
    }
  },

  methods: {

    isJustCreated (caseListId) {
      return this.$store.state.justCreatedCaseListId === caseListId
    },

    getRelativeCreatedDate (caseList) {
      return moment(caseList.created_at).calendar()
    },

    productCriteria (caseList) {
      return this.selectionCriteria(caseList, 'Product')
    },

    eventCriteria (caseList) {
      return this.selectionCriteria(caseList, 'Event')
    },

    selectionCriteria (caseList, sectionName) {
      let selectionCriteria = caseList['selection_criteria']

      // Filter keys by section name
      let sectionCriteriaKeys = Object.keys(selectionCriteria).filter(criteria => {
        return criteria.startsWith(sectionName)
      })

      // Get values for section as well (in title case)
      let sectionCriteriaValues = sectionCriteriaKeys.map(criteria => {
        return util.toTitleCase(selectionCriteria[criteria].replace(/;/g, ', '))
      })

      // Clean up messy delimiters in keys
      // let regex = new RegExp(sectionName, 'g')
      sectionCriteriaKeys = sectionCriteriaKeys.map(criteria => {
        return criteria.replace(sectionName, '').replace(/-|:/g, '').replace(/^\s+|\s+$/g, '')
      })

      // Create sets of criteria key:value pairs separated by a space
      let criteriaParts = []

      sectionCriteriaKeys.forEach((criteria, index) => {
        criteriaParts.push({
          'criteriaKey': criteria,
          'criteriaValue': sectionCriteriaValues[index]
        })
      })

      return criteriaParts
    },

    // Other than product or event
    otherSelectionCriteria (caseList) {
      let selectionCriteria = caseList['selection_criteria']

      // Filter keys by section name
      let sectionCriteriaKeys = Object.keys(selectionCriteria).filter(criteria => {
        return !criteria.startsWith('Product') && !criteria.startsWith('Event')
      })

      // Get values for section as well (in title case)
      let sectionCriteriaValues = sectionCriteriaKeys.map(criteria => {
        if (typeof selectionCriteria[criteria] === 'string') {
          return util.toTitleCase(selectionCriteria[criteria].replace(/;/g, ', '))
        } else {
          return selectionCriteria[criteria]
        }
      })

      // Create sets of criteria key:value pairs separated by a space
      let criteriaParts = []

      sectionCriteriaKeys.forEach((criteria, index) => {
        criteriaParts.push({
          'criteriaKey': criteria,
          'criteriaValue': sectionCriteriaValues[index]
        })
      })

      return criteriaParts
    },

    allCriteria (caseList) {
      let selectionCriteria = caseList['selection_criteria']
      let criteriaParts = Object.values(selectionCriteria)

      if (criteriaParts.length === 0) return 'No Selection Criteria'

      return util.toTitleCase(criteriaParts.join(', ').replace(/;|:/g, ', '))
    },

    reloadCaseLists () {
      this.$store.dispatch('populateCaseLists')
    },

    deleteCaseList (caseListId) {
      CaseService.deleteCaseList(caseListId)
        .then(response => {
          this.$store.commit('setSuccess', 'Successfully deleted case list')
          this.reloadCaseLists()
        })
        .catch(error => {
          this.$store.commit('setError', error)
        })
    },

    renameCaseList (caseList, name) {
      let updateObject = Object.assign({}, caseList)
      updateObject.name = name
      CaseService.updateCaseList(updateObject)
        .then(response => {
          this.caseListNameEditing = null
          caseList.name = name
        })
        .catch(error => {
          this.$store.commit('setError', error)
          this.caseListNameEditing = null
        })
    }
  },

  created () {
    this.$store.commit('resetCaseListSelected')
    this.reloadCaseLists()
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
a.case-series-item {
  text-decoration: none;
  color: inherit;
}

.case-list-container .heading {
  padding: 0px;
}

.case-list-item {
  padding-bottom: 20px;
}

.just-created .case-list-container {
  box-shadow: 0 8px 16px 0 rgba(0,0,0,0.5);
  background-color: #f4f4f4;
  transition: 0.3s;
}

.case-list-heading {
  font-weight: 300;
  font-size: 1.4em;
  margin-bottom: 5px;
}

.number-of-cases {
  font-weight: 500;
}

.section-heading, .criteria-key {
  font-weight: bold;
}

.section-heading {
  color: #084594;
}

.criteria-key {
  color: #4292c6;
}

button.delete-case-list {
  float: right;
  color: lightgrey;
}

button.delete-case-list:hover {
  color: gray;
}

button.rename-case-list:hover {
  color: gray;
}

button.rename-case-list {
  float: right;
  color: lightgrey;
}

input.rename-input {
  display: inline-block;
  width: inherit;
}

.case-list-name {
  font-size: 1.2em;
  font-weight: bold;
  line-height: 1em;
}
</style>
