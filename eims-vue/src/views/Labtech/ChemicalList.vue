<template>
  <div class="flex h-screen bg-gradient-to-b from-[#F5F4F1] to-[#D4EAF7]">
    <Sidebar @sidebarToggle="handleSidebarToggle" />
    <div 
      :class="[
        'flex-1 overflow-x-auto p-8 transition-all duration-300',
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

        <h1 class="text-3xl font-bold mb-6 text-gray-800">Chemicals</h1>

        <div class="flex justify-between mb-4">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search chemicals..."
            class="border border-gray-300 rounded py-2 px-4"
          />

          <div class="flex space-x-2">
            <PrimaryButton @click="openAddChemicalForm" v-if="userType === 'Lab Technician'">
              <template #icon>
                <i class="fas fa-plus mr-2"></i>
              </template>
              Add Chemical
            </PrimaryButton>
            
            <!-- Export Dropdown -->
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

        <div v-if="loading" class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>

        <div v-else-if="error" class="text-red-500 py-4">
          {{ error }}
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
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th v-for="header in visibleHeaders" 
                    :key="header" 
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr 
                v-for="chemical in chemicals" 
                :key="chemical.id" 
                @click="navigateToChemicalStocks(chemical.id)"
                :class="[
                  'transition-colors duration-150 cursor-pointer',
                  chemical.active_volume === '0.00' ? 'bg-red-50' : 'hover:bg-gray-50'
                ]"
              >
                <td class="px-4 py-4">
                  <span class="text-blue-600 hover:text-blue-800 font-medium">
                    {{ chemical.name }}
                  </span>
                  <div 
                    :title="chemical.description"
                    class="truncate max-w-xs text-xs text-gray-900"
                  >
                    {{ chemical.description }}
                  </div>
                  <div v-if="parseFloat(chemical.active_volume) === 0" class="text-xs text-red-500 font-medium mt-1">
                    Out of Stock
                  </div>
                  <div v-else-if="parseFloat(chemical.active_volume) < chemical.reorder_level" class="text-xs text-yellow-500 font-medium mt-1">
                    Low Stock
                  </div>
                  <div v-else-if="isNew(chemical)" class="text-xs text-green-500 font-medium mt-1">
                    New
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-900">
                    {{ chemical.unit }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="flex items-center gap-4">
                    <div class="relative w-48 bg-gray-300 rounded h-2">
                      <div 
                        class="h-2 rounded transition-all duration-300"
                        :class="getVolumeBarColor(chemical)"
                        :style="{ width: `${getBarWidth(chemical)}%` }"
                        :title="`Volume: ${chemical.active_volume}${chemical.unit}`"
                      ></div>
                    </div>
                    <span class="text-sm text-gray-500">
                      {{ chemical.active_volume }} {{ chemical.unit }} 
                    </span>
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="px-2 py-1 w-fit bg-red-100 text-red-700 rounded-full text-xs">
                    {{ chemical.reorder_level }} {{ chemical.unit }}
                  </div>
                </td>
                <td class="px-4 py-4" @click.stop v-if="userType === 'Lab Technician'">
                <div class="flex space-x-1.5">
                  <button 
                    @click="editChemical(chemical)"
                    class="text-blue-500 hover:text-blue-800 border border-blue-300 rounded-full p-1 flex items-center justify-center w-7 h-7"
                  >
                  <i class="pi pi-pencil" style="font-size: 14px"></i>
                  </button>
                  <button 
                    @click="handleDeleteClick(chemical.id)"
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
    </div>

    <!-- Chemical Form Modal -->
    <div v-if="showAddForm" class="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 z-50">
      <ChemicalForm
        :chemicals="chemicals"
        @close="showAddForm = false"
        @chemical-added="handleChemicalAdded"
      />
    </div>
    <div v-if="showUpdateForm" class="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 z-50">
      <UpdateChemical
        :chemical="selectedChemical"
        @close="closeUpdateForm"
        @chemical-updated="handleChemicalUpdated"
      />
    </div>
    <ConfirmButton
        v-model:visible="showDialog"
        title="Delete Chemical"
        message="Are you sure you want to delete this chemical?"
        @confirm="confirmDelete"
        @cancel="handleCancel"
      />

      <ChemicalCart
        v-if=" userType === 'Lab Technician'"
        :chemicals="chemicalCartStore.chemicals"
        :stocks="stocks"
        @remove-item="removeFromCart"
        @open-borrow="showBorrowModal = true"
      />

  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import Papa from 'papaparse'
import Sidebar from '@/components/UserType/Sidebar.vue'
import ChemicalForm from './Forms/ChemicalForm.vue'
import PrimaryButton from '@/components/buttons/PrimaryButton.vue'
import UpdateChemical from '../Labtech/Forms/UpdateChemical.vue'
import ConfirmButton from '@/components/buttons/ConfirmButton.vue'
import ChemicalCart from '../Labtech/Modals/ChemicalCart.vue'
import { useChemicalCart } from '@/stores/chemicalCart'

// Composables
const store = useStore()
const router = useRouter()
const chemicalCartStore = useChemicalCart()

// Reactive data
const loading = ref(true)
const error = ref(null)
const successMessage = ref(null)
const chemicals = ref([])
const searchQuery = ref('')
const showAddForm = ref(false)
const showUpdateForm = ref(false)
const isSidebarOpen = ref(false)
const selectedChemical = ref(null)
const showDialog = ref(false)
const chemicalToDelete = ref(null)
const currentPage = ref(1)
const totalPages = ref(0)
const pageSize = ref(10)

// Export related
const showExportDropdown = ref(false)
const exportDropdownRef = ref(null)
const exportingCurrentPage = ref(false)
const exportingAllData = ref(false)

// Computed properties
const userType = computed(() => store.state.userType)
const tableHeaders = ['Name', 'Unit', 'Stocks Level', 'Reorder Level', 'Actions']
const visibleHeaders = computed(() => {
  return tableHeaders.filter(header => header !== 'Actions' || userType.value !== 'Dean')
})

// Helper functions
const goBack = () => {
  router.back()
}

const isNew = (chemical) => {
  if (!chemical || !chemical.addedAt) return false
  
  const addedDate = new Date(chemical.addedAt)
  const currentDate = new Date()
  
  const diffInHours = (currentDate - addedDate) / (1000 * 60 * 60)
  return diffInHours < 24
}

// Export functions
const toggleExportDropdown = () => {
  showExportDropdown.value = !showExportDropdown.value
}

const downloadCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert('No data available to export')
    return
  }

  const csvData = data.map(row => {
    return {
      'Name': row.name || '',
      'Description': row.description || '',
      'Unit': row.unit || '',
      'Stock Level': row.active_volume || 0,
      'Reorder Level': row.reorder_level || ''
    }
  })

  const csv = Papa.unparse(csvData, {
    quotes: true,
    quoteChar: '"',
    delimiter: ',',
    header: true,
    skipEmptyLines: true
  })

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
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
    downloadCSV(chemicals.value, `chemicals_page_${currentPage.value}_${date}.csv`)
  } catch (err) {
    console.error('Export error:', err)
    alert('Failed to export data')
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
    
    const response = await axios.get('/api/chemical/', { params })
    const date = new Date().toISOString().slice(0, 10)
    downloadCSV(response.data.results || response.data, `all_chemicals_${date}.csv`)
  } catch (err) {
    console.error('Export all data error:', err)
    alert('Failed to export all data')
  } finally {
    exportingAllData.value = false
  }
}

const fetchChemicals = async () => {
  loading.value = true
  error.value = null
  
  try {
    const params = {
      page: currentPage.value,
      page_size: pageSize.value
    }
    
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    
    const response = await axios.get('/api/chemical/', { params })
    chemicals.value = response.data.results
    totalPages.value = Math.ceil(response.data.count / pageSize.value) || 1
  } catch (err) {
    console.error('Error fetching data:', err)
    error.value = err.response?.data?.message || "Failed to fetch data. Please try again."
  } finally {
    loading.value = false
  }
}

// Pagination
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchChemicals()
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchChemicals()
  }
}

// CRUD operations
const handleDeleteClick = (chemicalId) => {
  chemicalToDelete.value = chemicalId
  showDialog.value = true
}

const confirmDelete = async () => {
  if (chemicalToDelete.value) {
    try {
      await axios.delete(`/api/chemical/${chemicalToDelete.value}/delete/`)
      successMessage.value = "Chemical deleted successfully."
      setTimeout(() => {
        successMessage.value = null
      }, 1000)
      fetchChemicals()
    } catch (err) {
      console.error("Error deleting chemical:", err)
      error.value = "Failed to delete chemical. Please try again."
    } finally {
      showDialog.value = false
      chemicalToDelete.value = null
    }
  }
}

const editChemical = (chemical) => {
  selectedChemical.value = chemical
  showUpdateForm.value = true
}

const closeUpdateForm = () => {
  selectedChemical.value = null
  showUpdateForm.value = false
}

const handleCancel = () => {
  showDialog.value = false
  chemicalToDelete.value = null
}

const handleChemicalUpdated = async () => {
  await fetchChemicals()
  closeUpdateForm()
}

const handleChemicalAdded = async () => {
  await fetchChemicals()
  showAddForm.value = false
}

const openAddChemicalForm = () => {
  showAddForm.value = true
}

// UI helpers
const getBarWidth = (chemical) => {
  const volume = parseFloat(chemical.active_volume)
  if (volume <= 0) return 0
  if (volume < 100) return 33
  if (volume < 500) return 66
  return Math.min(100, Math.round((volume / (chemical.maxVolume || 1000)) * 100))
}

const getVolumeBarColor = (chemical) => {
  const volume = parseFloat(chemical.active_volume)
  if (volume < 100) return 'bg-red-500'
  if (volume < 500) return 'bg-yellow-500'
  return 'bg-green-500'
}

const navigateToChemicalStocks = (chemicalId) => {
  router.push({ name: 'chemical-stocks', params: { id: chemicalId } })
}

const handleSidebarToggle = (isOpen) => {
  isSidebarOpen.value = isOpen
}

// Click outside handler for dropdown
const handleClickOutside = (event) => {
  if (exportDropdownRef.value && !exportDropdownRef.value.contains(event.target)) {
    showExportDropdown.value = false
  }
}

// Watchers
watch([searchQuery], () => {
  currentPage.value = 1
  fetchChemicals()
}, { immediate: true })

// Lifecycle
onMounted(() => {
  fetchChemicals()
  isSidebarOpen.value = window.innerWidth >= 1024
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>