<template>
  <div id="app" class="container-fluid">
    <div v-if="$route.meta.layout !== 'splash'" class="row">
      <div class="col-md-2 sidenav" id="nav">
        <h3>INFOVIP</h3>
        <router-link :class="{ selected: isCaseListSelected }" to="/case_lists">Case Series</router-link>
        <router-link class="case-list-menu-item sub" v-if="isCaseListSelected" :to="'/case_list_explorer/' + $store.state.caseListId">Explorer</router-link>
        <router-link class="case-list-menu-item sub" v-if="isCaseListSelected" :to="'/excluded_cases/' + $store.state.caseListId">Excluded Reports</router-link>
        <router-link to="/import">Import</router-link>
        <a @click="logout()" href="#">Logout</a>
      </div>
      <div class="router-view-content col-md-10">
        <status-message></status-message>
        <router-view />
      </div>
    </div>
    <div v-else class="row">
      <div class="col-md-4"></div>
      <router-view class="col-md-4" />
      <div class="col-md-4"></div>
    </div>
    <div class="row footer">
      <div class="col-auto lab-logo">
        <a href="http://botsislab.com">
          <img src="/puzzle_logo_vibrant.png">
        </a>
      </div>
      <div class="col-auto hopkins-logo">
        <img src="/JHM_K_R_H.png" />
      </div>
      <div class="col ack">
        <span>
          Supported by a CERSI grant (2U01FD005942-03 REVISED) to Johns Hopkins University from the FDA
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import StatusMessage from './components/StatusMessage'
import UserService from './api/UserService'

export default {
  components: {
    'status-message': StatusMessage
  },

  computed: {

    isCaseListSelected () {
      return this.$store.state.caseListId !== 0
    }
  },

  methods: {

    logout () {
      UserService.logout()
        .then(response => {
          this.resetCaseListSelected()
          localStorage.setItem('username', '')
          this.$router.push('/login')
        })
        .catch(() => {
          this.resetCaseListSelected()
          // If there was a service error here, still log out on the client to avoid only being logged in on the client
          // this.$store.commit('setError', error)
          localStorage.setItem('username', '')
          this.$router.push('/login')
        })
    },

    resetCaseListSelected () {
      this.$store.commit('resetCaseListSelected')
    }
  }
}
</script>

<style>
body, html, #app {
  margin: 0px;
  height: 100%;
}

#app, #app > .row {
  min-height: 100%;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

a {
    color: #2c3e50;
}

.dull {
  color: gray;
  font-weight: normal;
}

.duller {
  color: #C0C0C0;
  font-weight: normal;
}

.long-text {
  height: 20px;
  width: 100%;
  overflow: hidden;
}

.box {
  overflow: scroll;
  padding: 5px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.25rem;
  height: 100%;
}

.smaller {
  font-size: .9em;
}

.dark-blue {
  color: #084594;
}

.light-blue {
  color: #4292c6;
}

.router-view-content {
  margin-top: 15px;
}

/* Layout */
#nav {
  padding-left: 0px;
  padding-right: 0px;
  font-size: 20px;
  font-weight: bold;
  color: #F7F8FC;
  box-shadow: inset 0px 0px 5px rgba(28, 94, 138, .5);
  background-color: #3aa9dc; /* For browsers that do not support gradients */
  background-image: linear-gradient(#3aa9dc, #3aa9dc, #217CC3); /* Standard syntax (must be last) */
}

#nav a {
  color: #F7F8FC;
  padding: 8px 8px 8px 20px;
  text-decoration: none !important;
  display: block;
}

#nav h3 {
  padding: 15px;
  font-family: Arial, 'san-serif';
  text-align: center;
}

#nav a:hover, #nav a.router-link-active, #nav a.case-list-menu-item, #nav a.selected {
  color: #F7F8FC;
  background-color: #3382b7;
}

#nav a.case-list-menu-item.router-link-active {
  background-color: #2b71a0;
}

#nav .sub {
  font-size: 17px;
  padding-left: 30px;
}

.content {
  margin-left: 280px; /* Same as the width of the sidenav */
  overflow-y: auto;
  min-height: 100%;
  padding: 10px 15px;
  background-color: #F7F8FC;
  box-shadow: inset 0px 0px 5px rgba(28, 94, 138, .5)
}

.content h2 {
 padding-bottom: 10px;
}

@media screen and (max-height: 450px) {
  #nav {padding-top: 15px;}
  #nav a {font-size: 18px;}
}
/* End Layout */

/* Cards */
.card {
  box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
  transition: 0.3s;
  float: left;
  border-radius: 5px;
  padding: 15px;
  margin: 0px;
  height: 100%;
  width: 100%;
  background-color: white;
}

.card:hover {
    box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2);
}

.card-container {
  height: 100%;
}
/* End Cards */

/* Tooltips */

#pt-bubbles-tooltip {
  position: absolute;
  top: 100px;
  left: 100px;
  -moz-border-radius:5px;
  border-radius: 5px;
  border: 2px solid #000;
  background: #fff;
  opacity: .9;
  color: black;
  padding: 10px;
  padding-top: 8px;
  font-size: 12px;
  z-index: 10;
}

#pt-bubbles-tooltip .title {
  font-weight: bold;
  font-size: 18px;
}

#pt-bubbles-tooltip .name {
  font-weight:bold;
}

#timeline-tooltip, #case-timeline-tooltip {
  border-radius: 10px;
  background-color: black;
  color: white;
  z-index: 10;
}

#timeline-tooltip table {
  font-size: 0.9em;
}

#timeline-tooltip td {
  padding: 0px;
}

#timeline-tooltip .indicator {
  display: inline-block;
  height: 0.9em;
  width: 0.9em;
  margin-right: 5px;
}

#case-timeline-tooltip .indicator {
  display: inline-block;
  height: 18px;
  width: 18px;
  margin: 5px 5px -3px 0px;
}

.tooltip {
  pointer-events: none;
}

.tooltip-inner {
  max-width: 300px !important;
}
/* End Tooltips */

#app > .row.footer {
  background: #333;
  min-height: 0px;
  color: white;
  font-weight: bold;
  position: fixed;
  bottom: 0;
  width: 100%;
}

.footer .ack {
  display: flex;
  margin: auto;
}

.lab-logo {
  padding: 20px;
}

.lab-logo img {
  height: 65px;
  margin-left: 15px;
}

.hopkins-logo img {
  height: 100px;
}
</style>
