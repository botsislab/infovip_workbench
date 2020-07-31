<template>
  <div>
    <h2>Import</h2>
      <!-- <label class="btn btn-secondary">Select File
        <input hidden type="file" id="file" ref="file" v-on:change="handleFileUpload"/>
      </label>
      <button class="btn btn-secondary" v-on:click="submitFile()">Submit</button> -->
    <div class="container-fluid">
      <!-- <div class="row">
        <div class="col">
          <b-spinner label="Loading..." />
        </div>
      </div> -->
      <div class="row justify-content-center">
        <div class="col-auto">
          <div class="loading-icon">
            <b-spinner v-if="loading" label="Loading..." />
          </div>
          <div class="import-controls">
            <label class="custom-file" id="customFile">
                <input v-on:change="onFileInputChange" ref="file" type="file" class="custom-file-input" id="fileInput" aria-describedby="fileHelp">
                <span :title="fileFormControlText" class="custom-file-control form-control-file" :class="{ selected: fileFormControlSelected }">{{ fileFormControlText }}</span>
            </label>
            <button class="btn btn-secondary" v-on:click="submitFile()">Submit</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CaseService from '../api/CaseService'

export default {
  name: 'import',

  data () {
    return {
      file: '',
      filename: '',
      loading: false
    }
  },

  computed: {

    fileFormControlSelected: function () {
      return this.filename !== ''
    },

    fileFormControlText: function () {
      return this.fileFormControlSelected ? this.filename : ''
    }
  },

  methods: {

    // Submits the file to the server
    submitFile () {
      this.loading = true
      let self = this
      // Initialize the form data
      let formData = new FormData()

      // Add the form data we need to submit
      formData.append('file', this.file)

      // Try to create the case list
      CaseService.createCaseList(formData)
        .then(function (response) {
          self.$store.commit('setSuccess', 'Case List successfully created')
          self.$router.push('/case_series')
          self.$store.commit('justCreatedCaseList', response.data.case_list_id)
        }).catch(function (error) {
          self.$store.commit('setError', error)
        })
    },

    onFileInputChange () {
      this.filename = document.getElementById('fileInput').files[0].name
      this.file = this.$refs.file.files[0]
    }
  },

  created () {
    this.$store.commit('resetCaseListSelected')
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.row {
  margin-top: 20%;
}

.loading-icon {
  margin-bottom: 20px;
  text-align: center;
  height: 35px;
  color: grey;
}

.import-controls .btn {
  margin-left: 10px;
  padding: 0.45rem 0.75rem;
  border: solid 1px rgba(0,0,0,.15);
  float: left;
}

.import-controls {
  width: 500px;
}

#customFile .custom-file-control:lang(en)::after {
  content: "Select file...";
}

#customFile .custom-file-control::before {
  content: "Browse";
}

/*when a value is selected, this class removes the content */
.custom-file-control.selected:lang(en)::after {
  content: "" !important;
}

.custom-file-input {
  height: 2.5rem;
  margin: 0;
  filter: alpha(opacity=0);
  opacity: 0;
}

.custom-file {
  overflow: hidden;
  position: relative;
  max-width: 400px;
  height: 2.5rem;
  margin-bottom: 0;
  cursor: pointer;
  float: left;
}

.custom-file-control {
  white-space: nowrap;
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 5;
  height: 2.5rem;
  padding: .5rem 1rem;
  line-height: 1.5;
  color: #555;
  user-select: none;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: .25rem;
}

.custom-file-control::before {
  position: absolute;
  top: -1px;
  right: -1px;
  bottom: -1px;
  z-index: 6;
  display: block;
  height: 2.5rem;
  padding: .5rem 1rem;
  line-height: 1.5;
  color: #fff;
  background-color: #6c757d;
  border: 1px solid rgba(0,0,0,.15);
  border-radius: 0 .25rem .25rem 0;
}
</style>
