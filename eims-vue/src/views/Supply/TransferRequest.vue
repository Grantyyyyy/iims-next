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
  
          <h1 class="text-3xl font-bold mb-6 text-gray-800">My Transfer Requests</h1>
  
          <div v-if="loading" class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <div v-else-if="requests.length === 0" class="text-center text-gray-500 text-lg my-8">
            No transfer requests found.
          </div>
  
          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Location
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    New Location
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested By
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr 
                  v-for="request in requests" 
                  :key="request.id" 
                  class="hover:bg-gray-50 transition-colors duration-150 ease-in-out"
                >
                  <td class="px-4 py-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ request.item_instance.item.name }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ request.item_instance.serial_number }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-sm text-gray-500">
                      {{ request.item_instance.assigned_at?.name || 'N/A' }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ request.new_location.name }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ request.requested_by.first_name }} {{ request.requested_by.last_name }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ formatDate(request.requested_date) }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="flex space-x-2">
                      <button 
                        @click="confirmTransfer(request.id)"
                        class="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                      >
                        Confirm
                      </button>
                      <button 
                        @click="rejectTransfer(request.id)"
                        class="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <div v-if="error" class="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {{ error }}
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
  import { useRouter } from 'vue-router'
  
  export default defineComponent({
    name: 'TransferRequest',
    components: {
      Sidebar
    },
    setup() {
      const requests = ref([])
      const loading = ref(true)
      const error = ref(null)
      const isSidebarOpen = ref(true)
      const router = useRouter()
  
      const fetchTransferRequests = async () => {
        try {
          loading.value = true
          const response = await axios.get('/api/assignee-transfer-requests/')
          requests.value = response.data
        } catch (err) {
          error.value = 'Error fetching transfer requests: ' + err.message
          console.error('Error fetching requests:', err)
        } finally {
          loading.value = false
        }
      }
  
      const confirmTransfer = async (requestId) => {
        try {
          loading.value = true
          const response = await axios.post(`/api/transfer-request/${requestId}/assignee-confirmation/`, {
            action: 'CONFIRMED'
          })
          
          // Show success message (you might want to add a toast notification)
          console.log(response.data.message)
          
          // Refresh the list
          await fetchTransferRequests()
        } catch (err) {
          error.value = 'Error confirming transfer: ' + 
            (err.response?.data?.error || err.message)
          console.error('Error confirming transfer:', err)
        } finally {
          loading.value = false
        }
      }
  
      const rejectTransfer = async (requestId) => {
        try {
          loading.value = true
          const response = await axios.post(`/api/transfer-request/${requestId}/assignee-confirmation/`, {
            action: 'REJECTED'
          })
          
          // Show success message
          console.log(response.data.message)
          
          // Refresh the list
          await fetchTransferRequests()
        } catch (err) {
          error.value = 'Error rejecting transfer: ' + 
            (err.response?.data?.error || err.message)
          console.error('Error rejecting transfer:', err)
        } finally {
          loading.value = false
        }
      }
  
      const formatDate = (dateString) => {
        const date = new Date(dateString)
        const options = {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true  
        }
        return date.toLocaleString('en-US', options)
      }
  
      const goBack = () => {
        router.go(-1)
      }
  
      onMounted(() => {
        fetchTransferRequests()
        isSidebarOpen.value = window.innerWidth > 1024
      })
  
      return {
        requests,
        loading,
        error,
        isSidebarOpen,
        confirmTransfer,
        rejectTransfer,
        formatDate,
        goBack
      }
    }
  })
  </script>