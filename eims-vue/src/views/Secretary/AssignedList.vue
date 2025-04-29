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
  
          <h1 class="text-3xl font-bold mb-6 text-gray-800">
            {{ userType === 'Staff' ? 'My Assigned Items' : 'Assigned Items' }}
          </h1>
          
          <div class="flex items-center mb-6">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search instances..."
              class="border border-gray-300 rounded py-2 px-4 mr-4"
            />
            <button @click="importInstances" class="flex items-center text-gray-700 hover:text-gray-900">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Import
            </button>
          </div>


  
          <div v-if="loading" class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <div v-else-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
            <p class="font-bold">Error</p>
            <p>{{ error }}</p>
          </div>
  
          <!-- Instances Table -->
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
              <tbody class="bg-white divide-y divide-gray-200">
                <tr 
                  v-for="(assign, index) in filteredItems " 
                  :key="assign.id" 
                  @click="navigateToItemDetails(assign.item_instance.id)" 
                  class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer">

                  <td v-if="userType === 'Staff'" class="px-4 py-4">
                    <div class="text-sm font-medium text-gray-900 flex items-center">
                      {{ index + 1 }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-sm text-gray-900">
                      ₱{{ Number(assign.item_instance.unit_cost).toLocaleString() }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-sm text-gray-900">
                      {{ assign.quantity }} pcs
                    </div>
                  </td>  
                  <td class="px-4 py-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ assign.item_instance.item?.name }}
                      <span 
                        v-if="isItemNew(assign.assign_date)" 
                        class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                      >
                        New
                      </span>
                    </div>
                    <div
                      :title="assign.item_instance.item.description" 
                      class="text-sm tuncated max-w-xs text-gray-500 "> 
                      {{ assign.item_instance.item.description }} 
                    </div>
                    <div class="text-xs text-gray-800">
                      Model: {{ assign.item_instance.item.model }}
                    </div>
                    <div class="text-xs text-gray-500">
                      SN# {{ assign.item_instance.serial_number }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-xs text-gray-900" @click.stop>
                      {{ assign.inventory_number }}
                    </div>
                  </td> 
                  <td class="px-4 py-4">
                    <span :class="[
                      getConditionClass(assign.item_instance.current_condition),
                      'text-sm'
                    ]">
                      {{ assign.item_instance.current_condition }}
                    </span>
                  </td>
                  <td class="px-4 py-4">
                    <div    class="flex">
                      <div>
                        <div class="text-xs text-gray-500 mb uppercase mb-1">Current Assignee</div>
                        <div class=" px-5 w-fit text-xs py-1 mb-2 bg-red-100 text-red-800 rounded-full ">
                          {{ assign.current_assigned_record.assignee }}
                        </div>
                        <div class="text-xs text-gray-500">
                          {{ assign.current_assigned_record.assigned_at }}
                        </div>
                        <div class="text-xs text-gray-500">
                          {{ formatDate(assign.current_assigned_record.assigned_date) }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-sm text-gray-900" @click.stop>
                      {{ assign.item_instance.status }}
                    </div>
                  </td> 
                  <td class="px-4 py-4" v-if="userType === 'Staff'">
                    <div class="flex space-x-2">
                      <button 
                        @click.stop
                        @click="turnoverItem(assign.item_instance.id)"
                        :disabled="isPendingAction(assign.item_instance, 'transfers') || 
                                  isPendingAction(assign.item_instance, 'disposals') || 
                                  isPendingAction(assign.item_instance, 'replacements')"
                      >
                        <i 
                          :class="{
                            'fas fa-exchange-alt text-gray-600': 
                              !isPendingAction(assign.item_instance, 'transfers') 
                              && !isPendingAction(assign.item_instance, 'disposals') 
                              && !isPendingAction(assign.item_instance, 'replacements'),
                            'fas fa-clock text-yellow-500': 
                              isPendingAction(assign.item_instance, 'transfers') 
                              || isPendingAction(assign.item_instance, 'disposals') 
                              || isPendingAction(assign.item_instance, 'replacements')
                          }"
                        ></i>
                      </button>
                    </div>
                  </td>
                  <td class="px-4 py-4" v-if="userType === 'Dean'"  @click.stop>
                    <div class="flex space-x-2">
                    <button 
                      @click="printBarcode(assign.item_instance.barcode)"
                      class="p-1 hover:bg-gray-100 rounded-full" 
                      title="Print Barcode"
                    >
                      <i class="fas fa-print text-gray-600"></i>
                    </button>
                    <button 
                      @click="addToCart(instance)"
                      class="p-1 hover:bg-gray-100 rounded-full" 
                      title="Add to Cart"
                      :disabled="assign.item_instance.borrowed_by  "
                      :class="{ 'opacity-50 cursor-not-allowed': assign.item_instance.borrowed_by  }"
                    >
                      <i class="fas fa-shopping-cart text-gray-600"></i>
                    </button>
                    <button 
                      @click="openBarcodePopup(instance.barcode)" 
                      class="p-1 hover:bg-gray-100 rounded-full" 
                      title="View Barcode"
                    >
                      <i class="fas fa-barcode text-gray-600"></i>
                    </button>
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
      
      <div v-if="showBarcodePopup" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="closeBarcodePopup">
        <transition name="fade">
          <div class="bg-white p-4 rounded-lg" @click.stop>
            <img :src="currentBarcode" alt="Barcode" class="max-w-full h-auto" />
            <button @click="closeBarcodePopup" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
              Close
            </button>
          </div>
        </transition>
      </div>
      <ImportModal 
        ref="importModal"
        @close="closeImportModal"
        @import-success="handleImportSuccess"
      />  
      <BatchForm
        v-if="showAddForm"
        :items="items"
        :batches="batches"
        :preselectedBatch="currentBatchId"
        @close="closeAddItemForm"
        @batch-added="handleItemAdded"
      />
      <TurnoverModal 
        ref="turnoverModal"
        :item-id="selectedItemId"
        @turnover-success="handleTurnoverSuccess"
      />
    </div>
  </template>
  
  <script>
  import { defineComponent, ref, onMounted, computed, watch } from 'vue';
  import axios from 'axios';
  import { useRouter } from 'vue-router';
  import Sidebar from '@/components/UserType/Sidebar.vue';
  import BatchForm from './Forms/BatchForm.vue';
  import store from '@/store';
  import PrimaryButton from '@/components/buttons/PrimaryButton.vue';
  import TurnoverModal from './Modals/TurnoverModal.vue';
  import ImportModal from './Modals/ImportModal.vue';
  
  
  export default defineComponent({
    name: 'Assignedlist',
    components: { 
      Sidebar, BatchForm, PrimaryButton, TurnoverModal, ImportModal 
     },
    
    setup(){
      const router = useRouter();
      const loading = ref(true);
      const error = ref(null);
      const assigned = ref([]);
      const showAddForm = ref(false);
      const showBarcodePopup = ref(false);
      const currentBarcode = ref('');
      const showBorrowModal = ref(false);
      const tableHeaders = [ 'No.',  'Unit Cost', 'Quantity', 'Description', 'Inventory Item No.', 'Condition', 'Assigned Info', 'Status', 'Actions', ];
      const visibleHeaders = computed(() => {
          if(userType.value === 'Supply Office'){
              return tableHeaders.filter(header => header !== 'Actions' && header !== 'No.');
          }else{
              return tableHeaders;
          }
      })
      const isSidebarOpen = ref(true);
      const userType = computed(() => store.state.userType);
      const searchQuery = ref('');
      const selectedItemId = ref(null);
      const turnoverModal = ref(null);
      const currentPage = ref(1);
      const totalPages = ref(0);
      const pageSize = ref(10);
      const importModal = ref(null);


      const pendingRequests = ref({
        transfers: new Set(),
        disposals: new Set(),
        replacements: new Set()
      });



      const importInstances = () => {
        if (importModal.value) {
          importModal.value.openModal();
        }
      };

      const closeImportModal = () => {
        if (importModal.value) {
          importModal.value.closeModal();
        }
      }

      const handleImportSuccess = () => {
        closeImportModal();
        fetchAssignedItemsAndPendingRequests();
      };


      const handleSidebarToggle = (isOpen) => {
        isSidebarOpen.value = isOpen;
      };

      const fetchAssignedItemsAndPendingRequests = async () => {
        try {
          const [
            assignedResponse, 
            transfersResponse, 
            disposalsResponse, 
            replacementsResponse
          ] = await Promise.all([
            axios.get('/api/assigned-items/', {
              params: {
                page: currentPage.value,
                page_size: pageSize.value,
                search: searchQuery.value 
              }
            }), 
            axios.get('/api/transfer-requests/pending/'),
            axios.get('/api/dispose-requests/pending/'),
            axios.get('/api/replace-requests/pending/')
          ]);

          assigned.value = assignedResponse.data.results;
          totalPages.value = Math.ceil(assignedResponse.data.count / pageSize.value);

          pendingRequests.value = {
            transfers: new Set(transfersResponse.data.map(request => request.item_instance.id)),
            disposals: new Set(disposalsResponse.data.map(request => request.item_instance.id)),
            replacements: new Set(replacementsResponse.data.map(request => request.item_instance.id))
          };
          loading.value = false;
        } catch (err) {
          console.error('Error fetching data:', err);
        }
      };

      watch(searchQuery, () => {
        currentPage.value = 1;  
        fetchAssignedItemsAndPendingRequests();
      });

      const nextPage = () => {
        if (currentPage.value < totalPages.value) {
          currentPage.value++;
          fetchAssignedItemsAndPendingRequests();
        }
      };

      const prevPage = () => {
        if (currentPage.value > 1) {
          currentPage.value--;
          fetchAssignedItemsAndPendingRequests();
        }
      };


      const isPendingAction = (itemInstance, actionType) => {
        return pendingRequests.value[actionType].has(itemInstance.id);
      };

      const turnoverItem = (itemId) => {
        const isPending = 
          isPendingAction({ id: itemId }, 'transfers') ||
          isPendingAction({ id: itemId }, 'disposals') ||
          isPendingAction({ id: itemId }, 'replacements');

        if (isPending) return;

        selectedItemId.value = itemId;
        if (turnoverModal.value) {
          turnoverModal.value.openModal();
        }
      };

      const handleTurnoverSuccess = async ({ itemId }) => {
        pendingRequests.value.transfers.add(itemId);
        await fetchAssignedItemsAndPendingRequests();
      };

      onMounted(() => {
        fetchAssignedItemsAndPendingRequests();
      });

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
            return 'text-blue-600';
            case 'poor':
            return 'text-orange-600';
            case 'damaged':
            return 'text-red-600';
            default:
            return 'text-gray-600';
        }
        };

        const goBack = () => {
        router.go(-1);
      }

        const isItemNew = (assignDate) => {
          const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; 
          const assignTime = new Date(assignDate).getTime();
          const currentTime = new Date().getTime();
          return (currentTime - assignTime) <= TWENTY_FOUR_HOURS;
        }

        const filteredItems = computed(() => {
        if (!searchQuery.value) return assigned.value;

        const query = searchQuery.value.toLowerCase();
        return assigned.value.filter((assign) => {
          const item = assign?.item_instance?.item;
          const batch = assign?.item_instance?.item_batch?.batch;
          const assignee = assign?.assignee;

          return (
            (item?.name?.toLowerCase().includes(query) || false) ||
            (item?.description?.toLowerCase().includes(query) || false) ||
            (assign?.item_instance?.serial_number?.toLowerCase().includes(query) || false) ||
            (String(assign?.item_instance?.price)?.toLowerCase().includes(query) || false) ||
            (batch?.batch_number?.toLowerCase().includes(query) || false) ||
            (assign?.item_instance?.current_condition?.toLowerCase().includes(query) || false) ||
            (assignee?.first_name?.toLowerCase().includes(query) || false) ||
            (assignee?.last_name?.toLowerCase().includes(query) || false) ||
            (assignee?.current_assigned_record?.assignee?.toLowerCase().includes(query) || false)

            );
          });
        });

      const navigateToItemDetails = (itemId) => {
            router.push({ name: 'ItemInstancesDetail', params: { id: itemId } })
        }


      return {
        loading,
        error,
        router,
        tableHeaders,
        visibleHeaders,
        isSidebarOpen,
        currentPage,
        totalPages,
        nextPage,
        prevPage,
        assigned,
        showAddForm,
        showBarcodePopup,
        currentBarcode,
        showBorrowModal,
        handleSidebarToggle,
        userType,
        formatDate,
        isItemNew,
        filteredItems,
        searchQuery,
        goBack,
        getConditionClass,
        importInstances,
        handleImportSuccess,
        importModal,
        navigateToItemDetails,
        handleTurnoverSuccess,
        turnoverItem,
        turnoverModal,
        selectedItemId,
        isPendingAction
    }
    }

  });
  </script>