<template>
  <div>
    <div class="row">
      <div class="col">
        <div class="row no-gutters case-listing-controls">
          <div class="col">
            <div class="sort-control">
              <div class="input-group">
                <div class="input-group-prepend">
                  <button @click="toggleSort" title="Sort" class="input-group-text btn">
                    <i v-if="sortDirection === 'up'" class="fas fa-sort-alpha-up"></i>
                    <i v-if="sortDirection === 'down'" class="fas fa-sort-alpha-down"></i>
                  </button>
                </div>
                <select v-model="sortField" class="custom-select">
                  <option v-for="(field, fieldName) in sortFields" :key="field" :value="field">{{ fieldName }}</option>
                </select>
              </div>
            </div>
          </div>
          <div class="col">
            <div class="input-group">
              <div class="input-group-prepend">
                <span class="input-group-text group-icon-container">
                  <i class="fas fa-layer-group"></i>
                </span>
              </div>
              <select v-model="groupField" class="custom-select">
                <option v-for="(field, fieldName) in groupFields" :key="field" :value="field">{{ fieldName }}</option>
              </select>
            </div>
          </div>
        </div>
        <div v-if="filteredInfo" class="row filtered-info">
          <div class="col">
            <button
              class="btn btn-sm"
              @click="onClearSearchClick()"
            >
              <font-awesome-icon icon="times" />
            </button>
            {{ filteredInfo }}
          </div>
        </div>
        <div class="row">
          <div class="col">
            <div v-if="grouped" class="case-listing grouped box">
              <div v-for="group in groups" :key="group.name">
                <div class="case-listing-group-header" :class="{ 'expanded': expandedGroup === group.name }" @click="toggleExpandedGroup(group.name)">
                  <span class="group-expansion-control">
                    <i v-if="expandedGroup === group.name" class="fas fa-minus"></i>
                    <i v-if="expandedGroup !== group.name" class="fas fa-plus"></i>
                  </span>
                  <span class="group-name">{{ group.name }} </span>
                  <span class="group-count">({{ group.cases.length }})</span>
                </div>
                <case-listing v-if="expandedGroup === group.name" v-model="group.cases" :excludeEnabled="true"></case-listing>
              </div>
            </div>
            <div v-if="!grouped" class="case-listing box">
              <case-listing v-model="cases" :excludeEnabled="true"></case-listing>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CaseListing from './CaseListing.vue'

export default {

  components: {
    'case-listing': CaseListing
  },

  data () {
    return {
      sortFields: {
        'Sex': 'sex',
        'Age': 'age_in_years',
        'Case ID': 'case_id',
        'Event Date': 'case_event_date',
        'Recv\'d Date': 'initial_fda_received_date'
      },
      groupFields: {
        'None': '',
        'Sex': 'sex',
        'Age in Years': 'age_in_years',
        'Age Group': 'age_group',
        'Outcome': 'all_outcomes',
        'Foreign vs US': 'foreign_vs_us',
        'Country (derived)': 'country_derived',
        'Report Source': 'report_source',
        'Report Type': 'report_type',
        'MFR Ctrl #': 'manufacturer_control_number',
        'Sender Org': 'sender_mfr_organization',
        'Classification Score': 'class_overall'
        // 'Has Causal Term': 'class_causal_term',
        // 'Mentions Drug Induced': 'class_drug_induced',
        // 'Narrative Length': 'class_narrative_length',
        // 'Onset Within 30 Days': 'class_reasonable_timeframe',
        // 'Had Symptoms Prior': 'class_symptoms_before'
        // 'All PTs': 'all_pts'
      },
      sortField: 'case_id',
      groupField: '',
      sortDirection: 'up',
      expandedGroup: ''
    }
  },

  computed: {

    allCases () {
      return this.$store.state.filteredCases
    },

    caseListFilter () {
      return this.$store.state.caseListFilter
    },

    filteredInfo () {
      return this.$store.getters.filteredInfo
    },

    cases () {
      // Sort as needed
      let cases = this.allCases.slice()
      cases.sort((caseObjectA, caseObjectB) => {
        let a = caseObjectA[this.sortField]
        let b = caseObjectB[this.sortField]

        if (this.sortField === 'age_in_years') {
          if (a === null || a === '') a = -1
          if (b === null || b === '') b = -1
        } else if (this.sortField === 'case_id') {
          a = parseInt(a) || ''
          b = parseInt(b) || ''
        } else {
          if (a === null) a = ''
          if (b === null) b = ''
        }

        if (this.sortDirection === 'up') {
          return b < a ? 1 : -1
        } else {
          return a < b ? 1 : -1
        }
      })
      return cases
    },

    groups () {
      if (!this.grouped) return []
      let groupMap = {}
      this.cases.forEach(caseObject => {
        let values = []

        // Use multiple groups if grouped field has multiple values
        if (this.groupField === 'all_outcomes' && caseObject[this.groupField] !== null) {
          values = caseObject[this.groupField].split(',')
        } else if (this.groupField === 'report_source' && caseObject[this.groupField] !== null) {
          values = caseObject[this.groupField].replace(/^\s+|\s+$/g, '').split(',').map(value => value.replace(/^\s+|\s+$/g, ''))
        } else if (this.groupField === 'all_pts') {
          values = caseObject[this.groupField].split(/:|;/g)
        } else if (this.groupField === 'foreign_vs_us') {
          let country = caseObject['country_derived']
          if (country === 'USA') {
            values = ['USA']
          } else if (country === '' || country === 'NULL' || country === null) {
            values = ['Unknown']
          } else {
            values = ['Foreign']
          }
        } else if (this.groupField === 'age_group') {
          let age = caseObject['age_in_years']
          if (age === '' || age === 'NULL' || age === null) {
            values = ['Unknown']
          } else if (age < (1 / 12)) {
            values = ['Neonates']
          } else if (age <= 2) {
            values = ['Infants']
          } else if (age < 12) {
            values = ['Children']
          } else if (age < 17) {
            values = ['Adolescents']
          } else if (age < 65) {
            values = ['Adults']
          } else if (age >= 65) {
            values = ['Elderly']
          }
        } else {
          values.push(caseObject[this.groupField])
        }

        values.forEach(value => {
          let groupName = value === null || value === '' || value === 'NULL' ? ' ' : value
          if (typeof groupName === 'string' &&
            this.groupField !== 'all_outcomes' &&
            this.groupField !== 'report_source' &&
            this.groupField !== 'country_derived' &&
            this.groupField !== 'foreign_vs_us') {
            groupName = this.camelize(groupName)
          }
          if (!(groupName in groupMap)) groupMap[groupName] = { name: groupName, cases: [] }
          groupMap[groupName].cases.push(caseObject)
        })
      })

      let groups = Object.values(groupMap)
      groups.sort((groupA, groupB) => {
        let a = groupA.name
        let b = groupB.name
        if (a === null) a = ''
        if (b === null) b = ''
        return b < a ? 1 : -1
      })

      return groups
    },

    grouped () {
      return this.groupField !== ''
    }
  },

  watch: {

    expandedGroup () {
      if (this.expandedGroup !== '') {
        let expandedGroup = this.groups.find(group => group.name === this.expandedGroup)
        this.$store.commit('setUserSelectedCases', expandedGroup.cases)
      } else {
        this.$store.commit('unsetUserSelectedCases')
      }
    },

    allCases () {
      // When the underlying set of cases changes, unexpand groups
      this.expandedGroup = ''
    },

    groupField () {
      if (this.groupField === '') {
        this.$store.commit('unsetUserSelectedCases')
      }
    }
  },

  methods: {

    toggleSort () {
      if (this.sortDirection === 'up') {
        this.sortDirection = 'down'
      } else if (this.sortDirection === 'down') {
        this.sortDirection = 'up'
      }
    },

    toggleExpandedGroup (groupName) {
      this.expandedGroup = this.expandedGroup !== groupName ? groupName : ''
    },

    camelize (str) {
      let words = str.split(' ')
      words = words.map(function (word) {
        return word.charAt(0).toUpperCase() + word.toLowerCase().substr(1)
      })
      return words.join(' ')
    },

    onClearSearchClick () {
      this.$store.commit('resetFilter')
      this.$store.dispatch('populateCaseList')
    }
  },

  created () {
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
.filtered-info {
  font-weight: bold;
}

.case-listing {
  min-height: 495px;
  /* height: 80vh; */
  /* height: 100px; */
  max-height: 555px;
  padding: 0px;
  margin-top: 5px;
}

.case-listing-controls {
  padding-bottom: 5px;
}

.sort-control {
  margin-right: 10px;
}

.group-icon-container.input-group-text {
  width: 37px;
  padding-left: 10px;
  padding-right: 10px;
}

.group-name {
  font-weight: 300;
  font-size: 1.3em;
  vertical-align: middle;
}

.group-count {
  float: right;
  margin-top: 5px;
}

.group-expansion-control {
  display: inline-block;
  margin: 5px;
  margin-right: 10px;
}

.case-listing-group-header {
  cursor: pointer;
  padding-left: 5px;
  padding-right: 5px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.case-listing-group-header:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.case-listing-group-header.expanded {
  background-color: rgba(0, 0, 0, 0.1);
}
</style>
