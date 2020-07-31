<template>
  <div>
    <h2>Reporter State Pie Chart</h2>
    <canvas id='pie_chart'></canvas>
  </div>
</template>

<script>
import MapService from '../api/MapService'
import DataMunger from '../util/DataMunger'
import Chart from 'chart.js'
import * as palette from 'google-palette'

export default {
  name: 'ReporterStatePie',

  data: function () {
    return {
      data: {}
    }
  },

  methods: {

    processData (serviceData) {
      // Build object of counts
      let processedData = DataMunger.getGroupedCounts(serviceData, 'Fake State')
      for (let state in processedData) {
        if (processedData[state] < 7) {
          delete processedData[state]
        }
      }

      let paletteLength = 12
      let colors = palette('tol', paletteLength)
      let backgroundColors = Object.keys(processedData).map(function (state, index) {
        return '#' + colors[index % paletteLength]
      })
      palette('tol', 12)
      this.data = {
        labels: Object.keys(processedData),
        datasets: [
          {
            data: Object.values(processedData),
            backgroundColor: backgroundColors
          }
        ]
      }
    }
  },

  mounted: function () {
    let self = this

    // Get data from service and contruct map
    MapService.getMapData()
      .then(function (response) {
        self.processData(response.data)

        self.chartOptions = {
          type: 'pie',
          data: self.data
        }

        // self.chart.data.datasets = self.data

        self.chart = new Chart('pie_chart', self.chartOptions)

        // console.log('calling chart.update()')
        // self.chart.update()
      })
  },

  created: function () {
  }
}
</script>

<!-- Add 'scoped' attribute to limit CSS to this component only -->
<style scoped>
.card {
  height: 100%;
  width: 100%;
}
</style>
