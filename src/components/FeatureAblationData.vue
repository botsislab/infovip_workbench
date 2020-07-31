<template>
  <div>
    <h3>Feature Ablation Data</h3>
    <table class="table">
      <thead>
        <tr>
          <th
            v-for="field in fields"
            :key="field"
            @click="onHeaderClick(field)"
            :style="{'cursor': 'pointer' }"
          >
            {{ field }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(ablation, index) in sortedData"
          :key="index"
        >
          <td
            v-for="field in fields"
            :key="field"
            :style="{
              'background-color': numberFields.indexOf(field) !== -1 ? getColor(ablation[field]) : 'white'
            }"
          >
            <!-- {{ numberFields.indexOf(field) !== -1 ? (ablation[field]*100).toFixed(1) + '%' : ablation[field] }} -->
            {{ numberFields.indexOf(field) !== -1 ? ablation[field].toFixed(3) : ablation[field] }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
// import Chart from 'chart.js'
import * as d3 from 'd3v4'
// import * as palette from 'google-palette'
import AblationService from '@/api/AblationService'

export default {

  data () {
    return {
      fields: [
        'classification_task',
        'model',
        // 'feature',
        'feature_source',
        'recall',
        'precision',
        'f1',
        'change_in_recall',
        'change_in_precision',
        'change_in_f1'
      ],
      numberFields: [
        'recall',
        'precision',
        'f1',
        'change_in_recall',
        'change_in_precision',
        'change_in_f1'
      ],
      color: d3.scaleLinear()
        .domain([-0.1, 0, 0.9])
        .range(['rgb(255,0,0)', 'rgb(255,255,255)', 'rgb(0,255,0)']),
      sortField: 'change_in_recall',
      sortAscending: false,
      sortedData: []
    }
  },

  computed: {
    ablationData () {
      let ablationData = []
      let rawAblationData = this.rawAblationData
      let ablationObject = {}

      // For each row, add to object keyed by classification_task|model|feature_source
      rawAblationData.forEach(row => {
        let key = row.classification_task + '|' + row.model + '|' + row.feature_source
        if (key in ablationObject) {
          ablationObject[key].push(row)
        } else {
          ablationObject[key] = []
        }
      })

      for (let key in ablationObject) {
        let groupValues = key.split('|')
        let newRow = {
          'classification_task': groupValues[0],
          'model': groupValues[1],
          'feature_source': groupValues[2]
        }
        this.numberFields.forEach(numberField => {
          let numbers = ablationObject[key].map(row => row[numberField])
          newRow[numberField] = this.median(numbers)
        })
        ablationData.push(newRow)
      }

      return ablationData
    },

    rawAblationData () {
      return AblationService.getAblationData()
    }
  },

  methods: {
    getColor (value) {
      return this.color(value)
    },

    onHeaderClick (field) {
      // If clicking on the same field, just change sort order
      if (field === this.sortField) {
        this.sortAscending = !this.sortAscending
      } else {
        this.sortField = field
        this.sortAscending = true
      }

      this.sortedData = this.getSortedData()
    },

    // #Source https://bit.ly/2neWfJ2
    median (arr) {
      let mid = Math.floor(arr.length / 2)
      let nums = [...arr].sort((a, b) => a - b)
      return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2
    },

    getSortedData () {
      if (this.sortedData.length === 0) {
        this.sortedData = this.ablationData.slice()
      }
      return this.sortedData.sort((a, b) => {
        if (this.numberFields.indexOf(this.sortField) !== -1) {
          return this.sortAscending ? a[this.sortField] - b[this.sortField] : b[this.sortField] - a[this.sortField]
        } else {
          if (a[this.sortField] < b[this.sortField]) return this.sortAscending ? -1 : 1
          if (a[this.sortField] > b[this.sortField]) return this.sortAscending ? 1 : -1
          return 0
        }
      })
    }
  },

  mounted () {
    this.sortedData = this.getSortedData()
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
