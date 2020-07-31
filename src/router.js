import Vue from 'vue'
import Router from 'vue-router'
import Login from './components/Login.vue'
import Register from './components/Register.vue'
import CaseLists from './components/CaseLists.vue'
import CaseListExplorer from './components/CaseListExplorer.vue'
import ExcludedCases from './components/ExcludedCases.vue'
import ExplorerCaseViewerSection from './components/ExplorerCaseViewerSection.vue'
import Import from './components/Import.vue'
import AllReports from '@/components/AllReports.vue'
import FeatureAblationData from '@/components/FeatureAblationData.vue'

Vue.use(Router)

const router = new Router({
  routes: [
    {
      path: '/login',
      component: Login,
      meta: { 'layout': 'splash' },
      beforeEnter: (to, from, next) => {
        let loggedIn = localStorage.getItem('username')
        if (loggedIn) {
          return next('/')
        }

        next()
      }
    },
    {
      path: '/register', component: Register
    },
    {
      path: '/', redirect: '/case_lists'
    },
    {
      path: '/case_lists', component: CaseLists
    },
    {
      path: '/case_list_explorer/:case_list_id',
      component: CaseListExplorer,
      props: true,
      children: [
        { path: 'case/:case_id', component: ExplorerCaseViewerSection, props: true }
      ]
    },
    {
      path: '/reports', component: AllReports
    },
    {
      path: '/reports/:case_id', component: ExplorerCaseViewerSection, props: true
    },
    {
      path: '/excluded_cases/:case_list_id', component: ExcludedCases, props: true
    },
    {
      path: '/import', component: Import
    },
    {
      path: '/ablation', component: FeatureAblationData
    },
    {
      path: '*', redirect: '/'
    }
  ]
})

router.beforeEach((to, from, next) => {
  // console.log(to)
  // Redirect to login page if not logged in and trying to access a restricted page
  const publicPages = ['/login', '/register']
  const authRequired = !publicPages.includes(to.path)
  const loggedIn = localStorage.getItem('username')

  if (authRequired && !loggedIn) {
    return next('/login')
  }

  next()
})

export default router
