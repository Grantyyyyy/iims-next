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
        
        <h1 class="text-3xl font-bold mb-6 text-gray-800">Items</h1>

        <div class="flex justify-between mb-4">
          <div class="flex items-center mr-4">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search..."
              class="border border-gray-300 rounded py-2 px-4"
            />
          </div>

          <div class="flex space-x-2" v-if="userType === 'Secretary'">
            <PrimaryButton @click="showAddForm = true">
              <template #icon>
                <i class="fas fa-plus mr-2"></i>
              </template>
              Add Item
            </PrimaryButton>

            <PrimaryButton @click="showAddCategoryForm = true">
              <template #icon>
                <i class="fas fa-list mr-2"></i>
              </template>
              Add Category
            </PrimaryButton>

            <div class="relative" ref="exportDropdownRef">
              <PrimaryButton @click="toggleExportDropdown" class="flex items-center">
                <template #icon>
                  <i class="fas fa-file-export mr-2"></i>
                </template>
                Export
                <i class="fas fa-chevron-down ml-2 text-sm"></i>
              </PrimaryButton>
              
              <div v-if="showExportDropdown" class="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                <div class="py-2">
                  <button 
                    @click="exportCurrentPage" 
                    :disabled="exportingCurrentPage"
                    class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <i class="fas fa-file-csv mr-2"></i>
                    <span v-if="!exportingCurrentPage">Export Current Page (CSV)</span>
                    <span v-else class="flex items-center">
                      <i class="fas fa-spinner fa-spin mr-2"></i>
                      Exporting...
                    </span>
                  </button>
                  
                  <button 
                    @click="exportAllData" 
                    :disabled="exportingAllData"
                    class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <i class="fas fa-database mr-2"></i>
                    <span v-if="!exportingAllData">Export All Data (CSV)</span>
                    <span v-else class="flex items-center">
                      <i class="fas fa-spinner fa-spin mr-2"></i>
                      Exporting All...
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading and Error States -->
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
                v-for="item in items" 
                :key="item.id" 
                @click="navigateToItemInstances(item.id)"
                class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
              >
                <td class="px-4 py-4">
                  <div class="text-sm font-medium text-gray-900 flex items-center space-x-2">
                    <span class="text-blue-600 hover:text-blue-800">
                      {{ item.name }}
                    </span>
                    <i v-if="item.is_consumable" class="fas fa-circle text-xs text-green-500"></i>
                  </div>
                  <div 
                    :title="item.description"
                    class="text-sm truncate max-w-xs text-gray-900"
                  >
                    {{ item.description }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-900">
                    {{ item.model || 'None' }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-900">
                    {{ item.category.name }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-900">
                    {{ item.item_type }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="space-y-1">
                    <!-- Count display -->
                    <div v-if="item.item_type === 'Consumables'" class="text-sm font-medium text-gray-900">
                      <span>{{ item.available_instances }}</span> left
                    </div>
                    <div v-else class="text-sm font-medium text-gray-900">
                      <span class="inline-flex items-center">{{ item.available_instances }} / {{ item.total_instances }}</span> 
                    </div>

                    <!-- Status indicator -->
                    <div v-if="item.available_instances === 0 " 
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      <i class="fas fa-times-circle mr-1"></i>
                      No Available Left
                    </div>
                    
                    <div v-else-if="item.available_instances / item.total_instances <= 0.2" 
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      <i class="fas fa-exclamation-circle mr-1"></i>
                      Low Stock: {{ item.available_instances }} left
                    </div>
                    
                    <div v-else 
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <i class="fas fa-check-circle mr-1"></i>
                      Available
                    </div>
                  </div>
                </td>
                <td class="px-4 py-4" @click.stop v-if="userType === 'Secretary'">
                  <div class="flex space-x-1">
                    <button 
                      @click="editItem(item)" 
                      class="text-blue-500 hover:text-blue-800 border border-blue-300 rounded-full p-1 flex items-center justify-center w-7 h-7"
                    >
                      <i class="pi pi-pencil" style="font-size: 14px"></i>
                    </button>
                    <button 
                      @click.stop="handleDeleteClick(item.id)" 
                       class="text-red-500 hover:text-red-800 border border-red-300 rounded-full p-1 flex items-center justify-center w-7 h-7"
                    >
                      <i class="pi pi-trash" style="font-size: 14px"></i>
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
      <CartSummary
          v-if="userType === 'Secretary'"
          :items="cartStore.cartItems"
          @remove-item="removeFromCart"
          @open-borrow="showBorrowModal = true"
        />
    </div>
      <ConfirmButton
        v-model:visible="showDialog"
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        @confirm="confirmDelete"
        @cancel="handleCancel"
      />
    <div v-if="showAddForm" class="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 z-50">
      <ItemForm
        :batches="batches"
        :categories="categories"
        @close="closeForm"
        @item-added="handleItemAdded"
      />
    </div>
    <div v-if="showUpdateForm" class="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 z-50">
      <UpdateItemForm
        :itemId="selectedItemId"
        :categories="categories"
        @close="closeUpdateForm"
        @item-updated="handleItemUpdated"
      />
    </div>
    <div v-if="showAddCategoryForm" class="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 z-50">
      <AddCategory
        @close="closeForm"
        @category-added="handleCategoryAdded"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { useItemCartStore } from '@/stores/newCart'
import axios from 'axios'
import Sidebar from '@/components/UserType/Sidebar.vue'
import ItemForm from './Forms/ItemForm.vue'
import CartSummary from './Modals/CartSummary.vue'
import PrimaryButton from '@/components/buttons/PrimaryButton.vue'
import UpdateItemForm from './Forms/UpdateItemForm.vue'
import ConfirmButton from '@/components/buttons/ConfirmButton.vue'
import AddCategory from './Forms/AddCategory.vue'

// Store and router
const store = useStore()
const router = useRouter()
const cartStore = useItemCartStore()

// Reactive data
const items = ref([])
const searchQuery = ref('')
const categories = ref([])
const batches = ref([])
const loading = ref(false)
const error = ref(null)
const showAddForm = ref(false)
const showAddCategoryForm = ref(false)
const isSidebarOpen = ref(false)
const showUpdateForm = ref(false)
const selectedItemId = ref(null)
const showDialog = ref(false)
const itemToDelete = ref(null)
const successMessage = ref(null)

// Pagination
const currentPage = ref(1)
const totalPages = ref(0)
const pageSize = ref(10)

const showExportDropdown = ref(false)
const exportDropdownRef = ref(null)
const exportingCurrentPage = ref(false)
const exportingAllData = ref(false)

// Constants
const tableHeaders = ['Name', 'Model', 'Category', 'Item Type', 'Item Availability', 'Actions']

// Computed properties
const token = computed(() => store.state.token)
const userType = computed(() => store.state.userType)
const visibleHeaders = computed(() => {
  return tableHeaders.filter(header => header !== 'Actions' || userType.value !== 'Dean')
})

const toggleExportDropdown = () => {
  showExportDropdown.value = !showExportDropdown.value
}

const downloadCSV = (data, filename) => {
  if (!data || data.length === 0) {
    error.value = 'No data available to export'
    setTimeout(() => {
      error.value = null
    }, 3000)
    return
  }

  const csvRows = []
  const headers = ['Name', 'Description', 'Model', 'Category', 'Item Availability']
  csvRows.push(headers.join(','))

  for (const row of data) {
    // Determine status
    let status = 'Available'
    if (row.available_instances === 0) {
      status = 'No Available Left'
    } else if (row.total_instances > 0 && row.available_instances / row.total_instances <= 0.2) {
      status = `Low Stock: ${row.available_instances} left`
    }

    const values = [
      `"${row.name || ''}"`,
      `"${row.description || ''}"`,
      `"${row.model || ''}"`,
      `"${row.category?.name || ''}"`,
      `"${row.available_instances || 0}"`,
    ]
    csvRows.push(values.join(','))
  }

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.setAttribute('hidden', '')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

const exportCurrentPage = async () => {
  exportingCurrentPage.value = true
  showExportDropdown.value = false
  
  try {
    const date = new Date().toISOString().slice(0, 10)
    downloadCSV(items.value, `items_page_${currentPage.value}_${date}.csv`)
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    console.error('Export error:', err)
    error.value = 'Failed to export current page data'
    setTimeout(() => {
      error.value = null
    }, 3000)
  } finally {
    exportingCurrentPage.value = false
  }
}

const exportAllData = async () => {
  exportingAllData.value = true
  showExportDropdown.value = false
  
  try {
    const params = {
      export: 'all'
    }
    
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    
    const response = await axios.get('/api/items/', {
      headers: { 'Authorization': `Token ${token.value}` },
      params
    })
    
    const date = new Date().toISOString().slice(0, 10)
    const allData = response.data.results || response.data
    downloadCSV(allData, `all_items_${date}.csv`)

    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    console.error('Export all data error:', err)
    error.value = 'Failed to export all data'
    setTimeout(() => {
      error.value = null
    }, 3000)
  } finally {
    exportingAllData.value = false
  }
}


// Methods
const fetchItems = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/items/', { 
      headers: { 
        'Authorization': `Token ${token.value}` 
      },
      params: {
        page: currentPage.value,
        page_size: pageSize.value,
        search: searchQuery.value,
      } 
    })

    items.value = response.data.results || response.data
    totalPages.value = Math.ceil(response.data.count / pageSize.value) || 1

  } catch (err) {
    console.error('Error fetching data:', err)
    error.value = "Failed to fetch data. Please try again."
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const response = await axios.get('/api/category/')
    categories.value = response.data
  } catch (err) {
    console.error("Error fetching categories:", err)
    error.value = "Failed to fetch categories. Please try again."
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchItems()
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchItems()
  }
}

const handleDeleteClick = (itemId) => {
  itemToDelete.value = itemId
  showDialog.value = true
}

const confirmDelete = async () => {
  if (itemToDelete.value) {
    try {
      await axios.delete(`/api/items/${itemToDelete.value}/delete/`)
      fetchItems()
    } catch (err) {
      console.error("Error deleting item:", err)
      error.value = "Failed to delete item. Please try again."
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
  selectedItemId.value = item.id
  showUpdateForm.value = true
}

const closeForm = () => {
  showAddForm.value = false
  showAddCategoryForm.value = false
}

const closeUpdateForm = () => {
  showUpdateForm.value = false
  selectedItemId.value = null
}

const addToCart = (instance) => {
  if (!instance.borrowed_by && !cartStore.isInCart(instance.id)) {
    cartStore.addToCart(instance)
  }
}

const removeFromCart = (instanceId) => {
  cartStore.removeFromCart(instanceId)
}

const isInCart = (instanceId) => {
  return cartStore.isInCart(instanceId)
}

const handleItemAdded = () => {
  showAddForm.value = false
  showAddCategoryForm.value = false
  successMessage.value = 'Item added successfully!'
  fetchItems()
  fetchCategories()
  setTimeout(() => successMessage.value = null, 3000)
}

const handleItemUpdated = () => {
  showUpdateForm.value = false
  selectedItemId.value = null
  fetchItems()
}

const handleCategoryAdded = () => {
  showAddCategoryForm.value = false
  successMessage.value = 'Category added successfully!'
  fetchCategories()
}

const handleWindowResize = () => {
  if (window.innerWidth >= 1024) {
    isSidebarOpen.value = true
  } else {
    isSidebarOpen.value = false
  }
}

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

const navigateToItemInstances = (itemId) => {
  router.push({ name: 'item-instances', params: { id: itemId } })
}

const handleSidebarToggle = (isOpen) => {
  isSidebarOpen.value = isOpen

  // Force layout recalculation
  window.requestAnimationFrame(() => {
    window.dispatchEvent(new Event('resize'))
  })
}

// Watchers
watch([searchQuery], () => {
  currentPage.value = 1
  fetchItems()
}, { immediate: true })

// Lifecycle
onMounted(() => {
  fetchItems()
  fetchCategories()
  window.addEventListener('resize', handleWindowResize)
  handleWindowResize()
})
</script>

<style scoped>
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>