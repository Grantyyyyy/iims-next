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

        <h1 class="text-3xl font-bold mb-6 text-gray-800">
          {{ source === 'batch' ? 'Batch' : 'Item' }} Instances 
        </h1>
        
        <div class="flex justify-between mb-4">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search instances..."
            class="border border-gray-300 rounded py-2 px-4"
          />

          <div class="flex gap-2">
            <button 
              @click="printPage"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 ease-in-out"
            >
              <i class="fas fa-print mr-2"></i>
              Print All Barcodes
            </button>
            <PrimaryButton @click="openAddInstancesForm" class="flex items-center" v-if="userType === 'Secretary'">
              <template #icon>
                <i class="fas fa-plus mr-2"></i>
              </template>
              Add Items
            </PrimaryButton>
          </div>
        </div>

        <div v-if="loading" class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
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
                <th v-for="header in visibleHeaders" 
                    :key="header" 
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr 
                v-for="instance in filteredInstances" 
                :key="instance.id" 
                @click="navigateToItemDetails(instance.id)"
                :class="[
                    'transition-colors duration-150 ease-in-out cursor-pointer',
                    instance.current_borrow_record || instance.current_condition === 'Damaged' || instance.quantity === 0 ? 'opacity-50' : 'hover:bg-gray-50'
                  ]"
                >
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-900">
                    ₱ {{ Number(instance.unit_cost).toLocaleString() }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-900">
                    {{ instance.quantity }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm font-medium text-gray-900">
                    {{ instance.item.name }}
                  </div>
                  <div 
                      :title="instance.item.description"
                      class="truncate max-w-xs text-sm text-gray-900"
                    >
                      {{ instance.item.description }}
                    </div>
                  <div class="text-xs text-gray-500" @click.stop>
                   SN# {{ instance.serial_number ? instance.serial_number : 'N/A' }}
                  </div>
                  <div class="text-xs text-gray-500" @click.stop>
                   Useful Life: {{ instance.useful_life ? `${instance.useful_life} years` : 'None' }}
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
                    {{ instance.purchase_date ? formatDate(instance.purchase_date) : 'None' }}
                  </div>
                </td>
                <td class="px-4 py-4">
                    <div class="grid grid-cols-2 gap-4">
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
                      @click="addToCart(instance)" 
                      class="text-black-500 hover:text-blue-800 border border-black-300 rounded-full p-1 flex items-center justify-center w-7 h-7"
                      :disabled="(instance.item.item_type === 'Consumables' ? instance.quantity <= 0 : instance.current_borrow_record) || isInCart(instance.id)"
                      :class="{ 'opacity-50 cursor-not-allowed': (instance.item.item_type === 'Consumables' ? instance.quantity <= 0 : instance.current_borrow_record) || isInCart(instance.id) }"
                    >
                      <i class="pi pi-shopping-cart" style="font-size: 14px"></i> 
                    </button>
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
    
    <CartSummary
        v-if="userType === 'Secretary'"
        :items="cartStore.cartItems"
        @remove-item="removeFromCart"
        @open-borrow="showBorrowModal = true"
    />


    <div v-if="showBorrowModal" class="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
          <h2 class="text-xl font-semibold mb-6">Complete Your Borrowing</h2>
          
          <form>
            <div class="mb-5">
              <label class="block text-gray-600 mb-2" for="user">
                User Selection
              </label>
              <select 
                v-model="selectedUser" 
                id="user" 
                class="block w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                :disabled="!!customBorrower"
                :class="{ 'bg-gray-100': !!customBorrower }"
              >
                <option value="">Choose a user</option>
                <option v-for="user in filteredUsers" :key="user.id" :value="user.id">
                  {{ user.first_name }} {{ user.last_name }}
                </option>
              </select>
            </div>
            <div class="mb-5">
              <label class="block text-gray-600 mb-2" for="custom_borrower">
                Custom Borrower
              </label>
              <input
                type="text"
                v-model="customBorrower" 
                id="custom_borrower" 
                class="block w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter custom borrower name"
                :disabled="!!selectedUser"
                :class="{ 'bg-gray-100': !!selectedUser }"
                @keypress="preventNumberInput"
                @paste="preventNumberPaste"
              >
            </div>
            <div class="mb-5">
              <label class="block text-gray-600 mb-2" for="room">
                Room Selection
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
              <label class="block text-gray-600 mb-2" for="date">
                Borrow duration
              </label>
              <input
                type="number"
                v-model="borrowDuration"
                id="duration"
                placeholder="Enter number of days"
                class="block w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
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
                :disabled="!selectedUser && !customBorrower" 
                class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded"
                :class="{ 'opacity-50 cursor-not-allowed': !selectedUser && !customBorrower  }"
              >
                Confirm
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmButton
        v-model:visible="showDialog"
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        @confirm="confirmDelete"
        @cancel="handleCancel"
      />

      <AddInstances
        v-if="showAddInstancesForm"
        :items="items || []"
        :preselectedItem="currentItemId"
        :selectedItemDetails="selectedItemDetails"
        @close="closeAddInstancesForm"
        @instance-added="handleItemAdded"
      /> 

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
import AddInstances from './Forms/AddInstances.vue';
import PrimaryButton from '@/components/buttons/PrimaryButton.vue';
import UpdateInstancesFrom from './Forms/UpdateInstancesFrom.vue';
import ConfirmButton from '@/components/buttons/ConfirmButton.vue';

export default defineComponent({
  name: 'ItemInstances',
  components: { Sidebar, CartSummary, AddInstances, PrimaryButton,
    UpdateInstancesFrom, ConfirmButton
  },
  props: {
    id: {
      type: String,
      required: true
    },
    source: {
      type: String,
      default: 'item', // can be 'item' or 'batch'
      validator: (value) => ['item', 'batch'].includes(value)
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
    const tableHeaders = ['Unit Cost', 'Quantity',  'Item Name',  'Inventory Item No.', 'Condition', 'Purchase Date', 'Borrower Info', 'Actions'];
    const visibleHeaders = computed(() => {
        if(userType.value === 'Dean' || userType.value === 'Staff'){
            return tableHeaders.filter(header => header !== 'Actions');
        }else{
            return tableHeaders;
        }
    })
    const showBorrowModal = ref(false);
    const showAddInstancesForm = ref(false);
    const selectedUser = ref('');
    const selectedRoom = ref('');
    const borrowingPurpose = ref('');
    const borrowDuration = ref('');
    const users = ref([]);
    const items = ref([]);
    const rooms = ref([]);
    const searchQuery = ref('');
    const batches = ref([]);
    const customBorrower = ref('');
    const userType = computed(() => store.state.userType);
    const showUpdateForm = ref(false);
    const selectedInstance = ref(null);
    const selectedItemDetails = computed(() => {
      return items.value?.find(item => item.id === parseInt(props.id)) || null;
    });
    const currentUser = computed(() => store.getters.user);

    const currentItemId = computed(() => props.id);
    
    const showAddForm = ref(false);
    const isSidebarOpen = ref(true);
    const token = computed(() => store.state.token)
    const currentPage = ref(1);
    const totalPages = ref(0);
    const pageSize = ref(10);
    const itemToDelete = ref(null);
    const showDialog = ref(false);

    const handleSidebarToggle = (isOpen) => {
        isSidebarOpen.value = isOpen;
      };

    onMounted(() => {
      fetchItemsAndUsersAndRooms();
      fetchInstances();
      
      window.addEventListener('resize', handleWindowResize);

      handleWindowResize();
    });

    const handleWindowResize = () => {
      if (window.innerWidth >= 1024) {
        isSidebarOpen.value = true;
      } else {
        isSidebarOpen.value = false;
      }
    };

    // ✅ Block number key presses
    const preventNumberInput = (event) => {
      const char = String.fromCharCode(event.which)
      if (/\d/.test(char)) {
        event.preventDefault()
      }
    }

    // ✅ Block pasting numbers
    const preventNumberPaste = (event) => {
      const pasted = (event.clipboardData || window.clipboardData).getData('text')
      if (/\d/.test(pasted)) {
        event.preventDefault()
      }
    }
        

    const navigateToItemDetails = (itemId) => {
      router.push({ name: 'ItemInstancesDetail', params: { id: itemId } })
    }

    const goBack = () => {
      router.back();
    };

    const fetchItemsAndUsersAndRooms = async () => {
      try {
        const [itemsResponse, usersResponse, roomsResponse] = await Promise.all([
          axios.get('/api/items/', {
            headers: {
              'Authorization': `Token ${token.value}`,
            },
          }),
          axios.get('/api/users/', {
            headers: {
              'Authorization': `Token ${token.value}`,
            },
          }),
          axios.get('/api/room-list/', {
            headers: {
              'Authorization': `Token ${token.value}`,
            },
          }),
        ]);
        
        items.value = itemsResponse.data.results || itemsResponse.data;
        users.value = usersResponse.data;
        rooms.value = roomsResponse.data.results;;
      } catch (err) {
        console.error('Error fetching items, users, and rooms:', err);
      }
    };


    const fetchInstances = async () => {
      try {
        const response = await axios.get(`/api/items/${props.id}/instances/`, {
          headers: {
            'Authorization': `Token ${token.value}`,
          },
          params: {
            page: currentPage.value,
            page_size: pageSize.value,
            search: searchQuery.value,
          },
        });

        instances.value = response.data.results || response.data;
        totalPages.value = Math.ceil(response.data.count / pageSize.value);

      } catch (err) {
        error.value = "Failed to fetch item instances. Please try again.";
        console.error('Error fetching instances:', err);
      } finally {
        loading.value = false;
      }
    };

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

    watch(searchQuery, () => {
        currentPage.value = 1;  
        fetchInstances();
      });

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

    const handleCancel = () => {
      showDialog.value = false
      itemToDelete.value = null
    }


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
        return 'px-2 py-1 bg-blue-100 text-blue-800 rounded-full'; // Last borrower
      }
      return borrowedBy
        ? 'px-2 py-1 bg-red-100 text-red-800 rounded-full' // Currently borrowed
        : 'px-2 py-1 bg-green-100 text-green-800 rounded-full'; // Available
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

    const printPage = () => {
      const printWindow = window.open('', '_blank');
      const printContent = `
        <html>
          <head>
            <title>Print Barcodes</title>
            <style>
              @media print {
                @page {
                  size: A4;
                  margin: 0.5cm;
                }
              }
              body {
                margin: 0;
                padding: 1cm;
                font-family: Arial, sans-serif;
              }
              .barcode-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 0.3cm;
              }
              .item-name {
                font-weight: bold;
                font-size: 12px;
              }
              .item-model {
                font-size: 10px;
              }
              .barcode-item {
                border: 1px solid #ccc;
                padding: 0.3cm;
                text-align: center;
                break-inside: avoid;
                page-break-inside: avoid;
              }
              .barcode-info {
                margin-top: 0.2cm;
                font-size: 7px;
              }
              img {
              max-width: 90%;
              height: 80px;
              }
            </style>
          </head>
          <body>
            <div class="barcode-grid">
              ${filteredInstances.value.map(instance => `
                <div class="barcode-item">
                  <img src="${instance.barcode_url}" alt="Barcode ${instance.inventory_number}" />
                  <div class="barcode-info">
                    <div class="item-name"> ${instance.item.name}</div>
                    <div class="item-model">Model: ${instance.item.model}</div>
                    <div>Inventory Item No: ${instance.inventory_number}</div>
                    ${instance.serial_number ? `<div>Serial #: ${instance.serial_number}</div>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for images to load before printing
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };


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
              purpose: borrowingPurpose.value,
              duration: borrowDuration.value,
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

    const filteredUsers = computed(() => {
        if (!currentUser.value) return [];
        return users.value.filter(user => 
          user.is_staff && 
          user.id !== currentUser.value.id &&
          user.department?.name === 'Information Technology'
        );
    });


    const openBorrowModal = () => {
      showBorrowModal.value = true;
    };

    const closeBorrowModal = () => {
      showBorrowModal.value = false;
      selectedUser.value = '';
      customBorrower.value = '';
      selectedRoom.value = '';
    };

    

    const filteredInstances = computed(() => {
      if (!searchQuery.value) return instances.value;

      const query = searchQuery.value.toLowerCase();
      return instances.value.filter((instance) => {

        const item = instance.item;
        return (
          (item?.name?.toLowerCase().includes(query) || false) ||
          (item?.description?.toLowerCase().includes(query) || false) ||
          (instance.inventory_number.toLowerCase().includes(query) || false) ||
          (instance.serial_number?.toLowerCase().includes(query) || false) ||
          (String(instance.unit_cost)?.toLowerCase().includes(query) || false) ||
          (instance.current_condition?.toLowerCase().includes(query) || false)
        );
      });
    });


    return {
      instances,
      loading,
      error,
      errorMessage,
      successMessage,
      totalPages,
      currentPage,
      pageSize,
      tableHeaders,
      visibleHeaders,
      printPage,
      showBorrowModal,
      selectedUser,
      selectedRoom,
      borrowingPurpose,
      borrowDuration,
      customBorrower,
      userType,
      users,
      rooms,
      openAddInstancesForm,
      closeAddInstancesForm,
      cartStore,
      getConditionClass,
      getBorrowedStatusClass,
      getBorrowerStatus,
      formatDate,
      goBack,
      navigateToItemDetails,
      addToCart,
      removeFromCart,
      isInCart,
      openBorrowModal,
      closeBorrowModal,
      finalizeBorrowing,
      filteredInstances,
      searchQuery,
      showAddInstancesForm,
      currentItemId,

      preventNumberInput,
      preventNumberPaste,

      items,
      batches,
      showAddForm,
      handleItemAdded,
      useItemCartStore,
      isSidebarOpen,
      handleSidebarToggle,
      nextPage,
      prevPage,
      editInstance,
      closeUpdateForm,
      handleInstanceUpdated,
      showUpdateForm,
      selectedInstance,
      selectedItemDetails,
      confirmDelete,
      handleCancel,
      handleDeleteClick, 
      itemToDelete,
      showDialog,
      filteredUsers,
      currentUser

      
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

.icon-small {
  font-size: 14px;
}
.icon-medium {
  font-size: 18px;
}
.icon-large {
  font-size: 22px;
}
</style>
