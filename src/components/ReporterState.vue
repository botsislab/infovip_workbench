<template>
  <div>
    <h2>Reporter State</h2>
    <div class="card">
      <div class="dull">Number of Cases for Reporter State</div>
      <div class="card-content">
        <div class="viz-container">
          <div ref="map" id='usa_map'></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import MapService from '../api/MapService'
import DataMunger from '../util/DataMunger'
import Datamap from 'datamaps'
// import * as palette from 'google-palette'

export default {
  name: 'ReporterState',

  data: function () {
    return {
      datasets: []
    }
  },

  methods: {

    processData (serviceData) {
      let data = {}

      // Build object with counts and save bounds
      let groupedCounts = DataMunger.getGroupedCounts(serviceData, 'Fake State')
      let min = Math.min.apply(null, Object.values(groupedCounts))
      let max = Math.max.apply(null, Object.values(groupedCounts))

      // Pick boundaries
      let third = Math.round((max - min) / 3)
      let high = max - third
      let medium = min + third

      // Generate key names
      let highKey = '> ' + high + ' Cases'
      let mediumKey = '> ' + medium + ' Cases'
      let lowKey = '< ' + medium + ' Cases'

      data = DataMunger.mapToObjectValues(groupedCounts, function (value) {
        if (value > high) {
          return { 'fillKey': highKey }
        } else if (value > medium) {
          return { 'fillKey': mediumKey }
        } else {
          return { 'fillKey': lowKey }
        }
      })

      // Include key names in data
      data['highKey'] = highKey
      data['mediumKey'] = mediumKey
      data['lowKey'] = lowKey

      return data
    }
  },

  mounted: function () {
    let self = this

    // Get data from service and contruct map
    MapService.getMapData()
      .then(function (response) {
        let data = self.processData(response.data)

        let options = {
          scope: 'usa',
          element: self.$refs.map,
          responsive: true,
          geographyConfig: {
            borderColor: '#bbb',
            highlightBorderColor: '#888',
            highlightFillColor: 'white',
            // popupTemplate: function (geography, data) {
            //   return '<div class="hoverinfo"></div>'
            // },
            highlightBorderWidth: 2
          },
          fills: {
            defaultFill: '#dddddd'
          },
          data: data
        }

        options.fills[data['highKey']] = '#2E7D32'
        options.fills[data['mediumKey']] = '#66BB6A'
        options.fills[data['lowKey']] = '#C8E6C9'

        let usaMap = new Datamap(options)

        usaMap.labels()
        usaMap.legend()
      })
  }
}
</script>

<!-- Add 'scoped' attribute to limit CSS to this component only -->
<style scoped>
.card {
  min-width: 90%;
}
</style>
