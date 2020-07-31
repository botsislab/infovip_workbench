<template>
  <div class="col">
    <div class="query-message">
      <span v-if="caseListQueryMessage">{{ caseListQueryMessage }} </span>
      <span :title="queryUsed" @click="showQuery = !showQuery" class="query-used dull">{{ showQuery ? queryUsed : 'Click to show/hide query' }}</span>
    </div>
    <div v-if="articles.length > 0">
      <div class="box article-box">
        <div
          v-for="(article, index) in articles"
          :key="index"
          class="article-item"
          :class="{ expanded: isExpanded(index) }"
          @click="toggleExpanded(index)"
        >
          <a :href="'https://www.ncbi.nlm.nih.gov/pubmed/' + article.pmid" target="_blank">
            <h3 class="article-title" :title="article.title">{{ article.title }}</h3>
          </a>
          <div class="row article-details dull">
            <div class="col-auto">
              {{ getDateCompleted(article) }}
            </div>
            <div class="col">
              {{ getArticleType(article) }}
            </div>
          </div>
          <div class="row article-details dull">
            <div class="col">
              {{ getArticleAuthors(article) }}
            </div>
          </div>
          <p v-html="getAbstractHTML(article)"></p>
        </div>
      </div>
    </div>
    <div v-else>
      <div class="box dull">
        No literature found for this report
      </div>
    </div>
  </div>
</template>

<script>
import util from '@/util/util'
import CaseService from '@/api/CaseService'
import Vue from 'vue'

export default {

  props: ['showAnnotations', 'all_pts', 'product_1_product_name', 'product_1_product_active_ingredient'],

  data () {
    return {
      caseListQueryMessage: '',
      reportArticles: [],
      reportQuery: '',
      showQuery: false,
      expanded: {}
    }
  },

  computed: {
    articles () {
      return this.caseListArticles.concat(this.reportArticles)
    },

    caseListArticles () {
      return this.$store.state.articles
    },

    caseListArticlesLoaded () {
      return this.$store.state.caseListArticlesLoaded
    },

    caseListArticleQuery () {
      return this.$store.state.articleQuery
    },

    queryUsed () {
      if (this.caseListArticles.length > 0) {
        return this.caseListArticleQuery
      } else {
        return this.reportQuery
      }
    }
  },

  watch: {
    caseListArticlesLoaded () {
      this.setup()
    }
  },

  methods: {
    getArticleType (article) {
      if ('PublicationTypeList' in article.full_medline.Article) {
        return article.full_medline.Article.PublicationTypeList.join()
      } else {
        return 'No Publication Types'
      }
    },

    getArticleAuthors (article) {
      if ('AuthorList' in article.full_medline.Article) {
        return article.full_medline.Article.AuthorList.map(author => author.LastName + ' ' + author.Initials).join()
      } else {
        return 'No Authors Listed'
      }
    },

    getDateCompleted (article) {
      if ('DateCompleted' in article.full_medline) {
        let dateObject = article.full_medline.DateCompleted
        return dateObject.Year + '-' + dateObject.Month + '-' + dateObject.Day
      } else {
        return 'No Date Listed'
      }
    },

    getAbstractHTML (article) {
      if (article.abstract.length > 0) {
        return article.abstract.join(' ')
      } else {
        return 'No Abstract'
      }
    },

    loadReportArticles () {
      // Get query for article
      this.reportQuery = this.getReportQuery()
      CaseService.getArticles(this.reportQuery)
        .then(response => {
          this.reportArticles = response.data
        })
        .catch(error => {
          this.$store.commit('setError', error)
        })
    },

    getReportQuery () {
      return util.generateArticleQuery(this.product_1_product_name, this.product_1_product_active_ingredient, this.all_pts)
    },

    toggleExpanded (articleIndex) {
      if (articleIndex in this.expanded) {
        Vue.set(this.expanded, articleIndex, !this.expanded[articleIndex])
      } else {
        Vue.set(this.expanded, articleIndex, true)
      }
    },

    isExpanded (articleIndex) {
      return this.expanded[articleIndex]
    },

    setup () {
      if (this.caseListArticlesLoaded && this.caseListArticles.length === 0) {
        this.caseListQueryMessage = 'No articles match the selection criteria. Instead showing results for this report\'s PS and AEs.'
        this.loadReportArticles()
      } else {
        this.caseListQueryMessage = ''
      }
    }
  },

  created () {
    this.setup()
  }
}
</script>

<style scoped>
.box {
  height: 400px;
}

.article-box {
  padding: 0px;
}

.article-item {
  display: block;
  cursor: pointer;
  padding-top: 5px;
  padding-bottom: 2px;
  padding-left: 5px;
  padding-right: 5px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  line-height: 1.2em;
}

.article-item:hover, .article-item.selected {
  text-decoration: none;
  background-color: rgba(0, 0, 0, 0.05);
  border-top: 1px solid rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
}

.article-item:hover a {
  text-decoration: none;
}

.article-item .heading {
  padding: 0px;
  text-decoration: underline;
}

.article-title {
  height: 1.2em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 0px;
}

.article-details {
  font-size: .8em;
}

.article-item {
  max-height: 6em;
  overflow: hidden;
  margin: 0px;
}

.article-item.expanded {
  max-height: inherit;
}

.query-message {
  margin-bottom: 10px;
}

.query-used {
  cursor: pointer;
  text-decoration: underline;
}
</style>
