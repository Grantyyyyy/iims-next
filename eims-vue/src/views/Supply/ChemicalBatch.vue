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
  
          <h1 class="text-3xl font-bold mb-6 text-gray-800">Batch {{ batchId }} Details</h1>
  
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
              <PrimaryButton @click="isAddChemicalFormOpen = true">
                <template #icon>
                  <i class="fas fa-plus mr-2"></i>
                </template>
                Add Chemical
              </PrimaryButton>
            </div>
          </div>
  
  
          <!-- Loading and Error States -->
          <div v-if="loading" class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <div v-else-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
            <p class="font-bold">Error</p>
            <p>{{ error }}</p>
          </div>
  
          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th v-for="header in chemicalHeaders" 
                      :key="header" 
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ header }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr 
                  v-for="chemical in batchContent" 
                  :key="chemical.id" 
                  @click="navigateToChemicalStocks(chemical.id)"
                  class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
                >
                <td class="px-4 py-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ chemical.chemical_details?.name || 'N/A' }}
                    </div>
                    <div 
                      :title="chemical.chemical_details?.description"
                      class="truncate max-w-xs text-sm text-gray-900"
                    >
                      {{ chemical.chemical_details?.description }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-sm text-gray-900">
                      {{ chemical.price || 'N/A' }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-sm text-gray-900">
                      {{ chemical.chemical_details?.unit || 'N/A' }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-sm text-gray-900">
                      {{ chemical.chemical_details?.volume || 'N/A' }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <ChemicalBatchForm
          v-if="isAddChemicalFormOpen"
          :batches="batches"
          :chemicals="chemicals"
          :preselectedBatch="currentBatchId"
          @close="closeAddChemicalForm"
          @chemical-added="handleChemicalAdded"
        />
      </div>
    </div>
  </template>
  
  <script>
  import { defineComponent, ref, onMounted, computed } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import axios from 'axios';
  import Sidebar from '@/components/UserType/Sidebar.vue';
  import ChemicalBatchForm from './Forms/ChemicalBatchForm.vue';
  import PrimaryButton from '@/components/buttons/PrimaryButton.vue';

  
  
  export default defineComponent({
    name: 'BatchItems',
    components: {
      Sidebar,
      ChemicalBatchForm,
      PrimaryButton
  
    },
    props: {
      id: {
        type: String,
        required: true
      }
    },
    setup() {
      const route = useRoute();
      const router = useRouter();
      const batchId = route.params.id;
      const batchContent = ref([]);
      const chemicals = ref([]);
      const batches = ref([]);
      const loading = ref(false);
      const error = ref(null);
      const searchQuery = ref('');
      const isSidebarOpen = ref(true);

      const isAddChemicalFormOpen = ref(false);
      
      const chemicalHeaders = ['Chemical Name', 'Price',  'Unit',  'Volume.'];
      const currentBatchId = computed(() => batchId);
  

  
      // Fetch combined batch content
      const fetchBatchContent = async () => {
        loading.value = true;
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`/api/batch-chemicals/${batchId}/chemicals/`, {
            headers: { 'Authorization': `Token ${token}` },
          });
          batchContent.value = response.data;
        } catch (err) {
          console.error('Error fetching batch content:', err);
          error.value = err.message || 'An error occurred while fetching batch content.';
        } finally {
          loading.value = false;
        }
      };
  
      const fetchBatchesandChemicals = async () => {
        try {
          const token = localStorage.getItem('token');
          const [batchesResponse, chemicalsResponse] = await Promise.all([
            axios.get('/api/batch-chemicals/', { headers: { 'Authorization': `Token ${token}` } }),
            axios.get('/api/chemical/', { headers: { 'Authorization': `Token ${token}` } }),
          ]);
          batches.value = batchesResponse.data;
          chemicals.value = chemicalsResponse.data;
        } catch (err) {
          console.error('Error fetching items or batches:', err);
        }
      };

      const filteredChemicals = computed(() => {
        if (!searchQuery.value) return batchContent.value.chemicals;
        const query = searchQuery.value.toLowerCase();
        return batchContent.value.chemicals.filter(chemical => 
          chemical.name.toLowerCase().includes(query) ||
          chemical.cas_no.toLowerCase().includes(query) ||
          String(chemical.quantity).toLowerCase().includes(query) ||
          chemical.unit.toLowerCase().includes(query)
        );
      });
  
      const navigateToChemicalStocks = (chemicalId) => {
        router.push({ name: 'batch-stocks', params: { id: chemicalId, batchId: batchId } })
      };
  
      const handleAddNew = () => {
          isAddChemicalFormOpen.value = true;
      };
  
      const handleChemicalAdded = () => {
        fetchBatchContent();
        fetchBatchesandChemicals();
        isAddChemicalFormOpen.value = false;
      };
  
      // Utility functions
      const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      };
  
      const handleSidebarToggle = (isOpen) => {
        isSidebarOpen.value = isOpen;
      };
  
      const goBack = () => {
        router.back();
      };
  
      // Modal control functions
      const closeAddItemForm = () => {
        isAddItemFormOpen.value = false;
      };
  
      const closeAddChemicalForm = () => {
        isAddChemicalFormOpen.value = false;
      };
  
      onMounted(() => {
        fetchBatchContent();
        fetchBatchesandChemicals();
        isSidebarOpen.value = window.innerWidth >= 1024;
      });
  
      return {
        batchId,
        batchContent,
        batches,
        chemicals,
        searchQuery,
        loading,
        error,

        handleChemicalAdded,
        searchQuery,
        isSidebarOpen,

        isAddChemicalFormOpen,
 
        chemicalHeaders,

        formatDate,
        goBack,
        navigateToChemicalStocks,
        handleAddNew,
        handleSidebarToggle,
        closeAddItemForm,
        closeAddChemicalForm,
        filteredChemicals,
        currentBatchId,
        
      };
    },
  });
  </script>