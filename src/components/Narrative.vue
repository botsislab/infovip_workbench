<template>
  <div class="col">
    <div class="row">
      <div class="col">
        <div class="heading">Narrative&nbsp;</div>
        <span v-if="report.features.length > 0">
          <label style="margin: 0px" for="narrative-show-annotations">Show Annotations&nbsp;</label>
          <input v-model="showAnnotations" id="narrative-show-annotations" type="checkbox" />
          <span class="smaller" v-if="showAnnotations"> (darker: has temporal info)</span>
        </span>
        <span class="smaller" v-else>(No extracted information)</span>
        <button v-if="clickedFeatures.length > 0" @click="clearSelected" style="float:right;margin-top:10px" class="btn btn-secondary btn-sm">Clear Selected</button>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <div ref="narrative-box" class="box">
          <!-- NARRATIVE TEXT -->
          <span
            :class="[{ 'temporal': isValidTemporalFeature(item), 'annotation': showAnnotations, 'hide': isHidden(item) }, getAnnotationClass(item)]"
            v-for="(item, index) in report.narrative_markup"
            :key="index"
            :ref="item['start_position']"
          >
            <span v-for="(line, lineIndex) in item.text.split('\n')" :key="lineIndex">
              <br v-if="lineIndex > 0" />
              {{ line }}
            </span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {

  props: ['report'],

  data () {
    return {
    }
  },

  computed: {

    hoveredFeatures () {
      return this.$store.state.hoveredFeatures
    },

    clickedFeatures () {
      return this.$store.state.clickedFeatures
    },

    minimumAllowedDate () {
      return this.$store.state.minimumAllowedDate
    },

    maximumAllowedDate () {
      return this.$store.state.maximumAllowedDate
    },

    showAnnotations: {
      get () {
        return this.$store.state.showAnnotations
      },

      set (showAnnotations) {
        this.$store.commit('setShowAnnotations', showAnnotations)
      }
    }
  },

  watch: {

    clickedFeatures (features) {
      if (features.length > 0) {
        // Use start position because this might be a duplicate time feature that doesn't show up in the narrative markup
        let target = this.$refs[features[0]['start_position']][0]
        let targetOffset = target.offsetTop > 50 ? target.offsetTop - 50 : 0
        this.$refs['narrative-box'].scrollTop = targetOffset
      }
    }
  },

  methods: {

    isValidTemporalFeature (feature) {
      if (feature['feature_temp_start'] === null || typeof feature['feature_temp_start'] === 'undefined') {
        return false
      }

      let date = new Date(feature['feature_temp_start'])
      if (date < this.minimumAllowedDate || date > this.maximumAllowedDate) {
        return false
      }

      return true
    },

    isHovering (item) {
      return this.hoveredFeatures.filter(feature => feature['start_position'] === item['start_position']).length > 0
    },

    isClicked (item) {
      return this.clickedFeatures.filter(feature => feature['start_position'] === item['start_position']).length > 0
    },

    isHidden (item) {
      // Hovering overrides anything else
      if (this.isHovering(item)) return false

      // Hide if we aren't hovering or clicking on this item
      return (this.hoveredFeatures.length !== 0 && !this.isHovering(item)) || (this.clickedFeatures.length !== 0 && !this.isClicked(item))
    },

    clearSelected () {
      this.$store.commit('unsetClickedFeatures')
    },

    inSelectionCriteria (pt) {
      return this.$store.getters.allRelatedSelectionCriteriaPTs.indexOf(pt) !== -1
    },

    getAnnotationClass (annotationItem) {
      if (annotationItem.pt && this.inSelectionCriteria(annotationItem.pt.toLowerCase())) {
        return 'selection_criteria'
      }
      return annotationItem.type
    }
  }
}
</script>

<style scoped>
</style>
