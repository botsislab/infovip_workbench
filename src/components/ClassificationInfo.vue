<template>
  <div class="col">
    <div class="row no-gutters" v-if="classification">
      <div
        class="feature overall-score col"
        :class="classification.classification.toLowerCase()"
        id="overall-score"
      >
        <div>
          {{ classification.classification }}
        </div>
        <b-tooltip
          target="overall-score"
          placement="bottom"
        >
          <div class="feature-tooltip-title">
            Overall Report Classification
          </div>
          <div class="feature-tooltip-value">
            {{ classification.classification || 'N/A' }}
          </div>
          <span class="feature-tooltip-description" v-if="classification.classification">
            This means the current model thinks this report has a {{ classification.classification.toLowerCase() }} probability of supporting causal inference
          </span>
        </b-tooltip>
      </div>
      <div
        v-for="feature in features"
        :key="feature.feature_name"
        class="feature col"
        :class="feature.feature_weight >= 0 ? 'positive-weight': 'negative-weight'"
      >
        <div class="icon-wrapper">
          <div
            v-if="feature.feature_name === 'PreCuratedTermEvaluator'"
            :id="feature.feature_name"
            class="causal-icon"
          >
            p <font-awesome-icon icon="long-arrow-alt-right" /> q
          </div>
          <font-awesome-icon
            v-else
            :id="feature.feature_name"
            :icon="getIconName(feature.feature_name)"
          />
        </div>
        <div class="short-description">{{ getFeatureShortDescription(feature) }}</div>
        <b-tooltip
          :target="feature.feature_name"
          placement="bottom"
        >
          <div class="feature-tooltip-title">
            {{ feature.display_name }}
          </div>
          <div class="feature-tooltip-value">
            {{ getFeatureValue(feature) }}
          </div>
          <span class="feature-tooltip-description" v-if="feature.description">{{ feature.description }}</span>
        </b-tooltip>
      </div>
    </div>
  </div>
</template>

<script>
export default {

  props: ['classification'],

  data () {
    return {
      featureNameIconMap: {
        'DrugInducedTermEvaluator': 'pills',
        'NarrativeLengthEvaluator': 'file-alt',
        'ExpertReporterEvaluator': 'user-md',
        'ReasonableTimeFrameEvaluator': 'calendar'
        // 'SymptomsBeforeEvaluator': 'mask'
      }
    }
  },

  computed: {
    features () {
      return this.classification.features.filter(feature => feature.feature_name in this.featureNameIconMap || feature.feature_name === 'PreCuratedTermEvaluator')
    }
  },
  methods: {

    getIconName (featureName) {
      if (featureName in this.featureNameIconMap) {
        return this.featureNameIconMap[featureName]
      }
      return ''
    },

    getFeatureValue (feature) {
      if (feature.feature_name === 'NarrativeLengthEvaluator') {
        return feature.feature_value + ' characters'
      } else {
        return feature.feature_value
      }
    },

    getFeatureShortDescription (feature) {
      if (feature.feature_name === 'DrugInducedTermEvaluator') {
        if (feature.feature_value === 'True') {
          return 'Mentions drug-induced'
        } else if (feature.feature_value === 'False') {
          return 'Doesn\'t mention drug-induced'
        }
      } else if (feature.feature_name === 'ExpertReporterEvaluator') {
        if (feature.feature_value === 'True') {
          return 'Expert reporter'
        } else if (feature.feature_value === 'False') {
          return 'Not expert reporter'
        }
      } else if (feature.feature_name === 'PreCuratedTermEvaluator') {
        if (feature.feature_value === 'True') {
          return 'Uses causal terms'
        } else if (feature.feature_value === 'False') {
          return 'No causal terms'
        }
      } else if (feature.feature_name === 'ReasonableTimeFrameEvaluator') {
        if (feature.feature_value === 'True') {
          return 'Onset within 30 days'
        } else if (feature.feature_value === 'False') {
          return 'Onset past 30 days or unknown'
        }
      }
      return ''
    }
  }
}
</script>

<style scoped>
.box {
  overflow: hidden;
}

.feature {
  font-size: 2.5em;
  text-align: center;
  vertical-align: middle;
}

.feature .causal-icon {
  font-style: italic;
  font-weight: bold;
  font-size: 25px;
}

.feature .short-description {
  font-size: 0.4em;
  color: gray;
}

.feature .icon-wrapper {
  height: 1.5em;
}

.feature-tooltip-title {
  font-size: 1.2em;
  font-weight: bold;
}

.feature-tooltip-value {
  font-size: 1.8em;
}

.feature.positive-weight {
  color: rgb(17, 119, 51);
  /* opacity: 0.3; */
}

.feature.negative-weight {
  color: rgb(204, 102, 119);
  /* opacity: 0.3; */
}

.overall-score {
  font-weight: bold;
}

.overall-score.high {
  /* color: rgb(44, 162, 95); */
  color: rgb(68, 119, 170);
}

.overall-score.medium {
  /* color: rgb(153, 216, 201); */
  color: rgb(221, 204, 119);
}

.overall-score.low {
  /* color: rgb(229, 245, 249); */
  color: rgb(204, 102, 119);
}

.overall-score.unassessable {
  color: rgb(115, 115, 115)
}
</style>
