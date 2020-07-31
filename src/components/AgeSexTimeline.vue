<template>
  <div style="height: 90%">
    <!-- <div class="dull">Case vs Age/Sex</div> -->
    <div class="card-content" style="height: 100%">
      <div class="viz-container" style="height: 100%">
        <canvas id="report-timeline-container"></canvas>
      </div>
      <div id="slider"></div>
      <!-- <select multiple @change="onSelectionChange()" v-model="smqSelection" class="smq-selection" size="30">
        <option v-for="smq in allSMQs" :key="smq">
          {{ smq }}
        </option>
      </select> -->
    </div>
  </div>
</template>

<script>
import Chart from 'chart.js'
import * as palette from 'google-palette'

export default {

  data: function () {
    return {
      datasets: []
    }
  },

  methods: {

    onSelectionChange: function () {
      this.updateData()
      this.chart.data.datasets = this.datasets
      this.chart.options.scales = this.getScales()
      this.chart.update()
    },

    getFilteredData: function (data, selection) {
      var filtered = []

      this.allSMQs.forEach(function (smq, index) {
        // If this smq is selected
        if (selection.indexOf(smq) !== -1) {
          // Include it's value
          filtered.push(data[index])
        }
      })

      return filtered
    },

    updateData: function () {
      this.datasets = []

      this.colorIndex = 0
      this.colors = this.initColors()

      // Add data to datasets
      this.datasets.push(this.getDataset('Male', this.maleData))
      this.datasets.push(this.getDataset('Female', this.femaleData))
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
      var color = this.getNextColor()
      var component = this

      rawData.forEach(function (report, index) {
        var date = new Date(report['EVENT_DATE'])

        if (component.minDate === undefined || date < component.minDate) component.minDate = date
        if (component.maxDate === undefined || date > component.maxDate) component.maxDate = date

        data.push({
          x: date,
          y: report['AGE']
        })
      })

      return {
        label: label,
        data: data,
        backgroundColor: 'rgba(' +
          color.r + ',' +
          color.g + ',' +
          color.b + ',1)'
      }
    }
  },

  created: function () {
    // Get data from service instead
    // eslint-disable-next-line
    this.maleData = [{'EVENT_DATE': '2012-07-02', 'AGE': 79.0, 'REPORT_ID': 8661802}, {'EVENT_DATE': '2014-05-01', 'AGE': 33.0, 'REPORT_ID': 10058091}, {'EVENT_DATE': '2014-04-22', 'AGE': 53.0, 'REPORT_ID': 10133478}, {'EVENT_DATE': '2014-03-17', 'AGE': 51.0, 'REPORT_ID': 10191620}, {'EVENT_DATE': '2014-06-14', 'AGE': 57.0, 'REPORT_ID': 10299167}, {'EVENT_DATE': '2014-03-12', 'AGE': 58.0, 'REPORT_ID': 10303397}, {'EVENT_DATE': '2006-06-01', 'AGE': 61.0, 'REPORT_ID': 10330698}, {'EVENT_DATE': '2014-02-05', 'AGE': 81.0, 'REPORT_ID': 10334529}, {'EVENT_DATE': '2014-07-12', 'AGE': 65.0, 'REPORT_ID': 10353476}, {'EVENT_DATE': '2012-08-06', 'AGE': 46.0, 'REPORT_ID': 8876220}, {'EVENT_DATE': '2009-10-25', 'AGE': 58.0, 'REPORT_ID': 10037827}, {'EVENT_DATE': '2014-07-31', 'AGE': 65.0, 'REPORT_ID': 10394465}, {'EVENT_DATE': '2014-09-01', 'AGE': 44.0, 'REPORT_ID': 10486990}, {'EVENT_DATE': '2014-08-19', 'AGE': 86.0, 'REPORT_ID': 10527736}, {'EVENT_DATE': '2014-10-03', 'AGE': 28.0, 'REPORT_ID': 10557012}, {'EVENT_DATE': '2012-01-01', 'AGE': 78.0, 'REPORT_ID': 10584167}, {'EVENT_DATE': '2014-10-01', 'AGE': 28.0, 'REPORT_ID': 10586525}, {'EVENT_DATE': '2014-08-01', 'AGE': 66.0, 'REPORT_ID': 10621664}, {'EVENT_DATE': '2014-11-21', 'AGE': 73.0, 'REPORT_ID': 10621901}, {'EVENT_DATE': '2014-08-11', 'AGE': 78.0, 'REPORT_ID': 10635217}, {'EVENT_DATE': '2014-11-01', 'AGE': 54.0, 'REPORT_ID': 10639530}, {'EVENT_DATE': '2014-09-07', 'AGE': 73.0, 'REPORT_ID': 10641892}, {'EVENT_DATE': '2014-12-01', 'AGE': 45.0, 'REPORT_ID': 10649062}, {'EVENT_DATE': '2014-11-27', 'AGE': 81.0, 'REPORT_ID': 10651278}, {'EVENT_DATE': '2014-11-12', 'AGE': 66.0, 'REPORT_ID': 10655583}, {'EVENT_DATE': '2014-07-02', 'AGE': 55.0, 'REPORT_ID': 10661511}, {'EVENT_DATE': '2014-12-21', 'AGE': 85.0, 'REPORT_ID': 10672095}, {'EVENT_DATE': '2012-11-01', 'AGE': 47.0, 'REPORT_ID': 10688335}, {'EVENT_DATE': '2013-06-27', 'AGE': 0.5, 'REPORT_ID': 9390992}, {'EVENT_DATE': '2013-07-25', 'AGE': 36.0, 'REPORT_ID': 9857237}, {'EVENT_DATE': '2013-11-26', 'AGE': 38.0, 'REPORT_ID': 10189485}, {'EVENT_DATE': '2013-12-01', 'AGE': 63.0, 'REPORT_ID': 10209898}, {'EVENT_DATE': '2014-02-01', 'AGE': 75.0, 'REPORT_ID': 10420267}, {'EVENT_DATE': '2014-08-08', 'AGE': 28.0, 'REPORT_ID': 10444898}, {'EVENT_DATE': '2013-10-23', 'AGE': 48.0, 'REPORT_ID': 10558295}, {'EVENT_DATE': '2014-10-17', 'AGE': 34.0, 'REPORT_ID': 10575438}, {'EVENT_DATE': '2014-10-24', 'AGE': 65.0, 'REPORT_ID': 10584421}, {'EVENT_DATE': '2014-11-01', 'AGE': 77.41666666666667, 'REPORT_ID': 10623689}, {'EVENT_DATE': '2014-09-08', 'AGE': 45.0, 'REPORT_ID': 10624858}, {'EVENT_DATE': '2014-11-14', 'AGE': 27.0, 'REPORT_ID': 10651530}, {'EVENT_DATE': '2014-10-29', 'AGE': 64.0, 'REPORT_ID': 10672472}, {'EVENT_DATE': '2014-09-30', 'AGE': 69.0, 'REPORT_ID': 10674543}, {'EVENT_DATE': '2014-10-28', 'AGE': 60.0, 'REPORT_ID': 10690384}, {'EVENT_DATE': '2014-02-25', 'AGE': 58.0, 'REPORT_ID': 10692073}, {'EVENT_DATE': '2013-05-01', 'AGE': 79.0, 'REPORT_ID': 10692441}, {'EVENT_DATE': '2013-12-20', 'AGE': 54.0, 'REPORT_ID': 10694057}, {'EVENT_DATE': '2014-12-10', 'AGE': 81.0, 'REPORT_ID': 10694073}, {'EVENT_DATE': '2014-11-03', 'AGE': 89.0, 'REPORT_ID': 10694375}, {'EVENT_DATE': '2015-01-04', 'AGE': 74.0, 'REPORT_ID': 10696956}, {'EVENT_DATE': '2014-12-15', 'AGE': 62.0, 'REPORT_ID': 10700905}, {'EVENT_DATE': '2014-12-05', 'AGE': 62.0, 'REPORT_ID': 10706659}, {'EVENT_DATE': '2014-11-21', 'AGE': 88.0, 'REPORT_ID': 10712821}, {'EVENT_DATE': '2015-01-04', 'AGE': 74.0, 'REPORT_ID': 10713073}, {'EVENT_DATE': '2014-03-01', 'AGE': 66.0, 'REPORT_ID': 10713303}, {'EVENT_DATE': '2015-01-05', 'AGE': 39.0, 'REPORT_ID': 10735055}]
    // eslint-disable-next-line
    this.femaleData = [{'EVENT_DATE': '2012-07-12', 'AGE': 30.0, 'REPORT_ID': 8731355}, {'EVENT_DATE': '2013-10-05', 'AGE': 53.0, 'REPORT_ID': 9609648}, {'EVENT_DATE': '2014-04-01', 'AGE': 58.0, 'REPORT_ID': 10230758}, {'EVENT_DATE': '2014-05-19', 'AGE': 70.0, 'REPORT_ID': 10232127}, {'EVENT_DATE': '2014-06-01', 'AGE': 52.0, 'REPORT_ID': 10261198}, {'EVENT_DATE': '2012-10-19', 'AGE': 62.0, 'REPORT_ID': 10263505}, {'EVENT_DATE': '1997-10-01', 'AGE': 52.0, 'REPORT_ID': 7806518}, {'EVENT_DATE': '2014-02-21', 'AGE': 66.0, 'REPORT_ID': 10027049}, {'EVENT_DATE': '2014-03-01', 'AGE': 55.0, 'REPORT_ID': 10162454}, {'EVENT_DATE': '2014-04-01', 'AGE': 47.0, 'REPORT_ID': 10188085}, {'EVENT_DATE': '2008-11-28', 'AGE': 73.0, 'REPORT_ID': 10246926}, {'EVENT_DATE': '2014-03-05', 'AGE': 63.0, 'REPORT_ID': 10273315}, {'EVENT_DATE': '2014-04-08', 'AGE': 66.9013698630137, 'REPORT_ID': 10275466}, {'EVENT_DATE': '2014-05-01', 'AGE': 37.0, 'REPORT_ID': 10277084}, {'EVENT_DATE': '2014-06-12', 'AGE': 22.0, 'REPORT_ID': 10292605}, {'EVENT_DATE': '2014-04-27', 'AGE': 74.0, 'REPORT_ID': 10329569}, {'EVENT_DATE': '2014-06-04', 'AGE': 48.0, 'REPORT_ID': 10401286}, {'EVENT_DATE': '2014-07-01', 'AGE': 30.0, 'REPORT_ID': 10414550}, {'EVENT_DATE': '2014-08-22', 'AGE': 37.0, 'REPORT_ID': 10458290}, {'EVENT_DATE': '2014-07-29', 'AGE': 50.0, 'REPORT_ID': 10459223}, {'EVENT_DATE': '2014-08-20', 'AGE': 69.0, 'REPORT_ID': 10477007}, {'EVENT_DATE': '2013-09-28', 'AGE': 35.0, 'REPORT_ID': 9655502}, {'EVENT_DATE': '2013-09-01', 'AGE': 47.0, 'REPORT_ID': 9720865}, {'EVENT_DATE': '2013-09-12', 'AGE': 71.0, 'REPORT_ID': 10071515}, {'EVENT_DATE': '2014-05-13', 'AGE': 66.0, 'REPORT_ID': 10292639}, {'EVENT_DATE': '2014-03-10', 'AGE': 54.0, 'REPORT_ID': 10330586}, {'EVENT_DATE': '2014-05-01', 'AGE': 33.0, 'REPORT_ID': 10353417}, {'EVENT_DATE': '2014-08-29', 'AGE': 66.0, 'REPORT_ID': 10505226}, {'EVENT_DATE': '2011-12-01', 'AGE': 37.0, 'REPORT_ID': 10515843}, {'EVENT_DATE': '2014-06-24', 'AGE': 38.0, 'REPORT_ID': 10542647}, {'EVENT_DATE': '2014-09-06', 'AGE': 42.0, 'REPORT_ID': 10553605}, {'EVENT_DATE': '2014-04-01', 'AGE': 60.0, 'REPORT_ID': 10569990}, {'EVENT_DATE': '2014-10-01', 'AGE': 58.0, 'REPORT_ID': 10581546}, {'EVENT_DATE': '2013-11-01', 'AGE': 49.0, 'REPORT_ID': 10582213}, {'EVENT_DATE': '2014-11-19', 'AGE': 47.0, 'REPORT_ID': 10642830}, {'EVENT_DATE': '2014-11-01', 'AGE': 73.0, 'REPORT_ID': 10643604}, {'EVENT_DATE': '2014-12-07', 'AGE': 81.0, 'REPORT_ID': 10647760}, {'EVENT_DATE': '2014-06-06', 'AGE': 51.0, 'REPORT_ID': 10650432}, {'EVENT_DATE': '2014-11-12', 'AGE': 0.16666666666666666, 'REPORT_ID': 10651639}, {'EVENT_DATE': '2012-10-01', 'AGE': 56.0, 'REPORT_ID': 10651834}, {'EVENT_DATE': '2013-07-11', 'AGE': 36.0, 'REPORT_ID': 10653858}, {'EVENT_DATE': '2014-11-24', 'AGE': 75.0, 'REPORT_ID': 10655170}, {'EVENT_DATE': '2014-12-10', 'AGE': 75.0, 'REPORT_ID': 10657046}, {'EVENT_DATE': '2014-11-04', 'AGE': 70.0, 'REPORT_ID': 10672833}, {'EVENT_DATE': '2014-12-17', 'AGE': 63.0, 'REPORT_ID': 10673609}, {'EVENT_DATE': '2014-12-22', 'AGE': 21.0, 'REPORT_ID': 10678543}, {'EVENT_DATE': '2014-11-18', 'AGE': 40.0, 'REPORT_ID': 10681825}, {'EVENT_DATE': '2013-11-01', 'AGE': 48.0, 'REPORT_ID': 9785241}, {'EVENT_DATE': '2013-08-01', 'AGE': 30.0, 'REPORT_ID': 10004356}, {'EVENT_DATE': '2014-06-24', 'AGE': 27.0, 'REPORT_ID': 10525327}, {'EVENT_DATE': '2014-09-29', 'AGE': 78.0, 'REPORT_ID': 10596362}, {'EVENT_DATE': '2014-11-13', 'AGE': 16.0, 'REPORT_ID': 10608202}, {'EVENT_DATE': '2014-11-01', 'AGE': 71.0, 'REPORT_ID': 10610670}, {'EVENT_DATE': '2014-11-25', 'AGE': 65.0, 'REPORT_ID': 10622608}, {'EVENT_DATE': '2014-10-18', 'AGE': 91.0, 'REPORT_ID': 10662804}, {'EVENT_DATE': '2014-12-15', 'AGE': 67.0, 'REPORT_ID': 10671333}, {'EVENT_DATE': '2014-11-20', 'AGE': 35.0, 'REPORT_ID': 10676762}, {'EVENT_DATE': '2014-12-30', 'AGE': 51.0, 'REPORT_ID': 10690306}, {'EVENT_DATE': '2014-11-10', 'AGE': 71.0, 'REPORT_ID': 10760809}, {'EVENT_DATE': '2011-07-01', 'AGE': 46.0, 'REPORT_ID': 9896947}, {'EVENT_DATE': '2014-01-01', 'AGE': 63.0, 'REPORT_ID': 9921440}]

    this.updateData()

    // Render slider
    // this.slider = slider('#slider').dateRangeSlider({
    //   bounds: {
    //     min: this.minDate,
    //     max: this.maxDate
    //   }
    // })
  },

  mounted: function () {
    // Create local variables for callback use
    var maleData = this.maleData
    var femaleData = this.femaleData

    this.chartOptions = {
      type: 'scatter',
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          xAxes: [{
            type: 'time',
            time: {
              // min: new Date('2014-01-01')
            }
          }]
        },
        tooltips: {
          bodyFontSize: 18,
          titleFontSize: 20,
          callbacks: {
            label: function (tooltipItem, data) {
              var label = data.datasets[tooltipItem.datasetIndex].label
              var datum

              if (label === 'Male') {
                datum = maleData[tooltipItem.index]
                return ' ' + datum['EVENT_DATE'] + ': ' + datum['AGE'].toFixed(2) + ' years old'
              } else if (label === 'Female') {
                datum = femaleData[tooltipItem.index]
                return ' ' + datum['EVENT_DATE'] + ': ' + datum['AGE'].toFixed(2) + ' years old'
              } else {
                return ''
              }
            },
            title: function (tooltipItems, data) {
              var label = data.datasets[tooltipItems[0].datasetIndex].label
              var datum

              if (label === 'Male') {
                datum = maleData[tooltipItems[0].index]
                return ' Report: ' + datum['REPORT_ID']
              } else if (label === 'Female') {
                datum = femaleData[tooltipItems[0].index]
                return ' Report: ' + datum['REPORT_ID']
              } else {
                return ''
              }
            }
          }
        }
      },
      data: {
        datasets: this.datasets
      }
    }

    this.chart = new Chart('report-timeline-container', this.chartOptions)
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
