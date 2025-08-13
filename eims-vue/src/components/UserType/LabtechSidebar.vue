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
          <li> 
            <router-link
              :to="{ name: 'labtech-dashboard' }"
              class="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
              @click="closeSidebarOnMobile"
            >
              <i class="fas fa-tachometer-alt w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"></i>
              <span class="ms-3">Dashboard</span>
            </router-link>
          </li>

          <li>
            <li>
              <router-link 
                to="/labtech-category" 
                class="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                @click="closeSidebarOnMobile"
              >
                <i class="fas fa-sitemap w-5 h-5 text-gray-500 dark:text-gray-400"></i>
                <span class="ms-3">Category</span>
              </router-link>
            </li>
            <button 
              @click="toggleTransactionDropdown" 
              type="button" 
              class="flex items-center w-full p-2 text-base text-gray-900 transition duration-75 rounded-lg group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
            >
              <i class="fas fa-exchange-alt w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"></i>
              <span class="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">Transactions</span>
              <i :class="['fas', isTransactionDropdownOpen ? 'fa-chevron-up' : 'fa-chevron-down', 'w-3 h-3 transition-transform duration-200']"></i>
            </button>
            <ul 
              :class="[' transition-all duration-200', isTransactionDropdownOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden']"
            >
              <li>
                <router-link 
                  to="/chemical-usage"
                  class="flex items-center w-full p-2 text-gray-900 transition duration-75 rounded-lg pl-11 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                  @click="closeSidebarOnMobile"
                >
                  Chemical Usage
                </router-link>
              </li>
              <li>
                <router-link 
                  to="/borrowed" 
                  class="flex items-center w-full p-2 text-gray-900 transition duration-75 rounded-lg pl-11 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                  @click="closeSidebarOnMobile"
                >
                  Current Borrowed
                </router-link>
              </li>
              <li>
                <router-link 
                  to="/returned" 
                  class="flex items-center w-full p-2 text-gray-900 transition duration-75 rounded-lg pl-11 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                  @click="closeSidebarOnMobile"
                >
                  Recently Returned
                </router-link>
              </li>
              <li>
                <router-link 
                  to="/distributed-apparatus" 
                  class="flex items-center w-full p-2 text-gray-900 transition duration-75 rounded-lg pl-11 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                  @click="closeSidebarOnMobile"
                >
                  Distributed Apparatus
                </router-link>
              </li>             
            </ul>
          </li>

          <li>
            <button 
              @click="toggleItemDropdown" 
              type="button" 
              class="flex items-center w-full p-2 text-base text-gray-900 transition duration-75 rounded-lg group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
            >
              <i class="fas fa-chart-bar w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"></i>
                <span class="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">Items</span>
              <i :class="['fas', isItemDropdownOpen ? 'fa-chevron-up' : 'fa-chevron-down', 'w-3 h-3 transition-transform duration-200']"></i>
            </button>
            <ul 
              :class="[' transition-all duration-200', isItemDropdownOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden']"
            >
              <li>
                <router-link 
                  to="/chemical" 
                  class="flex items-center w-full p-2 text-gray-900 transition duration-75 rounded-lg pl-11 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                  @click="closeSidebarOnMobile"
                >
                  Chemical
                </router-link>
              </li>
              <li>
                <router-link 
                  to="/equipments" 
                  class="flex items-center w-full p-2 text-gray-900 transition duration-75 rounded-lg pl-11 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                  @click="closeSidebarOnMobile"
                >
                  Equipment
                </router-link>
              </li>
              <li>
                <router-link 
                  to="/apparatus" 
                  class="flex items-center w-full p-2 text-gray-900 transition duration-75 rounded-lg pl-11 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                  @click="closeSidebarOnMobile"
                >
                  Apparatus
                </router-link>
              </li>
            </ul>
          </li>

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
    </aside>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'LabtechSidebar',
  setup() {
    const store = useStore()
    const isSidebarOpen = ref(false)

    const isTransactionDropdownOpen = ref(
      localStorage.getItem('isTransactionDropdownOpen') === 'true'
    )
    const isItemDropdownOpen = ref(
      localStorage.getItem('isItemDropdownOpen') === 'true'
    )
    const menuItems = [
      { name: 'Subjects', route: '/subjects', icon: 'fas fa-book' },
      { name: 'Profile', route: '/profile', icon: 'fas fa-user' },
    ]

    const toggleSidebar = () => {
      isSidebarOpen.value = !isSidebarOpen.value
      if (isSidebarOpen.value) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = 'auto'
      }
    }

    const toggleTransactionDropdown = () => {
      isTransactionDropdownOpen.value = !isTransactionDropdownOpen.value
      isItemDropdownOpen.value = false
      localStorage.setItem(
        'isTransactionDropdownOpen',
        isTransactionDropdownOpen.value.toString()
      )
      localStorage.setItem('isItemDropdownOpen', 'false')
    }

    const toggleItemDropdown = () => {
      isItemDropdownOpen.value = !isItemDropdownOpen.value
      isTransactionDropdownOpen.value = false
      localStorage.setItem(
        'isItemDropdownOpen',
        isItemDropdownOpen.value.toString()
      )
      localStorage.setItem('isTransactionDropdownOpen', 'false')
    }

    const closeSidebarOnMobile = () => {
      if (window.innerWidth < 1024) { 
        isSidebarOpen.value = false
        document.body.style.overflow = 'auto'
      }
    }

    const handleLogout = () => {
      store.dispatch('logout')
      localStorage.removeItem('isDropdownOpen')
      closeSidebarOnMobile()
    }

    onMounted(() => {
      if (localStorage.getItem('isTransactionDropdownOpen') === null) {
        localStorage.setItem('isTransactionDropdownOpen', 'false')
      }

      if (localStorage.getItem('isItemDropdownOpen') === null) {
        localStorage.setItem('isItemDropdownOpen', 'false')
      }

    }) 
  
    return {
      toggleSidebar,
      isSidebarOpen,
      isTransactionDropdownOpen,
      isItemDropdownOpen,

      toggleTransactionDropdown,
      toggleItemDropdown,


      menuItems,
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