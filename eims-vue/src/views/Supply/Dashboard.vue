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
          <i class="fas fa-arrow-left mr-2"></i>
          Back
        </button>

        <h1 class="text-3xl font-bold mb-6 text-gray-800">Supply Dashboard</h1>
        

        <div v-if="loading" class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <div v-else-if="error" class="flex justify-center items-center h-64">
          <p class="text-red-500 text-lg font-semibold">Error: {{ error }}</p>
        </div>
        <div v-else-if="successMessage" class="flex justify-center items-center h-64">
          <p class="text-green-500 text-lg font-semibold">Success: {{ successMessage }}</p>
        </div> 

        <div v-else>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white shadow-md rounded-lg p-6 border border-gray-200 flex items-center">
              <div class="bg-blue-100 rounded-full p-3 mr-4">
                <i class="fas fa-box text-blue-600 text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">Total Items</h3>
                <p class="text-3xl font-bold text-blue-600">{{ dashboardData.total_items }}</p>
              </div>
            </div>

            <div class="bg-white shadow-md rounded-lg p-6 border border-gray-200 flex items-center">
              <div class="bg-green-100 rounded-full p-3 mr-4">
                <i class="fas fa-cogs text-green-600 text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">Total Equipment</h3>
                <p class="text-3xl font-bold text-green-600">{{ dashboardData.total_equipment }}</p>
              </div>
            </div>

            <div class="bg-white shadow-md rounded-lg p-6 border border-gray-200 flex items-center">
              <div class="bg-purple-100 rounded-full p-3 mr-4">
                <i class="fas fa-flask text-purple-600 text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">Total Chemicals</h3>
                <p class="text-3xl font-bold text-purple-600">{{ dashboardData.total_chemicals }}</p>
              </div>
            </div>

              <div class="bg-white shadow-md rounded-lg p-6 border border-gray-200 flex items-center">
                <div class="bg-blue-100 rounded-full p-3 mr-4">
                  <i class="fas fa-upload text-blue-600 text-xl"></i>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-700 mb-2">Transferred Items</h3>
                  <p class="text-2xl font-bold text-blue-600">{{ dashboardData.transfered_items }}</p>
                </div>
              </div>

              <div class="bg-white shadow-md rounded-lg p-6 border border-gray-200 flex items-center">
                <div class="bg-green-100 rounded-full p-3 mr-4">
                  <i class="fas fa-check-square text-green-600 text-xl"></i>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-700 mb-2">Assigned Items</h3>
                  <p class="text-2xl font-bold text-green-600">{{ dashboardData.assigned_items }}</p>
                </div>
              </div>

              <div class="bg-white shadow-md rounded-lg p-6 border border-gray-200 flex items-center">
                <div class="bg-purple-100 rounded-full p-3 mr-4">
                  <i class="fas fa-box text-purple-600 text-xl"></i>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-700 mb-2">Assigned Equipment</h3>
                  <p class="text-2xl font-bold text-purple-600">{{ dashboardData.assigned_equipment }}</p>
                </div>

            </div>

          </div>

          <div v-if="dashboardData.transfer_approval.length > 0" class="grid grid-cols-1w-full gap-6 mb-8">
          <div class="overflow-x-auto">
              <table class="w-full text-sm text-left text-gray-500">
                <thead class="text-xs text-gray-700 uppercase bg-green-100">
                  <tr>
                    <th class="px-4 py-2">Item Name</th>
                    <th class="px-4 py-2">Requested By</th>
                    <th class="px-4 py-2">Requested Date</th>
                    <th class="px-4 py-2">New Assignee</th>
                    <th class="px-4 py-2">New Location</th>
                    <th class="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="request in dashboardData.transfer_approval" 
                    :key="request.id" 
                    class="bg-white border-b hover:bg-green-50"
                  >
                    <td class="px-4 py-2">{{ request.item_name }}</td>
                    <td class="px-4 py-2">{{ request.requested_by }}</td>
                    <td class="px-4 py-2">
                      {{ new Date(request.requested_date).toLocaleString() }}
                    </td>
                    <td class="px-4 py-2">{{ request.new_assignee }}</td>
                    <td class="px-4 py-2">{{ request.new_location }}</td>
                    <td class="px-4 py-2">
                      <div class="flex space-x-2">
                        <button 
                          @click="approveTransfer(request.transfer_id)" 
                          :disabled="loading"
                          class="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span v-if="loading" class="flex items-center">
                            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </span>
                          <span v-else>Approve</span>
                        </button>
                        <button 
                          @click="rejectTransfer(request.transfer_id)" 
                          :disabled="loading"
                          class="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div> 

          <!-- Detailed Sections -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Recently Assigned Chemicals -->
            <div class="bg-white shadow-md rounded-lg p-6 border border-gray-200">
              <div class="flex items-center mb-4">
                <i class="fas fa-flask text-purple-600 mr-2 text-lg"></i>
                <h3 class="text-xl font-semibold text-gray-800">Recent Chemical Assignments</h3>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-sm text-left text-gray-500">
                  <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th class="px-4 py-2">Chemical</th>
                      <th class="px-4 py-2">Assignee</th>
                      <th class="px-4 py-2">Assigned Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="chemical in dashboardData.assigned_chemicals" :key="chemical.chemical_stock_id" 
                        class="bg-white border-b hover:bg-gray-50">
                      <td class="px-4 py-2">{{ chemical.chemical_name }}</td>
                      <td class="px-4 py-2">{{ chemical.assignee }}</td>
                      <td class="px-4 py-2">{{ chemical.assigned_volume }} ml</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="bg-white shadow-md rounded-lg p-6 border border-gray-200">
              <div class="flex items-center mb-4">
                <i class="fas fa-cogs text-green-600 mr-2 text-lg"></i>
                <h3 class="text-xl font-semibold text-gray-800">Recent Equipment Assignments</h3>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-sm text-left text-gray-500">
                  <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th class="px-4 py-2">Equipment</th>
                      <th class="px-4 py-2">Assignee</th>
                      <th class="px-4 py-2">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="equipment in dashboardData.lastest_assigned_equipment" :key="equipment.equipment_id" 
                        class="bg-white border-b hover:bg-gray-50">
                      <td class="px-4 py-2">{{ equipment.equipment_name }}</td>
                      <td class="px-4 py-2">{{ equipment.assignee }}</td>
                      <td class="px-4 py-2">{{ equipment.assigned_location }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import Sidebar from '../../components/UserType/Sidebar.vue'
import axios from 'axios'

export default defineComponent({
  name: 'SupplyDashboard',
  components: {
    Sidebar
  },
  setup() {
    const user = ref(null)
    const error = ref(null)
    const successMessage = ref(null)
    const dashboardData = ref({
      transfered_items: 0,
      assigned_items: 0,
      assigned_equipment: 0,
      assigned_chemicals: [],
      lastest_assigned_equipment: [],
      total_items: 0,
      total_equipment: 0,
      total_chemicals: 0
    })
    const loading = ref(true)
    const isSidebarOpen = ref(true)

    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('/api/supply-dashboard/')
        dashboardData.value = response.data
        loading.value = false
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        loading.value = false
      }
    }

    const approveTransfer = async (requestId) => {
      try {
        loading.value = true;
        const response = await axios.post(`/api/transfer-approvals/${requestId}/`, {
          action: 'APPROVED'
        });

        
        successMessage.value = 'Request approved successfully';
        await fetchDashboardData();
      } catch (err) {
        error.value = 'Error approving request: ' + err.message;
        if (err.response?.data?.error) {
          // Show specific error from backend
          error.value = err.response.data.error;
        }
        console.error('Error approving request:', err);
      } finally {
        loading.value = false;
      }
    };

    const handleSidebarToggle = (isOpen) => {
      isSidebarOpen.value = isOpen
    }

    const goBack = () => {
      // Implement navigation back logic
      window.history.back()
    }

    onMounted(() => {
      fetchDashboardData()
    })

    return {
      dashboardData,
      loading,
      error,
      successMessage,
      isSidebarOpen,
      approveTransfer,
      handleSidebarToggle,
      goBack
    }
  }
})
</script>
