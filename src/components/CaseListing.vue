<template>
  <div>
    <div v-if="value">
      <div
        v-for="caseObject in value"
        :key="caseObject.case_id"
        class="case-listing-item row no-gutters"
        :class="{ selected: isSelected(caseObject.case_id) }"
      >
        <div class="col" @click="onCaseListingItemClick(caseObject.case_id)">
          <div v-if="isReportLoading(caseObject.case_id)" class="report-loading-mask">
            <div class="loading-icon">
              <div class="spinner-border" role="status">
                <span class="sr-only">Loading...</span>
              </div>
            </div>
          </div>
          <div style="float: right">
            <span class="case-event-date duller"> {{ caseObject.case_event_date }}</span>
            <span class="case-number light-blue">
              {{ caseObject.faers_case_number }}
            </span>
            <span class="version light-blue"> (v{{ parseInt(caseObject.version_number) }})</span>
            <button
              v-if="excludeEnabled"
              class="btn btn-sm exclude-button"
              @click="onExcludeClick(caseObject.case_id, $event)"
              title="Exclude Report"
            >
              <font-awesome-icon icon="times" />
            </button>
            <!--
              <b-dropdown @click="onDropdownClick" class="exclude-dropdown" text="..." variant="link" no-caret>
              <b-dropdown-header>Exclude as...</b-dropdown-header>
              <b-dropdown-item
                v-for="(label, category) in exclusionCategories"
                :key="category"
                @click="onExcludeClick(caseObject.case_id, category, $event)"
              >
                {{ label }}
              </b-dropdown-item>
            </b-dropdown>
            -->
          </div>
          <span class="classification-indicator">
            <svg height="1em" width="1em">
              <rect :fill="classificationColorMap[caseObject.class_overall.toLowerCase()]" />
            </svg>
          </span>
          <span class="sex dark-blue">{{ isCleanDatum(caseObject.sex) ? caseObject.sex[0] : '' }}</span>
          <span class="age light-blue">{{ isCleanDatum(caseObject.age_in_years) ? Math.round(caseObject.age_in_years) : '' }}</span>
          <span class="outcomes"> {{ caseObject.all_outcomes }}</span>
          <div  class="long-text dull" :title="caseObject.all_pts">{{ caseObject.all_pts ? caseObject.all_pts.replace(/:|;/g, ', ').toLowerCase() : 'No PTs' }}</div>
        </div>
        <slot v-bind:case-object="caseObject"></slot>
      </div>
    </div>
  </div>
</template>

<script>

export default {

  props: ['value', 'excludeEnabled'],

  computed: {
    reportLoading () {
      return this.$store.state.reportLoading
    },

    classificationColorMap () {
      return this.$store.state.classificationColorMap
    }
  },

  data () {
    return {
      exclusionCategories: {
        'duplicate': 'Duplicate',
        'other': 'Other'
      }
    }
  },

  methods: {

    isSelected (caseId) {
      return this.$route.params.case_id === caseId
    },

    isCleanDatum (datum) {
      if (typeof datum === 'number') return true
      return datum && datum.toLowerCase() !== 'null'
    },

    onDropdownClick (event) {
      // Needed because bootstrap-vue doesn't stop propagation of clicks on dropdown headers
      event.stopPropagation()
    },

    onCaseListingItemClick (caseId) {
      if (!this.isSelected(caseId)) {
        this.$store.commit('setReportLoading', caseId)
      }

      if (this.$router.currentRoute.path === '/reports') {
        this.$router.push('reports/' + caseId)
      } else {
        this.$router.push('/case_list_explorer/' + this.$route.params.case_list_id + '/case/' + caseId)
      }
    },

    onExcludeClick (caseId, event) {
      event.stopPropagation()
      this.$store.dispatch('excludeCase', {
        'case_list_id': this.$route.params.case_list_id,
        'case_id': caseId,
        'exclusion_category': 'other'
      })
    },

    isReportLoading (caseId) {
      return this.reportLoading === caseId
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
.case-listing-item {
  display: block;
  cursor: pointer;
  padding-top: 5px;
  padding-bottom: 2px;
  padding-left: 5px;
  padding-right: 5px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  line-height: 1.2em;
}

/* .case-listing-item:last-child {
  border-bottom: none;
} */

.case-listing-item:hover, .case-listing-item.selected {
  text-decoration: none;
  background-color: rgba(0, 0, 0, 0.05);
  border-top: 1px solid rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
}

.case-listing-item:hover a {
  text-decoration: none;
}

.case-listing-item .heading {
  padding: 0px;
  text-decoration: underline;
}

.outcomes {
  /* color: #2171b5; */
  color: black;
}

.age {
  width: 40px;
}

.sex {
  width: 40px;
}

.case-number {
  font-weight: 500;
}

.classification-indicator rect {
  height: 12px;
  width: 12px;
}

.age, .sex {
  font-weight: bold;
  display: inline-block;
}

button.exclude-button {
  line-height: 15px;
  margin-left: 0.25em;
  padding: 0.25em 0.5em;
  color: rgba(0, 0, 0, 0.5);
}

.exclude-dropdown button {
  line-height: 15px;
  padding: 0px 2px 0px 2px;
  color: rgba(0, 0, 0, 0.5);
}

.exclude-dropdown button:hover {
  text-decoration: none;
}

.exclude-dropdown {
  margin-top: -2px;
  border: 1px solid transparent;
}

.exclude-dropdown:hover {
  border: 1px solid rgba(0, 0, 0, 0.125);
  border-radius: 0.25rem;
}

.dropdown-toggle-no-caret::after {
  content: none !important;
}

.report-loading-mask {
  background: rgba(250,250,250,.7);
  position: absolute;
  z-index: 2000;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}

.loading-icon {
  position: absolute;
  top: 10%;
  left: 45%;
  color: gray;
}
</style>
