import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import VueScrollTo from 'vue-scrollto'
import BootstrapVue from 'bootstrap-vue'

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faPills,
  faUserMd,
  faFileAlt,
  faLongArrowAltRight,
  faCalendar,
  faMask,
  faTimes,
  faExternalLinkAlt,
  faCircle,
  faPencilAlt,
  faInfoCircle,
  faQuestionCircle
} from '@fortawesome/free-solid-svg-icons'
library.add(
  faPills,
  faUserMd,
  faFileAlt,
  faLongArrowAltRight,
  faCalendar,
  faMask,
  faTimes,
  faExternalLinkAlt,
  faCircle,
  faPencilAlt,
  faInfoCircle,
  faQuestionCircle
)
Vue.component('font-awesome-icon', FontAwesomeIcon)

Vue.use(BootstrapVue)
Vue.use(VueScrollTo)

require('../node_modules/bootstrap-css-only/css/bootstrap.css')

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
