<template>
  <div>
    <h2>Excluded Cases</h2>
    <div class="heading" v-if="this.$store.state.excludedCases.length === 0">No cases have been excluded from this case series</div>
    <div class="container-fluid">
      <case-listing v-model="excludedCases" :excludeEnabled="false">
        <template slot-scope="slotProps">
          <div class="col-auto exclusion-container">
            <div class="row">
              <div class="col">
                <div class="exclusion-category">{{ slotProps.caseObject.exclusion_category }}</div>
              </div>
              <div class="col">
                <button class="btn btn-secondary btn-sm" @click="includeCase(slotProps.caseObject.case_id)">Re-Include</button>
              </div>
            </div>
          </div>
        </template>
      </case-listing>
    </div>
  </div>
</template>

<script>
import CaseListing from './CaseListing.vue'

export default {

  props: ['case_list_id'],

  components: {
    'case-listing': CaseListing
  },

  data () {
    return {
    }
  },

  computed: {

    excludedCases () {
      return this.$store.state.excludedCases
    }
  },

  methods: {

    includeCase (caseId) {
      this.$store.dispatch('includeCase', { 'case_id': caseId, 'case_list_id': this.case_list_id })
    }
  },

  created () {
    this.$store.dispatch('populateCaseList', this.case_list_id)
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.exclusion-container button {
  width: 8em;
  margin-top: 0.2em;
}

.exclusion-category {
  border-radius: 10px;
  padding-left: 5px;
  padding-right: 5px;
  margin-top: 0.5em;
  background-color: #4292c6;
  color: white;
}
</style>
