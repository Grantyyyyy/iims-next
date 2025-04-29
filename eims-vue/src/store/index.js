import { createStore } from 'vuex';
import axios from 'axios';
import router from "../router"; //

export default createStore({
  state: {
    token: localStorage.getItem('token') || null,
    userType: localStorage.getItem('userType') || null,
    user: null
  },
  mutations: {
    setToken(state, token) {
      state.token = token
      localStorage.setItem('token', token)
    },
    setUserType(state, userType) {
      state.userType = userType
      localStorage.setItem('userType', userType)
    },
    setUser(state, user) {
      state.user = user
    },
    logout(state) {
      state.token = null
      state.userType = null
      state.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('userType')
    }
  },
  actions: {
    login({ commit, dispatch }, { token, userType }) {
      commit('setToken', token)
      commit('setUserType', userType)
      dispatch('fetchUserData')
    },
    logout({ commit }) {
      commit('logout')
      router.push({ name: 'login'})
    },
    async fetchUserData({ commit, state }) {
      if (!state.token) return
      try {
        const response = await axios.get('/api/user/', {
          headers: { Authorization: `Token ${state.token}` }
        })
        commit('setUser', response.data)
      } catch (error) {
        console.error('Failed to fetch user data', error)
        if (error.response && error.response.status === 401) {
          // Token is invalid or expired
          commit('logout')
        }
      }
    },
    initializeAuth({ dispatch }) {
       dispatch('fetchUserData')
    }
  },
  getters: {
    isAuthenticated: state => !!state.token,
    userType: state => state.userType,
    user: state => state.user
  }
});