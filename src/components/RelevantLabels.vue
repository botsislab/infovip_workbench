<template>
  <div class="col">
    <div v-if="labels.length > 0">
      <div class="row">
        <div class="col-md-2">
          <label class="col-form-label">Label</label>
        </div>
        <div class="col-md-10">
          <div class="row no-gutters">
            <div class="col">
              <select v-if="labels.length > 0" class="custom-select label-selection" v-model="selectedLabelId">
                <option
                  v-for="label in labels"
                  :key="label.label_id"
                  :value="label.label_id"
                >
                  {{ label.package_title }}
                </option>
              </select>
            </div>
            <div class="col-auto">
              <a
                v-if="selectedLabelId"
                class="btn form-control label-link"
                :href="'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=' + selectedLabelSetId"
                target="_blank"
              >
                <font-awesome-icon icon="external-link-alt"></font-awesome-icon>
              </a>
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-2">
          <label class="col-form-label">Section</label>
        </div>
        <div class="col-md-10">
          <select v-if="selectedLabelId !== null" class="custom-select label-section-selection" v-model="selectedMainSectionId">
            <option
              v-for="(section, index) in selectedLabelMainSections"
              :key="index"
              :value="section.section_id"
            >
              {{ section.title ? section.title : 'No Section Title' }}
            </option>
          </select>
        </div>
      </div>
      <div class="box label-box">
        <div v-if="selectedLabelMarkup">
          <div
            class="label-section"
            v-for="(section, index) in selectedMainSectionSections"
            :key="index"
          >
            <div v-if="section['subsection_id'] !== 0" class="section-heading">{{ section['title'] }}</div>
            <span
              v-for="(item, index) in section['markup']"
              :key="index"
            >
              <span
                v-html="getCleanLabelAnnotation(item)"
                :class="[{ 'annotation': showAnnotations }, getAnnotationClass(item)]"
              ></span>
              <span v-if="item.type !== 'none'">&nbsp;</span>
            </span>
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <div class="box label-box dull">
        No labels found for this report
      </div>
    </div>
  </div>
</template>

<script>
export default {

  props: ['labels'],

  data () {
    return {
      selectedLabelId: null,
      selectedMainSectionId: null
    }
  },

  computed: {

    selectedLabelMarkup () {
      return this.labels.find(label => label.label_id === this.selectedLabelId)
    },

    selectedLabelMainSections () {
      if (this.selectedLabelMarkup) {
        return this.selectedLabelMarkup['sections'].filter(section => section.subsection_id === 0)
          .map(section => {
            let title = section['title'].replace(/Â/g, '').replace(/\s\s+/g, ' ').trim()
            return {
              'title': title,
              'section_id': section['section_id'],
              'markup': section['markup']
            }
          })
      } else {
        return []
      }
    },

    selectedLabelSections () {
      return this.selectedLabelMarkup['sections'].filter(section => section.subsection_id === 0)
    },

    selectedMainSectionSections () {
      return this.selectedLabelMarkup['sections'].filter(section => {
        return section.section_id === this.selectedMainSectionId
      })
    },

    selectedLabelRelatedPTs () {
      return this.selectedLabelMarkup ? this.selectedLabelMarkup['related_pts'] : []
    },

    showAnnotations () {
      return this.$store.state.showAnnotations
    },

    selectedLabelSetId () {
      return this.selectedLabelMarkup['set_id']
    }
  },

  watch: {

    labels () {
      this.selectLabelAndSections()
    }
  },

  methods: {
    inSelectionCriteria (pt) {
      return this.$store.getters.allRelatedSelectionCriteriaPTs.indexOf(pt) !== -1
    },

    getAnnotationClass (annotationItem) {
      if (annotationItem.pt && this.inSelectionCriteria(annotationItem.pt.toLowerCase())) {
        return 'selection_criteria'
      }
      return annotationItem.type
    },

    getCleanLabelAnnotation (annotationItem) {
      let text = annotationItem.text
        .replace(/Â/g, '') // Because labels aren't getting parsed properly (this is a non-visible character)
        .replace(/â‰¥/g, '&ge;') // Because labels aren't getting parsed properly
        .replace(/â¥/g, '&le;') // Because labels aren't getting parsed properly
        .replace(/â€”/g, '-') // Because labels aren't getting parsed properly
        .replace(/â€‘/g, '-') // Because labels aren't getting parsed properly
        .replace(/^ /, '')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\n/g, '<br />')
      if (annotationItem.type !== 'none') text += '&nbsp;'
      return text
    },

    selectLabelAndSections () {
      if (this.labels.length > 0) {
        this.selectedLabelId = this.labels[0].label_id
        // Preselect first main section that has more than one markup item (has features)
        let sections = this.selectedLabelMarkup['sections']
        let adverseSectionId = 0

        // TODO Clean this logic up
        // Default to adverse reactions
        sections.forEach(section => {
          let title = section['title']
          if (title.toUpperCase().indexOf('ADVERSE') !== -1) {
            adverseSectionId = section.section_id
            this.selectedMainSectionId = adverseSectionId
          }
        })

        let maxSectionId = Math.max(...sections.map(section => section.section_id))

        // Look for first section with features
        for (let i = adverseSectionId; i < maxSectionId; i++) {
          let section = sections.find(section => section.section_id === i)
          if (section.markup.length > 1) {
            this.selectedMainSectionId = section.section_id
            break
          }
        }
      }
    }
  },

  mounted () {
    this.selectLabelAndSections()
  }
}
</script>

<style scoped>
.label-box {
  max-height: 400px;
}

.label-selection, .label-section-selection {
  margin-bottom: 10px;
}

.section-heading {
  font-weight: bold;
  margin-top: 20px;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
}

.label-link {
  color: gray;
}
</style>
