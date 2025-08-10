<template>
  <div class="flex h-screen bg-gradient-to-b from-[#F5F4F1] to-[#D4EAF7]">
    <Sidebar @sidebarToggle="handleSidebarToggle" />
      <div 
        :class="[
          'flex-1 overflow-x-auto p-8 transition-all duration-300 ',
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

        <h1 class="text-3xl font-bold mb-6 text-gray-800">Chemical Stocks</h1>



        <div class="flex justify-between  mb-4">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search chemicals..."
            class="border border-gray-300 rounded py-2 px-4 "
          />

          <PrimaryButton @click="openAddStockModal" class="flex items-center" v-if="userType === 'Lab Technician'">
            <template #icon>
              <i class="fas fa-plus mr-2"></i>
            </template>
            Add stocks
          </PrimaryButton>
        </div>

        <div v-if="loading" class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <div v-else-if="stocks.length === 0" class="text-center text-gray-500 text-lg my-8">
            No chemicals stocks found.
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
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr 
                v-for="stock in stocks" 
                :key="stock.id" 
                :class="[
                  'transition-colors duration-150 cursor-pointer',
                  parseFloat(stock.volume) === 0 || new Date(stock.expiry_date) < new Date() ? 'opacity-50' : 'hover:bg-gray-50'
                ]"
              >   
                <!-- Chemical Name + Description + Status -->
                <td class="px-4 py-4">
                  <div class="text-sm font-medium text-gray-900">
                    {{ stock.chemical.name }} 
                  </div>
                  <div 
                    :title="stock.chemical.description"
                    class="truncate max-w-xs text-xs mb-1 text-gray-500"
                  >
                    {{ stock.chemical.description }}
                  </div>
                  <div v-if="parseFloat(stock.volume) === 0"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    <i class="fas fa-times-circle mr-1"></i>
                    No Available Left
                  </div>
                  <div v-else-if="parseFloat(stock.volume) < 10" 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                    <i class="fas fa-exclamation-circle mr-1"></i>
                    Low on Stock
                  </div>
                </td>

                <!-- Volume -->
                <td class="px-4 py-4">
                  <div class="text-sm"
                      :class="{ 'text-red-500': stock.volume === '0.00' }">
                    {{ formatVolume(stock.volume, stock.chemical.unit) }}
                  </div>
                </td>

                <!-- Unit -->
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-900">
                      {{ stock.chemical.unit }}
                  </div>
                </td>

                <!-- Price -->
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-900">
                    ₱ {{ Number(stock.price).toLocaleString() }}
                  </div>
                </td>

                <!-- Inventory Number -->
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-900">
                    {{ stock.inventory_number }}
                  </div>
                </td>

                <!-- Purchase Date -->
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-900">
                    {{ stock.purchase_date ? formatDate(stock.purchase_date) : 'None' }}
                  </div>
                </td>

                <!-- Expiry Date + Badge -->
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-900">
                    {{ formatDate(stock.expiry_date) }}
                  </div>
                  <div v-if="stock.expiry_date && new Date(stock.expiry_date) < new Date() && stock.volume !== 0" 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 mt-1">
                    <i class="fas fa-times-circle mr-1"></i>
                    Expired
                  </div>
                </td>

                <!-- Action: Add to Cart -->
                <td class="px-4 py-4" @click.stop v-if="userType === 'Lab Technician' ">
                  <div class="flex space-x-2">
                    <button 
                      @click="addToCart(stock)"
                      class="text-black-500 hover:text-black-800 border border-black-300 rounded-full p-1 flex items-center justify-center w-7 h-7"
                      title="Add to Cart"
                      :disabled="isInChemicalCart(stock.id) || stock.volume === '0.00'"
                      :class="{ 'opacity-50 cursor-not-allowed': isInChemicalCart(stock.id) || stock.volume === '0.00' || new Date(stock.expiry_date) < new Date() }"
                    > 
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      class="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        stroke-linecap="round" 
                        stroke-linejoin="round" 
                        stroke-width="2" 
                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                      />
                      
                    </svg>
                    <span v-if="isInChemicalCart(stock.id)" 
                      class="absolute -top-1 -right-1 bg-green-500 rounded-full w-3 h-3">
                    </span>
                    </button>
                    <button 
                        @click.stop="handleDeleteClick(stock.id)" 
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
    </div>
    <ChemicalCart
      v-if=" userType === 'Lab Technician'"
      :chemicals="chemicalCartStore.chemicals"
      :stocks="stocks"
      @remove-item="removeFromCart"
      @open-borrow="showBorrowModal = true"
    />

    <div v-if="showBorrowModal" class="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
        <h2 class="text-xl font-semibold mb-6">Complete Your Borrowing</h2>
        <div v-if="successMessage" class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded" role="alert">
          <p class="font-bold">Success</p>
          <p>{{ successMessage }}</p>
        </div>
        <div v-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
          <p class="font-bold">Error</p>
          <p>{{ error }}</p>
        </div>
        <form>
          <div class="mb-5">
            <label class="block text-gray-600 mb-2" for="user">
              User Selection
            </label>
            <select 
              v-model="selectedUser" 
              id="user" 
              class="block w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Choose a user</option>
              <option v-for="user in filteredUsers" :key="user.id" :value="user.id">
                {{ user.first_name }} {{ user.last_name }}
              </option>
            </select>
          </div>
          <div class="mb-5">
            <label class="block text-gray-600 mb-2" for="room">
              Sucbject Selection
            </label>
            <select 
              v-model="selectedSubject" 
              id="subject" 
              class="block w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Choose a subject</option>
              <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                {{ subject.name }}
              </option>
            </select>
          </div>
          <div class="mb-5">
            <label class="block text-gray-600 mb-2" for="room">
              Room Selection (Optional)
            </label>
            <select 
              v-model="selectedRoom" 
              id="room" 
              class="block w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Choose a room</option>
              <option v-for="room in rooms" :key="room.id" :value="room.id">
                {{ room.name }}
              </option>
            </select>
          </div>
          <div class="mb-5">
            <label class="block text-gray-600 mb-2" for="purpose">
              Borrowing Purpose
            </label>
            <textarea
              v-model="borrowingPurpose"
              id="purpose"
              placeholder="Describe the purpose of borrowing..."
              class="block w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            ></textarea>
          </div>
          <div class="flex justify-end">
            <button 
              @click="closeBorrowModal" 
              type="button"
              class="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded mr-3"
            >
              Cancel
            </button>
            <button 
              @click="finalizeBorrowing"
              type="button"
              :disabled="!selectedUser" 
              class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded"
              :class="{ 'opacity-50 cursor-not-allowed': !selectedUser }"
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>

    <ConfirmButton
      v-model:visible="showDialog"
      title="Delete Chemical Stock"
      message="Are you sure you want to delete this Chemical Stock?"
      @confirm="confirmDelete"
      @cancel="handleCancel"
    />

    <AddStock
      v-if = showAddStockForm
      :chemicals="chemicals"
      :preselectedChemical="currentChemicalId"
      @close="closeAddStockModal"
      @stock-added="handleStockAdded"
    />
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import Sidebar from '@/components/UserType/Sidebar.vue';
import { useChemicalCart } from '@/stores/chemicalCart';
import ChemicalCart from './Modals/ChemicalCart.vue';
import PrimaryButton from '@/components/buttons/PrimaryButton.vue';
import AddStock from '../Labtech/Forms/AddStock.vue';
import ConfirmButton from '@/components/buttons/ConfirmButton.vue';

export default defineComponent({
  name: 'ChemicalStock',
  components: {
    Sidebar,
    ChemicalCart,
    PrimaryButton,
    AddStock,
    ConfirmButton
  },
  props: {
    id: {
      type: String,
      required: true
    },
    source: {
      type: String,
      default: 'chemical',
      validator: (value) => ['chemical', 'batch'].includes(value)
    }
  },
  setup(props) {
    const router = useRouter();
    const store = useStore()
    const successMessage = ref('');
    const stocks = ref([]);
    const chemicalCartStore = useChemicalCart();
    const token = computed(() => store.state.token)
    const loading = ref(true);
    const error = ref(null);
    const showBorrowModal = ref(false);
    const selectedUser = ref('');
    const selectedRoom = ref('');
    const selectedSubject = ref('');
    const borrowingPurpose = ref('');
    const users = ref([]);
    const rooms = ref([]);
    const subjects = ref([]);
    const chemicals = ref([]);
    const searchQuery = ref('');
    const isSidebarOpen = ref(false);
    const userType = computed(() => store.state.userType);
    const currentUser = computed(() => store.getters.user);
    const showDialog = ref(false)
    const itemToDelete  = ref(null)

    
    const tableHeaders = [ 'Chemical Name', 'Volume', 'Unit', 'Price', 'Inventory Number', 'Purchase Date', 'Expiry Date', 'Actions' ];
    const visibleHeaders = computed(() => {
      const userType = store.state.userType;
      return tableHeaders.filter(header => header !== 'Actions' || userType !== 'Dean');
    });
    
    const currentChemicalId = computed(() => props.id);
    const showAddStockForm = ref(false);

    const goBack = () => {
      router.back();
    };

    const openAddStockModal  = () => {
      showAddStockForm.value = true;
    };

    const closeAddStockModal = () => {
      showAddStockForm.value = false;
    };

    const handleStockAdded = async () => {
      await fetchStocksAndUsersAndRooms();
      closeAddStockModal();
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    const fetchChemicals = async () => {
      try {
        const response = await axios.get('/api/chemical/', {
          headers: {
            'Authorization': `Token ${store.state.token}`
          },
        });
        chemicals.value = response.data.results;
      } catch (err) {
        console.error('Error fetching chemicals:', err);
      } finally {
        loading.value = false;
      }
    };

    const fetchStocksAndUsersAndRooms = async () => {
      try {
        const [stocksResponse, usersResponse, roomsResponse, subjectsResponse] = await Promise.all([
          axios.get(`/api/chemical/${props.id}/stocks/`, {
            headers: {
              'Authorization': `Token ${store.state.token}`
            },
            params: {
              search: searchQuery.value
            }
          }),
          axios.get('/api/users/'),
          axios.get('/api/room-list/'),
          axios.get('/api/subject-list/'),
        ]);
        
        stocks.value = stocksResponse.data.response || stocksResponse.data;
        users.value = usersResponse.data;
        rooms.value = roomsResponse.data.results;
        subjects.value = subjectsResponse.data;
      } catch (err) {
        error.value = `Failed to fetch chemical instances, users, rooms and subjects. Please try again.`;
        console.error('Error fetching instances, users, rooms and subjects:', err);
      } finally {
        loading.value = false;
      }
    };

    watch(searchQuery, () => {
      fetchStocksAndUsersAndRooms();
    });

    const openBorrowModal = () => {
      showBorrowModal.value = true;
    };

    const closeBorrowModal = () => {
      showBorrowModal.value = false;
      selectedUser.value = '';
      selectedRoom.value = '';
      borrowingPurpose.value = '';
    };

    const formatVolume = (volume, unit) => {
      const v = parseFloat(volume);
       if (isNaN(v)) return volume;

       if (v % 1 === 0) `0 ${unit}`;

       return `${parseFloat(v.toFixed(3))} `;

    }


    const finalizeBorrowing = async () => {
      try {
        if (!selectedUser.value) throw new Error('Please select a user');
        
        // Use the getRequestPayload() method from the cart store
        const chemicalRequests = chemicalCartStore.getRequestPayload();
        
        if (!chemicalRequests.length) throw new Error('No chemicals selected for borrowing');
        
        const borrowRequest = {
          user_id: selectedUser.value,
          room_id: selectedRoom.value || null,
          subject_id: selectedSubject.value,
          purpose: borrowingPurpose.value || 'Laboratory Research',
          chemical_requests: chemicalRequests
        };

        await axios.post('/api/chemical-request/', borrowRequest);
        chemicalCartStore.clearChemicals();
        successMessage.value = 'Chemicals borrowed successfully!';
        setTimeout(() => {
          
            successMessage.value = null;
        }, 3000);
        closeBorrowModal();
        await fetchStocksAndUsersAndRooms();
      } catch (err) {
        console.error('Error finalizing borrowing:', err);
        error.value = err.response?.data?.error || err.message || 'Failed to borrow chemicals';
        alert(err.response?.data?.error || err.message || 'Failed to borrow chemicals');
      }
    };

    const handleDeleteClick = (chemicalId) => {
      itemToDelete.value = chemicalId
      showDialog.value = true
    }

    const confirmDelete = async () => {
      if (itemToDelete.value) {
        try {
          await axios.delete(`/api/stocks/${itemToDelete.value}/delete/`, {
              headers: { 'Authorization': `Token ${token.value}` }
          });
          successMessage.value = "Chemical stock deleted successfully."
          setTimeout(() => {
            successMessage.value = null
          } , 3000)
          fetchStocksAndUsersAndRooms();
        } catch (err) {
          console.error("Error deleting stock:", err);
          error.value = "Failed to delete stock. Please try again.";
        } finally {
          showDialog.value = false
          itemToDelete.value = null
        }
      }
    }



    const filteredUsers = computed(() => {
      if (!currentUser.value) return [];
      return users.value.filter(user => 
        user.is_staff && 
        user.id !== currentUser.value.id  && 
        user.department && user.department.name === 'Marine Biology'
      );
    });


    const isInChemicalCart = (stockId) => {
      return chemicalCartStore.chemicals.some(chemical => chemical.id === stockId);
    };

    const addToCart = (stock) => {
      if (!isInChemicalCart(stock.id)) {
        chemicalCartStore.addChemical(stock);
      }
    };

    const removeFromCart = (chemicalId) => {
      chemicalCartStore.removeChemical(chemicalId);
    };

    const handleSidebarToggle = (isOpen) => {
            isSidebarOpen.value = isOpen;
        };

    onMounted(async () => {
      await fetchStocksAndUsersAndRooms();
      await fetchChemicals();

      isSidebarOpen.value = window.innerWidth >= 1024;
    });

    return {
      stocks,
      chemicals,
      loading,
      successMessage,
      error,
      tableHeaders,
      visibleHeaders,
      goBack,
      formatDate,
      chemicalCartStore,
      addToCart,
      removeFromCart,
      showBorrowModal,
      isInChemicalCart,
      finalizeBorrowing,
      formatVolume,
      isSidebarOpen,
      selectedUser,
      selectedRoom,
      selectedSubject,
      borrowingPurpose,
      users,
      rooms,
      subjects,
      searchQuery,
      filteredUsers,
      currentUser,
      closeBorrowModal,
      finalizeBorrowing,
      openBorrowModal,
      handleSidebarToggle,
      openAddStockModal,
      closeAddStockModal,
      currentChemicalId,
      showAddStockForm,
      handleStockAdded,
      userType,
      handleDeleteClick,
      confirmDelete,
      itemToDelete,
      showDialog,



    };
  }
});
</script>