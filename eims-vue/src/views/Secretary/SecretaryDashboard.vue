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

        <h1 class="text-3xl font-bold mb-6 text-gray-800">Secretary Dashboard</h1>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div 
              @click="navigateToItems"
              class="bg-white shadow-md rounded-lg p-6 border border-gray-200 flex items-center transition duration-150 ease-in-out hover:bg-gray-100 hover:shadow-lg"
            >
              <div class="bg-blue-100 rounded-full p-3 mr-4">
                <i class="fas fa-box text-blue-600 text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">Total Items</h3>
                <p class="text-3xl font-bold text-blue-600">{{ dashboardData.dean_items }}</p>
              </div>
            </div>

            <div  @click="navigateToBorrowedItems"
              class="bg-white shadow-md rounded-lg p-6 border border-gray-200 flex items-center transition duration-150 ease-in-out hover:bg-gray-100 hover:shadow-lg"
            >
              <div class="bg-green-100 rounded-full p-3 mr-4">
                <i class="fas fa-arrow-right text-green-600 text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">Current Borrowed Items</h3>
                <p class="text-3xl font-bold text-green-600">{{ dashboardData.total_borrow_records }}</p>
              </div>
            </div>

            <div  @click="navigateToReturnedItems"
              class="bg-white shadow-md rounded-lg p-6 border border-gray-200 flex items-center transition duration-150 ease-in-out hover:bg-gray-100 hover:shadow-lg"
            >
              <div class="bg-yellow-100 rounded-full p-3 mr-4">
                <i class="fas fa-undo text-yellow-600 text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">Returned Items</h3>
                <p class="text-3xl font-bold text-yellow-600">{{ dashboardData.total_return_records }}</p>
              </div>
            </div>



          </div>

        
          <BorrowChart :borrowPerDayData="dashboardData.borrow_per_day_full" />

          <div class="grid grid-cols-1 lg:grid-cols-3 mt-8 gap-8">
              <div class="bg-white shadow-md rounded-lg p-6 border-gray-200">
                <div class="flex items-center mb-4">
                  <i class="fas fa-chart-bar text-blue-600 mr-2 text-lg"></i>
                  <h3 class="text-xl font-semibold text-gray-800">Most Borrowed Items</h3>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-sm text-left text-gray-500">
                    <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th class="px-4 py-2">Item Name</th>
                        <th class="px-4 py-2">Borrow Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in dashboardData.most_borrowed_items" :key="item.id" 
                          class="bg-white border-b hover:bg-gray-50">
                        <td class="px-4 py-2">
                          <div class="flex items-center">{{ item.name }}</div>
                          <div class="text-xs text-gray-400"> {{ item.inventory_number }} </div>
                        </td>
                        <td class="px-4 py-2">{{ item.borrow_count }} times</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
          


          <div class="bg-white shadow-md rounded-lg p-6 border border-gray-200">
              <div class="flex items-center mb-4">
                <i class="fas fa-history text-green-600 mr-2 text-lg"></i>
                <h3 class="text-xl font-semibold text-gray-800">Recent Borrowed</h3>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-sm text-left text-gray-500">
                  <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th class="px-4 py-2">Item</th>
                      <th class="px-4 py-2">Borrower</th>
                      <th class="px-4 py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="record in dashboardData.currently_borrowed" :key="record.id" 
                        class="bg-white border-b hover:bg-gray-50">
                      <td class="px-4 py-2">{{ record.item }}</td>
                      <td class="px-4 py-2">{{ record.borrower }}</td>
                      <td class="px-4 py-2">{{ formatDate(record.borrow_date) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="bg-white shadow-md rounded-lg p-6 border border-gray-200">
              <div class="flex items-center mb-4">
                  <i class="fas fa-exclamation-triangle text-red-600 mr-2 text-lg"></i>
                  <h3 class="text-xl font-semibold text-gray-800">Items Needing Attention</h3>
              </div>

              <div class="overflow-x-auto">
                  <template v-if="dashboardData.items_needing_attention.length > 0">
                  <table class="w-full text-sm text-left text-gray-500">
                      <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                          <th class="px-4 py-2">Item Name</th>
                          <th class="px-4 py-2">Serial Number</th>
                          <th class="px-4 py-2">Condition</th>
                      </tr>
                      </thead>
                      <tbody>
                      <tr v-for="item in dashboardData.items_needing_attention" :key="item.id" 
                          class="bg-white border-b hover:bg-gray-50">
                          <td class="px-4 py-2">{{ item.name }}</td>
                          <td class="px-4 py-2">{{ item.serial_number }}</td>
                          <td class="px-4 py-2">
                          <span class="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                              {{ item.condition }}
                          </span>
                          </td>
                      </tr>
                      </tbody>
                  </table>
                  </template>
                  <template v-else>
                  <p class="text-gray-500 text-center py-4">No items need attention at this time.</p>
                  </template>
              </div>
            </div>
          
        </div>
      </div> 
    </div>
  </div>
</template>
  
<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import Sidebar from '../../components/UserType/Sidebar.vue'
import axios from 'axios'
import router from '@/router';
import BorrowPerDay from '@/components/charts/BorrowPerDay.vue';
import BorrowChart from '@/components/charts/BorrowChart.vue';
  
  export default defineComponent({
    name: 'SecretaryDashboard',
    components: {
      Sidebar, BorrowPerDay, BorrowChart
    },
    setup() {
    const loading = ref(true);
    const error = ref(null);
    const dashboardData = ref({
      dean_items: 0,
      currently_borrowed: 0,
      total_return_records: 0,
      most_borrowed_items: [],
      total_borrow_records: [],
      items_needing_attention: [],
      borrow_per_day_full: []
    });
    const mostBorrowedItems = ref([]);
    const totalBorrowRecords = ref([]);
    const itemsNeedingAttention = ref([]);
    const borrowPerDay = ref([])
    const isSidebarOpen = ref(false)
  
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('/api/secretary-dashboard/')
        dashboardData.value = response.data
        loading.value = false
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        loading.value = false
      }
    }
  
      const goBack = () => {
        router.go(-1);
      }
  
      const handleSidebarToggle = (isOpen) => {
        isSidebarOpen.value = isOpen
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

      const navigateToItems = () => {
        router.push({ name: 'items' })
      }

      const navigateToBorrowedItems = () => {
        router.push({ name: 'borrowed-items' })
      }

      const navigateToReturnedItems = () => {
        router.push({ name: 'returned-items' })
      }
  
      onMounted(() => {
        fetchDashboardData();
  
        isSidebarOpen.value = window.innerWidth >= 1024
      })
  
      return {
        loading,
        error,
        dashboardData,
        isSidebarOpen,
        handleSidebarToggle,
        goBack,
        mostBorrowedItems,
        totalBorrowRecords,
        itemsNeedingAttention,
        borrowPerDay,
        formatDate,
        navigateToItems,
        navigateToBorrowedItems,
        navigateToReturnedItems
      }
    }
  })
  </script>