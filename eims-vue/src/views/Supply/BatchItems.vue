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
            <PrimaryButton v-if="activeTab === 'items'" @click="isAddItemFormOpen = true">
              <template #icon>
                <i class="fas fa-plus mr-2"></i>
              </template>
              Add Item
            </PrimaryButton>
            <PrimaryButton v-if="activeTab === 'chemicals'" @click="isAddChemicalFormOpen = true">
              <template #icon>
                <i class="fas fa-plus mr-2"></i>
              </template>
              Add Chemical
            </PrimaryButton>
          </div>
        </div>



        <!-- Tab Navigation -->
        <div class="mb-6 border-b border-gray-200">
          <nav class="flex space-x-4">
            <button
              @click="activeTab = 'items'"
              :class="[ 
                'py-2 px-4 font-medium flex items-center space-x-2',
                activeTab === 'items' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700' 
              ]"
            >
              <i class="fas fa-cogs"></i>
              <span>Items</span>
            </button>
            <button
              @click="activeTab = 'chemicals'"
              :class="[ 
                'py-2 px-4 font-medium flex items-center space-x-2',
                activeTab === 'chemicals' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700' 
              ]"
            >
              <i class="fas fa-flask"></i>
              <span>Chemicals</span>
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

        <!-- Items Table -->
        <div v-else-if="activeTab === 'items'" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th v-for="header in itemHeaders" 
                    :key="header" 
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr 
                v-for="itemBatch in filteredItems" 
                :key="itemBatch.id" 
                @click="navigateToItemInstances(itemBatch.id)"
                class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
              >
                <td class="px-4 py-4">
                  <div class="text-sm font-medium text-gray-900">
                    {{ itemBatch.item_details?.name || 'N/A' }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-900">
                    {{ itemBatch.price }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-900">
                    {{ formatDate(itemBatch.manufacture_date) }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-900">
                    {{ formatDate(itemBatch.expiry_date) }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-900">
                    {{ itemBatch.quantity }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Chemicals Table -->
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
                v-for="chemical in filteredChemicals" 
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

      <!-- Modal Forms -->
      <AddItemBatch
        v-if="isAddItemFormOpen"
        :batches="batches"
        :items="items"
        :preselectedBatch="currentBatchId"
        @close="closeAddItemForm"
        @item-added="handleItemAdded"
      />
      <AddChemicalBatch
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
import AddChemicalBatch from './Forms/ChemicalBatchForm.vue';
import PrimaryButton from '@/components/buttons/PrimaryButton.vue';


export default defineComponent({
  name: 'BatchItems',
  components: {
    Sidebar,
    AddItemBatch,
    AddChemicalBatch,
    PrimaryButton

  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const batchId = route.params.id;
    const activeTab = ref('items');
    const batchContent = ref({ items: [], chemicals: [] });
    const items = ref([]);
    const chemicals = ref([]);
    const batches = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const searchQuery = ref('');
    const isSidebarOpen = ref(true);
    const isAddItemFormOpen = ref(false);
    const isAddChemicalFormOpen = ref(false);
    
    const itemHeaders = ['Item', 'Price',  'Manufacture Date', 'Expiry Date', 'Quantity'];
    const chemicalHeaders = ['Chemical Name', 'Price',  'Unit',  'Volume.'];
    const currentBatchId = computed(() => batchId);

    const addButtonText = computed(() => 
      activeTab.value === 'items' ? 'Add Items in Batch' : 'Add Chemicals in Batch'
    );

    // Fetch combined batch content
    const fetchBatchContent = async () => {
      loading.value = true;
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/batch/${batchId}/combine/`, {
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

    const fetchItemsAndBatchesAndChemicals = async () => {
      try {
        const token = localStorage.getItem('token');
        const [itemsResponse, batchesResponse, chemicalsResponse] = await Promise.all([
          axios.get('/api/items/', { headers: { 'Authorization': `Token ${token}` } }),
          axios.get('/api/batch/', { headers: { 'Authorization': `Token ${token}` } }),
          axios.get('/api/chemical/', { headers: { 'Authorization': `Token ${token}` } }),
        ]);
        items.value = itemsResponse.data;
        batches.value = batchesResponse.data;
        chemicals.value = chemicalsResponse.data;
      } catch (err) {
        console.error('Error fetching items or batches:', err);
      }
    };

    // Filter functions
    const filteredItems = computed(() => {
      if (!searchQuery.value) return batchContent.value.items;
      const query = searchQuery.value.toLowerCase();
      return batchContent.value.items.filter(itemBatch => 
        itemBatch.item_details?.name.toLowerCase().includes(query) ||
        itemBatch.manufacture_date.toLowerCase().includes(query) ||
        itemBatch.expiry_date.toLowerCase().includes(query) ||
        String(itemBatch.quantity).toLowerCase().includes(query)
      );
    });

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

    // Navigation functions
    const navigateToItemInstances = (itemId) => {
      router.push({ name: 'batch-instances', params: { id: itemId, source: 'batch' } });
    };

    const navigateToChemicalStocks = (chemicalId) => {
      router.push({ name: 'batch-stocks', params: { id: chemicalId, batchId: batchId } })
    };

    const handleAddNew = () => {
      if (activeTab.value === 'items') {
        isAddItemFormOpen.value = true;
      } else {
        isAddChemicalFormOpen.value = true;
      }
    };

    const handleItemAdded = () => {
      fetchBatchContent();
      fetchItemsAndBatchesAndChemicals();
      isAddItemFormOpen.value = false;
    };

    const handleChemicalAdded = () => {
      fetchBatchContent();
      fetchItemsAndBatchesAndChemicals();
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
      fetchItemsAndBatchesAndChemicals();
      isSidebarOpen.value = window.innerWidth >= 1024;
    });

    return {
      activeTab,
      batchId,
      batchContent,
      items,
      batches,
      chemicals,
      searchQuery,
      loading,
      error,
      handleItemAdded,
      handleChemicalAdded,
      searchQuery,
      isSidebarOpen,
      isAddItemFormOpen,
      isAddChemicalFormOpen,
      itemHeaders,
      chemicalHeaders,
      addButtonText,
      formatDate,
      goBack,
      navigateToItemInstances,
      navigateToChemicalStocks,
      handleAddNew,
      handleSidebarToggle,
      closeAddItemForm,
      closeAddChemicalForm,
      filteredItems,
      filteredChemicals,
      currentBatchId,
      
    };
  },
});
</script>