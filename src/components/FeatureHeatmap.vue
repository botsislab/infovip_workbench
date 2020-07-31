<template>
  <div>
    <h2>Feature Heatmap</h2>
    <div class="card">
      <div class="dull">Description</div>
      <div class="card-content">
        <div class="viz-container">
          <!-- <apexchart type=heatmap :options="chartOptions" :series="series" /> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// import ReportService from '../api/ReportService'
import * as palette from 'google-palette'

export default {
  name: 'FeatureHeatmap',

  data: function () {
    return {
      series: [
        {
          name: 'Metric1',
          data: this.generateData(18, {
            min: 0,
            max: 90
          })
        },
        {
          name: 'Metric2',
          data: this.generateData(18, {
            min: 0,
            max: 90
          })
        },
        {
          name: 'Metric3',
          data: this.generateData(18, {
            min: 0,
            max: 90
          })
        },
        {
          name: 'Metric4',
          data: this.generateData(18, {
            min: 0,
            max: 90
          })
        },
        {
          name: 'Metric5',
          data: this.generateData(18, {
            min: 0,
            max: 90
          })
        },
        {
          name: 'Metric6',
          data: this.generateData(18, {
            min: 0,
            max: 90
          })
        },
        {
          name: 'Metric7',
          data: this.generateData(18, {
            min: 0,
            max: 90
          })
        },
        {
          name: 'Metric8',
          data: this.generateData(18, {
            min: 0,
            max: 90
          })
        },
        {
          name: 'Metric9',
          data: this.generateData(18, {
            min: 0,
            max: 90
          })
        }
      ],
      chartOptions: {
        dataLabels: {
          enabled: false
        },

        colors: palette('tol', 9).map(hex => '#' + hex),

        title: {
          text: 'HeatMap Chart (Single color)'
        }
      }
    }
  },

  methods: {
    generateData: function (count, yrange) {
      var i = 0
      var series = []
      while (i < count) {
        var x = 'w' + (i + 1).toString()
        var y = Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min

        series.push({
          x: x,
          y: y
        })
        i++
      }
      return series
    }
  },

  created: function () {
    // // Preserve context
    // let self = this

    // // Get data from service
    // ReportService.getReportData()
    //   .then(function (response) {
    //     self.rawData = response.data
    //     self.bubbleChart = D3BubbleChart.bubbleChart()

    //     // Create chart
    //     self.initChart()
    //   })
  },

  mounted: function () {

  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.card {
  min-width: 800px;
  /* width: 90%; */
}
</style>
