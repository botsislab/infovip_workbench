<template>
  <div style="height: 90%">
    <div class="card-content">
      <div class="viz-container" style="min-height:200px">
        <canvas id="case-timeline-container"></canvas>
      </div>
      <div id="slider"></div>
    </div>
  </div>
</template>

<script>
import Chart from 'chart.js'
import * as palette from 'google-palette'
import util from '@/util/util'

export default {

  props: ['features'],

  data: function () {
    return {
      categories: [
        'selection_criteria',
        'drug',
        'other_term',
        'diagnosis'
      ],
      selectionCriteriaCategory: 'selection_criteria',
      uniqueFeatureTexts: []
    }
  },

  computed: {

    uniqueTemporalFeatures () {
      let uniqueFeatureTexts = []
      let features = this.allTemporalFeatures.filter(feature => {
        let featureText = this.getFeatureText(feature)
        if (uniqueFeatureTexts.indexOf(featureText) === -1) {
          uniqueFeatureTexts.push(featureText)
          return true
        }
        return false
      })
      return features
    },

    allTemporalFeatures () {
      return this.splitFeatures.filter(feature => {
        let featureTempStartDate = new Date(feature['feature_temp_start'])
        return (
          feature['feature_temp_start'] !== null &&
          featureTempStartDate > this.minimumAllowedDate &&
          featureTempStartDate < this.maximumAllowedDate
        )
      })
    },

    splitFeatures () {
      // Split all features by their PT field
      let splitFeatures = []
      let uniqueIdentifiers = [] // Custom id so we can only include one PT/date combination

      this.features.forEach(feature => {
        if (feature.preferred_term !== '' && feature.preferred_term.includes(';')) {
          let pts = feature.preferred_term.split(';')
          pts.forEach(pt => {
            let id = pt + feature.feature_temp_start
            if (uniqueIdentifiers.indexOf(id) === -1) {
              let featureToAdd = Object.assign({}, feature)
              featureToAdd.preferred_term = pt
              splitFeatures.push(featureToAdd)
              uniqueIdentifiers.push(id)
            }
          })
        } else {
          let text = this.getFeatureText(feature)
          let id = text + feature.feature_temp_start
          if (uniqueIdentifiers.indexOf(id) === -1) {
            splitFeatures.push(feature)
            uniqueIdentifiers.push(id)
          }
        }
      })

      return splitFeatures
    },

    minimumAllowedDate () {
      return this.$store.state.minimumAllowedDate
    },

    maximumAllowedDate () {
      return this.$store.state.maximumAllowedDate
    }
  },

  methods: {

    getNextColor () {
      return this.colors[this.colorIndex++]
    },

    getFeatureText (feature) {
      let textField = feature.feature_type === 'other_term' && feature.preferred_term ? 'preferred_term' : 'clean_text'
      return feature[textField]
    },

    initColors () {
      var colors = []
      var hexColors = palette('tol', 4)
      var hexToRgb = this.hexToRgb
      hexColors.forEach(function (color) {
        colors.push(hexToRgb(color))
      })
      return colors
    },

    // https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
    hexToRgb (hex) {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null
    },

    getYValue (category) {
      return this.categories.indexOf(category) + 1
    },

    getCategory (yValue) {
      let categoryMap = {
        'selection_criteria': 'AEs',
        'drug': 'Tx',
        'other_term': 'Other',
        'diagnosis': 'Dx'
      }

      return categoryMap[this.categories[yValue - 1]]
    },

    getDataset (label, rawData, color) {
      let component = this
      var data = []

      rawData.forEach((temporalFeature, index) => {
        // TODO Fix dates to evaluate as GMT
        var date = new Date(temporalFeature['feature_temp_start'])

        data.push({
          x: date,
          y: component.getYValue(temporalFeature['feature_type']),
          temporalFeature
        })
      })

      return {
        label: util.toTitleCase(label),
        pointRadius: 8,
        pointHoverRadius: 8,
        data: data,
        backgroundColor: 'rgba(' +
          color.r + ',' +
          color.g + ',' +
          color.b + ',1)'
      }
    },

    loadCaseFeatures () {
      let colorIndex = 0
      this.colors = this.initColors()

      // Add data to datasets
      this.categories.forEach((category, index) => {
        let categoryData = this.allTemporalFeatures.filter(feature => feature['feature_type'] === category)

        // Pick color
        let color = category === this.selectionCriteriaCategory ? this.colors[this.colors.length - 1] : this.colors[colorIndex]
        if (category !== this.selectionCriteriaCategory) colorIndex++

        this.chart.data.datasets.push(this.getDataset(category, categoryData, color))
      })
      this.chart.update()
    },

    getFeature (label, index) {
      let labelFeatures = this.allTemporalFeatures.filter(feature => feature['feature_type'] === label)
      return labelFeatures[index]
    },

    getMatchingFeatures (activeElements) {
      let label = this.chart.data.datasets[activeElements[0]['_datasetIndex']].label
      let index = activeElements.map(element => element['_index'])
      let clicked = this.getFeature(label, index)
      let matching = this.allTemporalFeatures.filter(feature => {
        return (
          feature['feature_type'] === clicked['feature_type'] &&
          feature['feature_temp_start'] === clicked['feature_temp_start'] && true
          // feature[this.textFieldName] === clicked[this.textFieldName]
        )
      })

      return matching
    }
  },

  mounted () {
    let component = this

    this.chartOptions = {
      type: 'scatter',
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          xAxes: [{
            type: 'time'
          }],
          yAxes: [{
            ticks: {
              display: false,
              suggestedMin: 0,
              suggestedMax: 4,
              callback (value, index, values) {
                let fullLabel = component.getCategory(value)
                let label = typeof fullLabel !== 'undefined' && fullLabel.length > 15 ? fullLabel.slice(0, 12) + '...' : fullLabel
                return label
              }
            }
          }]
        },
        legend: {
          labels: {
            generateLabels: (chart) => {
              return chart.data.datasets.map((dataset, i) => {
                return {
                  text: dataset.label + ' (' + dataset.data.length + ')',
                  fillStyle: dataset.backgroundColor,
                  hidden: !chart.isDatasetVisible(i),
                  datasetIndex: i // Used for toggling the datasets
                }
              })
            }
          }
        },
        tooltips: {
          mode: 'point',
          bodyFontSize: 18,
          titleFontSize: 20,
          callbacks: {
            label (tooltipItem, data) {
              let feature = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].temporalFeature
              component.$store.commit('setHoveredFeature', feature)
              return component.getFeatureText(feature)
            },
            title (tooltipItems, data) {
              let days = [...new Set(tooltipItems.map(item => item.xLabel))].sort((a, b) => a - b)
              if (days.length > 1) {
                let daysFrom = days[0]
                let daysTo = days[days.length - 1]
                return 'Between: ' + daysFrom + ' and ' + daysTo
              } else {
                return 'On: ' + days.join(', ')
              }
            }
          },

          // Disable the on-canvas tooltip
          enabled: false,

          custom (tooltipModel) {
            // Tooltip Element
            var tooltipEl = document.getElementById('case-timeline-tooltip')

            // Create element on first render
            if (!tooltipEl) {
              tooltipEl = document.createElement('div')
              tooltipEl.id = 'case-timeline-tooltip'
              tooltipEl.innerHTML = '<table></table>'
              document.body.appendChild(tooltipEl)
            }

            // Hide if no tooltip
            if (tooltipModel.opacity === 0) {
              tooltipEl.style.opacity = 0
              tooltipEl.style.display = 'none'
              return
            }

            // Set caret Position
            tooltipEl.classList.remove('above', 'below', 'no-transform')
            if (tooltipModel.yAlign) {
              tooltipEl.classList.add(tooltipModel.yAlign)
            } else {
              tooltipEl.classList.add('no-transform')
            }

            // Set Text
            if (tooltipModel.body) {
              var titleLines = tooltipModel.title || []
              var bodyLines = tooltipModel.body.map(body => body.lines)

              var innerHtml = '<thead>'

              titleLines.forEach(title => {
                innerHtml += '<tr><th>' + title + '</th></tr>'
              })
              innerHtml += '</thead><tbody>'

              let usedLines = []

              for (let i = 0; i < bodyLines.length; i++) {
                let body = bodyLines[i].join(', ')
                if (usedLines.indexOf(body) !== -1) continue
                usedLines.push(body)
                var colors = tooltipModel.labelColors[i]
                var style = 'background:' + colors.backgroundColor
                style += '; border-color:' + colors.borderColor
                style += '; border-width: 2px'
                var span = '<span class="indicator" style="' + style + '"></span>'
                innerHtml += '<tr><td>' + span + body + '</td></tr>'
              }
              innerHtml += '</tbody>'

              var tableRoot = tooltipEl.querySelector('table')
              tableRoot.innerHTML = innerHtml
            }

            // `this` will be the overall tooltip
            var position = this._chart.canvas.getBoundingClientRect()

            // Display, position, and set styles for font
            tooltipEl.style.opacity = 1
            tooltipEl.style.display = 'initial'
            tooltipEl.style.position = 'absolute'
            // Adjust left position if at the edge of the screen
            let tooltipLeft = position.left + window.pageXOffset + tooltipModel.caretX
            if (window.outerWidth > tooltipLeft + 300) {
              tooltipEl.style.left = tooltipLeft + 'px'
              tooltipEl.style.right = ''
            } else {
              tooltipEl.style.left = ''
              tooltipEl.style.right = '0px'
            }
            tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px'
            tooltipEl.style.fontFamily = tooltipModel._bodyFontFamily
            tooltipEl.style.fontSize = tooltipModel.bodyFontSize + 'px'
            tooltipEl.style.fontStyle = tooltipModel._bodyFontStyle
            tooltipEl.style.padding = tooltipModel.yPadding + 'px ' + tooltipModel.xPadding + 'px'
            tooltipEl.style.pointerEvents = 'none'
          }
        },
        onHover (event, activeElements) {
          if (activeElements.length === 0) {
            component.$store.commit('unsetHoveredFeatures')
          }
        },
        onClick (event, activeElements) {
          if (activeElements.length !== 0) {
            component.$store.commit('setTimelineClicked')
          }
        }
      },
      data: {
        datasets: []
      }
    }

    this.chart = new Chart('case-timeline-container', this.chartOptions)

    this.loadCaseFeatures()
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
