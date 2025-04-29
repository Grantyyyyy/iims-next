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

        <h1 class="text-3xl font-bold mb-6 text-gray-800">Welcome to Dashboard</h1>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div 
              @click="navigateToChemical"
              class="bg-white shadow-md rounded-lg p-6 border border-gray-200 flex items-center transition duration-150 ease-in-out hover:bg-gray-100 hover:shadow-lg"
            >
              <div class="bg-blue-100 rounded-full p-3 mr-4 flex items-center justify-center">
                <i class="fas fa-flask text-blue-600 text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">Total Chemicals</h3>
                <p class="text-3xl font-bold text-blue-600">{{ dashboardData.total_chemicals }}</p>
              </div>
            </div>

            <div 
              @click="navigateToEquipments"
              class="bg-white shadow-md rounded-lg p-6 border border-gray-200 flex items-center transition duration-150 ease-in-out hover:bg-gray-100 hover:shadow-lg"
            >
              <div class="bg-green-100 rounded-full p-3 mr-4 flex items-center justify-center">
                <i class="fas fa-tools text-green-600 text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">Total Equipments</h3>
                <p class="text-3xl font-bold text-green-600">{{ dashboardData.total_equipments }}</p>
              </div>
            </div>

            <div 
              @click="navigateToApparatus"
              class="bg-white shadow-md rounded-lg p-6 border border-gray-200 flex items-center transition duration-150 ease-in-out hover:bg-gray-100 hover:shadow-lg"
            >
              <div class="bg-yellow-100 rounded-full p-3 mr-4 flex items-center justify-center">
                <i class="fas fa-microscope text-yellow-600 text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">Total Apparatus</h3>
                <p class="text-3xl font-bold text-yellow-600">{{ dashboardData.total_apparatus }}</p>
              </div>
            </div>

          </div>

      
          <UsageChart :usagePerDay="dashboardData.todays_usage_details" />

          <div class="grid grid-cols-1 lg:grid-cols-2 mt-8 gap-8">
              <div class="bg-white shadow-md rounded-lg p-6 border-gray-200">
                <div class="flex items-center mb-4">
                  <i class="fas fa-chart-bar text-blue-600 mr-2 text-lg"></i>
                  <h3 class="text-xl font-semibold text-gray-800">Recent Chemical Usage</h3>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-sm text-left text-gray-500">
                    <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th class="px-4 py-2">Chemical Name</th>
                        <th class="px-4 py-2">Volume Used</th>
                        <th class="px-4 py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="usage in dashboardData.chemical_recent_usage" :key="usage.id" 
                          class="bg-white border-b hover:bg-gray-50">
                        <td class="px-4 py-2">
                          <div class="flex items-center">{{ usage.name }}</div>
                          <di class="text-xs text-gray-400">{{ usage.inventory_number }}</di>
                        </td>
                        <td class="px-4 py-2">{{ usage.volume_used }} {{ usage.unit }}</td>
                        <td class="px-4 py-2">{{ usage.date_used }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
          

            <div class="bg-white shadow-md rounded-lg p-6 border border-gray-200">
              <div class="flex items-center mb-4">
                <i class="fas fa-exclamation-triangle text-red-600 mr-2 text-lg"></i>
                <h3 class="text-xl font-semibold text-gray-800">Chemicals with Low Stock</h3>
              </div>
              <div v-if="dashboardData.chemical_low_stocks.length > 0" class="overflow-x-auto">
                <table class="w-full text-sm text-left text-gray-500">
                  <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th class="px-4 py-2">Chemical</th>
                      <th class="px-4 py-2">Volume Left</th>
                      <th class="px-4 py-2">Reorder Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="chemical in dashboardData.chemical_low_stocks" :key="chemical.id" 
                        @click="navigateToChemicals(chemical.id)"
                        class="bg-white border-b hover:bg-gray-50">
                      <td class="px-4 py-2 cursor-pointer hover:bg-gray-50">
                        <div class="flex items-center text-blue-600 ">{{ chemical.name }}</div>
                        <div 
                          :title="chemical.description"
                          class="truncate max-w-xs text-sm text-gray-900"
                        >
                          {{ chemical.description }}
                        </div>
                      </td>
                      <td class="px-4 py-2">
                        <span class="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                          {{ chemical.volume_left }} {{ chemical.unit }}
                        </span>
                      </td>
                      <td class="px-4 py-2">
                        <span class="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                          {{ chemical.reorder_level }} {{ chemical.unit }}
                        </span>
                      </td> 
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="text-center text-gray-500 text-lg mt-4 my-8">
                No chemicals with low stock.
              </div>
            </div>
        </div>
        <!-- <div class="grid grid-cols-1 lg:grid-cols-2 mt-8 gap-8">
              <div class="bg-white shadow-md rounded-lg p-6 border-gray-200">
                <div class="flex items-center mb-4">
                  <i class="fas fa-chart-bar text-blue-600 mr-2 text-lg"></i>
                  <h3 class="text-xl font-semibold text-gray-800">Recent Chemical Usage</h3>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-sm text-left text-gray-500">
                    <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th class="px-4 py-2">Chemical Name</th>
                        <th class="px-4 py-2">Volume Used</th>
                        <th class="px-4 py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="usage in dashboardData.chemical_recent_usage" :key="usage.id" 
                          class="bg-white border-b hover:bg-gray-50">
                        <td class="px-4 py-2">
                          <div class="flex items-center">{{ usage.name }}</div>
                          <di class="text-xs text-gray-400">{{ usage.inventory_number }}</di>
                        </td>
                        <td class="px-4 py-2">{{ usage.volume_used }} {{ usage.unit }}</td>
                        <td class="px-4 py-2">{{ usage.date_used }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            <div class="bg-white shadow-md rounded-lg p-6 border-gray-200">
                <div class="flex items-center mb-4">
                  <i class="fas fa-chart-bar text-blue-600 mr-2 text-lg"></i>
                  <h3 class="text-xl font-semibold text-gray-800">Recent Chemical Usage</h3>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-sm text-left text-gray-500">
                    <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th class="px-4 py-2">Chemical Name</th>
                        <th class="px-4 py-2">Volume Used</th>
                        <th class="px-4 py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="usage in dashboardData.chemical_recent_usage" :key="usage.id" 
                          class="bg-white border-b hover:bg-gray-50">
                        <td class="px-4 py-2">
                          <div class="flex items-center">{{ usage.name }}</div>
                          <di class="text-xs text-gray-400">{{ usage.inventory_number }}</di>
                        </td>
                        <td class="px-4 py-2">{{ usage.volume_used }} {{ usage.unit }}</td>
                        <td class="px-4 py-2">{{ usage.date_used }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div> -->
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
import UsageChart from '@/components/charts/UsageChart.vue';
  
  export default defineComponent({
    name: 'SecretaryDashboard',
    components: {
      Sidebar, BorrowPerDay, UsageChart
    },
    setup() {
    const loading = ref(true);
    const error = ref(null);
    const dashboardData = ref({
      total_chemicals: 0,
      total_equipments: 0,
      total_apparatus: 0,
      currently_borrowed: 0,
      total_return_records: 0,
      most_borrowed_items: [],
      chemical_recent_usage: [],
      chemical_low_stocks: [],
      todays_usage_details: []
    });
    const mostBorrowedItems = ref([]);
    const totalBorrowRecords = ref([]);
    const itemsNeedingAttention = ref([]);
    const borrowPerDay = ref([])
    const isSidebarOpen = ref(false)
  
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('/api/labtech-dashboard/')
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

      const navigateToChemicals = (chemicalId) => {
        router.push({ name: 'chemical-stocks', params: { id: chemicalId } });
      }

      const navigateToChemical = () => {
        router.push({ name: 'chemical-list' })
      }

      const navigateToEquipments = () => {
        router.push({ name: 'equipment-list' })
      }

      const navigateToApparatus = () => {
        router.push({ name: 'apparatus-list' })
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
        navigateToChemicals,
        goBack,
        mostBorrowedItems,
        totalBorrowRecords,
        itemsNeedingAttention,
        borrowPerDay,
        formatDate,
        navigateToChemical,
        navigateToEquipments,
        navigateToApparatus
      }
    }
  })
  </script>