<template>
  <div class="row no-gutters slider-container">
    <div class="col-auto">
      <button title="Reset" @click="onResetClick" class="btn">
        <i class="fas fa-undo-alt"></i>
      </button>
    </div>
    <div class="col">
      <div class="slider">
        <input name="sliderFrom" class="slider-from" type="range" @change="slidersChanged" v-model="sliderFrom" :min="min" :max="max" />
        <output :style="{ 'left': sliderFromOutputLeft }" for="sliderFrom" :value="sliderFrom">{{ sliderFrom }}</output>
        <input name="sliderTo" class="slider-to" type="range" @change="slidersChanged" v-model="sliderTo" :min="min" :max="max" />
        <output :style="{ 'left': sliderToOutputLeft }" for="sliderTo" :value="sliderTo">{{ sliderTo }}</output>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'slider',

  props: [
    'min',
    'max',
    'value'
  ],

  data () {
    return {
      sliderFrom: 2,
      sliderTo: 3
    }
  },

  computed: {

    sliderFromOutputLeft () {
      let width = this.max - this.min
      let position = this.sliderFrom - this.min
      let percentPosition = position / width
      return Math.round(percentPosition * 98) + '%'
    },

    sliderToOutputLeft () {
      let width = this.max - this.min
      let position = this.sliderTo - this.min
      let percentPosition = position / width
      return Math.round(percentPosition * 98) + '%'
    }
  },

  watch: {

    value () {
      this.sliderFrom = this.value[0]
      this.sliderTo = this.value[1]
    }
  },

  methods: {

    slidersChanged () {
      // Update from/to in case one was dragged past the other
      let min = Math.min(this.sliderFrom, this.sliderTo)
      let max = Math.max(this.sliderFrom, this.sliderTo)
      this.sliderFrom = min
      this.sliderTo = max

      // Update range
      let range = [this.sliderFrom, this.sliderTo]
      this.$emit('input', range)
    },

    onResetClick () {
      this.$emit('reset')
    }
  },

  created () {
    this.sliderFrom = this.value[0]
    this.sliderTo = this.value[1]
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.slider-container {
  margin-top: 10px;
}
.slider {
  position: relative;
}

.slider-from, .slider-to {
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.slider-from::-webkit-slider-thumb {
  position: relative;
  z-index: 2;
}

output {
  position: absolute;
  background-color: rgba(255,255,255,.8);
  width: 50px;
  text-align: center;
  border-radius: 10px;
  display: inline-block;
  bottom: -3px;
  left: 0;
  margin-left: -19px;
}

/* https://www.cssportal.com/style-input-range/ */
input[type=range] {
  height: 38px;
  -webkit-appearance: none;
  /* margin: 10px 0; */
  width: 100%;
  background: transparent;
}
input[type=range]:focus {
  outline: none;
}
input[type=range]::-webkit-slider-runnable-track {
  width: 100%;
  height: 10px;
  cursor: pointer;
  animate: 0.2s;
  /* box-shadow: 1px 1px 1px #000000; */
  /* background: #3071A9; */
  background: #3aa9dc;
  border-radius: 5px;
  /* border: 1px solid #000000; */
}
input[type=range]::-webkit-slider-thumb::after {
  content: "test";
}
input[type=range]::-webkit-slider-thumb {
  /* box-shadow: 1px 1px 1px #000000; */
  border: 1px solid grey;
  height: 30px;
  width: 15px;
  border-radius: 5px;
  background: #FFFFFF;
  cursor: pointer;
  -webkit-appearance: none;
  margin-top: -11px;
}
input[type=range]:focus::-webkit-slider-runnable-track {
  background: #3aa9dc;
}
input[type=range]::-moz-range-track {
  width: 100%;
  height: 10px;
  cursor: pointer;
  animate: 0.2s;
  box-shadow: 1px 1px 1px #000000;
  background: #3aa9dc;
  border-radius: 5px;
  /* border: 1px solid #000000; */
}
input[type=range]::-moz-range-thumb {
  box-shadow: 1px 1px 1px #000000;
  border: 1px solid #000000;
  height: 30px;
  width: 15px;
  border-radius: 5px;
  background: #FFFFFF;
  cursor: pointer;
}
input[type=range]::-ms-track {
  width: 100%;
  height: 10px;
  cursor: pointer;
  animate: 0.2s;
  background: transparent;
  border-color: transparent;
  color: transparent;
}
input[type=range]::-ms-fill-lower {
  background: #3aa9dc;
  /* border: 1px solid #000000; */
  border-radius: 10px;
  /* box-shadow: 1px 1px 1px #000000; */
}
input[type=range]::-ms-fill-upper {
  background: #3aa9dc;
  /* border: 1px solid #000000; */
  border-radius: 10px;
  /* box-shadow: 1px 1px 1px #000000; */
}
input[type=range]::-ms-thumb {
  margin-top: 1px;
  /* box-shadow: 1px 1px 1px #000000; */
  border: 1px solid #000000;
  height: 30px;
  width: 15px;
  border-radius: 5px;
  background: #FFFFFF;
  cursor: pointer;
}
input[type=range]:focus::-ms-fill-lower {
  background: #3aa9dc;
}
input[type=range]:focus::-ms-fill-upper {
  background: #3aa9dc;
}
</style>
