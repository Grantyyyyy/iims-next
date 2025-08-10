<template>
    <div class="min-h-screen bg-gray-100 font-sans">
      <!-- Navigation -->
      <nav class="bg-gray-900/95 backdrop-blur-sm text-white shadow-lg fixed top-0 left-0 w-full z-50 transition-all duration-300">
        <div class="container mx-auto px-6 py-3 flex justify-between items-center">
            <div class="flex items-center space-x-3 hover:scale-105 transition-transform">
                <a href="https://msunaawan.edu.ph/">
                    <img :src="require('@/assets/Bagong-Pilipinas.png')" alt="MSUN Logo" class="h-16 w-16 object-cover rounded-full">
                </a>
                <a href="https://msunaawan.edu.ph/">
                    <img :src="require('@/assets/msun.png')" alt="MSUN Logo" class="h-16 w-16 object-cover rounded-full">
                </a>
                <a href="https://cmas.msunaawan.edu.ph/">
                    <img :src="require('@/assets/cmas.png')" alt="CMAS Logo" class="h-16 w-16 object-cover rounded-full">
                </a>
            </div>
  
          <button @click="toggleMenu" class="sm:hidden focus:outline-none hover:text-blue-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
  
          <ul :class="['sm:flex items-center space-x-8 text-sm uppercase tracking-wide', { 'hidden': !isMenuOpen }]">
            <li v-for="item in menuItems" :key="item.href">
              <a :href="item.href" class="hover:text-blue-400 transition-colors duration-300 font-medium">{{ item.text }}</a>
            </li>
          </ul>
  
          <div class="hidden sm:block relative">
          <!-- Show when user is NOT logged in -->
          <router-link v-if="!isAuthenticated" to="/login">
            <button class="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-md text-white font-medium 
                transform transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Login
            </button>
          </router-link>
          
          <!-- Profile Dropdown when logged in -->
          <div v-else class="relative profile-menu">
            <button @click="toggleProfileMenu" 
                class="flex items-center space-x-3 focus:outline-none hover:opacity-80 transition-opacity">
              <div class="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                <template v-if="userData?.profile_picture">
                  <img 
                    :src="getProfileImageUrl(userData?.profile_picture)" 
                    :alt="`${userData.first_name}'s profile`"
                    class="w-10 h-10 rounded-full object-cover">
                </template>
                <template v-else>
                  <span class="text-lg font-bold text-white">{{ userInitials }}</span>
                </template>
              </div>
              <div class="text-left">
                <p class="font-medium">{{ userData?.first_name }} {{  userData?.last_name || 'User' }}</p>
                <p class="text-xs text-gray-300">{{ userType }}</p>
              </div>
                <svg  xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <!-- Dropdown Menu -->
            <div v-show="isProfileMenuOpen" 
                class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 text-gray-700">
              <router-link to="/profile" class="block px-4 py-2 text-sm hover:bg-gray-100 transition-colors">
                My Profile
              </router-link>
              <hr class="my-1 border-gray-200">
              <button @click="handleLogout" 
                  class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  
      <!-- Hero Section -->
      <section id="home" class="relative h-[70vh] flex items-center justify-center bg-cover bg-center bg-blend-multiply bg-fixed bg-no-repeat"
        :style="{ backgroundImage: 'url(' + require('@/assets/cmas-bg.jpg') + ')' }">
        <div class="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/80 filter backdrop-blur-md"></div>
        
        <div class="relative z-10 text-center max-w-5xl mx-auto px-6 py-20">
          <div class="space-y-8 animate-fade-in">
            <div class="flex justify-center items-center space-x-6">
              <!-- <img :src="require('@/assets/msun.png')" class="h-20 w-20 rounded-full ring-4 ring-blue-500/50" alt="MSUN Logo">
              <img :src="require('@/assets/cmas.png')" class="h-20 w-20 rounded-full ring-4 ring-blue-500/50" alt="CMAS Logo"> -->
            </div>
            <div>
              <h1 class="text-2xl text-yellow-400 font-serif mb-2" style="font-family: 'Matura MT Script Capitals' , cursive;">Mindanao State University at Naawan</h1>

              <h2 class="text-2xl text-white font-bold mb-4">COLLEGE OF MARINE AND ALLIED SCIENCES</h2>
            </div>
            <h1 class="text-8xl lg:text-6xl font-bold text-white mb-6 ">
              ITEM INFORMATION MANAGEMENT SYSTEM
            </h1>
            <p class="text-xl sm:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto leading-relaxed">
              Simplifying item Tracking, Borrowing, and Accountability for efficient Laboratory and Equipment Management.
            </p>
          </div>
        </div>
      </section>
  
      <!-- About Section -->
      <section id="about" class="bg-white py-20">
        <div class="container mx-auto px-6">
          <div class="grid md:grid-cols-2 gap-16 items-center">
            <div class="space-y-8">
              <h2 class="text-5xl font-extrabold text-gray-900 mb-6">
                <span class="text-blue-700">About</span> IIMS
              </h2>
              <p class="text-xl text-gray-700 leading-relaxed">
                The Item Information Management System (IIMS) provides a centralized platform for tracking and managing
                inventory items. Designed for the College of Marine and Allied Sciences, IIMS enhances borrowing, tracking, and chemical management
                enabling accountability and smooth transactions.
              </p>
            </div>
            <div class="hidden md:block">
            </div>
          </div>
        </div>
      </section>
  
      <!-- Features Section -->
      <section id="features" class="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div class="container mx-auto px-6 lg:px-24">
          <div class="text-center max-w-3xl mx-auto mb-16">
            <h2 class="text-4xl font-extrabold text-gray-900 mb-6">Key Features</h2>
            <p class="text-xl text-gray-600">Discover the best features that make IIMS the perfect solution for your laboratory and equipment management needs.</p>
          </div>
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <feature-card
              v-for="feature in features"
              :key="feature.title"
              :title="feature.title"
              :description="feature.description"
              :icon="feature.icon"
            />
          </div>
        </div>
      </section>
  
      <section id="contact">
      <footer class="bg-gray-900 text-gray-300 py-12">
        <div class="container mx-auto px-6">
          <div class="grid md:grid-cols-4 gap-8">
            <div class="space-y-4">
              <h3 class="text-lg font-bold text-white mb-4">About IIMS</h3>
              <p class="text-sm">A comprehensive system for managing laboratory equipment and resources at the College of Marine and Allied Sciences.</p>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white mb-4">Quick Links</h3>
              <ul class="space-y-2">
                <li v-for="item in menuItems" :key="item.href">
                  <a :href="item.href" class="text-sm hover:text-blue-400 transition-colors">{{ item.text }}</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white mb-4">Contact</h3>
              <ul class="space-y-2 text-sm">
                <li>College of Marine and Allied Sciences</li>
                <li>Mindanao State University at Naawan</li>
                <li>Email: <a href="mailto:cmas@msun.edu.ph" class="hover:text-blue-400 transition-colors underline">cmas@msun.edu.ph</a></li>
              </ul>
            </div>
            <div>
            <h3 class="text-lg font-bold text-white mb-4">Follow Us</h3>
            <div class="items-center space-x-4">
                <a href="https://www.facebook.com/CMASFenris" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="text-xl hover:text-blue-400 transition-colors">
                <i class="fab fa-facebook-f"></i>
                </a>
            </div>
            </div>
          </div>
          <div class="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; {{ currentYear }} Item Information Management System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </section>
    </div>
  </template>
  
  <script>
  import { ref, computed } from 'vue';
  import { useStore } from 'vuex';
  import FeatureCard from '@/components/charts/FeatureCard.vue';
  
  export default {
    name: 'LandingPageView',
    components: {
      FeatureCard
    },
    setup() {
      const store = useStore();
      const isMenuOpen = ref(false);
      const currentYear = computed(() => new Date().getFullYear());
      const isAuthenticated = computed(() => store.getters.isAuthenticated);
      const userType = computed(() => store.getters.userType);
      const userData = computed(() => store.getters.user);
      const isProfileMenuOpen = ref(false);
      const apiURL = 'http://localhost:8000'
      const userInitials = computed(() => {
      const username = userData.value?.username || '';
        return username.charAt(0).toUpperCase();
      });

      // Get dashboard route based on user type
      const getDashboardRoute = computed(() => {
        switch (userType.value) {
          case 'Admin':
            return '/admin-dashboard';
          case 'staff':
            return '/staff/dashboard';
          case 'Secretary':
            return '/secretary-dashboard';
          default:
            return '/dashboard';
        }
      });

      const toggleProfileMenu = () => {
        isProfileMenuOpen.value = !isProfileMenuOpen.value;
      };

      // Close profile menu when clicking outside
      const closeProfileMenu = (e) => {
        if (!e.target.closest('.profile-menu')) {
          isProfileMenuOpen.value = false;
        }
      };

      const getProfileImageUrl = (profilePath) => {
        if (profilePath && profilePath.startsWith('http')) {
          return profilePath;
        }
        // Otherwise, prepend the API URL
        return profilePath ? `${apiURL}${profilePath}` : defaultImageUrl;
      };

      // Add click outside listener
      if (typeof window !== 'undefined') {
        window.addEventListener('click', closeProfileMenu);
      }

      const handleLogout = () => {
        store.dispatch('logout');
        isProfileMenuOpen.value = false;
      };
    
      const menuItems = [
        { href: '#home', text: 'Home' },
        { href: '#about', text: 'About' },
        { href: '#features', text: 'Features' },
        { href: '#contact', text: 'Contact' }
      ];
  
      const features = [
        {
          title: 'Centralized Monitoring',
          description: 'Track and manage all inventory items in one place with real-time updates.',
          icon: 'fas fa-eye'
        },
        {
          title: 'Borrowing & Returning',
          description: 'Efficiently manage the borrowing and returning process with automated notifications and condition tracking.',
          icon: 'fas fa-exchange-alt'
        },
        {
          title: 'Chemical Request & Usage Tracking',
          description: 'Manage chemical requests and usage to ensure proper handling and safety.',
          icon: 'fas fa-flask'
        }
      ];
  
      const toggleMenu = () => {
        isMenuOpen.value = !isMenuOpen.value;
      };
  
      return {
        isMenuOpen,
        isProfileMenuOpen,
        menuItems,
        getProfileImageUrl,
        features,
        currentYear,
        toggleMenu,
        isAuthenticated,
        userType,
        userData,
        userInitials,
        handleLogout,
        getDashboardRoute,
        toggleProfileMenu,
        apiURL
      };
    }
  };
  </script>
  
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
  
  .animate-fade-in {
    animation: fadeIn 1s ease-out;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  </style>