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
        
        <h1 class="text-3xl font-bold mb-6 text-gray-800">Apparatus List</h1>

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
            <PrimaryButton @click="showAddForm = true" v-if="userType === 'Lab Technician'">
              <template #icon>
                <i class="fas fa-plus mr-2"></i>
              </template>
              Add Apparatus
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
          <div v-else-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
            <p class="font-bold">Error</p>
            <p>{{ error }}</p>
          </div>

          <table v-else class="min-w-full divide-y divide-gray-200">
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
                v-for="apparatus in apparatuses" 
                :key="apparatus.id"
                @click="navigateToApparatusInstances(apparatus.id)" 
                class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
              >
                <td class="px-4 py-4">
                  <div class="text-sm font-medium text-gray-900">
                    <span class="text-blue-600 hover:text-blue-800">
                      {{ apparatus.name }}
                    </span>
                  </div>
                  <div 
                    :title="apparatus.description"
                    class="text-sm truncate max-w-xs text-gray-900"
                  >
                    {{ apparatus.description }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-900">
                    {{ apparatus.category?.name }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-900">
                    {{ apparatus.apparatus_type }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="space-y-1">
                    <!-- Count display -->
                    <div v-if="apparatus?.apparatus_type === 'Consumables'" class="text-sm font-medium text-gray-900">
                      <span>{{ apparatus?.available_instances }}</span> left
                    </div>
                    <div v-else class="text-sm font-medium text-gray-900">
                      <span class="inline-flex items-center">{{ apparatus?.available_instances }} / {{ apparatus?.total_instances }}</span> 
                    </div>

                    <!-- Status indicator -->
                    <div v-if="apparatus?.available_instances === 0 " 
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      <i class="fas fa-times-circle mr-1"></i>
                      No Available Left
                    </div>
                    
                    <div v-else-if="apparatus?.available_instances / apparatus?.total_instances <= 0.2" 
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      <i class="fas fa-exclamation-circle mr-1"></i>
                      Low Stock: {{ apparatus?.available_instances }} left
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
                    <button @click="editApparatus(apparatus)" 
                      class="text-blue-500 hover:text-blue-800 border border-blue-300 rounded-full p-1 flex items-center justify-center w-7 h-7"
                    >
                      <i class="pi pi-pencil" style="font-size: 14px"></i>
                    </button>
                    <button @click="handleDeleteClick(apparatus.id)" 
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

    <!-- Add Form Modal -->
    <div v-if="showAddForm" class="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 z-50">
      <ApparatusForm
        :categories="categories"
        @close="showAddForm = false"
        @apparatus-added="handleEquipmentAdded"
      />
    </div>

    <!-- Update Form Modal -->
    <div v-if="showUpdateForm" class="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 z-50">
      <UpdateApparatus
        :apparatusId="selectedApparatus"
        :categories="categories"
        @close="showUpdateForm = false"
        @apparatus-updated="handleApparatusUpdated"
      />
    </div>

    <ConfirmButton
      v-model:visible="showDialog"
      title="Delete Apparatus"
      message="Are you sure you want to delete this apparatus?"
      @confirm="confirmDelete"
      @cancel="showDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import axios from 'axios'
import Sidebar from '@/components/UserType/Sidebar.vue'
import PrimaryButton from '@/components/buttons/PrimaryButton.vue'
import ConfirmButton from '@/components/buttons/ConfirmButton.vue'
import ApparatusForm from './Forms/ApparatusForm.vue'
import UpdateApparatus from './Forms/UpdateApparatus.vue'

// Store and router
const store = useStore()
const router = useRouter()

// Reactive data
const apparatuses = ref([])
const searchQuery = ref('')
const categories = ref([])
const loading = ref(false)
const error = ref(null)
const successMessage = ref('')
const showAddForm = ref(false)
const isSidebarOpen = ref(false)
const showUpdateForm = ref(false)
const selectedApparatus = ref(null)
const showDialog = ref(false)
const apparatusToDelete = ref(null)

// Pagination
const currentPage = ref(1)
const totalPages = ref(0)
const pageSize = ref(10)

const showExportDropdown = ref(false)
const exportDropdownRef = ref(null)
const exportingCurrentPage = ref(false)
const exportingAllData = ref(false)


// Constants
const tableHeaders = ['Name', 'Category', 'Type', 'Apparatus Availability', 'Actions']

// Computed properties
const token = computed(() => store.state.token)
const userType = computed(() => store.state.userType)
const visibleHeaders = computed(() => {
  if (userType.value === 'Dean' || userType.value === 'Staff') {
    return tableHeaders.filter(header => header !== 'Actions')
  } else {
    return tableHeaders
  }
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

  const csvData = data.map(row => {
    let status = 'Available'
    if (row.available_instances === 0) {
      status = 'No Available Left'
    } else if (row.total_instances > 0 && row.available_instances / row.total_instances <= 0.2) {
      status = `Low Stock: ${row.available_instances} left`
    }

    return {
      'Name': row.name || '',
      'Description': row.description || '',
      'Category': row.category?.name || '',
      'Type': row.apparatus_type || '',
      'Available Apparatus': `${row.available_instances || ''} / ${row.total_instances || ''} (${status})`
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
    downloadCSV(apparatuses.value, `apparatus_page_${currentPage.value}_${date}.csv`)
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
    
    const response = await axios.get('/api/apparatus/', {
      headers: { 'Authorization': `Token ${token.value}` },
      params
    })
    
    const date = new Date().toISOString().slice(0, 10)
    const allData = response.data.results || response.data
    downloadCSV(allData, `all_apparatus_${date}.csv`)

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
const fetchApparatusAndCategories = async () => {
  loading.value = true
  error.value = null
  try {
    const [apparatusResponse, categoriesResponse] = await Promise.all([
      axios.get('/api/apparatus/', {
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

    apparatuses.value = apparatusResponse.data.results
    categories.value = categoriesResponse.data
    totalPages.value = Math.ceil(apparatusResponse.count / pageSize.value) || 1

  } catch (err) {
    console.error('Error fetching data:', err)
    error.value = err.response?.data?.message || "Failed to fetch data. Please try again."
  } finally {
    loading.value = false
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchApparatusAndCategories()
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchApparatusAndCategories()
  }
}

const handleDeleteClick = (apparatusId) => {
  apparatusToDelete.value = apparatusId
  showDialog.value = true
}

const confirmDelete = async () => {
  if (!apparatusToDelete.value) return
  
  try {
    await axios.delete(`/api/apparatus/${apparatusToDelete.value}/delete/`, {
      headers: { 'Authorization': `Token ${token.value}` }
    })
    successMessage.value = 'Apparatus deleted successfully'
    fetchApparatusAndCategories()
  } catch (err) {
    console.error('Error deleting apparatus:', err)
    error.value = 'Failed to delete apparatus'
  } finally {
    showDialog.value = false
    apparatusToDelete.value = null
    setTimeout(() => {
      successMessage.value = ''
      error.value = null
    }, 3000)
  }
}

const editApparatus = (apparatus) => {
  selectedApparatus.value = apparatus.id
  showUpdateForm.value = true
}

const handleEquipmentAdded = () => {
  showAddForm.value = false
  fetchApparatusAndCategories()
  successMessage.value = 'Apparatus added successfully!'
  setTimeout(() => {
    successMessage.value = null
  }, 3000)
  error.value = null
}


const handleApparatusUpdated = () => {
  showUpdateForm.value = false
  selectedApparatus.value = null
  fetchApparatusAndCategories()
}

const navigateToApparatusInstances = (apparatusId) => {
  router.push({ name: 'apparatus-instances', params: { apId: apparatusId } })
}

const handleSidebarToggle = (isOpen) => {
  isSidebarOpen.value = isOpen
}

const goBack = () => router.back()

// Watchers
watch(searchQuery, () => {
  currentPage.value = 1
  fetchApparatusAndCategories()
})

// Lifecycle
onMounted(() => {
  fetchApparatusAndCategories()
  isSidebarOpen.value = window.innerWidth >= 1024
})
</script>

<style scoped>
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>