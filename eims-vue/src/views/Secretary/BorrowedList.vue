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

        <h1 class="text-3xl font-bold mb-6 text-gray-800">Borrowed Items</h1>

        <div class="flex items-center mb-4 mr-4">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search..."
            class="border border-gray-300 rounded py-2 px-4"
          />
        </div>

        <!-- Loading and Error States -->
        <div v-if="loading" class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <div v-else-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
          <p class="font-bold">Error</p>
          <p>{{ error }}</p>
        </div>
        <div v-else-if="borrowed.length === 0" class="text-center text-gray-500 text-lg my-8">
          No borrowed items found.
        </div>

        <!-- Borrowed Items Table -->
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
              <tr v-for="borrow in borrowed" :key="borrowed.id" 
                  :class="{'bg-gray-50': index % 2 === 0}"
                  class="hover:bg-gray-100 transition-colors duration-150 ease-in-out">
                <td class="px-4 py-4">
                  <div class="text-sm font-medium text-gray-900">
                    {{ borrow.item_instance.item.name }}
                  </div>
                  <div class="text-sm text-gray-500"> 
                    {{ borrow.item_instance.inventory_number }}
                  </div>
                  <div class="text-sm text-gray-500"> 
                    {{ borrow.item_instance.serial_number }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="px-5 text-xs py-1 bg-green-100 w-fit text-green-800 rounded-full" >
                    {{ borrow.item_instance.current_borrow_record.borrower }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <span :class="[
                      getConditionClass(borrow.item_instance.current_condition), 
                      'text-sm font-medium px-3 py-1 rounded-full'
                      ]">
                        {{ borrow.item_instance.current_condition }}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm font-medium text-gray-900">
                    {{ borrow.room.name }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm font-medium text-gray-900">
                    {{ formatDate(borrow.borrow_date) }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm font-medium text-gray-900">
                    {{ borrow.duration }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm font-medium text-gray-900">
                    {{ borrow.purpose }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700" v-if="userType === 'Secretary'">
                  <button @click="openReturnForm(borrow.item_instance.id)" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center">
                    <i class="fas fa-undo-alt mr-2"></i> Return
                  </button>
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

    <div v-if="showReturnForm">
      <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
        <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-xl">
          <h2 class="text-xl font-bold mb-4">Return Item</h2>
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
                v-model="notes"
                id="notes"
                rows="3"
                class="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add notes about the item's condition..."
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

    <!-- Return Form Modal -->
    <!-- <ReturnForm
      v-if="showReturnForm" 
      :instanceId="selectedInstanceId" 
      @close="closeReturnForm" 
      @itemReturned="fetchBorrowedItems"
    /> -->
  </div>
</template>


<script>
import { defineComponent, ref, onMounted, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import axios from 'axios'
import Sidebar from '../../components/UserType/Sidebar.vue'
// import ReturnForm from './ReturnForm.vue'

export default defineComponent({
  name: 'BorrowedList',
  components: {
    Sidebar,
    // ReturnForm
  },
  setup() {
    const router = useRouter()
    const store = useStore()
    const borrowed = ref([])
    const loading = ref(true)
    const successMessage = ref(null)
    const error = ref(null)
    const userType = computed(() => store.state.userType)
    const showReturnForm = ref(false)
    const isSidebarOpen = ref(true)
    const selectedInstanceId = ref(null)
    const currentCondition = ref('')
    const tableHeaders = ['Item',  'Borrower', 'Condition', 'Room', 'Borrowed At', 'Duration', 'Purpose', 'Actions']
    const visibleHeaders = computed(() => {
        if(userType.value === 'Dean' || userType.value === 'Staff'){
            return tableHeaders.filter(header => header !== 'Actions');
        }else{
            return tableHeaders;
        }
    })
    const notes = ref('')
    const condition = ref('')
    const searchQuery = ref('');


    const currentPage = ref(1);
    const totalPages = ref(0);
    const pageSize = ref(10);

    const fetchBorrowedItems = async () => {
      try {
        const response = await axios.get('/api/borrowed-items/', {
          headers: {
            'Authorization': `Token ${store.state.token}`,
          },
          params: {
            page: currentPage.value,
            page_size: pageSize.value,
            search: searchQuery.value,
          },
        })
        borrowed.value = response.data.results || response.data;
        totalPages.value = Math.ceil(response.data.count / pageSize.value) || 1;

        loading.value = false
      } catch (err) {
        error.value = err.message
        loading.value = false
      }
    }

    watch([searchQuery], () => {
        currentPage.value = 1;  
        fetchBorrowedItems();
      }, { immediate: true });
        
    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
        fetchBorrowedItems();
      }
    };

    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--;
        fetchBorrowedItems();
      }
    };

    const submitReturn = async () => {
      if (!condition.value) {
        alert('Please select a condition before submitting.')
        return
      }

      try {
        const response = await axios.post(`/api/instances/${selectedInstanceId.value}/return/`, 
          { notes: notes.value,
            condition: condition.value
          },
          { headers: { 
            'Authorization': `Token ${store.state.token}`
          }}
        )
        successMessage.value = 'Item returned successfully.'
        setTimeout(() => {
          successMessage.value = null
        }, 3000)
        showReturnForm.value = false
        await fetchBorrowedItems()

      } catch (err) {
        console.error('Error returning item:', err)
        alert('Error returning item. Please try again.')
      }
    }

    const handleSidebarToggle = (isOpen) => {
        isSidebarOpen.value = isOpen;
      };

    const goBack = () => {
      router.back()
    }

    const openReturnForm = (instanceId) => {
      selectedInstanceId.value = instanceId

      const selectedItem = borrowed.value.find(item => 
        item.item_instance.id === instanceId)
        
        currentCondition.value = selectedItem.item_instance.current_condition
        condition.value = currentCondition.value
        showReturnForm.value = true
    }


    const closeReturnForm = () => {
      showReturnForm.value = false
      selectedInstanceId.value = null
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
      fetchBorrowedItems()

      isSidebarOpen.value = window.innerWidth >= 1024;
    })

    return {
      borrowed,
      loading,
      error,
      successMessage,
      formatDate,
      userType,
      showReturnForm,
      selectedInstanceId,
      openReturnForm,
      getConditionClass,
      closeReturnForm,
      fetchBorrowedItems,
      tableHeaders,
      visibleHeaders,
      goBack,
      isSidebarOpen,
      handleSidebarToggle,
      searchQuery,
      currentPage,
      totalPages,
      pageSize,
      nextPage,
      prevPage,
      submitReturn,
      notes,
      condition,
      
    }
  }
})
</script>
