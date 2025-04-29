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
          
          <h1 class="text-3xl font-bold mb-6 text-gray-800">Batch Purchase</h1>

          <div class="flex justify-between mb-4">
          <div class="flex items-center mr-4">
            <input
            v-model="searchQuery"
            type="text"
            placeholder="Search..."
            class="border border-gray-300 rounded py-2 px-4"
          />
          </div>

          <div class="flex space-x-2">
            <PrimaryButton @click="showAddForm = true">
              <template #icon>
                <i class="fas fa-plus mr-2"></i>
              </template>
              Add Batch
            </PrimaryButton>
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

    
          <!-- Loading and Error States -->
          <div v-if="loading" class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <div v-else-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
            <p class="font-bold">Error</p>
            <p>{{ error }}</p>
          </div>
          <div v-else-if="batches.length === 0" class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded" role="alert">
            <p class="font-bold">No batches found.</p>
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

              <tbody v-if="currentTab === 'Items'" class="bg-white divide-y divide-gray-200">
                <tr 
                  v-for="batch in filteredBatches" 
                  :key="batch.id" 
                  @click="navigateToItemBatch(batch.id)"
                  class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
                >
                  <td class="px-4 py-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ batch.batch_number }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-sm text-gray-900">
                      {{ batch.total_items }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-sm text-gray-900">
                      {{ formatDate(batch.created_at) }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <button @click.stop="handleDeleteClick(batch.id)" class="text-red-500 hover:text-red-800">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>

              <tbody v-if="currentTab === 'Chemicals'" class="bg-white divide-y divide-gray-200">
                <tr 
                  v-for="batch in filteredBatches" 
                  :key="batch.id" 
                  @click="navigateToChemicalBatch(batch.id)"
                  class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
                >
                  <td class="px-4 py-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ batch.batch_number }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-sm text-gray-900">
                      {{ batch.total_chemicals }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-sm text-gray-900">
                      {{ formatDate(batch.created_at) }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <button @click.stop="handleDeleteClick(batch.id)" class="text-red-500 hover:text-red-800">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
              <tbody v-if="currentTab === 'Equipments'" class="bg-white divide-y divide-gray-200">
                <tr 
                  v-for="batch in filteredBatches" 
                  :key="batch.id" 
                  @click="navigateToChemicalBatch(batch.id)"
                  class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
                >
                  <td class="px-4 py-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ batch.batch_number }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-sm text-gray-900">
                      {{ batch.total_chemicals }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-sm text-gray-900">
                      {{ formatDate(batch.created_at) }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <button @click.stop="handleDeleteClick(batch.id)" class="text-red-500 hover:text-red-800">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
              <tbody v-if="currentTab === 'Apparatus'" class="bg-white divide-y divide-gray-200">
                <tr 
                  v-for="batch in filteredBatches" 
                  :key="batch.id" 
                  @click="navigateToChemicalBatch(batch.id)"
                  class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
                >
                  <td class="px-4 py-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ batch.batch_number }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-sm text-gray-900">
                      {{ batch.total_apparatus }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-sm text-gray-900">
                      {{ formatDate(batch.created_at) }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <button @click.stop="handleDeleteClick(batch.id)" class="text-red-500 hover:text-red-800">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>


        <div v-if="showAddForm" class="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 z-50">
          <AddBatch
          :items="items"
          :batches="batches"
          @close="closeAddBatchForm"
          @new-batch-added="handleBatchAdded"
          />
        </div>
        <ConfirmButton
          v-model:visible="showDialog"
          title="Delete Item"
          message="Are you sure you want to delete this item?"
          @confirm="confirmDelete"
          @cancel="handleCancel"
        />
      </div>
    </div>
  </template>
  
<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import axios from 'axios'
import Sidebar from '@/components/UserType/Sidebar.vue'
import AddBatch from './Forms/AddBatch.vue'
import PrimaryButton from '@/components/buttons/PrimaryButton.vue' 
import ConfirmButton from '@/components/buttons/ConfirmButton.vue'
  
  export default defineComponent({
    name: 'BatchList',
    components: {
      Sidebar, AddBatch, PrimaryButton, ConfirmButton
    },
    setup() {
      const store = useStore()
      const router = useRouter()
      const batches = ref([])
      const items = ref([])
      const loading = ref(false)
      const error = ref(null)
      const itemHeaders = ['Batch Number', 'Total Items' , 'Batch Creation Date', 'Actions']
      const chemicalHeaders = ['Batch Number', 'Total Chemicals' , 'Batch Creation Date' , 'Actions']
      const equipmentHeaders = ['Batch Number', 'Total Equipments' , 'Batch Creation Date' , 'Actions']
      const apparatusHeaders = ['Batch Number', 'Total Apparatus' , 'Batch Creation Date' , 'Actions']

      const visibleHeaders = computed(() => {
      const headers = currentTab.value === 'Items'
          ? itemHeaders
          : currentTab.value === 'Chemicals'
            ? chemicalHeaders
            : currentTab.value === 'Equipments'
              ? equipmentHeaders
              : currentTab.value === 'Apparatus'
                ? apparatusHeaders
            : itemHeaders;

        return headers;
      });
      
      const showAddForm = ref(false)
      const searchQuery = ref('')
      const isSidebarOpen = ref(false)
      const token = computed(() => store.state.token)

      const tabs = ref(['Items', 'Chemicals', 'Equipments', 'Apparatus']);
      const currentTab = ref(tabs.value[0]);

      const batchToDelete = ref(null);
      const showDialog = ref(false);

      watch(currentTab, (newTab) => {
        localStorage.setItem('currentTab', newTab);
        fetchBatches();
      });
  
      const fetchBatches = async () => {
        loading.value = true;
        try {
          const endpoint = currentTab.value === 'Items'
            ? '/api/batch-items/'
            : currentTab.value === 'Chemicals'
              ? '/api/batch-chemicals/'
              : currentTab.value === 'Equipments'
                ? '/api/batch-equipments/'
                : currentTab.value === 'Apparatus'
                  ? '/api/batch-apparatus/'
              : '/api/batch-items/';

          const response = await axios.get(endpoint);
          batches.value = response.data;
        } catch (err) {
          console.error('Error fetching batches:', err);
          error.value = `Error fetching ${currentTab.value.toLowerCase()} requests: ` + err.message;
        } finally {
          loading.value = false;
        }
      };

      const fetchItems = async () => {
        try {
          const response = await axios.get('/api/items/', {
            headers: { 'Authorization': `Token ${token.value}` }
          });
          items.value = response.data;
        } catch (err) {
          console.error('Error fetching items:', err);
          error.value = err.message || 'An error occurred while fetching items.';
        }
      }

      const handleDeleteClick = (batchId) => {
        batchToDelete.value = batchId;
        showDialog.value = true;
      }

      const handleCancel = () => {
        batchToDelete.value = null;
        showDialog.value = false;
      }

      const confirmDelete = async () => {
        try {
          await axios.delete(`/api/batch-items/${batchToDelete.value}/delete/`, {
            headers: { 'Authorization': `Token ${token.value}` }
          });
          fetchBatches();
          showDialog.value = false;
        } catch (err) {
          console.error('Error deleting batch:', err);
          error.value = err.message || 'An error occurred while deleting the batch.';
        }
      }

      onMounted (() => {
        fetchBatches();
        fetchItems();

      if (!localStorage.getItem('currentTab')) {
        currentTab.value = 'Items';
        localStorage.setItem('currentTab', 'Items');
      }

        isSidebarOpen.value = window.innerWidth >= 1024;
      })

      const handleSidebarToggle = () => {
        isSidebarOpen.value 
      }
  
      const goBack = () => {
        router.back()
      }

      const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      }
      
      const navigateToItemBatch = (batchId) => {
        router.push({ name: 'item-batches', params: { id: batchId } })
      }

      const navigateToChemicalBatch = (batchId) => {
        router.push({ name: 'chemical-batches', params: { id: batchId } })
      }

      const openAddBatchForm = () => {
        showAddForm.value = true;
      }
  
      const closeAddBatchForm = () => {
        showAddForm.value = false;
      }

      const handleBatchAdded = () => {
        fetchBatches();
        showAddForm.value = false;
      }

      const filteredBatches = computed(() => {
      if (!searchQuery.value) return batches.value;

        const query = searchQuery.value.toLowerCase();
        return batches.value.filter(batch => 
          batch.batch_number?.toLowerCase().includes(query)
        );
      });
  
      return {
        loading,
        error,
        visibleHeaders,
        formatDate,
        navigateToItemBatch,
        navigateToChemicalBatch,
        goBack,
        batches,
        items,
        showAddForm,
        openAddBatchForm,
        closeAddBatchForm,
        handleBatchAdded,
        searchQuery,
        filteredBatches,
        isSidebarOpen,
        handleSidebarToggle,
        tabs,
        currentTab,
        handleDeleteClick,
        handleCancel,
        batchToDelete,
        showDialog,
        confirmDelete
      }
    }
  })
  </script>
  
  <style scoped>
  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  </style>
  