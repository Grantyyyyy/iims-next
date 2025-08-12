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
        
        <h1 class="text-3xl font-bold mb-6 text-gray-800">Equipments</h1>

        <div class="flex justify-between mb-4">
          <div class="flex items-center mr-4">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search..."
              class="border border-gray-300 rounded py-2 px-4"
            />
          </div>

          <!-- Buttons -->
          <div class="flex space-x-2">
            <PrimaryButton v-if="userType === 'Lab Technician'" @click="showAddForm = true">
              <template #icon>
                <i class="fas fa-plus mr-2"></i>
              </template>
              Add Equipment
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
                v-for="equipment in equipments" 
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

    <!-- Modals -->
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
        @equipment-updated="handleItemUpdated"
      />
    </div>
  </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { useItemCartStore } from '@/stores/newCart'
import axios from 'axios'
import Sidebar from '@/components/UserType/Sidebar.vue'
import PrimaryButton from '@/components/buttons/PrimaryButton.vue'
import ConfirmButton from '@/components/buttons/ConfirmButton.vue'
import EquipmentForm from './Forms/EquipmentForm.vue'
import UpdateEquipmentForm from './Forms/UpdateEquipment.vue'

// Composables
const store = useStore()
const router = useRouter()
const cartStore = useItemCartStore()

// Reactive data
const equipments = ref([])
const searchQuery = ref('')
const categories = ref([])
const batches = ref([])
const loading = ref(false)
const error = ref(null)
const successMessage = ref(null)
const showAddForm = ref(false)
const showAddCategoryForm = ref(false)
const isSidebarOpen = ref(false)
const showUpdateForm = ref(false)
const selectedEquipment = ref(null)
const showDialog = ref(false)
const equipmentToDelete = ref(null)
const currentPage = ref(1)
const totalPages = ref(0)
const pageSize = ref(10)

// Export related
const showExportDropdown = ref(false)
const exportDropdownRef = ref(null)
const exportingCurrentPage = ref(false)
const exportingAllData = ref(false)

// Computed properties
const token = computed(() => store.state.token)
const userType = computed(() => store.state.userType)
const tableHeaders = ['Name', 'Model', 'Category', 'Equipment Availability', 'Actions']
const visibleHeaders = computed(() => {
  if (userType.value === 'Dean' || userType.value === 'Staff') {
    return tableHeaders.filter(header => header !== 'Actions')
  } else {
    return tableHeaders
  }
})

// Export functions
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

  const csvData = data.map(row => {

    return {
      'Name': row.name || '',
      'Description': row.description || '',
      'Model': row.model || '',
      'Category': row.category?.name || '',
      'Available Instances': row.available_instances || 0,
    }
  })

  const csv = Papa.unparse(csvData, {
    quotes: true,
    quoteChar: '"',
    delimiter: ',',
    header: true,
    skipEmptyLines: true
  })

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
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
    downloadCSV(equipments.value, `equipments_page_${currentPage.value}_${date}.csv`)
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
    
    const response = await axios.get('/api/equipments/', {
      headers: { 'Authorization': `Token ${token.value}` },
      params
    })
    
    const date = new Date().toISOString().slice(0, 10)
    const allData = response.data.results || response.data
    downloadCSV(allData, `all_equipments_${date}.csv`)

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

// Data fetching
const fetchEquipementAndCategories = async () => {
  loading.value = true
  error.value = null
  
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
    ])

    equipments.value = equipmentResponse.data.results
    categories.value = categoriesResponse.data
    totalPages.value = Math.ceil(equipmentResponse.data.count / pageSize.value) || 1

  } catch (err) {
    console.error('Error fetching data:', err)
    error.value = err.response?.data?.message || "Failed to fetch data. Please try again."
  } finally {
    loading.value = false
  }
}

// CRUD operations
const handleDeleteClick = (equipmentId) => {
  equipmentToDelete.value = equipmentId
  showDialog.value = true
}

const confirmDelete = async () => {
  if (equipmentToDelete.value) {
    try {
      await axios.delete(`/api/equipments/${equipmentToDelete.value}/delete/`, {
        headers: { 'Authorization': `Token ${token.value}` }
      })
      successMessage.value = 'Equipment deleted successfully!'
      setTimeout(() => {
        successMessage.value = null
      }, 3000)
      fetchEquipementAndCategories()
    } catch (err) {
      console.error("Error deleting equipment:", err)
      error.value = "Failed to delete equipment. Please try again."
    } finally {
      showDialog.value = false
      equipmentToDelete.value = null
    }
  }
}

const editEquipment = (equipment) => {
  selectedEquipment.value = equipment.id
  showUpdateForm.value = true
}

const handleEquipmentAdded = () => {
  showAddForm.value = false
  showAddCategoryForm.value = false
  successMessage.value = 'Equipment added successfully!'
  fetchEquipementAndCategories()
  setTimeout(() => successMessage.value = null, 3000)
}

const handleItemUpdated = () => {
  showUpdateForm.value = false
  selectedEquipment.value = null
  fetchEquipementAndCategories()
}

const closeForm = () => {
  showAddForm.value = false
  selectedEquipment.value = null
}

const closeUpdateForm = () => {
  showUpdateForm.value = false
  selectedEquipment.value = null
}

const handleCancel = () => {
  showDialog.value = false
  equipmentToDelete.value = null
}

// Pagination
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchEquipementAndCategories()
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchEquipementAndCategories()
  }
}

// Cart functions
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

// Navigation
const goBack = () => {
  router.back()
}

const navigateToEquipmentInstances = (equipmentId) => {
  router.push({ name: 'equipment-instances', params: { eqId: equipmentId } })
}

const handleSidebarToggle = (isOpen) => {
  isSidebarOpen.value = isOpen
}

// Utility functions
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Click outside handler for dropdown
const handleClickOutside = (event) => {
  if (exportDropdownRef.value && !exportDropdownRef.value.contains(event.target)) {
    showExportDropdown.value = false
  }
}

// Watchers
watch(searchQuery, () => {
  currentPage.value = 1
  fetchEquipementAndCategories()
})

// Lifecycle
onMounted(() => {
  fetchEquipementAndCategories()
  isSidebarOpen.value = window.innerWidth >= 1024
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>