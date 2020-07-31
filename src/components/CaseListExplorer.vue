<template>
  <div>
    <div class="row top-bar">
      <div class="col-auto">
        <span class="number-of-cases">
          {{ numberOfCases }} reports
        </span>
        <div v-if="caseListLoaded && excludedInfo" class="number-of-hidden-cases">(<router-link :to="'/excluded_cases/' + case_list_id">{{ excludedInfo }}</router-link>)</div>
      </div>
      <div class="col">
        <div class="selection-criteria" id="selection-criteria-section">
          <div class="drug-selection">{{ drugSelectionText }}</div><br />
          <div class="pt-selection">{{ ptSelectionText }}</div>
          <b-popover
            target="selection-criteria-section"
            triggers="hover"
            placement="right"
            title="Selection Criteria"
          >
            <div><strong>Product: </strong>{{ drugSelectionText }}</div>
            <div><strong>Event: </strong>{{ ptSelectionText }}</div>
          </b-popover>
        </div>
      </div>
      <div class="col-4">
        <input type="text" v-model="searchQuery" @keydown.enter="onSearchEnter" placeholder="Search..." class="form-control" />
      </div>
    </div>
    <div class="row">
      <div class="col exploring-sections">
        <div class="row">
          <div class="col">
            <div class="card">
              <div class="row">
                <explorer-viz-section class="col-8"></explorer-viz-section>
                <explorer-case-list-section class="col-4"></explorer-case-list-section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col case-viewer-section">
        <router-view class="card">
        </router-view>
      </div>
    </div>
  </div>
</template>

<script>
import ExplorerCaseListSection from './ExplorerCaseListSection.vue'
import ExplorerVizSection from './ExplorerVizSection.vue'
import util from '@/util/util'

export default {

  props: ['case_list_id'],

  components: {
    'explorer-case-list-section': ExplorerCaseListSection,
    'explorer-viz-section': ExplorerVizSection
  },

  data () {
    return {
      searchQuery: ''
    }
  },

  computed: {

    numberOfCases () {
      return this.$store.state.cases.length
    },

    caseListLoaded () {
      return this.$store.state.caseListLoaded
    },

    excludedInfo () {
      let numberExcluded = this.$store.state.excludedCases.length
      if (numberExcluded > 0) {
        return numberExcluded + ' excluded'
      } else {
        return ''
      }
    },

    caseList () {
      return this.$store.getters.currentCaseList
    },

    selectionCriteria () {
      return this.$store.getters.selectionCriteria
    },

    ptSelectionText () {
      if (this.caseList) {
        let selectionText = []
        let selectionCriteria = this.selectionCriteria
        if ('Event PT:' in selectionCriteria) {
          selectionText.push(util.toTitleCase(selectionCriteria['Event PT:'].replace(/;/g, ', ')))
        }
        if ('Event HLT:' in selectionCriteria) {
          selectionText.push(util.toTitleCase(selectionCriteria['Event HLT:'].replace(/;/g, ', ')))
        }
        return selectionText.join(', ')
      }
      return ''
    },

    drugSelectionText () {
      if (this.caseList) {
        let selectionCriteria = this.selectionCriteria
        let productInfo = []
        if ('Product - Product Name:' in selectionCriteria) {
          productInfo.push(util.toTitleCase(selectionCriteria['Product - Product Name:'].replace(/;/g, ', ')))
        }
        if ('Product - Product Active Ingredient:' in selectionCriteria) {
          productInfo.push(util.toTitleCase(selectionCriteria['Product - Product Active Ingredient:'].replace(/;/g, ', ')))
        }
        return productInfo.join(', ')
      } else {
        return ''
      }
    },

    articleQuery () {
      let query = ''
      if (this.caseList) {
        let products = this.selectionCriteria['Product - Product Name:']
        let ingredients = this.selectionCriteria['Product - Product Active Ingredient:']
        let pts = this.selectionCriteria['Event PT:']
        query = util.generateArticleQuery(products, ingredients, pts)
      }
      return query
    },

    caseListFilter () {
      return this.$store.getters.caseListFilter
    },

    isFakeFilter () {
      return this.$store.state.isCaseListFilterFake
    }
  },

  watch: {
    articleQuery () {
      this.updateArticles()
    },

    case_list_id () {
      this.$store.commit('setCurrentCaseListId', this.case_list_id)
    },

    caseListFilter () {
      if (this.caseListFilter === '') {
        this.searchQuery = ''
      }
    },

    isFakeFilter () {
      if (this.isFakeFilter) {
        this.searchQuery = ''
      }
    }
  },

  methods: {

    onSearchEnter () {
      if (this.searchQuery === '') {
        this.$store.commit('resetFilter')
      } else {
        this.$store.commit('setCaseListFilter', this.searchQuery)
        this.$store.dispatch('populateCaseList', this.case_list_id)
      }
    },

    onSearchClear () {
      this.searchQuery = ''
      this.$store.commit('resetFilter')
    },

    updateArticles () {
      this.$store.dispatch('populateCaseListArticles', this.articleQuery)
    }
  },

  created () {
    this.updateArticles()
    this.$store.commit('resetFilter')
    this.$store.dispatch('populateCaseLists')
    this.$store.commit('setCurrentCaseListId', this.case_list_id)
    this.$store.dispatch('populateCaseList', this.case_list_id)
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.top-bar {
  padding-bottom: 5px;
}

div.no-padding {
  padding: 0px;
}

.exploring-sections {
  /* min-height: 400px; */
  /* height: 80vh; */
  height: 650px;
  padding-right: 15px;
  padding-bottom: 15px;
}

.exploring-sections div {
  height: 100%;
}

.case-viewer-section {
  min-height: 400px;
  padding-bottom: 20px;
}

.search-input {
  padding-right: 15px !important;
}

.number-of-cases {
  font-size: 2em;
  font-weight: 500;
}

.number-of-hidden-cases {
  display: inline-block;
  font-size: 1.2em;
}

.selection-criteria {
  display: inline;
  color: gray;
}

.pt-selection, .drug-selection {
  display: inline-block;
  height: 1.3em;
  overflow: hidden;
}
</style>
