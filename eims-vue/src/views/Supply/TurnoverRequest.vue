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

        <h1 class="text-3xl font-bold mb-6 text-gray-800">Turnover Requests</h1>

        <div class="flex justify-between mb-6">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search users..."
            class="border border-gray-300 rounded py-2 px-4"
          />

          <div>
            <button @click="printInventoryCustodianSlip"
              class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
              Print Inventory Custodian Slip
            </button>
          </div>
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

        <div v-if="loading" class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <div v-else-if="requests.length === 0" class="text-center text-gray-500 text-lg my-8">
            No  {{ currentTab }} requests found.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
              <tr>
                  <th v-for="header in visibleHeaders" 
                      :key="header" 
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ header }}
                  </th>
              </tr>
              </thead>    
                  <tbody v-if="currentTab === 'Transfer'" class="bg-white divide-y divide-gray-200">
                      <tr 
                          v-for="request in requests" 
                          :key="request.id" 
                          class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
                      >
                          <td class="px-4 py-4">
                              <div class="text-sm font-medium text-gray-900">
                                  {{ request.item_instance.item.name }}
                              </div>
                              <div class="text-sm text-gray-500">
                                  {{ request.item_instance.serial_number}}
                              </div>
                          </td>
                          <td class="px-4 py-4">
                              <div class="text-sm font-medium text-gray-900">
                                  {{ request.requested_by?.first_name }} {{ request.requested_by?.last_name }}
                              </div>
                              <div class="text-sm text-gray-500">
                                  {{ request.item_instance.assigned_at?.name}}
                              </div>
                              <div class="text-sm text-gray-500">
                                  {{ formatDate(request.requested_date) }}
                              </div>
                          </td>
                          <td class="px-4 py-4">
                              <div class="text-sm font-medium text-gray-900">
                                  {{ request.new_assignee?.first_name }} {{ request.new_assignee?.last_name }}
                              </div>
                              <div class="text-sm text-gray-500">
                                  {{ request.new_location.name}} 
                              </div>
                              <div v-if="request.processed_date" class="text-sm text-gray-500">
                                {{ formatDate(request.processed_date) }}
                              </div>
                          </td>
                          <td class="px-4 py-4">
                            <span
                              :class="[
                                'text-xs font-semibold inline-block py-1 px-2 rounded-full',
                                getStatusColor(request.status)  
                              ]"
                            >
                              {{ request.status }}
                            </span>
                            <div v-if="request.processed_by"  class="text-sm font-medium py-2 text-gray-900">
                              {{ request.processed_by.first_name }} {{ request.processed_by.last_name }}
                            </div>
                          </td>
                          <td class="px-4 py-4" v-if="userType === 'Supply Office'">
                            <div class="text-sm font-medium text-gray-900">
                              <button 
                                @click="approveTransfer(request.id)" 
                                :disabled="loading || request.status !== 'PENDING'"
                                class="px-2 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {{ loading ? 'Processing...' : 'Approve' }}
                              </button>
                            </div>
                          </td>
                        </tr>
                    </tbody>

                    <tbody v-if="currentTab === 'Disposal'" class="bg-white divide-y divide-gray-200">
                      <tr 
                          v-for="request in requests" 
                          :key="request.id" 
                          class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
                      >
                          <td class="px-4 py-4">
                              <div class="text-sm font-medium text-gray-900">
                                  {{ request.item_instance.item.name }}
                              </div>
                              <div class="text-sm text-gray-500">
                                  {{ request.item_instance.serial_number}}
                              </div>
                          </td>
                          <td class="px-4 py-4">
                              <div class="text-sm font-medium text-gray-900">
                                  {{ request.requested_by.first_name }} {{ request.requested_by.last_name }}
                              </div>
                              <div class="text-sm text-gray-500">
                                  {{ request.item_instance.assigned_at?.name ?? 'N/A'}}
                              </div>
                              <div class="text-sm text-gray-500">
                                  {{ formatDate(request.requested_date) }}
                              </div>
                          </td>
                          <td class="px-4 py-4">
                              <div class="text-sm font-medium text-gray-900">
                                  {{ request.disposal_reason }}
                              </div>
                          </td>
                          <td class="px-4 py-4">
                            <span
                              :class="[
                                'text-xs font-semibold inline-block py-1 px-2 rounded-full',
                                getStatusColor(request.status)  
                              ]"
                            >
                              {{ request.status }}
                            </span>
                            <div v-if="request.processed_by"  class="text-sm font-medium py-2 text-gray-900">
                              {{ request.processed_by.first_name }} {{ request.processed_by.last_name }}
                            </div>
                          </td>
                          <td class="px-4 py-4" v-if="userType === 'Supply Office'">
                            <div class="text-sm font-medium text-gray-900">
                              <button 
                                @click="approveDisposal(request.id)" 
                                :disabled="loading || request.status !== 'PENDING'"
                                class="px-2 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {{ loading ? 'Processing...' : 'Approve' }}
                              </button>
                            </div>
                          </td> 
                      </tr> 
                    </tbody>
                    <tbody v-if="currentTab === 'Replacement'" class="bg-white divide-y divide-gray-200">
                      <tr 
                          v-for="request in requests" 
                          :key="request.id" 
                          class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
                      >
                          <td class="px-4 py-4">
                              <div class="text-sm font-medium text-gray-900">
                                  {{ request.item_instance.item?.name }}
                              </div>
                              <div class="text-sm text-gray-500">
                                  {{ request.item_instance.serial_number}}
                              </div>
                          </td>
                          <td class="px-4 py-4">
                              <div class="text-sm font-medium text-gray-900">
                                  {{ request.requested_by?.first_name }} {{ request.requested_by?.last_name }}
                              </div>
                              <div class="text-sm text-gray-500">
                                  {{ request.item_instance.assigned_at?.name}}
                              </div>
                              <div class="text-sm text-gray-500">
                                  {{ formatDate(request.requested_date)  }}  
                              </div>
                          </td>
                          
                          <td class="px-4 py-4">
                            <div v-if="request.status === 'PENDING' && userType === 'Supply Office'">
                              <button
                                @click="openReplacementModal(request)"
                                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                :disabled="loadingInstances"
                              >
                                {{ loadingInstances ? 'Loading...' : 'Select Replacement' }}
                              </button>

                              <div v-if="selectedReplacement[request.id]" class="mt-2 p-3 bg-gray-50 rounded-md">
                                <p class="text-sm font-medium text-gray-900">Selected replacement:</p>
                                <p class="text-sm text-gray-500">
                                  {{ getSelectedItemName(selectedReplacement[request.id]) }}
                                </p>
                              </div>
                            </div>
                            <div v-else-if="request.status === 'APPROVED'" class="text-sm font-medium text-gray-900">
                              <p class="text-gray-500">{{ request.replacement_item?.item.name }}</p>
                            </div>
                            <div class="text-sm">
                              {{ request.replacement_item?.serial_number || 'No replacement selected' }}
                            </div>
                          </td>

                          <td class="px-4 py-4">
                              <div class="text-sm font-medium text-gray-900">
                                  {{ request.replacement_reason }}
                              </div>
                          </td>
                          <td class="px-4 py-4">
                            <span
                              :class="[
                                'text-xs font-semibold inline-block py-1 px-2 rounded-full',
                                getStatusColor(request.status)  
                              ]"
                            >
                              {{ request.status }}
                            </span>
                            <div v-if="request.processed_by"  class="text-sm font-medium py-2 text-gray-900">
                              {{ request.processed_by?.first_name }} {{ request.processed_by?.last_name }}
                            </div>
                          </td>
                          <td class="px-4 py-4" v-if="userType === 'Supply Office'">
                            <div class="text-sm font-medium text-gray-900">
                              <button 
                                @click="approveReplacement(request.id)" 
                                :disabled="loading || request.status !== 'PENDING'"
                                class="px-2 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {{ loading ? 'Processing...' : 'Approve' }}
                              </button>
                            </div>
                          </td>
                      </tr> 
                    </tbody>          
          </table> 
            <div v-if="error && currentTab " class="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {{ error }}
            </div>      
        </div> 
      </div> 
      <ItemSelection
        v-model="isModalOpen"
        :items="availableInstances"
        :loading="loadingInstances"
        @select="handleItemSelected"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import Sidebar from '../../components/UserType/Sidebar.vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import store from '@/store';
// import printJS from 'print-js'
import ItemSelection from './Modals/ItemSelection.vue';

export default defineComponent({
  name: 'TurnoverRequest',
  components: {
    Sidebar, ItemSelection
  },
  setup() {
    const requests = ref([]);
    const items = ref([]);
    const router = useRouter();
    const loading = ref(true);
    const error = ref(null);
    const isSidebarOpen = ref(true);
    const userType = computed(() => store.state.userType);
    const transferHeaders = ['Item Name', 'Requested By', 'Transfered to', 'Status', 'Actions'];
    const disposeHeaders = ['Item Name', 'Requested By', 'Disposal Reason', 'Status', 'Actions'];
    const replacementHeaders = ['Item Name', 'Requested By', 'Item Replaced', 'Replacement Reason', 'Status', 'Actions'];

    const visibleHeaders = computed(() => {
      const headers = currentTab.value === 'Transfer'
        ? transferHeaders
        : currentTab.value === 'Disposal'
          ? disposeHeaders
          : currentTab.value === 'Replacement'
            ? replacementHeaders
            : transferHeaders;

      if (userType.value === 'Staff') {
        return headers.filter(header => header !== 'Actions');
      }
      return headers;
    });

    const isModalOpen = ref(false)
    const currentRequest = ref(null)


    const availableInstances = ref([]);
    const selectedReplacement = ref({});
    const loadingInstances = ref(false);

    const tabs = ref(['Transfer', 'Disposal', 'Replacement']);
    const currentTab = ref(tabs.value[0]);

    watch(currentTab, (newTab) => {
      localStorage.setItem('currentTab', newTab);
      fetchTurnoverRequest();
    });


    const fetchTurnoverRequest = async () => {
      try {
        loading.value = true;
        const endpoint = currentTab.value === 'Transfer' 
          ? '/api/transfer-list/' 
          : currentTab.value === 'Disposal' 
            ? '/api/dispose-list/'
             
            : '/api/replace-list/';
        
        const response = await axios.get(endpoint);
        requests.value = response.data;
      } catch (err) {
        error.value = `Error fetching ${currentTab.value.toLowerCase()} requests: ` + err.message;
        console.error('Error fetching requests:', err);
      } finally {
        loading.value = false;
      }
    };

    const approveTransfer = async (requestId) => {
      try {
        loading.value = true;
        const response = await axios.post(`/api/transfer-approvals/${requestId}/`, {
          action: 'APPROVED'
        });

        // Show success message (you might want to add a toast notification here)
        console.log(response.data.message);

        // Refresh the list to show updated status
        await fetchTurnoverRequest();
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

    const approveDisposal = async (requestId) => {
      try {
        loading.value = true;
        const response = await axios.post(`/api/dispose-approvals/${requestId}/`, {
          action: 'APPROVED'
        });

        console.log(response.data.message);

        // Refresh the list to show updated status  
        await fetchTurnoverRequest();
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

    const approveReplacement = async (requestId) => {
      try {
        if (!selectedReplacement.value[requestId]) {
          error.value = 'Please select a replacement item first';
          return;
        }

        loading.value = true;
        const response = await axios.post(`/api/replace-approvals/${requestId}/`, {
          action: 'APPROVED',
          replacement_item_id: selectedReplacement.value[requestId].id
        });

        // Clear the selected replacement for this request
        selectedReplacement.value[requestId] = null;

        // Show success message
        console.log(response.data.message);

        await fetchTurnoverRequest();

      } catch (err) {
        error.value = 'Error approving replacement: ' + 
          (err.response?.data?.error || err.message);
        console.error('Error approving replacement:', err);
      } finally {
        loading.value = false;
      }
    };
    
    const getStatusColor = (status) => {
      switch (status.toUpperCase()) {
        case 'PENDING':
          return 'bg-blue-100 text-blue-800';
        case 'APPROVED':
          return 'bg-green-100 text-green-800';
        case 'REJECTED':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

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

    onMounted(() => {
      fetchTurnoverRequest();

      if (!localStorage.getItem('currentTab')) {
        currentTab.value = 'Transfer';
        localStorage.setItem('currentTab', 'Transfer');
      }

      isSidebarOpen.value = window.innerWidth > 1024;
    });

    const openReplacementModal = async (request) => {
      currentRequest.value = request
      loadingInstances.value = true
      isModalOpen.value = true
      
      try {
        const response = await axios.get('/api/available-instances/', {
          params: {
            category_id: request.item_instance.item.category.id,
            exclude_instance_id: request.item_instance.id,
          },
        })
        availableInstances.value = response.data
      } catch (err) {
        console.error('Error fetching available instances:', err)
        error.value = 'Error loading available items'
      } finally {
        loadingInstances.value = false
      }
    }

    const goBack = () => {
      router.go(-1);
    }

    const handleItemSelected = (item) => {
      if (currentRequest.value) {
        selectedReplacement.value[currentRequest.value.id] = item
      }
    }

    const getSelectedItemName = (selectedItem) => {
      if (!selectedItem) return ''
      return `${selectedItem.item?.name} - ${selectedItem.serial_number}`
    }

    return {
      requests,
      items,
      router,
      visibleHeaders,
      transferHeaders,
      disposeHeaders,
      replacementHeaders,
      userType,
      approveTransfer,
      approveDisposal,
      approveReplacement,
      loading,
      error,
      isSidebarOpen,
      getStatusColor,
      formatDate,
      currentTab,
      tabs,
      goBack,
      selectedReplacement,
      availableInstances,
      loadingInstances,



      isModalOpen,
      openReplacementModal,
      handleItemSelected,
      getSelectedItemName




    }
  }
})
</script>