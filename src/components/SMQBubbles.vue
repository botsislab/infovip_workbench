<template>
  <div>
    <h2>Semantic Similarity (Lin Similarity)</h2>
    <div class="card">
      <div>
        <span class="dull">Report </span>
        <span :style="{ color: reportColor }">{{ reportID }}</span>
        <span class="dull"> VS </span>
        <span :style="{ color: averageColor }">Dataset Average</span>
      </div>
      <div class="card-content">
        <div class="viz-container">
          <canvas id="smq-bubbles-container" width="480" height="400"></canvas>
        </div>
        <select multiple @change="onSelectionChange()" v-model="smqSelection" class="smq-selection" size="30">
          <option v-for="smq in allSMQs" :key="smq">
            {{ smq }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script>
import Chart from 'chart.js'
import * as palette from 'google-palette'

export default {
  name: 'SMQBubbles',

  data: function () {
    return {
      reportID: '10639530',
      allSMQs: ['Accidents and injuries (SMQ)', 'Acute central respiratory depression (SMQ)', 'Acute pancreatitis (SMQ)', 'Acute renal failure (SMQ)', 'Agranulocytosis (SMQ)', 'Anaphylactic reaction (SMQ)', 'Anaphylactic/anaphylactoid shock conditions (SMQ)', 'Angioedema (SMQ)', 'Arthritis (SMQ)', 'Asthma/bronchospasm (SMQ)', 'Biliary system related investigations, signs and symptoms (SMQ)', 'Biliary tract disorders (SMQ)', 'Blood premalignant disorders (SMQ)', 'Breast malignant tumours (SMQ)', 'Cardiac arrhythmia terms, nonspecific (SMQ)', 'Cardiac failure (SMQ)', 'Cardiomyopathy (SMQ)', 'Cholestasis and jaundice of hepatic origin (SMQ)', 'Chronic kidney disease (SMQ)', 'Conditions associated with central nervous system haemorrhages and cerebrovascular accidents (SMQ)', 'Conduction defects (SMQ)', 'Conjunctival disorders (SMQ)', 'Convulsions (SMQ)', 'Demyelination (SMQ)', 'Depression (excl suicide and self injury) (SMQ)', 'Drug reaction with eosinophilia and systemic symptoms syndrome (SMQ)', 'Drug withdrawal (SMQ)', 'Dyskinesia (SMQ)', 'Dyslipidaemia (SMQ)', 'Embolic and thrombotic events, arterial (SMQ)', 'Embolic and thrombotic events, venous (SMQ)', 'Embolic and thrombotic events, vessel type unspecified and mixed arterial and venous (SMQ)', 'Eosinophilic pneumonia (SMQ)', 'Extravasation events (injections, infusions and implants) (SMQ)', 'Foetal disorders (SMQ)', 'Functional lactation disorders (SMQ)', 'Gallbladder related disorders (SMQ)', 'Gallstone related disorders (SMQ)', 'Gastrointestinal haemorrhage (SMQ)', 'Gastrointestinal nonspecific dysfunction (SMQ)', 'Gastrointestinal nonspecific inflammation (SMQ)', 'Gastrointestinal nonspecific symptoms and therapeutic procedures (SMQ)', 'Gastrointestinal obstruction (SMQ)', 'Gastrointestinal perforation (SMQ)', 'Gastrointestinal perforation, ulcer, haemorrhage, obstruction non-specific findings/procedures (SMQ)', 'Gastrointestinal premalignant disorders (SMQ)', 'Generalised convulsive seizures following immunisation (SMQ)', 'Haematopoietic cytopenias affecting more than one type of blood cell (SMQ)', 'Haematopoietic erythropenia (SMQ)', 'Haematopoietic leukopenia (SMQ)', 'Haematopoietic thrombocytopenia (SMQ)', 'Haemodynamic oedema, effusions and fluid overload (SMQ)', 'Haemorrhage terms (excl laboratory terms) (SMQ)', 'Haemorrhagic central nervous system vascular conditions (SMQ)', 'Hearing impairment (SMQ)', 'Hepatic failure, fibrosis and cirrhosis and other liver damage-related conditions (SMQ)', 'Hepatitis, non-infectious (SMQ)', 'Hostility/aggression (SMQ)', 'Hyperglycaemia/new onset diabetes mellitus (SMQ)', 'Hypersensitivity (SMQ)', 'Hypertension (SMQ)', 'Hypoglycaemia (SMQ)', 'Hypothyroidism (SMQ)', 'Infectious biliary disorders (SMQ)', 'Infective pneumonia (SMQ)', 'Interstitial lung disease (SMQ)', 'Ischaemic central nervous system vascular conditions (SMQ)', 'Ischaemic colitis (SMQ)', 'Lack of efficacy/effect (SMQ)', 'Lacrimal disorders (SMQ)', 'Lactic acidosis (SMQ)', 'Lens disorders (SMQ)', 'Liver malignant tumours (SMQ)', 'Liver related investigations, signs and symptoms (SMQ)', 'Liver-related coagulation and bleeding disturbances (SMQ)', 'Malignancy related conditions (SMQ)', 'Malignancy related therapeutic and diagnostic procedures (SMQ)', 'Medication errors (SMQ)', 'Myelodysplastic syndrome (SMQ)', 'Myocardial infarction (SMQ)', 'Neonatal disorders (SMQ)', 'Non-haematological malignant tumours (SMQ)', 'Non-haematological tumours of unspecified malignancy (SMQ)', 'Noninfectious diarrhoea (SMQ)', 'Noninfectious encephalitis (SMQ)', 'Noninfectious encephalopathy/delirium (SMQ)', 'Ocular infections (SMQ)', 'Ocular motility disorders (SMQ)', 'Optic nerve disorders (SMQ)', 'Oropharyngeal allergic conditions (SMQ)', 'Oropharyngeal conditions (excl neoplasms, infections and allergies) (SMQ)', 'Oropharyngeal infections (SMQ)', 'Osteoporosis/osteopenia (SMQ)', 'Other ischaemic heart disease (SMQ)', 'Periorbital and eyelid disorders (SMQ)', 'Pregnancy, labour and delivery complications and risk factors (excl abortions and stillbirth) (SMQ)', 'Prostate malignant tumours (SMQ)', 'Psychosis and psychotic disorders (SMQ)', 'Respiratory failure (SMQ)', 'Retinal disorders (SMQ)', 'Retroperitoneal fibrosis (SMQ)', 'Rhabdomyolysis/myopathy (SMQ)', 'Severe cutaneous adverse reactions (SMQ)', 'Shock-associated circulatory or cardiac conditions (excl torsade de pointes) (SMQ)', 'Suicide/self-injury (SMQ)', 'Supraventricular tachyarrhythmias (SMQ)', 'Tachyarrhythmia terms, nonspecific (SMQ)', 'Tendinopathies and ligament disorders (SMQ)', 'Termination of pregnancy and risk of abortion (SMQ)', 'Torsade de pointes, shock-associated conditions (SMQ)', 'Torsade de pointes/QT prolongation (SMQ)', 'Tubulointerstitial diseases (SMQ)', 'Ventricular tachyarrhythmias (SMQ)'],
      smqSelection: [],
      datasets: []
    }
  },

  methods: {

    onSelectionChange: function () {
      this.updateData()
      this.chart.data.datasets = this.datasets
      this.chart.options.scales = this.getScales()
      this.chart.update()
    },

    getFilteredData: function (data, selection) {
      var filtered = []

      this.allSMQs.forEach(function (smq, index) {
        // If this smq is selected
        if (selection.indexOf(smq) !== -1) {
          // Include it's value
          filtered.push(data[index])
        }
      })

      return filtered
    },

    // updateChart: function() {
    //   this.chartOptions.data.datasets = this.datasets
    // },

    updateData: function () {
      this.datasets = []

      this.colorIndex = 0
      this.colors = this.initColors()

      // Filter data
      this.filteredReportData = this.getFilteredData(this.rawReportData, this.smqSelection)
      this.filteredAverageData = this.getFilteredData(this.rawAverageData, this.smqSelection)

      this.squareSize = parseInt(Math.sqrt(this.filteredAverageData.length)) + 1

      // Add data to datasets
      var averageDataset = this.getDataset('average', this.filteredAverageData, this.squareSize)
      this.averageColor = averageDataset.backgroundColor
      this.datasets.push(averageDataset)
      var reportDataset = this.getDataset('report', this.filteredReportData, this.squareSize)
      this.reportColor = reportDataset.backgroundColor
      this.datasets.push(reportDataset)
    },

    getNextColor: function () {
      return this.colors[this.colorIndex++]
    },

    initColors: function () {
      var colors = []
      var hexColors = palette('tol', 10)
      var hexToRgb = this.hexToRgb
      hexColors.forEach(function (color) {
        colors.push(hexToRgb(color))
      })
      return colors
    },

    // https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
    hexToRgb: function (hex) {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null
    },

    getDataset: function (label, rawDataArray, squareSize) {
      var data = this.build2dData(rawDataArray, squareSize)
      var color = this.getNextColor()
      return {
        label: label,
        data: data,
        backgroundColor: 'rgba(' +
          color.r + ',' +
          color.g + ',' +
          color.b + ',1)'
        // hoverBackgroundColor: "#ff6384"
      }
    },

    build2dData: function (rawDataArray, squareSize) {
      function get1dIndex (row, col, rowSize) {
        return rowSize * row + col
      }

      var data = []

      // For each row in the matrix
      for (var row = 0; row < squareSize; row++) {
        // For each datapoint in row
        for (var col = 0; col < squareSize; col++) {
          var index = get1dIndex(row, col, squareSize)
          // Only add data if the next 1 dimensional index exists
          if (index < rawDataArray.length) {
            // Add datapoint to data using row/datapoint coordinate
            // And check to make sure we stop before the end of the array
            var datapoint = this.getDatapoint(rawDataArray, row, col, index)
            data.push(datapoint)
          }
        }
      }

      return data
    },

    getDatapoint: function (dataArray, row, col, index) {
      // Add data in chartjs format
      var r = dataArray[index] * 50 + 3
      return {
        x: row + 1,
        y: col + 1,
        r: r,
        smq: this.allSMQs[index]
      }
    },

    getScales: function () {
      return {
        xAxes: [{
          display: false,
          ticks: {
            max: this.squareSize + 1,
            min: 0
          }
        }],
        yAxes: [{
          display: false,
          ticks: {
            max: this.squareSize + 1,
            min: 0
          }
        }]
      }
    },

    getLabelCallback: function (tooltipItem, data) {
      var label = data.datasets[tooltipItem.datasetIndex].label

      if (label === 'report') {
        return ' Report Similarity: ' + this.filteredReportData[tooltipItem.index].toFixed(2)
      } else if (label === 'average') {
        return ' Average Similarity: ' + this.filteredAverageData[tooltipItem.index].toFixed(2)
      } else {
        return ''
      }
    },

    getTitleCallback: function (tooltipItems, data) {
      var smq = this.smqSelection[tooltipItems[0].index]
      return smq
    }

  },

  created: function () {
    this.smqSelection = this.allSMQs

    // Get raw data
    // this.rawAverageData = [0, 0, 0.15384615384615385, 0, 0, 0, 0, 0, 0, 0, 0.24, 0.32258064516129026, 0, 0, 0, 0, 0, 0.3703703703703704, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.10526315789473684, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    this.rawAverageData = [0.1403508771929825, 0.02000000000000001, 0, 0, 0, 0, 0, 0, 0, 0.02061855670103093, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.02040816326530613, 0.09708737864077673, 0, 0, 0, 0, 0, 0, 0.04081632653061226, 0.04123711340206187, 0, 0, 0, 0.10937500000000004, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.1395348837209303, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.041666666666666685, 0, 0, 0, 0, 0, 0, 0, 0.09900990099009906, 0, 0, 0, 0, 0, 0, 0, 0.021052631578947382, 0, 0, 0, 0, 0.08163265306122452, 0, 0.021052631578947382, 0, 0, 0, 0.02000000000000001, 0, 0, 0, 0, 0, 0, 0, 0, 0.02040816326530613, 0, 0, 0, 0, 0]
    this.rawReportData = [0, 0, 0, 0.2545454545454546, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.2916666666666667, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5937500000000001, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.18181818181818185, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.4500000000000001, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

    // var reportID1 = 10303397
    // var reportID2 = 7806518
    // var reportID3 = 10639530

    this.updateData()
  },

  mounted: function () {
    // Create local variables to access component functions
    var getLabelCallback = this.getLabelCallback
    var getTitleCallback = this.getTitleCallback

    this.chartOptions = {
      type: 'bubble',
      options: {
        onClick: function (event, activeElements) {
          // console.log(activeElements)
        },
        responsive: true,
        legend: {
          display: false
        },
        scales: this.getScales(),
        tooltips: {
          mode: 'index',
          bodyFontSize: 18,
          titleFontSize: 20,
          callbacks: {
            label: getLabelCallback,
            title: getTitleCallback
          }
        },
        hover: {
          mode: 'index'
        }
      },
      data: {
        datasets: this.datasets
      }
    }

    this.chart = new Chart('smq-bubbles-container', this.chartOptions)
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.viz-container {
  width: 480px;
  float: left;
}

.smq-selection {
  float: left;
  padding: 2px 8px;
  border: 1px solid #ced4da;
  border-radius: 5px;
}
</style>
