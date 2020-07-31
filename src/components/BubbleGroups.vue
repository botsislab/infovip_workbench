<template>
  <div class="bubble-groups">
    <div class="row controls no-gutters">
      <div class="col-auto" style="padding-left:0px">
        <slot></slot>
      </div>
      <div class="col">
        <input v-model="ptSearch" class="form-control" type="text" />
      </div>
      <div class="col macro-group-1-selection" style="padding-right:0px">
        Group by:
        <select v-model="groupByField" class="custom-select">
          <option value="none">None</option>
          <option value="all_outcomes">Outcome</option>
          <option value="sex">Sex</option>
          <option value="report_source">Report Source</option>
          <!-- <option value="class_expert_reporter">Is Expert Reporter</option> -->
          <option value="class_overall">Classification</option>
          <option value="class_drug_induced">Mentions Drug Induced</option>
          <option value="class_causal_term">Mentions "Causal" Term</option>
          <!-- <option value="sender_mfr_organization">Sender Organization</option> TOO MANY -->
          <option value="pt_similarity">PT Similarity</option>
        </select>
      </div>
      <div class="col macro-group-2-selection" style="padding-right:0px">
        Shaded by:
        <select v-model="shadeByField" class="custom-select">
          <option value="none">None</option>
          <option value="all_outcomes">Outcome</option>
          <option value="sex">Sex</option>
          <option value="top_all_pts">Top PTs</option>
        </select>
      </div>
      <div class="col-auto">
        <button class="btn-sm" @click="onResetBubbles">Reset</button>
      </div>
    </div>
    <div class="row no-gutters viz">
      <div class="col">
        <div class="filters">
          <button title="Reset" v-if="filters.length !== 0"  v-on:click="onResetClick" class="col-auto btn">
            <i class="fas fa-undo-alt"></i>
          </button>
          <span v-for="filter in filters" :key="filter" class="badge badge-pill badge-dark">{{ filter }}</span>
          <div class="top-counts-container" v-if="topCounts && topCounts.keys">
            <div
              v-for="(topCountKey, index) in topCounts.keys"
              :key="topCountKey"
              :style="{ color: topCounts.colors[index] }"
            >
              {{ topCountKey }} ({{ topCounts.values[index]}})
            </div>
          </div>
        </div>
        <div ref="chart" id="bubble-chart-container"></div>
      </div>
    </div>
  </div>
</template>

<script>
import BubbleGroups from '../util/BubbleGroups'

export default {
  name: 'PTBubbles',

  data () {
    return {
      filters: [],
      hoverTimeout: null,
      ptSearch: '',
      groupByField: 'none',
      shadeByField: 'none',
      topCounts: {}
    }
  },

  computed: {

    cases () {
      return this.$store.state.userSelectedCases
    },

    ptList () {
      let ptList = new Set()
      this.cases.forEach(report => {
        let pts = report.all_pts.split(';')
        pts.forEach(pt => {
          ptList.add(pt.trim())
        })
      })
      return ptList
    },

    searchQuery () {
      return this.$store.state.caseListFilter
    }
  },

  watch: {

    cases () {
      this.macroGroup1 = 'none'
      this.initChart()
    },

    groupByField () {
      if (this.groupByField.indexOf('_similarity') !== -1) {
        let name = this.groupByField.replace(/_similarity/, '')
        this.bubbleChart.setGroupBySimilarityField(name)
      } else {
        this.bubbleChart.setGroupByField(this.groupByField)
      }
    },

    shadeByField () {
      if (this.shadeByField.indexOf('top_') !== -1) {
        let name = this.shadeByField.replace(/top_/, '')
        this.topCounts = this.bubbleChart.shadeTopCounts(name)
      } else {
        this.bubbleChart.setShadeByField(this.shadeByField)
        this.topCounts = {}
      }
    },

    ptSearch () {
      if (this.ptSearch.length >= 3) this.bubbleChart.setPTSearch(this.ptSearch)
      if (this.ptSearch.length === 0) this.bubbleChart.clearPTSearch()
    }
  },

  methods: {

    initChart: function () {
      this.bubbleChart = new BubbleGroups('#bubble-chart-container', 550, 740, this.cases, this.groupByField, this.shadeByField)
      this.bubbleChart.resetGraph()
    },

    onResetBubbles () {
      this.groupByField = 'none'
      this.shadeByField = 'none'
      this.bubbleChart.resetGraph()
    }
  },

  mounted () {
    this.initChart()
  },

  beforeDestroy () {
    this.bubbleChart.destroyTooltip()
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
.bubble-groups .controls > .col, .bubble-groups .controls > [class*="col-"] {
  padding-left: 5px;
  padding-right: 5px;
}

.bubble-groups .macro-group-1-selection select, .bubble-groups .macro-group-2-selection select {
  display: inline-block;
  padding-left: 10px;
  height: 35px;
}

.bubble-groups .viz {
  padding-top: 15px;
  height: 550px;
  min-width: 750px;
}

.bubble-groups #bubble-chart-container {
  text-align: center;
  font-size: 13px;
  font-weight: bold;
  text-anchor: middle;
}

.bubble-groups .top-counts-container {
  position: absolute;
  font-weight: bold;
}

#bubble-chart-container .selected {
  fill: #bada55;
  stroke: black;
}

#bubble-chart-container svg:focus {
    outline: none;
}
</style>
