<template>
  <div class="flex h-screen bg-gradient-to-b from-[#F5F4F1] to-[#D4EAF7]">
    <Sidebar @sidebarToggle="handleSidebarToggle" />
      <div 
        :class="[
          'flex-1 overflow-x-auto p-8 transition-all duration-300 ease-in-out',
          isSidebarOpen ? 'lg:ml-64' : 'ml-0'
        ]"
      >
      <div class="max-w-full bg-white/80 backdrop-blur-md shadow-lg rounded-lg p-8">

        <button @click="goBack" class="flex items-center mb-6 text-gray-700 hover:text-gray-900">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 class="text-3xl font-bold mb-6 text-gray-800">Borrowed Summary</h1>

        <div v-if="loading" class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <div v-else-if="error" class="text-center text-red-500 text-lg my-8">
            {{ error }}
        </div>
        <div v-else>

          <div class="bg-white/50 backdrop-blur-sm shadow-md rounded-lg p-6 mb-8">
            <h2 class="text-xl font-semibold mb-4">{{ user.first_name }} {{ user.last_name }}</h2>
            <p><strong>ID:</strong> {{ user.custom_id }}</p>
            <p><strong>Email:</strong> {{ user.email || 'None' }}</p>
          </div>

          <div class="mb-6 border-b border-gray-200">
                <nav class="-mb-px flex space-x-4">
                    <button 
                    v-for="tab in tabs" 
                    :key="tab"
                    @click="currentTab = tab"
                    :class="[
                        'px-4 py-2 font-medium text-sm rounded-t-lg',
                        currentTab === tab 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200'
                    ]"
                    >
                    {{ tab }}
                    </button>
                </nav>
            </div>

          <div v-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
            <p class="font-bold">Error</p>
            <p>{{ error }}</p>
          </div>

          <div v-else-if="currentTab === 'Current Borrowed Items'  && user.current_borrowed_items.length === 0" class="text-center text-gray-500 text-lg my-8">
            No borrowed items found.
          </div>

          <div v-else-if="currentTab === 'Current Borrowed Equipments' && user.current_borrowed_equipments.length === 0" class="text-center text-gray-500 text-lg my-8">
            No borrowed equipments found.
          </div>

          <div v-else-if="currentTab === 'Current Borrowed Apparatus' && user.current_borrowed_apparatus.length === 0" class="text-center text-gray-500 text-lg my-8">
            No borrowed apparatus found.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                <tr>
                    <th v-for="header in visibleTableHeaders" 
                        :key="header" 
                        class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ header }}
                    </th>
                </tr>
                </thead>    
                    <tbody v-if="currentTab === 'Current Borrowed Items'" class="bg-white divide-y divide-gray-200">
                    <tr 
                        v-for="item in user.current_borrowed_items" 
                        :key="item.id"
                        class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
                    >
                    <td class="px-4 py-4">
                        <div class="text-sm font-medium text-gray-900">
                            {{ item.item_instance?.item.name }}
                        </div>
                        <div class="text-sm text-gray-500">
                            {{ item.item_instance?.inventory_number }}
                        </div>
                    </td>
                    <td class="px-4 py-4">
                        <div class="text-sm text-gray-900">
                            {{ item?.room.name }}
                        </div>
                    </td>
                    <td class="px-4 py-4">
                        <div class="text-sm text-gray-900">
                            {{ formatDate(item?.borrow_date) }}
                        </div>
                    </td>
                </tr>
              </tbody>
                <tbody v-if="currentTab === 'Current Borrowed Equipments'" class="bg-white divide-y divide-gray-200">
                      <tr 
                          v-for="item in user?.current_borrowed_equipments" 
                          :key="item.id"
                          class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
                      >
                      <td class="px-4 py-4">
                        <div class="text-sm font-medium text-gray-900">
                          {{ item?.equipment_instance?.equipment?.name }}
                        </div>
                        <div class="text-sm text-gray-500">
                          {{ item?.equipment_instance?.inventory_number }}
                        </div>
                      </td>
                      <td class="px-4 py-4">
                        <div class="text-sm text-gray-900">{{ item?.room }}</div>
                      </td>
                      <td class="px-4 py-4">
                        <div class="text-sm text-gray-900">{{ formatDate(item?.borrowed_date) }}</div>
                      </td>
                  </tr>
                </tbody>
                <tbody v-if="currentTab === 'Current Borrowed Apparatus'" class="bg-white divide-y divide-gray-200">
                      <tr 
                          v-for="item in user.current_borrowed_apparatus" 
                          :key="item.id"
                          class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
                      >
                      <td class="px-4 py-4">
                          <div class="text-sm font-medium text-gray-900">
                              {{ item.apparatus_instance?.apparatus.name }}
                          </div>
                          <div class="text-sm text-gray-500">
                              {{ item.apparatus_instance?.inventory_number }}
                          </div>
                      </td>
                      <td class="px-4 py-4">
                          <div class="text-sm text-gray-900">
                              {{ item?.room }}
                          </div>
                      </td>
                      <td class="px-4 py-4">
                          <div class="text-sm text-gray-900">
                              {{ formatDate(item?.borrowed_date) }}
                          </div>
                      </td>
                  </tr>
                </tbody>
              </table>
              <div class="flex items-center mt-4 space-x-4">
                  <button 
                    @click="prevPage" 
                    :disabled="currentPage === 1"
                    class="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 focus:ring-2 focus:ring-blue-300"
                    aria-label="Previous Page"
                  >
                    Previous
                  </button>
                  <button 
                    @click="nextPage" 
                    :disabled="currentPage === totalPages"
                    class="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 focus:ring-2 focus:ring-blue-300"
                    aria-label="Next Page"
                  >
                    Next
                  </button>
      
                  <span class="text-gray-700 font-medium">
                    Page <span class="font-bold">{{ currentPage }}</span> of <span class="font-bold">{{ totalPages }}</span>
                  </span>
              </div>
            </div>
        </div>
      </div> 
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import Sidebar from '@/components/UserType/Sidebar.vue'

export default defineComponent({
  name: 'StaffDetail',
  components: {
    Sidebar
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const user = ref(null)
    const loading = ref(true)
    const error = ref(null)
    const isSidebarOpen = ref(true)
    const borrowedItems = ['Item Name',  'Room', 'Borrowed Date']
    const borrowedEquipments = ['Equipment Name',  'Room', 'Borrowed Date']
    const borrowedApparatus = ['Apparatus Name',  'Room', 'Borrowed Date']
    const visibleTableHeaders = computed(() => {
      switch(currentTab.value) {
        case 'Current Borrowed Items':
          return ['Item Name', 'Room', 'Borrowed Date']
        case 'Current Borrowed Equipments':
          return ['Equipment Name', 'Room', 'Borrowed Date']
        case 'Current Borrowed Apparatus':
          return ['Apparatus Name', 'Room', 'Borrowed Date']
        default:
          return []
      }
    })
    const tabs = ref(['Current Borrowed Items', 'Current Borrowed Equipments', 'Current Borrowed Apparatus'])
    const currentTab = ref(localStorage.getItem('currentTab') || tabs.value[0])
    const currentPage = ref(1);
    const totalPages = ref(0);
    const pageSize = ref(10);
    

    watch(currentTab, (newTab) => {
      localStorage.setItem('currentTab', newTab)
      fetchStaffDetails()
    })


    const fetchStaffDetails = async () => {
      loading.value = true
      error.value = null
      try {
        const response = await axios.get(`/api/staffs/${route.params.id}/detail/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          },
          params: {
            page: currentPage.value,
            page_size: pageSize.value
          }
        })
        user.value = response.data
        totalPages.value = Math.ceil(user.value.total_items / pageSize.value) || 1;
      } catch (err) {
        console.error("Error fetching user details:", err)
        error.value = "Failed to fetch user details. Please try again."
      } finally {
        loading.value = false
      }
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString);
        const options = {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true  
        };
        return date.toLocaleString('en-US', options); 
    }
      
    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
        fetchStaffDetails();
      }
    };

    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--;
        fetchStaffDetails();
      }
    };

    const goBack = () => {
      router.go(-1)
    }

    const handleSidebarToggle = (isOpen) => {
      isSidebarOpen.value = isOpen
    }



    onMounted (() => {
      fetchStaffDetails()

      const storedTab = localStorage.getItem('currentTab')
      if (storedTab && !tabs.value.includes(storedTab)) {
          currentTab.value = tabs.value[0]
          localStorage.setItem('currentTab', currentTab.value)
      }
    })

    return {
      user,
      loading,
      error,
      currentTab,
      tabs,
      visibleTableHeaders,
      borrowedItems,
      borrowedEquipments,
      borrowedApparatus,
      formatDate,
      goBack,
      isSidebarOpen,
      handleSidebarToggle,
      nextPage,
      prevPage,
      currentPage,
      totalPages,
      pageSize
    }
  }
})
</script>

<style scoped>
/* Add any additional styles here */
</style>