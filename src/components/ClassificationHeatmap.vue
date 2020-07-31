<template>
  <div>
    <div class="row controls no-gutters">
      <div class="col-auto" style="padding-left:0px">
        <slot></slot>
      </div>
    </div>
    <div class="row no-gutters viz" :style="{ height: vizHeight + 'px' }">
      <div class="col">
        <!-- <div class="chart-mask" v-if="!loaded">
          <div class="loading-icon">
            <div class="spinner-border" role="status">
              <span class="sr-only">Loading...</span>
            </div>
          </div>
        </div> -->
        <div>
          {{ hoveredReportId }}
        </div>
        <div>
          <div
            v-for="feature in features"
            :key="'header-' + feature"
            class="feature-header"
          >
            {{ feature.replace("class_", "") }}
          </div>
        </div>
        <div
          v-for="report in reports"
          :key="report.case_id"
          class="feature-row"
          @click="onRowClick(report)"
        >
          <div
            v-for="feature in features"
            :key="feature"
            class="feature-cell"
            :style="{
              'background-color': getFeatureValueColor(report[feature]),
              'height': cellHeight + 'px'
            }"
          >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'PTBubbles',

  data () {
    return {
      features: [
        'class_overall',
        'class_drug_induced',
        'class_expert_reporter',
        // 'class_narrative_length',
        'class_causal_term',
        'class_reasonable_timeframe',
        'class_symptoms_before'
      ],
      vizHeight: 550,
      hoveredReportId: null
    }
  },

  computed: {

    reports () {
      let reports = JSON.parse(JSON.stringify(this.$store.state.userSelectedCases))
      let features = JSON.parse(JSON.stringify(this.features)).reverse()
      let sorted = reports
      features.forEach(feature => {
        sorted = sorted.sort((reportA, reportB) => {
          if (feature === 'class_overall') {
            if (reportA[feature] === 'High' || reportB[feature] === 'Low') return -1
            if (reportA[feature] === 'Low' || reportB[feature] === 'High') return 1
            return 0
          } else {
            return reportA[feature] > reportB[feature] ? 1 : -1
          }
        })
      })
      return sorted
    },

    searchQuery () {
      return this.$store.state.caseListFilter
    },

    classificationColorMap () {
      return this.$store.state.classificationColorMap
    },

    cellHeight () {
      return (this.vizHeight - 24) / this.reports.length
    }
  },

  methods: {
    getFeatureValueColor (featureValue) {
      if (featureValue === 'True') {
        return 'slategray'
      } else if (featureValue === 'False') {
        return 'lightgray'
      } else if (featureValue === 'High') {
        return this.classificationColorMap['high']
      } else if (featureValue === 'Medium') {
        return this.classificationColorMap['medium']
      } else if (featureValue === 'Low') {
        return this.classificationColorMap['low']
      } else {
        return 'black'
      }
    },

    onRowClick (report) {
      let path = '/case_list_explorer/' + this.$route.params.case_list_id + '/case/' + report.case_id
      this.$router.push(path)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.controls > .col, .controls > [class*="col-"] {
  padding-left: 5px;
  padding-right: 5px;
}

.viz {
  padding-top: 15px;
  min-width: 750px;
}

.chart-mask {
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
  top: 45%;
  left: 50%;
}

.feature-row {
  clear: both;
}

.feature-row:hover .feature-cell {
  border-top: solid 1px white;
  border-bottom: solid 1px white;
}

.feature-cell {
  width: 120px;
  float: left;
}

.feature-header {
  height: 1.5em;
  width: 120px;
  float: left;
  overflow: hidden;
}
</style>
