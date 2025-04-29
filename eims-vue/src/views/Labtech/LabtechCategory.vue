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
          
          <h1 class="text-3xl font-bold mb-6 text-gray-800">Categories</h1>
  
          <div class="flex justify-between mb-4">
            <div class="flex items-center mr-4">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search..."
                class="border border-gray-300 rounded py-2 px-4 "
              />
            </div>
  
  
            <PrimaryButton v-if="userType === 'Lab Technician'"  @click="showAddCategoryForm = true ">
            <template #icon>
                <i class="fas fa-list mr-2 "></i>
            </template>
                Add Category
            </PrimaryButton>
          </div>
  
          <div v-if="loading" class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
  
          <!-- Items Table -->
          <div v-else class="overflow-x-auto">
            <div v-if="successMessage" class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded" role="alert">
              <p class="font-bold">Success</p>
              <p>{{ successMessage }}</p>
            </div>
            <div v-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
              <p class="font-bold">Error</p>
              <p>{{ error }}</p>
            </div>
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
                  v-for="category in filteredCategories" 
                  :key="category.id" 
                  @click="navigateToItemInstances(category.id)"
                  class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
                >
                  <td class="px-4 py-4">
                    <div class="text-sm font-medium text-gray-900">
                      <span class="text-blue-600 hover:text-blue-800">
                        {{ category.name }}
                      </span>
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div 
                      :class="[
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        category.total_instances > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      ]">
                      {{ category.total_instances }}
                    </div>
                  </td>
                  <td class="px-4 py-4" @click.stop v-if="userType === 'Lab Technician'">
                    <div class="flex space-x-1">
                      <button @click="editItem(category)" 
                        class="text-blue-500 hover:text-blue-800 border border-blue-300 rounded-full p-1 flex items-center justify-center w-7 h-7"
                        title="Edit Category">
                        <i class="pi pi-pencil" style="font-size: 14px"></i>
                      </button>
                      <button @click="handleDeleteClick(category.id)" 
                        class="text-red-500 hover:text-red-800 border border-red-300 rounded-full p-1 flex items-center justify-center w-7 h-7 ml-2"
                        title="Delete Category">
                        <i class="pi pi-trash" style="font-size: 14px"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
      </div>
    </div>
        <ConfirmButton
          v-model:visible="showDialog"
          title="Delete Item"
          message="Are you sure you want to delete this item?"
          @confirm="confirmDelete"
          @cancel="handleCancel"
        />
        <div v-if="showUpdateForm" class="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 z-50">
          <UpdateLabCategory
            :categoryId="selectedCategory"
            :categories="categories"
            @close="closeUpdateForm"
            @category-updated="handleCategoryUpdated"
          />
        </div>
        <div v-if="showAddCategoryForm" class="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 z-50">
          <AddLabtechCategory
            @close="closeForm"
            @category-added="handleCategoryAdded"
          />
        </div>
    </div>
  </template>
  
  <script>
  import { defineComponent, ref, computed, onMounted } from 'vue'
  import { useStore } from 'vuex'
  import { useRouter } from 'vue-router'
  import axios from 'axios'
  import Sidebar from '@/components/UserType/Sidebar.vue'
  import PrimaryButton from '@/components/buttons/PrimaryButton.vue'
  import ConfirmButton from '@/components/buttons/ConfirmButton.vue'
  import UpdateLabCategory from './Forms/UpdateLabCategory.vue'
  import AddLabtechCategory from './Forms/AddLabtechCategory.vue'
  
  export default defineComponent({
    name: 'LabtechCategory',
    components: {
      Sidebar, PrimaryButton, ConfirmButton, UpdateLabCategory, AddLabtechCategory
    },
    setup() {
      const store = useStore()
      const router = useRouter()
      const searchQuery = ref('')
      const categories = ref([])
      const loading = ref(false)
      const successMessage = ref('')
      const error = ref(null)
      const isSidebarOpen = ref(false)
      const tableHeaders = ['Name', 'Total Instances', 'Actions']
      const visibleHeaders = computed(() => {
          if(userType.value === 'Dean' || userType.value === 'Staff'){
              return tableHeaders.filter(header => header !== 'Actions');
          }else{
              return tableHeaders;
          }
      })
      const userType = computed(() => store.state.userType)
      const showAddCategoryForm = ref(false)
      const showUpdateForm = ref(false)
      const selectedCategory = ref(null)
      const showDialog = ref(false)
      const itemToDelete = ref(null)
  
      const token = computed(() => store.state.token)
  
      const handleItemAdded = () => {
        showAddCategoryForm.value = false
        fetchCategories();
      };
  
      const fetchCategories = async () => {
        try {
          const response = await axios.get('/api/labtech-category/');
  
          categories.value = response.data;
        } catch (err) {
          console.error("Error fetching categories:", err);
          error.value = "Failed to fetch categories. Please try again.";
        }
      }
  
      const handleDeleteClick = (itemId) => {
        itemToDelete.value = itemId
        showDialog.value = true
      }
  
      const confirmDelete = async () => {
        if (itemToDelete.value) {
          try {
            await axios.delete(`/api/labtech-category/${itemToDelete.value}/delete/`);
            fetchCategories();
            successMessage.value = 'Category deleted successfully!';
            setTimeout(() => {
              successMessage.value = ''
            }, 3000);
          } catch (err) {
            console.error("Error deleting item:", err);
            error.value = "Failed to delete item. Please try again.";
          } finally {
            showDialog.value = false
            itemToDelete.value = null
          }
        }
      }
  
      const handleCancel = () => {
        showDialog.value = false
        itemToDelete.value = null
      }
  
      const editItem = (item) => {
        selectedCategory.value = item.id
        showUpdateForm.value = true
      }
  
      const closeForm = () => {
        showAddCategoryForm.value = false
      }

      const handleCategoryAdded = () => {
        showAddCategoryForm.value = false
        successMessage.value = 'Category added successfully!';
        fetchCategories()
      }
  
      const filteredCategories = computed(() => {
        if (!searchQuery.value) return categories.value;
        
        const query = searchQuery.value.toLowerCase();
        return categories.value.filter(category => 
            category.name.toLowerCase().includes(query) 
        );
      });
  
      onMounted(() => {
        fetchCategories();
  
        isSidebarOpen.value = window.innerWidth >= 1024
      });
  
      const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      }
  
      const openAddCategoryForm = () => {
        showAddCategoryForm.value = true
      }
  
      const goBack = () => {
        router.back()
      }
  
      const navigateToItemInstances = (categoryId) => {
        router.push({ name: 'labtech-category-instances', params: { id: categoryId } })
      }
  
      const handleSidebarToggle = (isOpen) => {
        isSidebarOpen.value = isOpen
      }
  
      const handleCategoryUpdated = () => {
        showUpdateForm.value = false
        selectedCategory.value = null
        fetchCategories()
      }

      const closeUpdateForm = () => {
        showUpdateForm.value = false
        selectedCategory.value = null
      }
      
  
  
      return {
        loading,
        categories,
        userType,
        successMessage,
        error,  
        tableHeaders,
        visibleHeaders,
        searchQuery,
        filteredCategories,
        formatDate,
        navigateToItemInstances,
        goBack,
        openAddCategoryForm,
        handleItemAdded,
        handleSidebarToggle,
        isSidebarOpen,
        editItem,
        showUpdateForm,
        selectedCategory,
        showAddCategoryForm,
        handleCategoryAdded,
        handleCategoryUpdated,
        closeUpdateForm,
        showDialog,
        itemToDelete,
        handleDeleteClick,
        confirmDelete,
        handleCancel,
        closeForm
  
        
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