<template>
  <div :class="['score', scoreStyle]">
    {{ score }}
  </div>
</template>

<script>
export default {
  name: 'score-tag',

  props: ['score'],

  computed: {
    scoreStyle: function () {
      if (this.score > 75) {
        return 'great'
      } else if (this.score > 50) {
        return 'ok'
      } else if (this.score > 25) {
        return 'bad'
      } else {
        return 'terrible'
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.score {
  padding: 5px;
  font-weight: bold;
  font-size: 2em;
}
.great {
  color: green;
}
.ok {
  color: orange;
}
.bad {
  color: yellow;
}
.terrible {
  color: red;
}
</style>
