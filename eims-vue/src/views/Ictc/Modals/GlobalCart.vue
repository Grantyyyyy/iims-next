<!-- layouts/MainLayout.vue -->
<template>
    <div class="min-h-screen bg-gray-50">
      <!-- Main Navigation -->
      <nav class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex">
              <router-link to="/" class="flex items-center">
                <span class="text-lg font-bold text-blue-600">Inventory System</span>
              </router-link>
            </div>
            <div class="flex items-center">
              <!-- Add any navigation items here -->
            </div>
          </div>
        </div>
      </nav>
  
      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <router-view></router-view>
      </main>
  
      <!-- Global Cart Component -->
      <CartSummary 
        @open-borrow="handleBorrow" 
        :redirect-url="currentRoute"
      />
    </div>
  </template>
  
  <script>
  import { defineComponent } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import CartSummary from './CartSummary.vue';
  
  export default defineComponent({
    name: 'GlobalCart',
    components: {
      CartSummary
    },
    setup() {
      const router = useRouter();
      const route = useRoute();
  
      const handleBorrow = () => {
        // Store the current route path for returning after borrowing
        localStorage.setItem('returnToPath', route.fullPath);
        router.push('/borrow-confirmation');
      };
  
      const currentRoute = route.fullPath;
  
      return {
        handleBorrow,
        currentRoute
      };
    }
  });
  </script>