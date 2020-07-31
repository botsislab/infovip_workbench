<template>
  <div>
    <!-- // https://alligator.io/vuejs/dynamic-components/ -->
    <component class="viz-component" :is="getVizComponent">
      <select v-model="vizName" class="custom-select viz-selection">
        <option v-for="(label, name) in vizComponentNameMap" :key="name" :value="name">{{ label }}</option>
      </select>
    </component>
  </div>
</template>

<script>
import PTBubbles from './PTBubbles.vue'
import CaseSeriesTimelineRelativeGrouped from './CaseSeriesTimeline.vue'
import BubbleGroups from './BubbleGroups.vue'
import ClassificationHeatmap from './ClassificationHeatmap.vue'

export default {

  computed: {

    getVizComponent () {
      if (this.vizName in this.vizComponentMap) {
        return this.vizComponentMap[this.vizName]
      }

      return PTBubbles
    }
  },

  data () {
    return {
      vizName: 'pt-bubbles',
      // vizName: 'classification-heatmap',
      // vizName: 'report-groups',
      vizComponentMap: {
        'classification-heatmap': ClassificationHeatmap,
        'pt-bubbles': PTBubbles,
        'case-series-timeline': CaseSeriesTimelineRelativeGrouped,
        'report-groups': BubbleGroups
      },
      vizComponentNameMap: {
        // 'classification-heatmap': 'Classification Heatmap',
        'pt-bubbles': 'All PTs Prevalence',
        'case-series-timeline': 'Timeline'
        // 'report-groups': 'Report Groups'
      }
    }
  },

  created () {
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.viz-component {
  padding: 0px;
}
</style>
