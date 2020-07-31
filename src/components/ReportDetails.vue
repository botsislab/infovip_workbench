<template>
  <div class="col">
    <div class="row">
      <div class="col-6">
        <div class="row"><div class="col">
          <span class="field-title">Received </span>
          <span class="dull">{{ report.initial_fda_received_date }}</span>
        </div></div>
        <div class="row"><div class="col">
          <span class="field-title">Age in Years </span>
          <span class="dull">{{ report.age_in_years }}</span>
        </div></div>
        <div class="row"><div class="col">
          <span class="field-title">Sex </span>
          <span class="dull">{{ report.sex }}</span>
        </div></div>
        <div class="row"><div class="col">
          <span class="field-title">Outcomes </span>
          <span class="dull">{{ report.all_outcomes }}</span>
        </div></div>
      </div>
      <div class="col-6">
        <div class="row"><div class="col">
          <span class="field-title">Sender </span>
          <span class="dull">{{ report.sender_mfr_organization }}</span>
        </div></div>
        <div class="row"><div class="col">
          <span class="field-title">Country (Derived) </span>
          <span class="dull">{{ report.country_derived }}</span>
        </div></div>
        <div class="row"><div class="col">
          <span class="field-title">Concomitants </span>
          <span class="dull">{{ report.all_concomitants ? report.all_concomitants.replace(/:/g, ', ') : '' }}</span>
        </div></div>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <span class="field-title">All PTs </span>
        <span class="dull">{{ getPrettyValue('all_pts', report.all_pts) }}</span>
      </div>
    </div>
    <div style="text-align:center">
      <button class="btn show-fields-button" @click="showFields = !showFields">{{ showFields ? 'Hide Additional Fields' : 'Show Additional Fields' }}</button>
    </div>
    <transition name="expand">
      <div v-if="showFields" class="extra-fields-container">
        <div
          class="row"
          v-for="(value, key) in getExtraReportFields()"
          :key="key"
        >
          <div class="col">
            <span class="field-title">{{ key }} </span>
            <span class="dull">{{ value }}</span>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import util from '@/util/util'

export default {

  props: ['report'],

  data () {
    return {
      topFields: [
        'case_id',
        'faers_case_number',
        'version_number',
        'initial_fda_received_date',
        'age_in_years',
        'sex',
        'all_outcomes',
        'sender_mfr_organization',
        'country_derived',
        'all_concomitants',
        'all_pts',
        'narrative',
        'image_link',
        'attachments_link'
      ],
      delimitedFields: [
        'all_pts',
        'all_hlts',
        'all_llts',
        'all_hlgts',
        'all_socs'
      ],
      showFields: false
    }
  },

  methods: {
    getExtraReportFields () {
      let fields = {}
      for (let key in this.report) {
        let value = this.report[key]
        if (this.topFields.indexOf(key) !== -1 || typeof value === 'object') {
          continue
        }
        fields[this.getPrettyKey(key)] = this.getPrettyValue(key, value)
      }
      return fields
    },

    getPrettyKey (key) {
      return util.toTitleCase(key.replace(/_/g, ' '))
    },

    getPrettyValue (key, value) {
      // Make delimited value fields easier to read
      if (this.delimitedFields.indexOf(key) !== -1) {
        return value.split(/:|;/g).map(delimitedValue => util.toTitleCase(delimitedValue)).join(', ')
      }
      return value
    }
  }
}
</script>

<style scoped>
.field-title {
  font-weight: 500;
}

.extra-fields-container {
  overflow: scroll;
  height: 400px;
}

.show-fields-button {
  margin-bottom: 10px;
}

.expand-enter-active, .expand-leave-active {
  transition: all 1s ease;
}

.expand-enter, .expand-leave-to {
  opacity: 0;
  height: 0;
}
</style>
