<template>
  <div>
    <div class="card-content">
      <div class="row controls">
        <div class="col-auto">
          <slot></slot>
        </div>
        <div class="col-auto pt-count-selection">
          In at least
          <select v-model="minimumPTCount" class="custom-select">
            <option v-for="i in 5" :key="i" :value="i">{{ i }}</option>
          </select>
          reports
        </div>
        <div class="col-auto group-selection">
          Interval:
          <span v-if="customInterval">
            <input @keyup.enter="setCustomInterval($event.target.value)" type="text" class="form-control" :value="groupByDays">
            <button @click="disableCustomInterval()" title="Use preset intervals instead" class="btn btn-sm">
              <i class="fas fa-times"></i>
            </button>
          </span>
          <select v-else @change="setInterval($event.target.value)" class="custom-select">
            <option :selected="groupByDays === i" v-for="i in [1, 5, 10, 30, 60, 'custom']" :key="i" :value="i">{{ i === 'custom' ? 'custom' : i + ' days' }}</option>
          </select>
        </div>
        <div class="col-auto split-by-type-selection">
          Split By Type
          <input type="checkbox" v-model="splitByFeatureType" />
        </div>
      </div>
      <div class="row no-gutters">
        <div class="col viz-container">
          <div class="temporal-note">Showing data for the {{ casesWithTemporalInformation.length }} reports which had temporal information</div>
          <div class="help-toggles">
            <div class="help-toggle" id="help-toggle">
              <i class="fas fa-info-circle"></i>
            </div>
            <b-popover
              target="help-toggle"
              triggers="hover"
              placement="bottomright"
              title="Timeline Help"
            >
              <div><strong>Zooming </strong>Zoom by either dragging/swiping left to right on the timeline or using the slider handles located below the timeline</div>
              <div><strong>Legend </strong>Each category of terms can be toggled on/off by clicking on their legend item. This can be useful when some terms are initially hidden</div>
            </b-popover>
            <div class="term-help-toggle" id="term-help-toggle">
              <i class="fas fa-question-circle"></i>
            </div>
            <b-popover
              target="term-help-toggle"
              triggers="hover"
              placement="bottomright"
              title="Terminology Help"
            >
              <div><strong>Selection Criteria</strong> Any term that was used as selection criteria in the imported FBIS file</div>
              <div><strong>Drug</strong> Any term in the narrative that ETHER recognizes as a product/drug</div>
              <div><strong>Diagnosis</strong> Any term in the narrative that ETHER recognizes as a primary diagnosis</div>
              <div><strong>Selection Criteria</strong> Any other term in the narrative that ETHER recognizes as a medical term of interest. These could be ETHER terms such as Symptom, Cause of Death, Medical History, etc</div>
            </b-popover>
          </div>
          <div class="viz">
            <div v-if="selectingZoom" class="zoom-slider" :style="{ left: sliderLeft + 'px', right: sliderRight + 'px' }"></div>
            <canvas id="case-series-timeline-container"></canvas>
          </div>
        </div>
      </div>
      <div>
        <slider v-model="sliderSelectedRange" :min="sliderMin" :max="sliderMax" @reset="onResetSliderClick" />
      </div>
    </div>
  </div>
</template>

<script>
import Slider from './Slider.vue'
import Chart from 'chart.js'
import * as d3 from 'd3v4'
// import * as palette from 'google-palette'
import RainbowMaker from '@/util/RainbowMaker'
import util from '@/util/util'

export default {

  components: {
    Slider
  },

  data: function () {
    return {
      caseListId: this.$route.params['case_list_id'],
      chartId: 'case-series-timeline-container',
      sliderSelectedRange: [2, 3],
      sliderMin: 0,
      sliderMax: 10,
      range: null,
      datasetJustChanged: false,
      hasSliderBeenUsed: false,
      textFieldName: 'preferred_term',
      categories: [
        'selection_criteria',
        'diagnosis',
        'drug',
        'other_term'
      ],
      selectionCriteriaCategory: 'selection_criteria',
      colors: ['#ddcc77', '#4477aa', '#117733', '#cc6677'],
      colorIndex: 0,
      minimumPTCount: 2,
      groupByDays: 10,
      customInterval: false,
      splitByFeatureType: false,
      // activeElements: [],
      selectStart: 0,
      selectEnd: 0,
      yAxisWidth: 55,
      chartPaddingRight: 15,
      selectStartPercent: 0,
      sliderLeft: 0,
      sliderRight: 0,
      selectingZoom: false
    }
  },

  computed: {

    casesWithTemporalInformation () {
      return [...new Set(this.allTemporalFeatures.map(feature => feature['case_id']))]
    },

    uniqueTemporalFeatures () {
      let uniqueFeatureKeys = []
      return this.sortedTemporalFeatures.filter(feature => {
        // Only want one feature for each combination of case id and text (ignore subsequent PTs in same case)
        let uniqueKey = null
        if (feature.feature_type === 'drug') {
          uniqueKey = feature['case_id'] + '|' + feature.clean_text
        } else {
          uniqueKey = feature['case_id'] + '|' + feature[this.textFieldName]
        }
        if (uniqueFeatureKeys.indexOf(uniqueKey) === -1) {
          uniqueFeatureKeys.push(uniqueKey)
          return true
        }
        return false
      })
    },

    sortedTemporalFeatures () {
      let unsorted = this.splitFeatures.slice()
      return unsorted.sort((featureA, featureB) => {
        // Sort by feature_temp_start
        return new Date(featureA.feature_temp_start) - new Date(featureB.feature_temp_start)
      })
    },

    splitFeatures () {
      // Split all features by their PT field
      let splitFeatures = []
      let uniqueIdentifiers = [] // Custom id so we can only include one case/PT/day combination

      this.allTemporalFeatures.forEach(feature => {
        if (feature.preferred_term.includes(';')) {
          let pts = feature.preferred_term.split(';')
          pts.forEach(pt => {
            let id = feature.case_id + pt + feature.feature_temp_start
            if (uniqueIdentifiers.indexOf(id) === -1) {
              let featureToAdd = Object.assign({}, feature)
              featureToAdd.preferred_term = pt
              splitFeatures.push(featureToAdd)
              uniqueIdentifiers.push(id)
            }
          })
        } else {
          let id = feature.case_id + feature.preferred_term + feature.feature_temp_start
          if (uniqueIdentifiers.indexOf(id) === -1) {
            splitFeatures.push(feature)
            uniqueIdentifiers.push(id)
          }
        }
      })

      return splitFeatures
    },

    allTemporalFeatures () {
      return this.$store.state.userSelectedCasesTemporalFeatures.filter(feature => {
        let featureTempStartDate = new Date(feature['feature_temp_start'])
        return (
          feature['feature_temp_start'] !== null &&
          featureTempStartDate > this.minimumAllowedDate &&
          featureTempStartDate < this.maximumAllowedDate &&
          feature['relative_days'] !== null // We can use this in non-relative timelines but not here
        )
      })
        .map(temporalFeature => {
          let roundedFeature = Object.assign({}, temporalFeature)
          let relativeDays = roundedFeature['relative_days']
          if (relativeDays < 0 && relativeDays >= -this.groupByDays) {
            roundedFeature['relative_days'] = -this.groupByDays
          } else {
            roundedFeature['relative_days'] = this.groupByDays * Math.ceil(relativeDays / this.groupByDays)
          }
          return roundedFeature
        })
    },

    datasets () {
      let datasets = []
      let dataArrays = []
      let colorIndex = 0

      // Get data for each category
      this.categories.forEach((category, index) => {
        let categoryData = this.getCategoryData(category)
        let dataArray = this.getDataArray(category, categoryData, this.minimumPTCount)
        dataArrays.push(dataArray)
      })

      // Get max count
      let maxCount = Math.max(...dataArrays.map(dataArray => Math.max(...dataArray.map(row => row['count']))))

      // Generate dataset for each data array
      dataArrays.forEach((dataArray, index) => {
        let category = this.categories[index]

        // Pick color
        let color = category === this.selectionCriteriaCategory ? this.colors[this.colors.length - 1] : this.colors[colorIndex]
        if (category !== this.selectionCriteriaCategory) colorIndex++

        // Set radius as rescaled count
        let countScale = d3.scaleLinear()
          .domain([this.minimumPTCount, maxCount])
          .range([15, 50])

        dataArray.forEach(row => { row['r'] = countScale(row['count']) })

        datasets.push({
          label: util.toTitleCase(category),
          hoverRadius: 0,
          data: dataArray,
          borderColor: (context) => {
            if (context) {
              var index = context.dataIndex
              var datum = context.dataset.data[index]
              return parseInt(datum.x) < 0 ? 'white' : 'black'
            } else {
              return 'black'
            }
          },
          backgroundColor: function (context) {
            if (context) {
              var index = context.dataIndex
              var datum = context.dataset.data[index]
              let toReturn = color
              if (parseInt(datum.x) < 0) {
                toReturn = RainbowMaker.getLighter(RainbowMaker.getGrayer(color, 0.7), 0.2)
              }
              return toReturn
            } else {
              return color
            }
          },
          hoverBackgroundColor: function (context) {
            if (context) {
              var index = context.dataIndex
              var datum = context.dataset.data[index]
              let toReturn = color
              if (parseInt(datum.x) < 0) {
                toReturn = RainbowMaker.getLighter(RainbowMaker.getGrayer(color, 0.7), 0.2)
              }
              return toReturn
            } else {
              return color
            }
          },
          borderWidth: 1
        })
      })

      return datasets
    },

    minimumAllowedDate () {
      return this.$store.state.minimumAllowedDate
    },

    maximumAllowedDate () {
      return this.$store.state.maximumAllowedDate
    },

    isSliderActivated () {
      return !this.datasetJustChanged && this.hasSliderBeenUsed
    },

    caseList () {
      return this.$store.state.caseLists.find(caseList => caseList.id === parseInt(this.caseListId))
    },

    caseLists () {
      return this.$store.state.caseLists
    },

    selectionCriteriaPTs () {
      return this.$store.getters.selectionCriteriaPTs
    },

    selectionCriteriaFeatures () {
      return this.uniqueTemporalFeatures.filter(feature => this.isFeatureInSelection(feature))
    },

    nonSelectionCriteriaFeatures () {
      return this.uniqueTemporalFeatures.filter(feature => !this.isFeatureInSelection(feature))
    },

    xAxis () {
      if (this.chart) {
        return this.chart.scales['x-axis-0']
      } else {
        return null
      }
    }

    // casesInView () {
    //   // Get list of cases represented by the data in view
    //   let caseIdsInView = [...new Set(this.allTemporalFeatures.filter(feature => {
    //     return feature.relative_days >= this.sliderSelectedRange[0] && feature.relative_days <= this.sliderSelectedRange[1]
    //   }).map(feature => feature['case_id']))]

    //   let casesInView = this.$store.state.userSelectedCases.filter(caseObject => {
    //     return caseIdsInView.indexOf(caseObject.case_id) !== -1
    //   })

    //   return casesInView
    // }
  },

  watch: {

    datasets (datasets) {
      if (this.caseList) {
        if (datasets.length > 0) {
          this.chart.options.scales = this.getScales()
          this.datasetJustChanged = true
          this.updateChart()
        }
      }
    },

    sliderSelectedRange () {
      if (this.isSliderActivated) {
        this.chart.options.scales.xAxes[0].ticks.min = this.sliderSelectedRange[0]
        this.chart.options.scales.xAxes[0].ticks.max = this.sliderSelectedRange[1]
        this.chart.update()
      }
    }

    // casesInView (newCasesInView, oldCasesInView) {
    //   console.log('cases in view changed', oldCasesInView, newCasesInView)
    //   console.log(this.$store.state.cases, this.$store.state.filteredCases)
    //   this.$store.commit('setFakeCaseListFilter', 'has temporal info between ' + this.sliderSelectedRange[0] + ' and ' + this.sliderSelectedRange[1] + ' days after exposure')
    //   if (oldCasesInView.length !== newCasesInView.length) {
    //     console.log('filtering cases to just those in view', newCasesInView)
    //     this.$store.commit('setFilteredCases', newCasesInView)
    //   }
    // }
  },

  methods: {
    // getCasesInView () {
    //   // Get list of cases represented by the data in view
    //   let caseIdsInView = [...new Set(this.allTemporalFeatures.filter(feature => {
    //     return feature.relative_days >= this.sliderSelectedRange[0] && feature.relative_days <= this.sliderSelectedRange[1]
    //   }).map(feature => feature['case_id']))]
    //   console.log(caseIdsInView)

    //   let casesInView = this.$store.state.userSelectedCases.filter(caseObject => {
    //     return caseIdsInView.indexOf(caseObject.case_id) !== -1
    //   })

    //   return casesInView
    // },

    getCategoryData (category) {
      if (category === this.selectionCriteriaCategory) {
        return this.selectionCriteriaFeatures
      } else {
        return this.nonSelectionCriteriaFeatures.filter(feature => feature['feature_type'] === category)
      }
    },

    isFeatureInSelection (feature) {
      let inSelection = false
      this.selectionCriteriaPTs.forEach(pt => {
        if (feature['preferred_term'].toLowerCase().indexOf(pt) !== -1) {
          inSelection = true
        }
      })
      return inSelection
    },

    // getColors (numColors) {
    //   // var colors = []
    //   // var hexColors = palette('tol', numColors)
    //   // hexColors.forEach(function (color) {
    //   //   colors.push('#' + color)
    //   // })
    //   // Needed to use custom order for colors after SE requested alterations
    //   return ['#4477aa', '#117733', '#ddcc77', '#cc6677']
    // },

    getYValue (category) {
      return this.categories.indexOf(category) + 1
    },

    getCategory (yValue) {
      let categoryMap = {
        'selection_criteria': '',
        'drug': 'Tx',
        'other_term': 'Other',
        'diagnosis': 'Dx'
      }

      categoryMap[this.selectionCriteriaCategory] = 'Selected PT'

      return categoryMap[this.categories[yValue - 1]]
    },

    getDataArray (category, rawData, minimumPTCount) {
      let data = []
      let byTerm = {}

      // Build up object with structure {ptName|drugText: {relativeDays: count, ...}, ...}
      rawData.forEach(feature => {
        let terms = []
        if (feature.feature_type === 'drug') {
          terms.push(feature.clean_text)
        } else {
          terms = feature['preferred_term'].split(';')
        }
        terms.forEach(term => {
          if (term === '') return

          // Ignore selection criteria PTs if this isn't the selection dataset
          if (category !== this.selectionCriteriaCategory && this.selectionCriteriaPTs.includes(term.toLowerCase())) {
            return
          }

          if (!(term in byTerm)) byTerm[term] = {}

          let relativeDays = feature['relative_days']

          if (!(relativeDays in byTerm[term])) {
            byTerm[term][relativeDays] = 1
          } else {
            byTerm[term][relativeDays]++
          }
        })
      })

      let splitByFeatureTypeYValue = this.getYValue(category)

      // Convert PT object into array of data points
      // x = relative_days
      // y = feature_type (label)
      // r = count of same pt with the same relative_days
      Object.keys(byTerm).forEach(term => {
        let occurrences = byTerm[term]
        Object.keys(occurrences).forEach(relativeDays => {
          let count = occurrences[relativeDays]
          if (count < minimumPTCount) return
          data.push({
            x: relativeDays,
            y: this.splitByFeatureType ? splitByFeatureTypeYValue : count,
            count,
            text: term
          })
        })
      })

      return data
    },

    loadPlaceHolderChart () {
      let size = this.datasets.map(dataset => dataset.data.length).reduce((prev, curr) => prev + curr)
      if (this.caseList && size === 0 && this.minimumPTCount > 1) {
        this.minimumPTCount = 1
      }
      let component = this
      this.chartOptions = {
        type: 'bubble',
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: this.getScales(),
          legend: {
            labels: {
              generateLabels: (chart) => {
                return chart.data.datasets.map((dataset, i) => {
                  return {
                    text: dataset.label + ' (' + dataset.data.length + ')',
                    fillStyle: dataset.backgroundColor(),
                    hidden: !chart.isDatasetVisible(i),
                    strokeStyle: dataset.borderColor(),
                    datasetIndex: i // Used for toggling the datasets
                  }
                })
              }
            }
          },
          tooltips: {
            mode: 'point',
            bodyFontSize: 16,
            titleFontSize: 22,
            callbacks: {
              label (tooltipItem, data) {
                let datum = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]
                console.log(data.datasets[tooltipItem.datasetIndex])
                let text = datum['text']
                let count = datum['count']
                // return ptName + ' (' + count + ')'
                return {
                  'text': text + ' (' + count + ')',
                  'datum': datum
                }
              },
              title (tooltipItems, data) {
                let days = [...new Set(tooltipItems.map(item => parseInt(item.xLabel)))].sort((a, b) => a - b)
                // component.activeElements = tooltipItems
                if (days.filter(day => day !== 0).length === 0) {
                  return 'On Day: 0'
                } else if (component.groupByDays > 1 || days.length > 4) {
                  let daysFrom = parseInt(days[0])
                  if (component.groupByDays > 1) {
                    let rangeId = Math.floor((days[0] - 1) / component.groupByDays)
                    daysFrom = rangeId * component.groupByDays + 1
                  }
                  let daysTo = days[days.length - 1]
                  if (daysTo < 0 && daysTo >= -component.groupByDays) {
                    daysTo = -1
                  }
                  return 'Between: ' + daysFrom + ' and ' + daysTo + ' days'
                } else {
                  return 'On Day: ' + days.join(', ')
                }
              }
            },

            // Disable the on-canvas tooltip
            enabled: false,

            custom (tooltipModel) {
              // Tooltip Element
              var tooltipEl = document.getElementById('timeline-tooltip')

              // Create element on first render
              if (!tooltipEl) {
                tooltipEl = document.createElement('div')
                tooltipEl.id = 'timeline-tooltip'
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

              function getBody (bodyItem) {
                return bodyItem.lines[0]
              }

              // Set Text
              if (tooltipModel.body) {
                var titleLines = tooltipModel.title || []
                var bodyLines = tooltipModel.body.map(getBody).map((body, i) => {
                  body['originalIndex'] = i
                  return body
                })
                  .sort((a, b) => a.text.toLowerCase() > b.text.toLowerCase() ? 1 : -1)
                  .sort((a, b) => b.datum.count - a.datum.count)

                var innerHtml = '<thead>'

                titleLines.forEach(title => {
                  innerHtml += '<tr><th>' + title + '</th></tr>'
                })
                innerHtml += '</thead><tbody>'

                // Cut off too many items
                let additional = 0

                if (bodyLines.length > 30) {
                  additional = bodyLines.length - 33
                  bodyLines = bodyLines.slice(0, 33)
                }

                bodyLines.forEach((body, i, lines) => {
                  var colors = tooltipModel.labelColors[body.originalIndex]
                  var style = 'background:' + colors.backgroundColor
                  style += '; border-color:' + colors.borderColor
                  style += '; border-width: 2px'
                  var span = '<span class="indicator" style="' + style + '"></span>'
                  innerHtml += '<tr><td>' + span + body.text + '</td></tr>'
                })
                if (additional > 0) {
                  innerHtml += '<tr><td>And ' + additional + ' more</td></tr>'
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
              // Adjust position if too many elements
              if (bodyLines.length > 15) {
                tooltipEl.style.top = ''
                tooltipEl.style.bottom = '10px'
              } else {
                tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px'
                tooltipEl.style.bottom = ''
              }
              tooltipEl.style.fontFamily = tooltipModel._bodyFontFamily
              tooltipEl.style.fontSize = tooltipModel.bodyFontSize + 'px'
              tooltipEl.style.fontStyle = tooltipModel._bodyFontStyle
              tooltipEl.style.padding = tooltipModel.yPadding + 'px ' + tooltipModel.xPadding + 'px'
              tooltipEl.style.pointerEvents = 'none'
              tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px'
            }
          },
          onHover (event, activeElements) {
            // component.onTimelineHovered(event)
            // if (activeElements.length === 0) {
            //   component.activeElements = []
            // }
          },
          onClick: (event, activeElements) => {
            // component.onTimelineClicked(event, this)
            // if (activeElements.length !== 0) {
            //   component.onTimelineClicked(event, activeElements)
            // }
          }
        },
        data: {
          datasets: this.datasets
        }
      }

      return new Chart(this.chartId, this.chartOptions)
    },

    getScales () {
      let component = this

      let yAxes = [{
        scaleLabel: {
          display: true,
          labelString: 'Number of Reports Mentioning PT'
        },
        ticks: {
          suggestedMin: this.splitByFeatureType ? 0 : this.minimumPTCount - 1,
          callback (value, index, values) {
            if (component.splitByFeatureType) {
              let fullLabel = component.getCategory(value)
              let label = typeof fullLabel !== 'undefined' && fullLabel.length > 15 ? fullLabel.slice(0, 12) + '...' : fullLabel
              return label
            } else {
              return value
            }
          }
        }
      }]

      if (this.splitByFeatureType) {
        yAxes[0]['ticks']['suggestedMax'] = 5
      } else {
        let maxY = Math.max(...this.datasets.map(dataset => Math.max(...dataset.data.map(point => point.y))))
        yAxes[0]['ticks']['suggestedMax'] = maxY + 1
      }

      return {
        xAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'Number of Days After Exposure'
          },
          afterUpdate (axis) {
            // If the dataset has just changed, also set the selected range
            if (component.datasetJustChanged || !component.hasSliderBeenUsed) {
              // Update slider min/max
              // console.log('updating max bounds to: ' + [axis.min, axis.max])
              component.sliderMin = axis.min
              component.sliderMax = axis.max
            }

            // Update range components if axis min/max have moved "inside" of the range
            if (component.sliderSelectedRange[0] < axis.min) {
              component.sliderSelectedRange.splice(0, 1, axis.min < -200 ? -200 : axis.min)
            }

            if (component.sliderSelectedRange[1] > axis.max) {
              component.sliderSelectedRange.splice(1, 1, axis.max)
            }

            // If the slider hasn't been adjusted by the user, set range to a reasonable min/max
            if (!component.hasSliderBeenUsed) {
              component.sliderSelectedRange = [axis.min < -200 ? -200 : axis.min, axis.max]
              component.hasSliderBeenUsed = true
            }

            if (component.datasetJustChanged) {
              // Set range to a reasonable min/max if minimum PT count is 1 (to catch changing from 2 to 1)
              if (component.minimumPTCount === 1 || component.groupByDays > 1) {
                component.sliderSelectedRange = [axis.min < -200 ? -200 : axis.min, axis.max]
              }

              component.chart.options.scales.xAxes[0].ticks.min = component.sliderSelectedRange[0]
              component.chart.options.scales.xAxes[0].ticks.max = component.sliderSelectedRange[1]
              component.datasetJustChanged = false
              // component.chart.update()
            }
          },
          ticks: {
            // min: this.sliderSelectedRange[0],
            // max: this.sliderSelectedRange[1]
          }
        }],
        yAxes
      }
    },

    updateChart () {
      let size = this.datasets.map(dataset => dataset.data.length).reduce((prev, curr) => prev + curr)
      if (this.caseList && size === 0 && this.minimumPTCount > 1) {
        this.minimumPTCount = 1
      } else {
        this.chart.data.datasets = this.datasets
        this.chart.update()
      }
      // this.range = this.getChartXRange()
    },

    getChartXRange () {
      let min = this.chart.options.scales.xAxes[0].ticks.min
      let max = this.chart.options.scales.xAxes[0].ticks.max
      this.min = min
      this.max = max
      return [min, max]
    },

    onResetSliderClick () {
      // this.$store.commit('resetFilter')
      this.chart.options.scales = this.getScales()
      this.hasSliderBeenUsed = false
      this.updateChart()
    },

    onTimelineHovered (event) {
    },

    onTimelineClicked (event, activeElements) {
      // console.log(this.sliderSelectedRange[0])
      // console.log(event, activeElements, context)
      // TODO Below filters by PTs on the day(s) clicked
      // Instead, I want to filter the reports by the time range shown
      let relativeDaysClicked = activeElements.map(element => parseInt(this.chart.data.datasets[element._datasetIndex].data[element._index].x))

      if (relativeDaysClicked.length > 0) {
        let caseIdsClicked = [...new Set(this.allTemporalFeatures.filter(feature => {
          return feature.relative_days >= relativeDaysClicked[0] &&
            feature.relative_days <= relativeDaysClicked[0]
        }).map(feature => feature['case_id']))]

        let casesClicked = this.$store.state.userSelectedCases.filter(caseObject => {
          return caseIdsClicked.indexOf(caseObject.case_id) !== -1
        })

        console.log(casesClicked)
        this.$store.commit('setFakeCaseListFilter', 'has temporal info on ' + relativeDaysClicked[0] + ' days after exposure')
        this.$store.commit('setFilteredCases', casesClicked)
        let tooltip = document.getElementById('timeline-tooltip')
        tooltip.style.display = 'none'
        tooltip.style.opacity = '0'
      }

      // let caseIdsClicked = [...new Set(this.allTemporalFeatures.filter(feature => {
      //   return feature.relative_days >= this.sliderSelectedRange[0] &&
      //     feature.relative_days <= this.sliderSelectedRange[1]
      // }).map(feature => feature['case_id']))]

      // let casesInView = this.$store.state.userSelectedCases.filter(caseObject => {
      //   return caseIdsInView.indexOf(caseObject.case_id) !== -1
      // })

      // console.log(dataItems)
      // let pts = dataItems.map(item => item.pt_name)
      // this.$store.commit('setCaseListFilter', pts.join(' '))
      // this.$store.dispatch('populateCaseList')
      // // TODO Tooltip should be in the template and chartjs options should only update component data
      // document.getElementById('timeline-tooltip').remove()
    },

    dragStart () {
      this.selectStart = this.getDataHoveredX()
      this.selectStartPercent = this.getMousePercent()
    },

    dragMove () {
      // Set updated left and right for slider
      let currentPercent = this.getMousePercent()
      let minPercent = Math.min(currentPercent, this.selectStartPercent)
      let maxPercent = Math.max(currentPercent, this.selectStartPercent)
      let percentSelected = maxPercent - minPercent
      if (!this.selectingZoom && percentSelected > 0.01) {
        this.selectingZoom = true
      }
      let chartWidth = this.getChartWidth()
      this.sliderLeft = Math.max(minPercent * chartWidth + this.yAxisWidth, this.yAxisWidth)
      this.sliderRight = Math.max(chartWidth - maxPercent * chartWidth + this.chartPaddingRight, this.chartPaddingRight)
    },

    dragEnd () {
      if (this.selectingZoom) {
        this.selectEnd = this.getDataHoveredX()
        this.selectingZoom = false
        let min = Math.min(this.selectStart, this.selectEnd)
        let max = Math.max(this.selectStart, this.selectEnd)
        this.sliderSelectedRange = [min, max]
      }
    },

    getMousePercent () {
      // For the axis TODO Is there a less hacky way to get these magic numbers?
      let relativeX = d3.mouse(this.chart.canvas)[0] - this.yAxisWidth
      let chartWidth = this.getChartWidth()
      return relativeX / chartWidth
    },

    getChartWidth () {
      // For the axis TODO Is there a less hacky way to get these magic numbers?
      let chartRect = this.chart.canvas.getBoundingClientRect()
      return chartRect.right - chartRect.left - this.yAxisWidth - this.chartPaddingRight
    },

    getDataHoveredX () {
      if (this.chart && this.dragBehavior) {
        let mousePercent = this.getMousePercent()
        let dataHoveredX = Math.round((this.xAxis.max - this.xAxis.min) * mousePercent + this.xAxis.min)
        if (dataHoveredX > this.xAxis.max) {
          return this.xAxis.max
        } else if (dataHoveredX < this.xAxis.min) {
          return this.xAxis.min
        } else if (dataHoveredX >= this.xAxis.min && dataHoveredX <= this.xAxis.max) {
          return dataHoveredX
        }
      }

      return 0
    },

    getVisibleCases () {
      let visibleCases = [...new Set(
        this.uniqueTemporalFeatures
          .filter(feature => {
            return feature.relative_days >= this.xAxis.min && feature.relative_days <= this.xAxis.max
          })
          .map(feature => feature.case_id)
      )]
      // console.log(this.xAxis.min, this.xAxis.max)
      // console.log(visibleCases)
      return visibleCases
    },

    initZoomSelection () {
      this.chartElement = d3.select('#' + this.chartId)
      this.dragBehavior = d3.drag()
        .on('start', () => this.dragStart())
        .on('drag', () => this.dragMove())
        .on('end', () => this.dragEnd())
      this.chartElement.call(this.dragBehavior)
      this.chartElement.on('dblclick', () => this.onResetSliderClick())
    },

    setInterval (interval) {
      if (interval === 'custom') {
        this.customInterval = true
      } else {
        this.groupByDays = interval
      }
    },

    setCustomInterval (interval) {
      let parsedInterval = parseInt(interval)
      if (isNaN(parsedInterval)) {
        this.$store.commit('setError', 'Interval must be a number')
      } else {
        this.groupByDays = interval
      }
    },

    disableCustomInterval () {
      this.customInterval = false
      this.groupByDays = 10
    }
  },

  mounted () {
    this.chart = this.loadPlaceHolderChart()
    this.initZoomSelection()
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.viz-container {
  position: relative;
  /* padding-top: 10px; */
  margin-top: 5px;
}

.viz {
  margin-top: 24px;
  height: 496px;
}

.temporal-note {
  position: absolute;
  background-color: rgba(255,255,255,0.8);
  padding-left: 3px;
  padding-right: 3px;
  border-radius: 10px;
}

.help-toggles {
  position: absolute;
  right: 0px;
}

.help-toggle, .term-help-toggle {
  display: inline-block;
  cursor: pointer;
  margin-right: 5px;
  color: gray;
}

.controls div {
  padding-left: 8px;
  padding-right: 8px;
}

.controls div:first-child {
  padding-left: 15px;
}

.controls div:last-child {
  padding-right: 15px;
}

.pt-count-selection select, .group-selection select, .group-selection input {
  display: inline-block;
  padding-left: 10px;
}

.pt-count-selection select {
  width: 50px;
}

.group-selection select {
  width: 100px;
}

.group-selection input {
  width: 70px;
}

.split-by-type-selection input {
  margin-top: 10px;
  margin-bottom: 10px;
}

.zoom-slider {
  position: absolute;
  top: 56px;
  bottom: 20px;
  background-color: #4474;
}
</style>
