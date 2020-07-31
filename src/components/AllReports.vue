<template>
  <div>
    <h2>All Reports</h2>
    <div class="container-fluid">
      <div class="row">
        <div class="col">
          <case-listing v-model="reports" :excludeEnabled="false"></case-listing>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CaseService from '@/api/CaseService'
import CaseListing from '@/components/CaseListing.vue'

export default {
  components: {
    'case-listing': CaseListing
  },

  data () {
    return {
      reports: []
    }
  },

  beforeRouteUpdate (to, from, next) {
    if (to.path === from.path) {
      this.reloadCaseLists()
    }
  },

  methods: {
    loadReports () {
      CaseService.getAllReports()
        .then((response) => { this.reports = response.data })
        .catch((error) => self.$store.commit('setError', error))
    }
  },

  created () {
    this.loadReports()
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
