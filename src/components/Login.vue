<template>
<!-- User registration/authentication ideas: http://jasonwatmore.com/post/2018/07/14/vue-vuex-user-registration-and-login-tutorial-example#loginpage-vue -->
  <div>
    <h2 class="login-heading">InfoViP Login</h2>
    <form @submit.prevent="handleSubmit()">
        <div class="form-group">
            <label for="username">Username</label>
            <input type="text" v-model="username" name="username" class="form-control" :class="{ 'is-invalid': submitted && !username }" />
            <div v-show="submitted && !username" class="invalid-feedback">Username is required</div>
        </div>
        <div class="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" v-model="password" name="password" class="form-control" :class="{ 'is-invalid': submitted && !password }" />
            <div v-show="submitted && !password" class="invalid-feedback">Password is required</div>
        </div>
        <div class="form-group">
            <button class="btn btn-primary" :disabled="status === 'loggingIn'">Login</button>
            <img v-show="status === 'loggingIn'" src="data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAkKAAAALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA==" />
            <!-- <router-link to="/register" class="btn btn-link">Register</router-link> -->
        </div>
    </form>
  </div>
</template>

<script>
import UserService from '../api/UserService'

export default {
  name: 'about',

  data () {
    return {
      username: '',
      password: '',
      submitted: false,
      status: ''
    }
  },

  methods: {

    handleSubmit () {
      this.submitted = true
      let { username, password } = this

      if (username && password) {
        this.status = 'loggingIn'
        UserService.login({ username, password })
          .then(response => {
            localStorage.setItem('username', username)
            this.status = ''
            this.$router.push('/')
          })
          .catch(error => {
            this.$store.commit('setError', error)
            this.status = ''
          })
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.login-heading {
  margin-top: 20px;
}
</style>
