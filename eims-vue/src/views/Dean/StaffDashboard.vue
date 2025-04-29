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
  
          <h1 class="text-3xl font-bold mb-6 text-gray-800">Dashboard</h1>
  
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div v-for="(stat, index) in dashboardStats" :key="index" class="bg-white rounded-lg shadow">
              <div class="p-4">
                <div class="flex justify-between items-center mb-2">
                  <h3 class="text-sm font-medium text-gray-500">{{ stat.title }}</h3>
                  <component :is="stat.icon" class="h-5 w-5 text-gray-500" />
                </div>
                <div class="text-xl font-bold">{{ stat.value }}</div>
              </div>
            </div>
          </div>
  

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <!-- <div class="bg-white p-4 rounded-lg shadow w-auto">
              <div class="flex items-center space-x-2 mb-4">
                <i class="fas fa-chart-bar text-gray-500 "></i>
                <h2 class="text-lg font-semibold  ">Most Borrowed Items</h2>
              </div>
              <div class="space-y-3">
                <div v-for="item in mostBorrowedItems" 
                      :key="item.id" 
                      class="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span class="font-small">{{ item.name }}</span>
                  <span class="text-gray-500 text-sm">{{ item.serial_number }} </span>
                  <span class="text-gray-500 text-sm">{{ item.borrow_count }} times</span>
                </div>
              </div>
            </div> -->

            <!-- <BorrowPerDay :borrowPerDayData="borrowPerDay" /> -->
  
            <!-- <div class="bg-white p-4 rounded-lg shadow">
              <div class="flex items-center space-x-2 mb-4">
                <i class= "fas fa-history text-gray-500 "></i>
                <h2 class="text-lg font-semibold">Recent Borrowed</h2>
              </div>
              <div class="overflow-x-auto">
                <table class="min-w-full table-auto">
                  <thead class="bg-gray-100">
                    <tr>
                      <th class="py-2 px-3 text-left text-xs font-medium text-gray-500">Item</th>
                      <th class="py-2 px-3 text-left text-xs font-medium text-gray-500">Borrower</th>
                      <th class="py-2 px-3 text-left text-xs font-medium text-gray-500">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="record in totalBorrowRecords" 
                        :key="record.id" 
                        class="border-b">
                      <td class="py-3 px-3 text-sm">{{ record.item }}</td>
                      <td class="py-3 px-3 text-sm">{{ record.borrower }}</td>
                      <td class="py-3 px-3 text-sm">{{ formatDate(record.borrow_date) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div> -->
  
            <!-- <div class="bg-white p-4 rounded-lg shadow">
              <div class="flex items-center space-x-2 mb-4">
                <i class="fas fa-exclamation-triangle text-red-500"></i>
                <h2 class="text-lg font-semibold">Items Needing Attention</h2>
              </div>
              <div class="overflow-x-auto">
                <table class="min-w-full table-auto">
                  <thead class="bg-red-100 text-red-700">
                    <tr>
                      <th class="py-2 px-3 text-left text-xs font-medium">Item Name</th>
                      <th class="py-2 px-3 text-left text-xs font-medium">Serial Number</th>
                      <th class="py-2 px-3 text-left text-xs font-medium">Condition</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in itemsNeedingAttention" 
                        :key="item.id" 
                        class="border-b border-red-100">
                      <td class="py-2 px-3 text-sm">{{ item.name }}</td>
                      <td class="py-2 px-3 text-sm">{{ item.serial_number }}</td>
                      <td class="py-2 px-3 text-sm">
                        <span class="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                          {{ item.condition }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div> -->
  
          </div>
        </div> 
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue';
  import axios from 'axios';
  import { 
    Package, 
    Layers,
    Archive,
    Clock,
    AlertTriangle,
    Users
  } from 'lucide-vue-next';
  import Sidebar from '@/components/UserType/Sidebar.vue';
  import ChartComponent from '@/components/charts/ChartComponent.vue';
  
  export default {
    name: 'StaffDashboard',
    components: {
      Sidebar,
      ChartComponent,
      Package,
      Layers,
      Archive,
      Clock,
      AlertTriangle,
      Users
    },
    setup() {
      const dashboardStats = ref([]);
      const mostBorrowedItems = ref([]);
      const totalBorrowRecords = ref([]);
      const itemsNeedingAttention = ref([]);
      const recentActivities = ref([]);
      const expiringBatches = ref([]);
      const isSidebarOpen = ref(true);
  
      const fetchDashboardData = async () => {
        try {
          const response = await axios.get('/api/staff-dashboard/');
          const data = response.data;
          
          // Update dashboard stats
          dashboardStats.value = [
            { 
              title: 'Transfered Items',
              value: data.transfer_items,
              icon: 'Package'
            },
            { 
              title: 'Disposed Items',
              value: data.dispose_items,
              icon: 'Layers'
            },
            { 
              title: 'Replaced Items',
              value: data.replace_items,
              icon: 'Archive'
            },
            { 
              title: 'Assigned Items',
              value: data.assigned_items,
              icon: 'Users'
            }
          ];
          
        //   mostBorrowedItems.value = data.most_borrowed_items;
        //   totalBorrowRecords.value = data.total_borrow_records;
        //   itemsNeedingAttention.value = data.items_needing_attention;
        //   recentActivities.value = data.recent_activities;
        //   expiringBatches.value = data.expiring_batches;
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
        }
      };
  
      const handleSidebarToggle = (isOpen) => {
          isSidebarOpen.value = isOpen;
        };
  
      const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      };
  
      onMounted(fetchDashboardData);
  
      return {
        dashboardStats,
        mostBorrowedItems,
        totalBorrowRecords,
        itemsNeedingAttention,
        recentActivities,
        expiringBatches,
        formatDate,
        handleSidebarToggle,
        isSidebarOpen
      };
    }
  };
  </script>
  
  <style scoped>
  .dashboard-card {
    @apply bg-white rounded-lg shadow p-6;
  }
  
  .card-title {
    @apply text-lg font-semibold mb-4;
  }
  
  .table-header {
    @apply text-left py-3 px-4;
  }
  
  .table-cell {
    @apply py-3 px-4;
  }
  </style>