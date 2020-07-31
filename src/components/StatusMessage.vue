<template>
  <div :class="['status', 'alert', alertClass, { active }]">
    {{ message }}
  </div>
</template>

<script>
export default {
  name: 'status-message',

  computed: {
    message () {
      return this.$store.state.statusMessage.text
    },

    level () {
      return this.$store.state.statusMessage.level
    },

    active () {
      return this.$store.state.statusMessage.active
    },

    alertClass () {
      if (this.message && this.level === 'success') {
        return 'alert-success'
      }

      return 'alert-danger'
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.status {
  position: absolute;
  z-index: 5;
  overflow-y: hidden;
  opacity: 0;
  max-height: 0;
  transform: translateY(-20px);
  transition: max-height 0.25s, opacity 0.25s, transform 0.5s;
}

.active {
  transform: translateY(0);
  opacity: 1;
  max-height: 50px;
}
</style>
