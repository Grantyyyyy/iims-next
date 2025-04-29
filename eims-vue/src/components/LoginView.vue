<template>
  <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
    <div class="bg-white/90 backdrop-blur-md shadow-xl rounded-2xl p-8 w-full max-w-md mx-4 transition-all duration-300 hover:shadow-2xl">
      <!-- Header section remains the same -->
      <div class="flex justify-between items-center mb-12">
        <img :src="require('@/assets/cmas.png')" alt="CMAS Logo" class="h-14 w-14 object-cover rounded-full">
        <a href="/landing-page" class="text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm font-medium transition-colors">
          <i class="fas fa-arrow-left"></i>
          Back to Home
        </a>
      </div>

      <!-- Title Section remains the same -->
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold text-blue-700">
          Welcome to IIMS
        </h2>
        <p class="text-gray-500 mt-2">Sign in to continue to your account</p>
      </div>

      <!-- Error Alert remains the same -->
      <transition name="fade">
        <div v-if="errorMessage" class="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 flex items-center gap-3">
          <i class="fas fa-exclamation-circle"></i>
          <p>{{ errorMessage }}</p>
        </div>
      </transition>

      <form @submit.prevent="login" class="space-y-6 h-64">
        <!-- Username Input remains the same -->
        <div class="space-y-2">
          <label for="username" class="text-sm font-medium text-gray-700 block">Username</label>
          <div class="relative group">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 group-focus-within:text-blue-500">
              <i class="fas fa-user"></i>
            </span>
            <input 
              type="text" 
              id="username" 
              v-model="username" 
              required
              :disabled="loading"
              placeholder="Enter your username"
              class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white disabled:opacity-75 disabled:cursor-not-allowed"
              :class="{ 'border-red-500 focus:ring-red-200': errorMessage }"
            />
          </div>
        </div>

        <!-- Modified Password Input -->
        <div class="space-y-1">
          <div class="flex justify-between items-center">
            <label for="password" class="text-sm font-medium text-gray-700">Password</label>
          </div>
          <div class="relative group">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 group-focus-within:text-blue-500">
              <i class="fas fa-lock"></i>
            </span>
            <input 
              :type="showPassword ? 'text' : 'password'" 
              id="password" 
              v-model="password" 
              required
              :disabled="loading"
              placeholder="Enter your password"
              @keydown.enter.prevent="login"
              class="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white disabled:opacity-75 disabled:cursor-not-allowed"
              :class="{ 'border-red-500 focus:ring-red-200': errorMessage }"
            />
            <button 
              type="button"
              @click="togglePasswordVisibility"
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
              :disabled="loading"
            >
              <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
        </div>

        <div class="space-y-2 mt-8">
          <button 
            type="submit" 
            :disabled="loading"
            class="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span v-if="!loading" class="flex items-center justify-center gap-2">
              Sign In 
              <i class="fas fa-arrow-right"></i>
            </span>
            <div v-else class="flex items-center justify-center gap-2">
              <span class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
              Signing in...
            </div>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'LoginView',
  data() {
    return {
      username: '',
      password: '',
      errorMessage: '',
      showPassword: false,
      rememberMe: false,
      loading: false
    };
  },
  methods: {
    togglePasswordVisibility() {
      this.showPassword = !this.showPassword;
    },
    async login() {
      if (this.loading) return;
      
      this.loading = true;
      this.errorMessage = '';

      try {
        const response = await axios.post('/api/login/', {
          username: this.username.trim(),
          password: this.password,
          remember_me: this.rememberMe
        });

        await this.$store.dispatch('login', {
          token: response.data.token,
          userType: response.data.user_type,
          rememberMe: this.rememberMe
        });

        await this.$store.dispatch('fetchUserData');

        setTimeout(() => {
          this.$router.push('/profile');
        }, 300);

      } catch (error) {
        console.error('Login failed:', error);
        
        if (error.response?.status === 401) {
          this.errorMessage = 'Invalid username or password';
        } else if (error.response?.status === 429) {
          this.errorMessage = 'Too many attempts. Please try again later.';
        } else {
          this.errorMessage = 'Invalid username or password';
        }
        
        const form = document.querySelector('form');
        form.classList.add('shake');
        setTimeout(() => form.classList.remove('shake'), 500);
        
      } finally {
        this.loading = false;
      }
    }
  },
  beforeDestroy() {
    this.username = '';
    this.password = '';
    this.errorMessage = '';
  }
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.shake {
  animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
</style>