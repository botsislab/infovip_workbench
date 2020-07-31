<template>
  <div>
    <div class="row controls no-gutters">
      <div class="col-auto" style="padding-left:0px">
        <slot></slot>
      </div>
      <div class="col-auto bubble-size-selection">
        Show PTs in at least
        <select v-model="minimumBubbleSize" class="custom-select">
          <option v-for="i in 5" :key="i" :value="i">{{ i }}</option>
        </select>
        reports.
      </div>
      <div class="col-auto outcome-selection" style="padding-right:0px">
        Shade by outcome:
        <select v-model="outcomeOfInterest" class="custom-select">
          <option v-for="outcome in outcomes" :key="outcome" :value="outcome">{{ outcome }}</option>
        </select>
      </div>
    </div>
    <div class="row no-gutters viz">
      <div class="col-auto pt-filter">
        <input type="text" v-model="ptSearch" placeholder="Find a PT..." class="form-control" />
        <div class="box">
          <div
            v-for="ptObject in ptList"
            :key="ptObject['pt']"
            class="pt-item"
            :title="ptObject['pt']"
            @mouseover="onPTMouseOver(ptObject)"
            @mouseout="onPTMouseOut(ptObject)"
            @click="onAddFilter(ptObject['pt'])"
          >
            <div class="pt-quantity">
              ({{ ptObject['quantity'] }})
            </div>
            <span class="pt-name">
              {{ ptObject['pt'].toLowerCase() }}
            </span>
          </div>
        </div>
      </div>
      <div class="col">
        <div class="chart-mask" v-if="!loaded">
          <div class="loading-icon">
            <div class="spinner-border" role="status">
              <span class="sr-only">Loading...</span>
            </div>
          </div>
        </div>
        <!-- <div class="filters"> -->
          <!-- <button title="Reset" v-if="filters.length !== 0"  v-on:click="onResetClick" class="col-auto btn">
            <i class="fas fa-undo-alt"></i>
          </button> -->
          <!-- <span v-for="filter in filters" :key="filter" class="badge badge-pill badge-dark">{{ filter }}</span> -->
        <!-- </div> -->
        <!-- <button title="Back" :class="{ disabled:filters.length === 0 }" :disabled="filters.length === 0" v-on:click="onBackClick" class="col-auto btn">
          <i class="fas fa-arrow-left"></i>
        </button> -->
        <div class="legend-title">Number of {{ outcomeOfInterest }}</div>
        <div class="legend">
          <div
            v-for="(item, index) in cleanLegendItems"
            :key="'legend-gradient-' + index"
            class="legend-gradient-item"
            :style="{ 'background-color': item.color}"
          >
            {{ item.count }}
          </div>
        </div>
        <div ref="chart" id="bubble-chart-container"></div>
      </div>
    </div>
  </div>
</template>

<script>
import D3BubbleChart from '../util/D3BubbleChart'

export default {
  name: 'PTBubbles',

  data () {
    return {
      filters: [],
      defaultMinimumBubbleSize: 1,
      minimumBubbleSize: 1,
      hoverTimeout: null,
      // https://pharmahub.org/app/site/resources/2018/01/00739/FDA-FAERS-Data-Dictionary.pdf
      // Abbreviations: DE=Death, HO=Hospitalization, LT= Life-threatening, DS= Disability, CA= Congenital Anomaly, OT=Other medically significant
      outcomes: ['DE', 'HO', 'LT', 'DS', 'CA', 'OT'],
      outcomeOfInterest: 'DE',
      ptSearch: '',
      loaded: false,
      legendItems: []
    }
  },

  computed: {

    cleanLegendItems () {
      return this.legendItems.filter(item => {
        return item
      })
    },

    cases () {
      return this.$store.state.userSelectedCases
    },

    data () {
      return this.processData(this.cases, this.filters)
    },

    ptList () {
      // Get PTs filtered by minimum bubble size
      let filtered = this.data.filter(ptObject => ptObject['quantity'] >= this.minimumBubbleSize)

      // Sort by pt name
      filtered.sort((a, b) => {
        if (a['pt'] < b['pt']) return -1
        if (b['pt'] > a['pt']) return 1
        return 0
      })

      // Reverse sort by quantity
      filtered.sort((a, b) => b['quantity'] - a['quantity'])

      // Filter to match search term
      filtered = filtered.filter(ptObject => {
        return ptObject['pt'].toLowerCase().indexOf(this.ptSearch.toLowerCase()) !== -1
      })

      return filtered
    },

    searchQuery () {
      return this.$store.state.caseListFilter
    },

    isFiltered () {
      return this.$store.state.isCaseListFilterFake
    }
  },

  watch: {

    data () {
      this.initChart()
    },

    isFiltered () {
      if (!this.isFiltered) {
        this.filters = []
      }
    },

    minimumBubbleSize () {
      this.initChart()
    },

    outcomeOfInterest () {
      this.initChart()
    },

    searchQuery (searchQuery) {
      if (searchQuery !== '') {
        this.minimumBubbleSize = 1
      } else {
        this.minimumBubbleSize = this.defaultMinimumBubbleSize
        this.filters = []
      }
    }
  },

  methods: {

    onPTMouseOver (ptObject) {
      this.hoverTimeout = setTimeout(() => {
        this.bubbleChart.onPTMouseOver(ptObject)
      }, 50)
    },

    onPTMouseOut (ptObject) {
      clearTimeout(this.hoverTimeout)
      this.bubbleChart.onPTMouseOut(ptObject)
    },

    processData (data, filters) {
      let byPT = {}

      data.forEach((caseObject) => {
        let allPTs = caseObject.all_pts.split(/:|;/)
        let outcomes = caseObject.all_outcomes ? caseObject.all_outcomes.split(',') : []

        allPTs.forEach((pt) => {
          byPT[pt] = this.getUpdatedCounts(byPT, pt, outcomes)
        })
      })

      let processed = []
      for (let pt in byPT) {
        let countsObject = byPT[pt]
        countsObject['pt'] = pt
        processed.push(countsObject)
      }

      // Remove filtered PTs because we know each processed case includes them
      let minusFilters = processed.filter((value) => {
        return filters.indexOf(value.pt.toLowerCase()) === -1
      })

      return minusFilters
    },

    getUpdatedCounts (countsObject, pt, outcomes) {
      let updatedCounts = {}
      if (pt in countsObject) {
        updatedCounts = countsObject[pt]
        // Increment quantity for PT
        updatedCounts['quantity'] = updatedCounts['quantity'] + 1

        // Increment number of each outcome if it's included in case
        this.outcomes.forEach(outcome => {
          if (outcomes.includes(outcome)) {
            updatedCounts[outcome] = updatedCounts[outcome] + 1
          }
        })
      } else {
        // Set initial quantity for PT
        updatedCounts['quantity'] = 1

        // Set initial number of each outcome
        this.outcomes.forEach(outcome => {
          updatedCounts[outcome] = outcomes.includes(outcome) ? 1 : 0
        })
      }

      return updatedCounts
    },

    containsAll (subjectArray, needles) {
      for (let i = 0; i < needles.length; i++) {
        // Return false if needle isn't in subject array
        if (subjectArray.indexOf(needles[i]) === -1) return false
      }
      return true
    },

    onAddFilter (ptName) {
      // Add filter
      if (this.filters.indexOf(ptName.toLowerCase()) === -1) {
        this.filters.push(ptName.toLowerCase())
      }
      // Reset PT search
      this.ptSearch = ''

      this.$store.commit('setFakeCaseListFilter', this.filters.join(' and ') + ' in all_pts')

      let filtered = this.cases.filter(caseObject => {
        let casePTs = caseObject.all_pts.toLowerCase().split(/;|:/)
        return casePTs.indexOf(ptName.toLowerCase()) !== -1
      })

      this.$store.commit('setFilteredCases', filtered)
    },

    initChart: function () {
      if (this.data.length > 0) {
        this.loaded = false
        this.$nextTick(function () {
          setTimeout(() => {
            this.bubbleChart.initChart('#bubble-chart-container', this.data, this.onAddFilter, this.minimumBubbleSize, this.outcomeOfInterest)
            this.legendItems = this.bubbleChart.getLegendItems()
            setTimeout(() => {
              this.loaded = true
            }, 100)
          }, 0)
        })
      } else {
        this.loaded = true
        this.bubbleChart.clear()
      }
    },

    onBackClick: function () {
      this.filters.pop()
    },

    onResetClick: function () {
      this.$store.commit('resetFilter')
      this.$store.dispatch('populateCaseList', this.$store.state.currentCaseListId)
      this.filters = []
    }
  },

  mounted () {
    this.bubbleChart = D3BubbleChart.bubbleChart(530)
    this.initChart()
  },

  beforeDestroy () {
    this.bubbleChart.destroyTooltip()
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.controls > .col, .controls > [class*="col-"] {
  padding-left: 5px;
  padding-right: 5px;
}

.filters {
  position: absolute;
}

.disabled {
  color: gray;
}

.bubble-size-selection select, .outcome-selection select {
  display: inline-block;
  padding-left: 10px;
  height: 35px;
}

.bubble-size-selection select {
  width: 55px;
}

.outcome-selection select {
  width: 70px;
}

.viz {
  padding-top: 15px;
  height: 550px;
  min-width: 750px;
}

.pt-filter .box {
  padding: 0px;
  width: 220px;
  height: 500px;
}

.pt-filter input {
  margin-bottom: 8px;
}

.pt-name {
  color: #4292c6;
  font-weight: bold;
}

.pt-quantity {
  color: grey;
  float: right;
}

.pt-item {
  height: 24px;
  width: 100%;
  padding: 0px 3px;
  overflow: hidden;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.pt-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
  border-top: 1px solid rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
}

#bubble-chart-container {
  text-align: center;
  font-size: 13px;
  font-weight: bold;
  text-anchor: middle;
  margin-top: 10px;
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

.help-text {
  position: absolute;
  width: 100%;
  text-align: center;
  top: 50%;
}

.legend {
  position: absolute;
  top: 23px;
  left: 0;
  margin-left: 7px;
  border: solid 2px rgb(179, 173, 165);
}

.legend-title {
  position: absolute;
  font-weight: bold;
  padding-left: 7px;
}

.legend-gradient-item {
  height: 20px;
  width: 20px;
  padding: 3px;
  float:left;
  line-height: 1em;
  text-align: center;
  font-weight: bold;
}
</style>
