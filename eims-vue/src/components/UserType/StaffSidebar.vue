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
          <li v-for="(item, index) in filteredMenuItems" :key="index">
            <router-link 
              :to="item.route" 
              class="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
              @click="closeSidebarOnMobile"
            >
              <i :class="[item.icon, 'w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white']"></i>
              <span class="flex-1 ms-3 whitespace-nowrap">{{ item.name }}</span>
            </router-link>
          </li>

          <!-- <li v-if = "userData.department == 'Marine Biology'">
            <button 
              @click="toggleDropdown" 
              type="button" 
              class="flex items-center w-full p-2 text-base text-gray-900 transition duration-75 rounded-lg group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
            >
              <i class="fas fa-exchange-alt w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"></i>
              <span class="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">Transaction</span>
              <i :class="['fas', isDropdownOpen ? 'fa-chevron-up' : 'fa-chevron-down', 'w-3 h-3 transition-transform duration-200']"></i>
            </button>
            <ul 
              :class="[' transition-all duration-200', isDropdownOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden']"
            > 
              <li>
                <router-link 
                  to="/borrowed" 
                  class="flex items-center w-full p-2 text-gray-900 transition duration-75 rounded-lg pl-11 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                  @click="closeSidebarOnMobile"
                >
                  Borrowed Items
                </router-link>
              </li>
              <li>
                <router-link 
                  to="/returned" 
                  class="flex items-center w-full p-2 text-gray-900 transition duration-75 rounded-lg pl-11 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                  @click="closeSidebarOnMobile"
                >
                  Returned History
                </router-link>
              </li>
              <li>
                <router-link 
                  to="/chemical-usage" 
                  class="flex items-center w-full p-2 text-gray-900 transition duration-75 rounded-lg pl-11 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                  @click="closeSidebarOnMobile"
                >
                  Chemical Usage
                </router-link>
              </li>
            </ul>
          </li> -->

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
import { defineComponent, computed, watch, onMounted } from 'vue'
import { ref } from 'vue'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'StaffSidebar',
  setup() {
    const store = useStore()
    const isSidebarOpen = ref(false)
    const isDropdownOpen = ref(localStorage.getItem('isDropdownOpen') === 'true')
    const userData = computed(() => store.state.user || {})

    const menuItems = [
      { name: 'Borrowed Items', route: '/borrowed-items', icon: 'fas fa-box', departments: ['Information Technology'] },
      { name: 'Returned History', route: '/returned-items', icon: 'fas fa-history', departments: ['Information Technology'] },
      { name: 'Recieved Items', route: '/distributed-items', icon: 'fas fa-gift', departments: ['Information Technology'] },

      { name: 'Chemical Usage', route: '/chemical-usage', icon: 'fas fa-flask', departments: ['Marine Biology'] },
      { name: 'Borrowed Items', route: '/borrowed', icon: 'fas fa-box', departments: ['Marine Biology'] },
      { name: 'Returned History', route: '/returned', icon: 'fas fa-history', departments: ['Marine Biology'] },
      { name: 'Recieved Items', route: '/distributed-items', icon: 'fas fa-gift', departments: ['Marine Biology'] },



      { name: 'Profile', route: '/profile', icon: 'fas fa-user', departments: ['Marine Biology', 'Information Technology'] }
    ]

    const filteredMenuItems = computed(() => {
      const department = userData.value.department
      return menuItems.filter(item => item.departments.includes(department))
    })


    watch(isDropdownOpen, (newValue) => { 
      localStorage.setItem('isDropdownOpen', newValue)
    })


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

    onMounted(() => {
    // If no stored value exists, set default to false
      if (localStorage.getItem('isDropdownOpen') === null) {
        localStorage.setItem('isDropdownOpen', 'false')
      }
    })

    const handleLogout = () => {
      store.dispatch('logout')
      closeSidebarOnMobile()
    }

    return {
      isSidebarOpen,
      isDropdownOpen,
      menuItems,
      filteredMenuItems,
      userData,
      toggleSidebar,
      toggleDropdown,
      closeSidebarOnMobile,
      handleLogout
    }
  }
})
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