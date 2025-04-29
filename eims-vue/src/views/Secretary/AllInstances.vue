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

        <h1 class="text-3xl font-bold mb-6 text-gray-800">Item List</h1>
        
        <div class="mb-4 flex items-center space-x-4 justify-between">
            <div class="flex items-center space-x-4 flex-grow">
                <input
                v-model="searchQuery"
                type="text"
                placeholder="Search instances..."
                class="border border-gray-300 rounded py-2 px-4 "
                />

              <div class="relative">
                  <select 
                      v-model="selectedCategory" 
                      class="border border-gray-300 rounded py-2 px-4 w-screen md:w-auto"
                  >
                    <option :value=null>All Categories</option>
                    <option 
                        v-for="category in categories" 
                        :key="category.id" 
                        :value="category.id"
                    >
                        {{ category.name }} 
                    </option>
                  </select>
              </div>
              <div class="relative">
                  <select 
                      v-model="selectedValue" 
                      class="border border-gray-300 rounded py-2 px-4 w-screen md:w-auto"
                  >
                      <option :value=null>All Values</option>
                      <option value="high">High Value (≥5000)</option>
                      <option value="low">Low Value (≤4999)</option>
                  </select>
              </div>
            </div>
        </div>

        <div v-if="loading" class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <div v-if="instances.length === 0 " class="text-center text-gray-500 text-lg my-8">
          No instances found
        </div>
        <div v-else-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
          <p class="font-bold">Error</p>
          <p>{{ error }}</p>
        </div>

        <!-- Instances Table -->
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
                <th v-for="header in tableHeaders" 
                    :key="header" 
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr 
                v-for="instance in instances" 
                :key="instance.id" 
                @click="navigateToItemDetails(instance.id)"
                class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer">
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-900">
                    ₱ {{ Number(instance.unit_cost).toLocaleString() }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm font-medium text-gray-900">
                    {{ instance.item.name }} 
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ instance.item.description }}
                  </div>
                  <div class="text-sm text-gray-900" @click.stop>
                   SN#: {{ instance.serial_number ? instance.serial_number : 'None' }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-900">
                    {{ instance.quantity }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-xs text-gray-900">
                    {{ instance.inventory_number }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <span :class="[
                    getConditionClass(instance.current_condition),
                    'text-sm'
                  ]">
                    {{ instance.current_condition }}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <div class="text-xs text-gray-900">
                    {{ instance?.purchase_date ? formatDate(instance.purchase_date) : 'None' }}
                  </div>
                </td>
                <td class="px-4 py-4">
                    <div class="grid grid-cols-2 gap-42">
                        <div>
                        <div v-if="instance.item.item_type === 'Consumables'" class="text-xs text-gray-500 uppercase mb-1">Distributed to</div>
                        <div v-else class="text-xs text-gray-500 uppercase mb-1">Current borrower</div>
                        <div :class="[
                            getBorrowedStatusClass(instance.current_borrow_record),
                            'text-xs mb-1'
                        ]">
                            {{ getBorrowerStatus(instance, 'current') }}
                        </div>
                        <div v-if="instance.current_borrow_record" class="text-xs text-gray-500">
                            <div>At: {{ formatDate(instance.current_borrow_record.borrow_date) }}</div>
                            <div>In: {{ instance.current_borrow_record.room }}</div>
                        </div>
                        </div>
                        <div>
                        <div v-if="instance.item.item_type === 'Consumables'" class="text-xs text-gray-500 uppercase mb-1">Last Distributed to</div>
                        <div v-else class="text-xs text-gray-500 uppercase mb-1">Last borrower</div>
                        <div :class="[
                            getBorrowedStatusClass(instance.last_borrow_record, true),
                            'text-xs'
                        ]">
                            {{ getBorrowerStatus(instance, 'last') }}
                        </div>
                        <div v-if="instance.last_borrow_record" class="text-xs text-gray-500">
                            <div>At: {{ formatDate(instance.last_borrow_record.return_date) }}</div>
                            <div>In: {{ instance.last_borrow_record.room }}</div>
                        </div>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-4" @click.stop v-if="userType === 'Secretary'">
                  <div class="flex space-x-1.5">
                    <button 
                      @click="editInstance(instance)"  
                      class="text-blue-500 hover:text-blue-800 border border-blue-300 rounded-full p-1 flex items-center justify-center w-7 h-7"
                    >
                      <i class="pi pi-pencil" style="font-size: 14px"></i>
                    </button>
                    <button 
                      @click.stop="handleDeleteClick(instance.id)" 
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
    
    <!-- <CartSummary
        :items="cartStore.cartItems"
        @remove-item="removeFromCart"
        @open-borrow="showBorrowModal = true"
    /> -->

    <ConfirmButton
        v-model:visible="showDialog"
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        @confirm="confirmDelete"
        @cancel="handleCancel"
      />

    <div v-if="showBarcodePopup" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="closeBarcodePopup">
      <transition name="fade">
        <div class="bg-white p-4 rounded-lg" @click.stop>
          <img :src="currentBarcode" alt="Barcode" class="max-w-full h-auto" />
          <button @click="closeBarcodePopup" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            Close
          </button>
        </div>
      </transition>
    </div>

    <div v-if="showBorrowModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-8 rounded-lg max-w-md w-full">
          <h2 class="text-2xl font-bold mb-4">Finalize Borrowing</h2>
          <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="user">
                  Select Borrower (Optional)
              </label>
              <select v-model="selectedUser" id="user" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                :disabled="!!customBorrower"
                :class="{ 'bg-gray-100': !!customBorrower }"
              >   
                  <option value="">Select Borrower</option>
                  <option v-for="user in users" :key="user.id" :value="user.id" >{{ user.first_name }} {{ user.last_name }} </option> 
              </select>
          </div>
          <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="room">
                  Custom Borrower
              </label>
              <input v-model="customBorrower" id="room" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                placeholder="Enter custom borrower name"
                :disabled="!!selectedUser"
                :class="{ 'bg-gray-100': !!selectedUser }"
              >
          </div>
          <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="room">
                  Select Room
              </label>
              <select v-model="selectedRoom" id="room" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                  <option v-for="room in rooms" :key="room.id" :value="room.id">{{ room.name }}</option> 
              </select>
          </div>
          <div class="flex justify-end">
          <button @click="closeBorrowModal" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded mr-2">
              Cancel
          </button>
          <button @click="finalizeBorrowing" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
              Confirm Borrowing
          </button>
          </div>
      </div>
    </div>

    <div v-if="showUpdateForm" class="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 z-50">
      <UpdateInstancesFrom
        :instanceId="selectedInstance"
        @close="closeUpdateForm"
        @instance-updated="handleInstanceUpdated"
      />
    </div>
    
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, computed, watch} from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import Sidebar from '@/components/UserType/Sidebar.vue';
import { useItemCartStore } from '@/stores/newCart'
import CartSummary from './Modals/CartSummary.vue';
import PrimaryButton from '@/components/buttons/PrimaryButton.vue';
import UpdateInstancesFrom from './Forms/UpdateInstancesFrom.vue';
import ConfirmButton from '@/components/buttons/ConfirmButton.vue';

export default defineComponent({
  name: 'ItemInstances',
  components: { Sidebar, CartSummary,  PrimaryButton, UpdateInstancesFrom, ConfirmButton },
  props: {
    id: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const store = useStore()
    const router = useRouter();
    const errorMessage = ref(null);
    const successMessage = ref(null);
    const cartStore = useItemCartStore();
    const instances = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const tableHeaders = ['Unit Cost', 'Item Name', 'Quantity',  'Inventory Item No.', 'Condition', 'Purchase Date', 'Borrower Info', ' Actions'];
    const showBarcodePopup = ref(false);
    const currentBarcode = ref('');
    const showBorrowModal = ref(false);
    const showAddInstancesForm = ref(false);
    const selectedUser = ref('');
    const selectedRoom = ref('');
    const users = ref([]);
    const items = ref([]);
    const rooms = ref([]);
    const categories = ref([]);
    const searchQuery = ref('');
    const customBorrower = ref('');
    const selectedCategory = ref(null);
    const selectedValue = ref(null);
    const selectedInstance = ref(null);
    const showAddForm = ref(false);
    const isSidebarOpen = ref(true);
    const token = computed(() => store.state.token)
    const currentPage = ref(1);
    const totalPages = ref(0);
    const pageSize = ref(10);
    const showUpdateForm = ref(false);
    const itemToDelete = ref(null);
    const showDialog = ref(false);

    const userType = computed(() => store.state.userType);

    const editInstance = (instance) => {
      selectedInstance.value = instance.id;
      showUpdateForm.value = true;
    };

    const closeUpdateForm = () => {
      showUpdateForm.value = false
      selectedInstance.value = null
    }

    const handleInstanceUpdated = () => {
      fetchInstances();
      showUpdateForm.value = false;
    };

    const handleDeleteClick = (equipmentId) => {
      itemToDelete.value = equipmentId
      showDialog.value = true
    }

    const confirmDelete = async () => {
      if (itemToDelete.value) {
        try {
          await axios.delete(`/api/instances/${itemToDelete.value}/delete/`, {
              headers: { 'Authorization': `Token ${token.value}` }
          });
          successMessage.value = "Item instance deleted successfully."
          setTimeout(() => {
            successMessage.value = null
          } , 3000)
          fetchInstances();
        } catch (err) {
          console.error("Error deleting item:", err);
          error.value = "Failed to delete item. Please try again.";
        } finally {
          showDialog.value = false
          itemToDelete.value = null
        }
      }
    }

    const handleSidebarToggle = (isOpen) => {
      isSidebarOpen.value = isOpen;
      // Force layout recalculation
      window.requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
      });
    };

    onMounted(() => {
      fetchItemsAndUsersAndRooms();
      fetchInstances();
      
      window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) {
          isSidebarOpen.value = true;
        } else {
          isSidebarOpen.value = false;
        }
      });
    });

    const navigateToItemDetails = (itemId) => {
      router.push({ name: 'ItemInstancesDetail', params: { id: itemId } })
    }

    const goBack = () => {
      router.back();
    };

    const fetchItemsAndUsersAndRooms = async () => {
      try {
        const [itemsResponse, usersResponse, roomsResponse, categoriesResponse] = await Promise.all([
          axios.get('/api/items/', {
            headers: {
              'Authorization': `Token ${token.value}`,
            },
          }),
          axios.get('/api/user-list/', {
            headers: {
              'Authorization': `Token ${token.value}`,
            },
          }),
          axios.get('/api/room-list/', {
            headers: {
              'Authorization': `Token ${token.value}`,
            },
          }),
          axios.get('/api/category/', {
            headers: {
              'Authorization': `Token ${token.value}`,
            },
          }),
        ]);
        items.value = itemsResponse.data;
        users.value = usersResponse.data;
        rooms.value = roomsResponse.data;
        categories.value = categoriesResponse.data;
      } catch (err) {
        console.error('Error fetching items, users, rooms and categories:', err);
      }
    };


    const fetchInstances = async () => {
      try {
        const response = await axios.get('/api/instances/', {
          headers: {
            'Authorization': `Token ${token.value}`,
          },
          params: {
            page: currentPage.value,
            page_size: pageSize.value,
            search: searchQuery.value,
            category: selectedCategory.value || null,
            value_filter: selectedValue.value || null
          },
        });
        instances.value = response.data.results;

        totalPages.value = Math.ceil(response.data.count / pageSize.value);

      } catch (err) {
        error.value = "Failed to fetch item instances. Please try again.";
        console.error('Error fetching instances:', err);
      } finally {
        loading.value = false;
      }
    };

    watch([searchQuery, selectedCategory, selectedValue], () => {
      currentPage.value = 1;  
      fetchInstances();
    }, { immediate: true });
      
    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
        fetchInstances();
      }
    };

    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--;
        fetchInstances();
      }
    };

    const handleItemAdded = (newItem) => {
      fetchInstances();
      showAddForm.value = false;
    };


    const getConditionClass = (condition) => {
      switch (condition.toLowerCase()) {
        case 'good':
          return 'text-green-600';
        case 'fair':
          return 'text-yellow-600';
        case 'poor':
          return 'text-blue-600';
        case 'damaged':
          return 'text-red-600';
        default:
          return 'text-gray-600';
      }
    };

    const getBorrowedStatusClass = (borrowedBy, isLastBorrower = false) => {
        if (isLastBorrower) {
            return 'px-5 text-xs py-1 bg-blue-100 w-32 text-blue-800 rounded-full'; 
        }
        return borrowedBy
            ? 'px-5 py-1 bg-red-100 text-red-800 w-32 rounded-full' 
            : 'px-5 py-1 bg-green-100 text-green-800 w-32 rounded-full'; 
    };


    const getBorrowerStatus = (instance, type) => {
      if (type === 'current' && instance.current_borrow_record) {
        return `${instance.current_borrow_record.borrower}`;
      }
      if (type === 'last' && instance.last_borrow_record) {
        return `${instance.last_borrow_record.borrower} `;
      }
      return 'Available';
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    const openAddInstancesForm = () => {
      showAddInstancesForm.value = true;
    };

    const closeAddInstancesForm = () => {
      showAddInstancesForm.value = false;
    };

    const printBarcode = (barcodeUrl) => {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Barcode</title>
            <style>
              @page { size: 3in 2in; margin: 0; }
              body { 
                margin: 0; 
                padding: 0;
                display: flex; 
                justify-content: center; 
                align-items: center; 
                width: 3in; 
                height: 2in;
              }
              img { 
                max-width: 90%; 
                max-height: 90%; 
              }
            </style>
          </head>
          <body>
            <img src="${barcodeUrl}" alt="Barcode" />
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };

    const openBarcodePopup = (barcodeUrl) => {
      currentBarcode.value = barcodeUrl;
      showBarcodePopup.value = true;
    };

    const closeBarcodePopup = () => {
      showBarcodePopup.value = false;
      currentBarcode.value = '';
    };

    // New methods for cart functionality
    const addToCart = (instance) => {
  // For consumable items, check if quantity is above 0
    if (instance.item.item_type === 'Consumables') {
      if (instance.quantity > 0 && !cartStore.isInCart(instance.id)) {
        cartStore.addToCart(instance);
      }
    } else {
      // For non-consumable items, use existing logic
      if (!instance.current_borrow_record && !cartStore.isInCart(instance.id)) {
        cartStore.addToCart(instance);
      }
    }
  };

    const removeFromCart = (instanceId) => {
      cartStore.removeFromCart(instanceId);
    };

    const isInCart = (instanceId) => {
      return cartStore.isInCart(instanceId);
    };

    const finalizeBorrowing = async () => {
      if ( !selectedUser.value && !customBorrower.value) {
                errorMessage.value = 'Please select a user or provide a custom borrower';
                setTimeout(() => {
                    errorMessage.value = null;
                }, 5000);
                return;
            }
            if (!selectedRoom.value) {
                errorMessage.value = 'Please select a room';
                setTimeout(() => {
                    errorMessage.value = null;
                }, 5000);
                return;
            }
      try {
          const borrowData = {
              user_id: selectedUser.value || null,
              custom_borrower: customBorrower.value,
              room_id: selectedRoom.value,
              instances: cartStore.cartItems.map(item => ({
                  id: item.id,
                  quantity: item.requested_quantity || 1,
              })),

          };

          await axios.post('/api/manual-borrow/', borrowData);
          successMessage.value = 'Items borrowed successfully';

          setTimeout(() => {
              successMessage.value = null;
          }, 5000);

          cartStore.clearCart();
          closeBorrowModal();
          fetchInstances();

      } catch (err) {
          console.error('Error finalizing borrowing:', err);
          errorMessage.value = 'Error finalizing borrowing';

          setTimeout(() => {
              errorMessage.value = null;
          }, 5000);
      }
    };



    return {
      // states
      instances,
      loading,
      error,
      errorMessage,
      successMessage,
      totalPages,
      currentPage,
      pageSize,
      // table
      tableHeaders,
      // barcode
      showBarcodePopup,
      currentBarcode,
      // borrow
      showBorrowModal,
      selectedUser,
      selectedRoom,
      customBorrower,
      users,
      rooms,
      // add instances
      openAddInstancesForm,
      closeAddInstancesForm,
      // cart
      cartStore,
      // helpers
      getConditionClass,
      getBorrowedStatusClass,
      getBorrowerStatus,
      formatDate,
      printBarcode,
      openBarcodePopup,
      closeBarcodePopup,
      goBack,
      navigateToItemDetails,
      addToCart,
      removeFromCart,
      isInCart,
      finalizeBorrowing,
      // search
      searchQuery,
      // add instances form
      showAddInstancesForm,
      items,
      categories,
      showAddForm,
      // update form
      handleItemAdded,
      useItemCartStore,
      isSidebarOpen,
      handleSidebarToggle,
      // pagination
      nextPage,
      prevPage,
      // update form
      selectedCategory,
      selectedInstance,
      selectedValue,
      editInstance,
      closeUpdateForm,
      handleInstanceUpdated,
      // delete confirmation
      handleDeleteClick,
      itemToDelete,
      showDialog,
      confirmDelete,
      showUpdateForm,
      userType

      
    };
  }
});
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
.transition-all {
  will-change: margin-left;
}
</style>
