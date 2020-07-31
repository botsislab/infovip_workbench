<template>
  <div class="container-fluid case-viewer">
    <div v-if="loaded" class="row no-gutters header">
      <div class="col">
        <div class="heading">Report {{ report.faers_case_number }} (Version {{ parseInt(report.version_number) }})</div>
      </div>
      <div class="col-auto">
        <router-link
          :to="'/reports/' + case_id"
          target="_blank"
          class="btn"
        >
          <font-awesome-icon icon="external-link-alt"></font-awesome-icon>
        </router-link>
      </div>
    </div>
    <div class="row classification">
      <classification-info :classification="report.classification"></classification-info>
    </div>
    <div v-if="loaded" class="row">
      <div class="col-7 case-content">
        <div class="row narrative">
          <narrative :report="report"></narrative>
        </div>
      </div>
      <div class="col-5 case-insight">
        <div class="row">
          <div class="col">
            <div class="heading">Report Details</div>
          </div>
        </div>
        <div class="row details">
          <report-details :report="report"></report-details>
        </div>
        <div class="row visualization">
          <div class="col">
            <div class="row">
              <div class="col">
                <div class="heading">Timeline</div>
              </div>
            </div>
            <div class="row">
              <div class="col">
                <div class="box" style="min-height:100px">
                  <case-timeline :features="report.features"></case-timeline>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="row labels">
          <div class="col">
            <div class="row">
              <div class="col">
                <div class="heading">
                  <span>Relevant Labels</span>
                  <div class="show-annotations">
                    <label style="margin: 0px" for="labels-show-annotations">Show Annotations&nbsp;</label>
                    <input v-model="showAnnotations" id="labels-show-annotations" type="checkbox" />
                  </div>
                </div>
              </div>
            </div>
            <div class="row">
              <relevant-labels :labels="labels"></relevant-labels>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col">
            <div class="row">
              <div class="col">
                <div class="heading">Relevant Literature</div>
              </div>
            </div>
            <div class="row">
              <relevant-literature
                :all_pts="report.all_pts"
                :product_1_product_name="report.product_1_product_name"
                :product_1_product_active_ingredient="report.product_1_product_active_ingredient"
              ></relevant-literature>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CaseService from '../api/CaseService'
import ReportDetails from './ReportDetails.vue'
import Narrative from './Narrative.vue'
import CaseTimeline from './CaseTimeline'
import RelevantLabels from '@/components/RelevantLabels.vue'
import RelevantLiterature from '@/components/RelevantLiterature.vue'
import ClassificationInfo from '@/components/ClassificationInfo.vue'
import VueScrollTo from 'vue-scrollto'

export default {

  props: ['case_id'],

  components: {
    'report-details': ReportDetails,
    'narrative': Narrative,
    'case-timeline': CaseTimeline,
    'relevant-labels': RelevantLabels,
    'relevant-literature': RelevantLiterature,
    'classification-info': ClassificationInfo
  },

  data () {
    return {
      loaded: false,
      labels: [],
      report: {}
    }
  },

  computed: {
    showAnnotations: {
      get () {
        return this.$store.state.showAnnotations
      },

      set (showAnnotations) {
        this.$store.commit('setShowAnnotations', showAnnotations)
      }
    }
  },

  watch: {
    case_id (newCaseId) {
      this.loadCaseDetails(newCaseId)
    },

    loaded (loaded) {
      if (loaded) VueScrollTo.scrollTo(this.$el, 1000)
    }
  },

  methods: {

    loadCaseDetails (caseId) {
      // Clear any prior state
      this.clearSelected()

      this.loaded = false

      // Get full case details
      CaseService.getCase(caseId)
        .then(response => {
          for (let key in response.data) this.report[key] = response.data[key]
          this.$store.commit('addRelatedPTs', this.report.related_pts)
          this.$store.commit('setReportLoading', '')
          this.loaded = true
        })
        .catch(error => {
          this.$store.commit('setError', error)
          this.$store.commit('setReportLoading', '')
        })

      CaseService.getCaseLabels(caseId)
        .then(response => {
          this.labels = response.data
          this.labels.forEach(label => {
            this.$store.commit('addRelatedPTs', label.related_pts)
          })
        })
        .catch(error => {
          this.$store.commit('setError', error)
        })
    },

    clearSelected () {
      this.$store.commit('unsetClickedFeatures')
    }
  },

  created () {
    this.loadCaseDetails(this.case_id)
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
.case-viewer .box {
  border: none;
}

.case-content .heading, .case-insight .heading {
  color: slategray;
  padding-top: 20px;
  /* padding-bottom: 5px; */
  margin-bottom: 20px;
  font-size: 2em;
  /* text-align: center; */
  border-bottom: solid 1px lightgray;
  /* border-width: 1px; */
  /* border-style: solid; */
  /* border-image:
    linear-gradient(
      to right,
      lightgray,
      rgba(0, 0, 0, 0)
    ) 0 0 100% 0; */
}

.case-content > .row:first-child .heading, .case-insight > .row:first-child .heading {
  margin-top: 15px;
}

.case-viewer .header .heading {
  font-size: 2.5em;
}

.case-viewer .header {
  /* border-width: 2px; */
  /* border-style: solid; */
  margin-bottom: 20px;
  /* border-image:
    linear-gradient(
      to right,
      lightgray
    ) 0 0 100% 0; */
}

/* .case-viewer .classification {
  margin-top: 10px;
  margin-bottom: 20px;
} */

.show-annotations {
  display: inline-block;
  margin-left: 10px;
  color: #2c3e50;
  font-size: 1rem;
}

.narrative .box {
  height: 800px;
}

.case-content {
  padding-right: 0px;
}

.annotation {
  border-radius: 10px;
  padding-left: 4px;
  color: white;
  background-color: lightgray;
}

.annotation.none {
  color: inherit;
  padding-left: 0px;
  background-color: white;
}

.annotation.drug {
  background-color: rgb(68, 119, 170);
  opacity: 0.5;
}

.annotation.other_term {
  background-color: rgb(17, 119, 51);
  /* background-color: rgb(221, 204, 119); */
  opacity: 0.5;
}

.annotation.diagnosis {
  background-color: rgb(221, 204, 119);
  opacity: 0.5;
}

.annotation.medical_history, .annotation.cause_of_death, .annotation.family_history, .annotation.rule_out {
  background-color: rgb(17, 119, 51);
  /* background-color: rgb(221, 204, 119); */
  opacity: 0.5;
}

.annotation.selection_criteria {
  background-color: rgb(204, 102, 119);
  opacity: 0.5;
}

.annotation.temporal {
  opacity: 1;
}

.annotation.hide {
  color: inherit;
  background-color: white;
  opacity: 1;
}
</style>
