<template>
    <div class="flex h-screen bg-gradient-to-b from-[#F5F4F7] to-[#D4EAF7]">
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
  
          <h1 v-if="userType === 'Secretary'" class="text-3xl font-bold mb-6 text-gray-800">Distributed Items </h1>
          <h1 v-else class="text-3xl font-bold mb-6 text-gray-800">Received Items </h1>
  
          <div class="flex items-center mb-4 mr-4">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search..."
              class="border border-gray-300 rounded py-2 px-4"
            />
          </div>
   
          <div v-if="loading" class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <div v-else-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
            <p class="font-bold">Error</p>
            <p>{{ error }}</p>
          </div>
          <div v-else-if="distributedItems.length === 0" class="text-center text-gray-500 text-lg my-8">
            No returned items found.
          </div>
  
          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th v-for="header in tableHeaders" :key="header" 
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ header }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(returnedItem, index) in distributedItems" :key="returnedItem.id" 
                    :class="{'bg-gray-50': index % 2 === 0}"
                    class="hover:bg-gray-100 transition-colors duration-150 ease-in-out">
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div>
                      {{ returnedItem.item_instance.item.name }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ returnedItem.item_instance.inventory_number }}
                    </div>
                  </td>               
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div class="px-5 text-xs py-1 bg-blue-100 w-fit text-blue-800 rounded-full" >
                      {{ returnedItem.item_instance.last_borrow_record.borrower }}
                    </div>
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700 ">
                    <span :class="[
                        getConditionClass(returnedItem.item_instance.current_condition ),
                        'text-sm font-medium px-3 py-1 rounded-full'
                        ]">
                          {{ returnedItem.item_instance.current_condition }}
                    </span>
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{{ returnedItem.borrow_record.room.name }}</td>
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{{ formatDate(returnedItem.borrow_record.borrow_date) }}</td>
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{{ formatDate(returnedItem.return_date) }}</td>
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{{ returnedItem.notes}}</td>
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
  </template>
    
  <script>
  import { defineComponent, ref, onMounted, computed, watch } from 'vue'
  import { useStore } from 'vuex'
  import { useRouter } from 'vue-router'
  import axios from 'axios'
  import Sidebar from '@/components/UserType/Sidebar.vue'
  
  
  export default defineComponent({
    name: 'ReturnedList',
    components: {
      Sidebar
    },
    setup() {
      const router = useRouter()
      const store = useStore()
      const distributedItems = ref([])
      const loading = ref(true)
      const error = ref(null)
      const tableHeaders = ['Item',  'Borrower', 'Condition on Return', 'Room', 'Borrow At', 'Return Date' , 'Remarks' ]
      const isSidebarOpen = ref(false)
      const searchQuery = ref('')
  
      const currentPage = ref(1);
      const totalPages = ref(0);
      const pageSize = ref(10);

      const userType = computed(() => store.state.userType)
  
      const goBack = () => {
        router.back()
      }
  
  
    
      const fetchDistributedItems = async () => {
        loading.value = true
        error.value = null
        try {
          const response = await axios.get('/api/distributed-items/', {
            headers: {
              'Authorization': `Token ${store.state.token}`
            },
            params: {
              page: currentPage.value,
              page_size: pageSize.value,
              search: searchQuery.value,
            }
          })
          distributedItems.value = response.data.results || response.data;
          totalPages.value = Math.ceil(response.data.count / pageSize.value) || 1
  
        } catch (err) {
          console.error("Error fetching distributed items:", err)
          error.value = "Failed to fetch distributed items. Please try again."
        } finally {
          loading.value = false
        }
      }
  
      watch([searchQuery, currentPage, pageSize], () => {
        currentPage.value = 1;
        fetchDistributedItems()
      }, { immediate: true });
  
      const nextPage = () => {
        if (currentPage.value < totalPages.value) {
          currentPage.value++;
          fetchDistributedItems();
        }
      };
  
      const prevPage = () => {
        if (currentPage.value > 1) {
          currentPage.value--;
          fetchDistributedItems();
        }
      };
  
      const handleSidebarToggle = () => {
        isSidebarOpen.value = !isSidebarOpen.value
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
      };
  
      const getConditionClass = (condition) => {
        switch (condition.toLowerCase()) {
            case 'good':
            return 'text-green-600';
            case 'fair':
            return 'text-yellow-600';
            case 'poor':
            return 'text-orange-600';
            case 'damaged':
            return 'text-red-600';
            default:
            return 'text-gray-600';
        }
        };
  
      onMounted(() => {
        fetchDistributedItems()
  
        window.addEventListener('resize', handleWindowResize);
  
        handleWindowResize();
      });
  
      const handleWindowResize = () => {
        if (window.innerWidth >= 1024) {
          isSidebarOpen.value = true;
        } else {
          isSidebarOpen.value = false;
        }
      };
  
  
      
      return {
        distributedItems,
        loading,
        error,
        searchQuery,
        formatDate,
        getConditionClass,
        tableHeaders,
        goBack,
        handleSidebarToggle,
        nextPage,
        prevPage,
        isSidebarOpen,
        currentPage,
        totalPages,
        pageSize,
        handleSidebarToggle,
        userType
  
      }
    }
  })
  </script>