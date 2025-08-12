<template>
  <div class="flex h-screen bg-gradient-to-b from-[#F5F4F1] to-[#D4EAF7]">
    <Sidebar @sidebarToggle="handleSidebarToggle" />
    <div
      :class="{
        'flex-1 overflow-x-auto p-8 transition-all duration-300 ease-in-out': true,
        'lg:ml-64': isSidebarOpen,
      }"
    >
      <div class="max-w-full bg-white/80 backdrop-blur-md shadow-lg rounded-lg p-8">
        <button @click="goBack" class="flex items-center mb-6 text-gray-700 hover:text-gray-900">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 class="text-3xl font-bold mb-6 text-gray-800">Current Borrowed </h1>

        <div class="flex items-center mb-4 mr-4">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search..."
            class="border border-gray-300 rounded py-2 px-4"
          />
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

        <div v-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
          <p class="font-bold">Error</p>
          <p>{{ error }}</p>
        </div>
        <div v-else-if="currentTab === 'Borrowed Items' && itemBorrowed.length === 0" class="text-center text-gray-500 text-lg my-8">
          No Borrowed Items found.
        </div>
        <div v-else-if="currentTab === 'Borrowed Equipments' && equipmentBorrowed.length === 0" class="text-center text-gray-500 text-lg my-8">
          No Borrowed Equipments found.
        </div>
        <div v-else-if="currentTab === 'Borrowed Apparatus' && apparatusBorrowed.length === 0" class="text-center text-gray-500 text-lg my-8">
          No Borrowed Apparatus found.
        </div>
        
        <div v-else class="overflow-x-auto">
          <div v-if="successMessage" class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded" role="alert">
            <p class="font-bold">Success</p>
            <p>{{ successMessage }}</p>
          </div>

          <BorrowedItems
            v-if="currentTab === 'Borrowed Items'"
            :itemBorrowed="itemBorrowed"
            :itemHeaders="itemHeaders"
            :getConditionClass="getConditionClass"
            :formatDate="formatDate"
            :openReturnForm="openReturnForm"
            :userType="userType"
          />

          <BorrowedEquipment
            v-if="currentTab === 'Borrowed Equipments'"
            :equipmentBorrowed="equipmentBorrowed"
            :equipmentHeaders="equipmentHeaders"
            :getConditionClass="getConditionClass"
            :formatDate="formatDate"
            :openReturnForm="openReturnForm"
            :userType="userType"
          />

          <BorrowedApparatus
            v-if="currentTab === 'Borrowed Apparatus'"
            :apparatusBorrowed="apparatusBorrowed"
            :apparatusHeaders="apparatusHeaders"
            :getConditionClass="getConditionClass"
            :formatDate="formatDate"
            :openApparatusReturnForm="openApparatusReturnForm"
            :userType="userType"
          />

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

    <div v-if="showReturnForm">
      <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
        <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-xl">
          <h2 class="text-xl font-bold mb-4">Return Equipment</h2>
          <div class="grid grid-cols-1 mb-6 gap-4">
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-semibold text-gray-700" for="condition">
                  Condition
                </label>
                <select
                  v-model="condition"
                  id="condition"
                  class="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                  :disabled="isSubmitting"
                >
                  <option value="">Select Condition</option>
                  <option value="Good" :selected="currentCondition === 'Good'">Good</option>
                  <option value="Fair" :selected="currentCondition === 'Fair'">Fair</option>
                  <option value="Poor" :selected="currentCondition === 'Poor'">Poor</option>
                  <option value="Damaged" :selected="currentCondition === 'Damaged'">Damaged</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700" for="notes">
                Remarks
              </label>
              <textarea
                v-model="remarks"
                id="remarks"
                rows="3"
                class="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add remarks about the item's condition..."
                :disabled="isSubmitting"
              ></textarea>
            </div>
            <div class="flex justify-end space-x-3 mt-8">
              <button
                @click="closeReturnForm"
                type="button"
                class="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                @click="submitReturn"
                type="submit"
                class="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import axios from 'axios'
import Sidebar from '../../components/UserType/Sidebar.vue'
import BorrowedEquipment from '../Labtech/BorrowedEquipment.vue'
import BorrowedApparatus from '../Labtech/BorrowedApparatus.vue'
import BorrowedItems from '../Secretary/Modals/BorrowedItems.vue'

const router = useRouter()
const store = useStore()
const itemBorrowed = ref([])
const equipmentBorrowed = ref([])
const apparatusBorrowed = ref([])
const loading = ref(true)
const errorMessage = ref(null)
const successMessage = ref(null)
const userType = computed(() => store.state.userType)
const userData = computed(() => store.state.user || {})
const showReturnForm = ref(false)
const isSidebarOpen = ref(true)
const selectedInstanceId = ref(null)
const currentCondition = ref('')
const tabs = ref(['Borrowed Items', 'Borrowed Equipments', 'Borrowed Apparatus'])
if (userData.department === 'Marine Biology' || userType.value === 'Staff' || userType.value === 'Lab Technician') {
  tabs.value = tabs.value.filter(tab => tab !== 'Borrowed Items')
}

const currentTab = ref(localStorage.getItem('currentTab') || tabs.value[0])
const error = ref(null)
const searchQuery = ref('');
const currentPage = ref(1);
const totalPages = ref(0);
const pageSize = ref(10);
const isSubmitting = ref(false)
const itemHeaders = ['Item', 'Borrower', 'Condition', 'Room', 'Borrowed At', 'Purpose', ...(userType.value === 'Staff' || userType.value === 'Dean' ? [] : ['Actions'])]
const equipmentHeaders = ['Equipment', 'Quantity', 'Borrower', 'Condition', 'Subject', 'Borrowed At', 'Purpose', ...(userType.value === 'Staff' || userType.value === 'Dean' ? [] : ['Actions'])]
const apparatusHeaders = ['Apparatus', 'Quantity', 'Borrower', 'Condition', 'Subject', 'Borrowed At', 'Purpose', ...(userType.value === 'Staff' || userType.value === 'Dean' ? [] : ['Actions'])]
const condition = ref('')
const notes = ref('')
const remarks = ref('')

const fetchBorrowedList = async () => {
  try {
    const config = {
      headers: { Authorization: `Token ${store.state.token}` },
      params: {
        page: currentPage.value,
        page_size: pageSize.value,
        search: searchQuery.value
      }
    }
    
    if (currentTab.value === 'Borrowed Items') {
      const { data } = await axios.get('/api/borrowed-items/', config)
      itemBorrowed.value = data
      totalPages.value = Math.ceil(data.count / pageSize.value) || 1
    } 
    else if (currentTab.value === 'Borrowed Equipments') {
      const { data } = await axios.get('/api/borrowed-equipment-list/', config)
      equipmentBorrowed.value = data
      totalPages.value = Math.ceil(data.count / pageSize.value) || 1
    }
    else if (currentTab.value === 'Borrowed Apparatus') {
      const { data } = await axios.get('/api/borrowed-apparatus/', config)
      apparatusBorrowed.value = data
      totalPages.value = Math.ceil(data.count / pageSize.value) || 1
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const openReturnForm = (instanceId) => {
  selectedInstanceId.value = instanceId

  const selectedItem = equipmentBorrowed.value.find(equipment => 
    equipment.equipment_instance.id === instanceId)
    
    currentCondition.value = selectedItem.equipment_instance.current_condition
    condition.value = currentCondition.value
    showReturnForm.value = true
}

const openApparatusReturnForm = (instanceId) => {
  selectedInstanceId.value = instanceId

  const selectedItem = apparatusBorrowed.value.find(apparatus => 
    apparatus.apparatus_instance.id === instanceId)
    
    currentCondition.value = selectedItem.apparatus_instance.current_condition
    condition.value = currentCondition.value
    showReturnForm.value = true
}

const submitReturn = async () => {
  if (!condition.value) {
    errorMessage.value = `Please select the condition of the ${currentTab.value === 'Borrowed Equipments' ? 'equipment' : 'apparatus'}.`
    setTimeout(() => {
      errorMessage.value = null
    }, 2000)
    return
  }

  try{
    const endpoint = currentTab.value === 'Borrowed Equipments' 
      ? `equipment-instances/${selectedInstanceId.value}/return/`
      : `apparatus-instances/${selectedInstanceId.value}/return/`
    
      await axios.post(`/api/${endpoint}`, {
        condition: condition.value,
        remarks: remarks.value
      }, {
        headers: {  
          'Authorization': `Token ${store.state.token}`
        }
      })
      successMessage.value = `${currentTab.value === 'Borrowed Equipments' ? 'Equipment' : 'Apparatus'} returned successfully.`
      showReturnForm.value = false
      fetchBorrowedList()
      setTimeout(() => {
        resetForm()
      }, 2000)
  }catch(err){
    errorMessage.value = err.message
    setTimeout(() => {
      errorMessage.value = null
    }, 2000)
  }
}

const resetForm = () => {
  condition.value = ''
  remarks.value = ''
  currentCondition.value = ''
  selectedInstanceId.value = null
  showReturnForm.value = false
  successMessage.value = null
  errorMessage.value = null
}
  
const closeReturnForm = () => {
  resetForm()
}

watch([currentTab, searchQuery], () => {
  currentPage.value = 1;
  fetchBorrowedList()
});

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const handleSidebarToggle = (isOpen) => {
    isSidebarOpen.value = isOpen;
};

const goBack = () => {
  router.back()
}

const getConditionClass = (condition) => {
  switch (condition.toLowerCase()) {
    case 'good':
      return 'text-green-600';
    case 'fair':
      return 'text-yellow-600';
    case 'poor':
      return 'text-orange-600';
    case 'damaged':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true  
  };
  return date.toLocaleString('en-US', options);  
};

onMounted(() => {
  fetchBorrowedList()

  isSidebarOpen.value = window.innerWidth >= 1024;

  const storedTab = localStorage.getItem('currentTab')
  if (storedTab && !tabs.value.includes(storedTab)) {
      currentTab.value = tabs.value[0]
      localStorage.setItem('currentTab', currentTab.value)
}
});
</script>
