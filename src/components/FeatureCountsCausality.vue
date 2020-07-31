<template>
  <div>
    <h2>Feature Counts Causality</h2>
    <div class="card">
      <div class="dull">ETHER Feature Counts by Causality Score</div>
      <div class="card-content">
        <div class="viz-container">
          <canvas id="feature-counts-causality-container" width="800" height="600"></canvas>
        </div>
        <select id="feature-selection" multiple @change="onSelectionChange()" v-model="featureSelection" class="feature-selection" :size="allFeatures.length">
          <option v-for="feature in allFeatures" :key="feature">
            {{ feature }}
          </option>
        </select>
        <select id="causality-score-selection" multiple @change="onSelectionChange()" v-model="causalityScoreSelection" class="causality-score-selection" :size="allCausalityScores.length">
          <option v-for="causalityScore in allCausalityScores" :key="causalityScore">
            {{ causalityScore }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script>
import Chart from 'chart.js'
import * as palette from 'google-palette'
import FeatureCountsCausalityService from '../api/FeatureCountsCausalityService'

export default {
  name: 'FeatureCountsCausality',

  data: function () {
    return {
      datasets: [],
      featureSelection: [],
      allFeatures: [
        'DIAGNOSIS',
        'CAUSE_OF_DEATH',
        'SECOND_LEVEL_DIAGNOSIS',
        'SYMPTOM',
        'RULE_OUT',
        'MEDICAL_HISTORY',
        'FAMILY_HISTORY',
        'DRUG',
        'VACCINE'
      ],
      causalityScoreSelection: [],
      allCausalityScores: ['1', '2', '3', '4', '5', '6', '7']
    }
  },

  methods: {

    onSelectionChange: function () {
      this.updateData()
      this.chart.data.datasets = this.datasets
      this.chart.options.scales = this.getScales()
      this.chart.update()
    },

    getFilteredData: function (data, featureSelection, causalityScoreSelection) {
      var filtered = []
      // console.log(causalityScoreSelection)

      data.forEach(function (row, index) {
        if (featureSelection.indexOf(row['FeatureType']) !== -1 && causalityScoreSelection.indexOf(row['CausalityScore'].toString()) !== -1) {
          filtered.push(row)
        }
      })

      return filtered
    },

    updateData: function () {
      this.datasets = []

      this.colorIndex = 0
      this.colors = this.initColors()

      // Filter data
      var filteredData = this.getFilteredData(this.rawData, this.featureSelection, this.causalityScoreSelection)
      // console.log('filtered:')
      // console.log(filteredData)

      // Normalize feature counts
      var normalizedData = this.normalizeByProperty(filteredData, 'FeatureCount')
      // console.log('normalized:')
      // console.log(normalizedData)

      // Add data to datasets
      var byCaseID = {}

      // For each row, add it to a dictionary keyed by case id
      normalizedData.forEach(function (row, index) {
        if (!(row['CaseID'] in byCaseID)) {
          byCaseID[row['CaseID']] = []
        }

        byCaseID[[row['CaseID']]].push(row)
      })

      for (var caseID in byCaseID) {
        this.datasets.push(this.getDataset('Case ID: ' + caseID, byCaseID[caseID]))
      }
    },

    normalizeByProperty: function (objects, property) {
      var normalized = []
      var bounds = this.getBoundsByProperty(objects, property)
      var normalizeValue = this.normalizeValue

      // For each object
      objects.forEach(function (report, index) {
        // Normalize using bounds
        var copy = JSON.parse(JSON.stringify(report)) // https://stackoverflow.com/questions/728360/how-do-i-correctly-clone-a-javascript-object
        copy[property] = normalizeValue(report[property], bounds.min, bounds.max)
        normalized.push(copy)
      })

      return normalized
    },

    normalizeValue: function (value, min, max) {
      return (value - min) / (max - min)
    },

    getBoundsByProperty (objects, property) {
      var bounds = {
        min: Number.MAX_SAFE_INTEGER,
        max: Number.MIN_SAFE_INTEGER
      }
      objects.forEach(function (object) {
        if (object[property] < bounds.min) bounds.min = object[property]
        if (object[property] > bounds.max) bounds.max = object[property]
      })
      return bounds
    },

    getNextColor: function () {
      return this.colors[this.colorIndex++]
    },

    initColors: function () {
      var colors = []
      var hexColors = palette('tol', 10)
      var hexToRgb = this.hexToRgb
      hexColors.forEach(function (color) {
        colors.push(hexToRgb(color))
      })
      return colors
    },

    // https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
    hexToRgb: function (hex) {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)

      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null
    },

    getDataset: function (label, rawData) {
      var data = []
      var color = this.colors[1] // this.getNextColor()
      var maxSize = 30

      rawData.forEach(function (row, index) {
        var size = row['FeatureCount'] * maxSize
        if (size > 0) size += 2

        data.push({
          x: row['FeatureType'],
          y: row['CausalityScore'],
          r: size
        })
      })

      return {
        label: label,
        data: data,
        backgroundColor: 'rgba(' +
          color.r + ',' +
          color.g + ',' +
          color.b + ',.25)'
      }
    },

    getScales: function () {
      return {
        xAxes: [{
          type: 'category',
          labels: [
            '',
            'DIAGNOSIS',
            'CAUSE_OF_DEATH',
            'SECOND_LEVEL_DIAGNOSIS',
            'SYMPTOM',
            'RULE_OUT',
            'MEDICAL_HISTORY',
            'FAMILY_HISTORY',
            'DRUG',
            'VACCINE',
            ''
          ],
          ticks: {
            autoSkip: false,
            maxRotation: 30
          }
        }],
        yAxes: [{
          ticks: {
            min: 0,
            max: 8
          }
        }]
      }
    }

  },

  created: function () {
    // Select all filters
    this.featureSelection = this.allFeatures
    this.causalityScoreSelection = this.allCausalityScores

    // Get data from service
    FeatureCountsCausalityService.getFeatureCountsCausalityData().then(response => {
      this.rawData = response.data
      this.updateData()
      this.chart.data.datasets = this.datasets
      this.chart.options.scales = this.getScales()
      this.chart.update()
    })
  },

  mounted: function () {
    this.chartOptions = {
      type: 'bubble',
      options: {
        onClick: function (event, activeElements) {
          // console.log(activeElements)
        },
        responsive: true,
        legend: {
          display: false
        },
        scales: this.getScales(),
        tooltips: {
          enabled: false,
          bodyFontSize: 18,
          titleFontSize: 20,
          callbacks: {
          }
        }
      },
      data: {
        datasets: this.datasets
      }
    }

    this.chart = new Chart('feature-counts-causality-container', this.chartOptions)
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.viz-container {
  /* width: 480px; */
  float: left;
}

.feature-selection {
  float: left;
  padding: 2px 8px;
  border: 1px solid #ced4da;
  border-radius: 5px;
}

.causality-score-selection {
  float: left;
  width: 100px;
  padding: 2px 8px;
  border: 1px solid #ced4da;
  border-radius: 5px;
}
</style>
