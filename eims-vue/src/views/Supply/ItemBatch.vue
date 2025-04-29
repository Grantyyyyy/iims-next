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
          </div>
        </div>



        <div v-if="loading" class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <div v-else-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
          <p class="font-bold">Error</p>
          <p>{{ error }}</p>
        </div>

        <!-- Items Table -->
        <div  class="overflow-x-auto">
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
                v-for="itemBatch in filteredContent" 
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
                    {{ itemBatch.unit_cost }}
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
                <td class="px-4 py-4">
                  <button @click.stop="handleDeleteClick(itemBatch.id)" class="text-red-500 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
      <ItemBatchForm
        v-if="isAddItemFormOpen"
        :items="items"
        :batches="batches"
        :preselectedBatch="currentBatchId"
        @close="closeAddItemForm"
        @item-added="handleItemAdded"

      />
      <ConfirmButton
        v-model:visible="showDialog"
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        @confirm="confirmDelete"
        @cancel="handleCancel"
      />
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import Sidebar from '@/components/UserType/Sidebar.vue';
import PrimaryButton from '@/components/buttons/PrimaryButton.vue';
import ItemBatchForm from './Forms/ItemBatchForm.vue';
import ConfirmButton from '@/components/buttons/ConfirmButton.vue';


export default defineComponent({
  name: 'BatchItems',
  components: {
    Sidebar,
    PrimaryButton,
    ItemBatchForm,
    ConfirmButton

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
    const activeTab = ref('items');
    const batchContent = ref([]);
    const items = ref([]);
    const chemicals = ref([]);
    const batches = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const searchQuery = ref('');
    const isSidebarOpen = ref(true);
    const isAddItemFormOpen = ref(false);

    const currentBatchId = computed(() => batchId);
    
    const itemHeaders = ['Item', 'Unit Cost',  'Manufacture Date', 'Expiry Date', 'Quantity', 'Actions'];

    const itemBatchToDelete = ref(null);
    const showDialog = ref(false);


    const fetchBatchContent = async () => {
      loading.value = true;
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/batch-items/${batchId}/items/`, {
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

    const fetchBatchandItem = async () => {
      loading.value = true;
      try {
        const token = localStorage.getItem('token');
        const [batchResponse, itemResponse] = await Promise.all([
          axios.get('/api/batch-items/', { headers: { 'Authorization': `Token ${token}` } }),
          axios.get('api/items/', { headers: { 'Authorization': `Token ${token}` } })
        ])
        batches.value = batchResponse.data;
        items.value = itemResponse.data;
      } catch (err) {
        console.error('Error fetching batch content:', err);
        error.value = err.message || 'An error occurred while fetching batch content.';
      } finally {
        loading.value = false;
      }
    }

    const filteredContent = computed(() => {
      if (!searchQuery.value) return batchContent.value;
      
      const query = searchQuery.value.toLowerCase();
      return batchContent.value.filter(item => 
        item.item_details?.name.toLowerCase().includes(query) ||
        item.manufacture_date.toLowerCase().includes(query) ||
        item.expiry_date.toLowerCase().includes(query) ||
        String(item.quantity).toLowerCase().includes(query)
      );
    });

    const handleDeleteClick = (itemId) => {
      itemBatchToDelete.value = itemId;
      showDialog.value = true;
    }

    const handleCancel = () => {
      itemBatchToDelete.value = null;
      showDialog.value = false;
    }

    const confirmDelete = async () => {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/batch-items/${itemBatchToDelete.value}/items/delete/`, { headers: { 'Authorization': `Token ${token}` } });
        fetchBatchContent();
        handleCancel();
      } catch (err) {
        console.error('Error deleting item:', err);
      }
    }

    const navigateToItemInstances = (itemId) => {
      router.push({ name: 'batch-instances', params: { id: itemId, source: 'batch' } });
    };

    const handleAddNew = () => {
        isAddItemFormOpen.value = true;
    };

    const handleItemAdded = () => {
      fetchBatchContent();
      fetchBatchandItem();
      isAddItemFormOpen.value = false;
    };

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
      fetchBatchandItem();
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

      searchQuery,
      isSidebarOpen,
      isAddItemFormOpen,
      itemHeaders,
      formatDate,
      goBack,
      navigateToItemInstances,
      handleAddNew,
      handleSidebarToggle,
      closeAddItemForm,
      closeAddChemicalForm,
      filteredContent,
      currentBatchId,

      handleDeleteClick,
      itemBatchToDelete,
      showDialog,
      confirmDelete,
      handleCancel
      
    };
  },
});
</script>