<template>
  <div>
    <!-- Mobile Menu Button -->
    <button 
      @click="toggleSidebar" 
      class="fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-100 lg:hidden hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200"
      aria-controls="logo-sidebar"
      aria-expanded="false"
    >
      <i :class="['fas', isSidebarOpen ? 'fa-times' : 'fa-bars', 'w-6 h-6 text-gray-500']"></i>
    </button>

    <!-- Backdrop for mobile -->
    <div 
      v-if="isSidebarOpen" 
      @click="toggleSidebar"
      class="fixed inset-0 bg-gray-800 bg-opacity-50 z-30 lg:hidden transition-opacity duration-300"
    ></div>

    <!-- Sidebar -->
    <aside 
      id="logo-sidebar" 
      :class="[
        'fixed top-0 left-0 z-40 w-64 h-screen transition-transform duration-300 ease-in-out',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0'
      ]"
      aria-label="Sidebar"
    >
      <div class="h-full px-3 py-4 overflow-y-auto bg-gray-50 dark:bg-gray-800">
        <!-- Logo -->
        <a href="/landing-page" class="flex items-center ps-2.5 mb-5">
          <img :src="require('@/assets/cmas.png')" class="h-6 me-3 sm:h-10" alt="CMASLogo" />
          <span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white">IIMS</span>
        </a>

        <!-- Navigation Menu -->
        <ul class="space-y-2 font-medium">
          <!-- Dashboard -->
          <!-- <li>
            <router-link 
              :to="{ name: 'staff-dashboard' }"
              href="#" 
              class="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
              @click="closeSidebarOnMobile"
            >
              <i class="fas fa-tachometer-alt w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"></i>
              <span class="ms-3">Dashboard</span>
            </router-link>
          </li> -->

          <!-- Other Menu Items -->
          <li v-for="(item, index) in menuItems" :key="index">
            <router-link 
              :to="item.route" 
              class="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
              @click="closeSidebarOnMobile"
            >
              <i :class="[item.icon, 'w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white']"></i>
              <span class="flex-1 ms-3 whitespace-nowrap">{{ item.name }}</span>
            </router-link>
          </li>

          <!-- Logout -->
          <li>
            <a 
              @click="handleLogout" 
              class="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group cursor-pointer"
            >
              <i class="fas fa-sign-out-alt w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"></i>
              <span class="flex-1 ms-3 whitespace-nowrap">Logout</span>
            </a>
          </li>
        </ul>
      </div>

      <!-- Barcode Scanner Button -->
      <router-link 
        to="/barcode-scanner" 
        class="fixed bottom-4 right-4 lg:absolute lg:top-1/2 lg:right-[-30px] w-12 h-12 lg:w-16 lg:h-16 bg-blue-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-blue-700 transition duration-300 transform hover:scale-110"
        @click="closeSidebarOnMobile"
      >
        <i class="fas fa-barcode w-6 h-6 lg:w-8 lg:h-8"></i>
      </router-link>
    </aside>
  </div>
</template>

<script>
import router from '@/router';
import { ref } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'AdminSidebar',
  setup() {
    const store = useStore()
    const isSidebarOpen = ref(false)
    const isDropdownOpen = ref(false)

    const menuItems = [
      // { name: 'Departments', route: '/department', icon: 'fas fa-building' },
      { name: 'Employee', route: '/users', icon: 'fas fa-user' },
      // { name: 'Staffs', route: '/staffs', icon: 'fas fa-users' },
      { name: 'Room', route: '/rooms', icon: 'fas fa-door-open' },
      { name: 'Profile', route: '/profile', icon: 'fas fa-user' }
    ]

    const toggleSidebar = () => {
      isSidebarOpen.value = !isSidebarOpen.value
      if (isSidebarOpen.value) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = 'auto'
      }
    }

    const toggleDropdown = () => {
      isDropdownOpen.value = !isDropdownOpen.value
    }

    const closeSidebarOnMobile = () => {
      if (window.innerWidth < 1024) { // lg breakpoint
        isSidebarOpen.value = false
        document.body.style.overflow = 'auto'
      }
    }

    const handleLogout = () => {
      store.dispatch('logout')
      closeSidebarOnMobile()
    }

    return {
      isSidebarOpen,
      isDropdownOpen,
      menuItems,
      toggleSidebar,
      toggleDropdown,
      closeSidebarOnMobile,
      handleLogout
    }
  }
}
</script>

<style scoped>
/* Ensure smooth transitions */
.transition-transform {
  will-change: transform;
}

/* Prevent content shift on mobile */
@media (max-width: 1023px) {
  :deep(.router-link-active) {
    background-color: rgb(243 244 246 / var(--tw-bg-opacity));
  }
}
</style>