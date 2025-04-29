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
          
          <h1 class="text-3xl font-bold mb-6 text-gray-800">Equipments </h1>
  
          <div class="flex justify-between mb-4">
            <div class="flex items-center mr-4">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search..."
                class="border border-gray-300 rounded py-2 px-4 "
              />
            </div>
  
            <!-- Buttons -->
            <div class="flex space-x-2" v-if="userType === 'Lab Technician'">
              <PrimaryButton  @click="showAddForm = true ">
                <template #icon>
                  <i class="fas fa-plus mr-2 "></i>
                </template>
                  Add Equipment
              </PrimaryButton>
  
            </div>
          </div>
  
  
          <!-- Loading and Error States -->
          <div v-if="loading" class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>

          <div v-else class="overflow-x-auto">
            <div v-if="successMessage" class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded" role="alert">
              <p class="font-bold">Success</p>
              <p>{{ successMessage }}</p>
            </div>
            <div v-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
              <p class="font-bold">Error</p>
              <p>{{ error }}</p>
            </div>
            <table v-else class="min-w-full divide-y divide-gray-200">
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
                  v-for="equipment in  equipments" 
                  :key="equipment.id" 
                  @click="navigateToEquipmentInstances(equipment.id)"
                  class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
                >
                  <td class="px-4 py-4">
                    <div class="text-sm font-medium text-gray-900">
                      <span class="text-blue-600 hover:text-blue-800">
                        {{ equipment.name }}
                      </span>
                    </div>
                    <div 
                      :title="equipment.description"
                      class="text-sm truncate max-w-xs text-gray-900"
                    >
                      {{ equipment.description }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-sm text-gray-900">
                      {{ equipment.model }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-sm text-gray-900">
                      {{ equipment.category.name }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="space-y-1">
                      <!-- Count display -->
                      <div class="text-sm font-medium text-gray-900">
                        {{ equipment.available_instances }} / {{ equipment.total_instances }}
                      </div>
                      
                      <!-- Status indicator -->
                      <div v-if="equipment.available_instances === 0" 
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <i class="fas fa-times-circle mr-1"></i>
                        No Available Left
                      </div>
                      
                      <div v-else-if="equipment.available_instances / equipment.total_instances <= 0.2" 
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        <i class="fas fa-exclamation-circle mr-1"></i>
                        Low Stock: {{ equipment.available_instances }} left
                      </div>
                      
                      <div v-else 
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <i class="fas fa-check-circle mr-1"></i>
                        Available
                      </div>
                    </div>
                  </td>
                  <td v-if="userType === 'Lab Technician'" class="px-4 py-4" @click.stop>
                    <div class="flex space-x-1.5">
                      <button @click="editEquipment(equipment)" 
                        class="text-blue-500 hover:text-blue-800 border border-blue-300 rounded-full p-1 flex items-center justify-center w-7 h-7"
                      >
                        <i class="pi pi-pencil" style="font-size: 14px"></i>
                      </button>
                      <button @click.stop="handleDeleteClick(equipment.id)" 
                        class="text-red-500 hover:text-red-800 border border-red-300 rounded-full p-1 flex items-center justify-center w-7 h-7"  
                      >
                        <i class="pi pi-trash" style="font-size: 14px"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
      </div>
      <div v-if="showAddForm" class="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 z-50">
      <EquipmentForm
        :categories="categories"
        @close="closeForm"
        @equipment-added="handleEquipmentAdded"
      />
      </div>
      <ConfirmButton
        v-model:visible="showDialog"
        title="Delete Equipment"
        message="Are you sure you want to delete this equipment?"
        @confirm="confirmDelete"
        @cancel="handleCancel"
      />
      <div v-if="showUpdateForm" class="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 z-50">
        <UpdateEquipmentForm
          :equipmentId="selectedEquipment"
          :categories="categories"
          @close="closeUpdateForm"
          @equipment-updated="handleEquipmentAdded"
        />
      </div>
    </div>
  </div>
</template>



  
<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { useItemCartStore } from '@/stores/newCart'
import axios from 'axios'
import Sidebar from '@/components/UserType/Sidebar.vue'
import PrimaryButton from '@/components/buttons/PrimaryButton.vue'
import ConfirmButton from '@/components/buttons/ConfirmButton.vue'
import EquipmentForm from '../Supply/Forms/EquipmentForm.vue'
import UpdateEquipmentForm from './Forms/UpdateEquipmentForm.vue'

export default defineComponent({
  name: 'EquipmentList',
  components: {
    Sidebar, PrimaryButton, ConfirmButton, EquipmentForm, UpdateEquipmentForm
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    const equipments = ref([])
    const searchQuery = ref('')
    const categories = ref([])
    const batches = ref([])
    const loading = ref(false)
    const error = ref(null)
    const showAddForm = ref(false)
    const showAddCategoryForm = ref(false)
    const cartStore = useItemCartStore();
    const isSidebarOpen = ref(false)
    const tableHeaders = ['Name', 'Model', 'Category', 'Equipment Availability', 'Actions']
    const visibleHeaders = computed(() => {
        if(userType.value === 'Dean' || userType.value === 'Staff'){
            return tableHeaders.filter(header => header !== 'Actions');
        }else{
            return tableHeaders;
        }
    })
    const showUpdateForm = ref(false)
    const selectedEquipment = ref(null)
    const showDialog = ref(false)
    const equipmentToDelete = ref(null)

    const token = computed(() => store.state.token)
    const userType = computed(() => store.state.userType)

    const currentPage = ref(1);
    const totalPages = ref(0);
    const pageSize = ref(10);

    const handleEquipmentAdded = () => {
      showAddForm.value = false;
      showAddCategoryForm.value = false
      fetchEquipementAndCategories();
    };

    const fetchEquipementAndCategories = async () => {
      loading.value = true;
      error.value = null;
      try {
      const [equipmentResponse, categoriesResponse] = await Promise.all([
          axios.get('/api/equipments/', {
              headers: { 'Authorization': `Token ${token.value}` },
              params: {
                  search: searchQuery.value,
                  page: currentPage.value,
                  page_size: pageSize.value
              }
          }),
          
          axios.get('/api/labtech-category/', {
              headers: { 'Authorization': `Token ${token.value}` }
          })
          ]);

      equipments.value = equipmentResponse.data.results;
      categories.value = categoriesResponse.data;

      totalPages.value = Math.ceil(equipmentResponse.count / pageSize.value) || 1;


    } catch (err) {
        console.error('Error fetching data:', err);
        error.value = err.response?.data?.message || "Failed to fetch data. Please try again.";
        } finally {
            loading.value = false;
        }
    };

    const handleDeleteClick = (equipmentId) => {
      equipmentToDelete.value = equipmentId
      showDialog.value = true
    }

    const confirmDelete = async () => {
      if (equipmentToDelete.value) {
        try {
          await axios.delete(`/api/equipments/${equipmentToDelete.value}/delete/`, {
              headers: { 'Authorization': `Token ${token.value}` }
          });
          fetchEquipementAndCategories();
        } catch (err) {
          console.error("Error deleting equipment:", err);
          error.value = "Failed to delete equipment. Please try again.";
        } finally {
          showDialog.value = false
          equipmentToDelete.value = null
        }
      }
    }

    watch(searchQuery, () => {
      currentPage.value = 1;  
      fetchEquipementAndCategories();
    });

    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
        fetchEquipementAndCategories();
      }
    };

    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--;
        fetchEquipementAndCategories();
      }
    };

    const handleCancel = () => {
      showDialog.value = false
      equipmentToDelete.value = null
    }

    const editEquipment = (equipment) => {
      selectedEquipment.value = equipment.id
      showUpdateForm.value = true
    }

    const closeForm = () => {
      showAddForm.value = false
      selectedEquipment.value = null
    }

    const addToCart = (instance) => {
      if (!instance.borrowed_by && !cartStore.isInCart(instance.id)) {
        cartStore.addToCart(instance);
      }
    };

    const removeFromCart = (instanceId) => {
      cartStore.removeFromCart(instanceId);
    };

    const isInCart = (instanceId) => {
      return cartStore.isInCart(instanceId);
    };



    onMounted(() => {
      fetchEquipementAndCategories();

      isSidebarOpen.value = window.innerWidth >= 1024
    });

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    const openAddItemForm = () => {
      showAddForm.value = true
    }

    const openAddCategoryForm = () => {
      showAddCategoryForm.value = true
    }

    const goBack = () => {
      router.back()
    }

    const navigateToEquipmentInstances = (equipmentId) => {
      router.push({ name: 'equipment-instances', params: { eqId: equipmentId } })
    }

    const handleSidebarToggle = (isOpen) => {
      isSidebarOpen.value = isOpen
    }

    const handleItemUpdated = () => {
      showUpdateForm.value = false
      selectedEquipment.value = null
      fetchItemsAndBatches()
    }

    const closeUpdateForm = () => {
      showUpdateForm.value = false
      selectedEquipment.value = null
    }

    


    return {
      equipments,
      batches,
      loading,
      categories,
      error,  
      userType,
      showAddForm,
      tableHeaders,
      visibleHeaders,
      searchQuery,

      formatDate,
      navigateToEquipmentInstances,
      goBack,
      openAddItemForm,
      openAddCategoryForm,
      handleEquipmentAdded,
      cartStore,
      useItemCartStore,
      addToCart,
      removeFromCart,
      isInCart,
      handleSidebarToggle,
      isSidebarOpen,

      editEquipment,
      showUpdateForm,
      selectedEquipment,
      handleItemUpdated,
      closeUpdateForm,
      showDialog,
      equipmentToDelete,
      handleDeleteClick,
      confirmDelete,
      handleCancel,
      closeForm,
      currentPage,
      totalPages,
      nextPage,
      prevPage

      
    }
  }
})
</script>

<style scoped>
</style>