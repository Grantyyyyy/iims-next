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
  
  
  
          <h1 class="text-3xl font-bold mb-6 text-gray-800">Recently Returned </h1>
  
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
          <div v-else-if="currentTab === 'Returned Items' && itemReturned.length === 0" class="text-center text-gray-500 text-lg my-8">
            No Returned Items found.
          </div>
          <div v-else-if="currentTab === 'Returned Equipments' && equipmentReturned.length === 0" class="text-center text-gray-500 text-lg my-8">
            No Returned Equipments found.
          </div>
          <div v-else-if="currentTab === 'Returned Apparatus' && apparatusReturned.length === 0" class="text-center text-gray-500 text-lg my-8">
            No Returned Apparatus found.
          </div>

          <!-- Borrowed Table -->
          <div v-else class="overflow-x-auto">
            <div v-if="successMessage" class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded" role="alert">
              <p class="font-bold">Success</p>
              <p>{{ successMessage }}</p>
            </div>

            <ReturnedItems
              v-if="currentTab === 'Returned Items'"
              :itemReturned="itemReturned"
              :itemHeaders="itemHeaders"
              :getConditionClass="getConditionClass"
              :formatDate="formatDate"
            />

            <ReturnedEquipments
              v-if="currentTab === 'Returned Equipments'"
              :equipmentReturned="equipmentReturned"
              :equipmentHeaders="equipmentHeaders"
              :getConditionClass="getConditionClass"
              :formatDate="formatDate"
              :userType="userType"
            />

            <ReturnedApparatus
              v-if="currentTab === 'Returned Apparatus'"
              :apparatusReturned="apparatusReturned"
              :apparatusHeaders="apparatusHeaders"
              :getConditionClass="getConditionClass"
              :formatDate="formatDate"
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
    </div>
  </template>
  
  
<script>
import { defineComponent, ref, onMounted, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import axios from 'axios'
import Sidebar from '../../components/UserType/Sidebar.vue'
import ReturnedApparatus from '../Labtech/ReturnedApparatus.vue'
import ReturnedEquipments from '../Labtech/ReturnedEquipments.vue'
import ReturnedItems from '../Secretary/Modals/ReturnedItems.vue'

  
  
  export default defineComponent({
    name: 'AllBorrowedList',
    components: {
      Sidebar, ReturnedEquipments, ReturnedApparatus, ReturnedItems
  
    },
    setup() {
      const router = useRouter()
      const store = useStore()
      const itemReturned = ref([])
      const equipmentReturned = ref([])
      const apparatusReturned = ref([])
      const loading = ref(true)
      const errorMessage = ref(null)
      const successMessage = ref(null)
      const userType = computed(() => store.state.userType)
      const userData = computed(() => store.state.user || {})
      const showReturnForm = ref(false)
      const isSidebarOpen = ref(true)
      const selectedInstanceId = ref(null)
      const currentCondition = ref('')
      const tabs = ref( ['Returned Items', 'Returned Equipments', 'Returned Apparatus'])
      if (userData.department === 'Marine Biology' || userType.value === 'Staff' || userType.value === 'Lab Technician') {
        tabs.value = tabs.value.filter(tab => tab !== 'Returned Items')
      }
      const currentTab = ref(localStorage.getItem('currentTab') || tabs.value[0])
      const error = ref(null)
      const searchQuery = ref('');
      const currentPage = ref(1);
      const totalPages = ref(0);
      const pageSize = ref(10);
      const isSubmitting = ref(false)
      const itemHeaders = ['Item', 'Quantity',  'Borrower', 'Condition on Return', 'Room', 'Borrow At', 'Return Date' , 'Remarks' ]
      const equipmentHeaders = ['Equipment', 'Quantity', 'Borrower', 'Condition', 'Subject', 'Borrowed At', 'Returned At', 'Remarks']
      const apparatusHeaders = ['Apparatus', 'Quantity', 'Borrower', 'Condition', 'Subject', 'Borrowed At', 'Returned At', 'Remarks']
      const condition = ref('')
      const notes = ref('')
      const remarks = ref('')
  

      const fetchReturnedList = async () => {
        try {
          const config = {
            headers: { Authorization: `Token ${store.state.token}` },
            params: {
              page: currentPage.value,
              page_size: pageSize.value,
              search: searchQuery.value
            }
          }
          
          if (currentTab.value === 'Returned Items') {
            const { data } = await axios.get('/api/returned-items/', config)
            itemReturned.value = data.results
            totalPages.value = Math.ceil(data.count / pageSize.value) || 1
          } 
          else if (currentTab.value === 'Returned Equipments') {
            const { data } = await axios.get('/api/returned-equipment-list/', config)
            equipmentReturned.value = data
            totalPages.value = Math.ceil(data.count / pageSize.value) || 1
          }
          else if (currentTab.value === 'Returned Apparatus') {
            const { data } = await axios.get('/api/returned-apparatus/', config)
            apparatusReturned.value = data
            totalPages.value = Math.ceil(data.count / pageSize.value) || 1
          }
        } catch (err) {
          error.value = err.message
        } finally {
          loading.value = false
        }
      }

  
      watch([currentTab, searchQuery], () => {
        currentPage.value = 1;
        fetchReturnedList()
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
        fetchReturnedList()
  
        isSidebarOpen.value = window.innerWidth >= 1024;

        const storedTab = localStorage.getItem('currentTab')
        if (storedTab && !tabs.value.includes(storedTab)) {
            currentTab.value = tabs.value[0]
            localStorage.setItem('currentTab', currentTab.value)
        }
      })
  
      return {
        error,
        itemReturned,
        equipmentReturned,
        apparatusReturned,

        condition,
        notes,
        remarks,
        currentCondition,
        isSubmitting,

        loading,
        errorMessage,
        successMessage,

        itemHeaders,
        equipmentHeaders,
        apparatusHeaders,

        userType,
        userData,
        selectedInstanceId,
        searchQuery,
        goBack,
        isSidebarOpen,
        handleSidebarToggle,
        tabs,
        currentTab,
        getConditionClass,
        formatDate,
        currentPage,
        totalPages,
        pageSize,
        nextPage,
        prevPage
        
      }
    }
  })
  </script>
  
  