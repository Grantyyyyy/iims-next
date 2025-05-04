import { createApp } from 'vue'
import { createPinia } from 'pinia'  // Import createPinia
import App from './App.vue'
import 'primeicons/primeicons.css';
import router from './router'
import store from './store'
import axios from 'axios'
import './assets/main.css'

// Set up axios default base URL
//axios.defaults.baseURL = process.env.VUE_APP_BASE_URL || 'http://localhost:8000' || 'localhost:8000' ;

axios.defaults.baseURL = process.env.VUE_APP_BASE_URL || 'https://iims-django.onrender.com' ;

// Set up axios interceptor for authentication
axios.interceptors.request.use(config => {
  const token = store.state.token
  if (token) {
    config.headers.Authorization = `Token ${token}`
  }
  return config
})

// Initialize auth state
store.dispatch('initializeAuth')

const app = createApp(App);
const pinia = createPinia()  // Create a Pinia instance

app.use(store)
   .use(router)
   .use(pinia)  // Use Pinia in your app
   .mount('#app');