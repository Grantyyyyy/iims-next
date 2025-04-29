<template>
    <div class="flex h-screen bg-gradient-to-b from-[#F5F4F1] to-[#D4EAF7]">
      <Sidebar />
      <div class="flex-1 overflow-x-auto p-8 ml-64 relative">
        <div class="max-w-full bg-white/80 backdrop-blur-md shadow-lg rounded-lg p-8">
  
          <button @click="goBack" class="flex items-center mb-6 text-gray-700 hover:text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
  
          <h1 class="text-3xl font-bold mb-6 text-gray-800">Item Instances</h1>
          
        <div class="flex justify-end mb-4">
            <button 
                @click="printAllBarcodes" 
                class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
                Print All Barcodes
            </button>

            <button 
              @click="openAddInstances" 
              class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 ml-4 px-4 rounded flex items-center">
              <i class="fas fa-layer-group mr-2"></i> Add Instances
            </button>

        </div>
  
          <!-- Loading and Error States -->
          <div v-if="loading" class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <div v-else-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
            <p class="font-bold">Error</p>
            <p>{{ error }}</p>
          </div>

          
  
          <!-- Instances Table -->
          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th v-for="header in tableHeaders" :key="header" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ header }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr 
                  v-for="instance in instances" 
                  :key="instance.id" 
                  @click="navigateToItemDetails(instance.id)"
                  class="hover:bg-gray-100 transition-colors duration-150 ease-in-out cursor-pointer">
                  <td class="px-6 py-4 whitespace-nowrap">
                    {{ instance.price }}
                  </td> 
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-blue-600 hover:text-blue-800 font-medium">
                      {{ instance.item.name }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {{ instance.serial_number }}
                  </td> 
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="getConditionClass(instance.current_condition)">
                      {{ instance.current_condition }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wider">Current borrower</h3>
                        <div :class="getBorrowedStatusClass(instance.borrowed_by)">
                          {{ getBorrowerStatus(instance, 'current') }}
                        </div>
                        <div v-if="instance.borrowed_by" class="text-xs text-gray-700 mt-1">
                          <div><strong>Since: </strong> {{ formatDate(instance.borrowed_at) }}</div>
                          <div><Strong>At: </Strong> {{ instance.current_location.name }}</div>
                        </div>
                      </div>
                      <div>
                        <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wider">Last borrower</h3>
                        <div :class="getBorrowedStatusClass(instance.last_borrowed_by, true)">
                          {{ getBorrowerStatus(instance, 'last') }}
                        </div>
                        <div v-if="instance.last_borrowed_by" class="text-xs text-gray-700 mt-1">
                          <div><strong>Since: </strong>: {{ formatDate(instance.last_borrowed_at) }}</div>
                          <div><strong>At: </strong> {{ instance.last_location.name }}</div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <img 
                      v-if="instance.barcode"
                      :src="instance.barcode" 
                      alt="Barcode" 
                      class="h-20 w-30 cursor-pointer transition-transform duration-300 ease-in-out transform hover:scale-110" 
                      @click.stop="openBarcodePopup(instance.barcode)"
                      aria-label="Click to view barcode"
                    />
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex flex-col space-y-2">
                      <button 
                        @click.stop="printBarcode(instance.barcode)" 
                        class="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150 ease-in-out"
                        aria-label="Print Barcode">
                        Print
                      </button>
                      <button 
                        @click.stop="addToCart(instance)" 
                        class="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 ease-in-out"
                        :disabled="instance.borrowed_by || isInCart(instance.id)"
                        :class="{ 'opacity-50 cursor-not-allowed': instance.borrowed_by || isInCart(instance.id) }"
                        aria-label="Add to Cart">
                        {{ isInCart(instance.id) ? 'In Cart' : 'Add to Cart' }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <CartSummary
        :items="cartStore.cartItems"
        @remove-item="removeFromCart"
        @open-borrow="showBorrowModal = true"
      />
  
      <!-- Barcode Popup -->
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
  
      <!-- Borrow Modal -->
      <BorrowModal 
        v-if="showBorrowModal"
        :show="showBorrowModal"
        :users="users"
        :rooms="rooms"
        @close="closeBorrowModal"
        @borrow-success="handleBorrowSuccess"
      />

      <div v-if="showAddInstanceForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <InstancesForm 
          :items="items"
          :preselectedItem="currentItemId"
          @close="closeAddInstances"
          @instance-added="handleInstanceAdded"
        />
      </div>
    </div>
  </template>
  
  <script>
  import { defineComponent, ref, onMounted, computed } from 'vue';
  import axios from 'axios';
  import { useRouter } from 'vue-router';
  import Sidebar from '@/components/UserType/Sidebar.vue';

  
  import BatchForm from './Forms/BatchForm.vue';
  import CartSummary from './Modals/CartSummary.vue';
  import BorrowModal from './Modals/BorrowModal.vue';
  import { useCartStore } from '@/stores/cartStore';
  import InstancesForm from './Forms/InstancesForm.vue';
;
  
  
  export default defineComponent({
    name: 'ItemInstances',
    components: { Sidebar, InstancesForm, CartSummary, BorrowModal },
    props: {
      id: {
        type: String,
        required: true
      }
    },
    setup(props) {
      const router = useRouter();
      const cartStore = useCartStore();
      const instances = ref([]);
      const loading = ref(true);
      const error = ref(null);
      const tableHeaders = ['Unit Cost', 'Item Name', 'Serial Number', 'Condition', 'Borrower Info', 'Barcode', 'Actions'];
      const showBarcodePopup = ref(false);
      const currentBarcode = ref('');
      const showBorrowModal = ref(false);
      const selectedUser = ref('');
      const selectedRoom = ref('');
      const items = ref([]);
      const users = ref([]);
      const rooms = ref([]);
      const showAddInstanceForm = ref(false);
      const batches = ref([]);
      const currentItemId = computed(() => props.id); 
  
      
  
      onMounted(() => {
        fetchUsers();
        fetchRooms();
        fetchInstances();
        fetchBatches();
        fetchItems();
      });
  
      const navigateToItemDetails = (itemId) => {
        router.push({ name: 'ItemInstancesDetail', params: { id: itemId } })
      }
  
      const goBack = () => {
        router.back();
      };
  

      const fetchBatches = async () => {
      try {
        const response = await axios.get('/api/ictc-batch/');
        batches.value = response.data;
      } catch (error) {
        console.error('Error fetching batches:', error);
      }
    };

      const fetchItems = async () => {
        try {
          const response = await axios.get('/api/ictc-item/');
          items.value = response.data;
        } catch (error) {
          console.error('Error fetching items:', error);
        }
      };

      const currentItemBatches = computed(() => {
        return batches.value.filter(batch => batch.item.id === parseInt(currentItemId));
      });

      const fetchInstances = async () => {
      loading.value = true;
      error.value = null;
      try {
        const response = await axios.get(`/api/ictc-item/${props.id}/instances/`);
        instances.value = response.data;
      } catch (err) {
        error.value = 'Failed to fetch instances. Please try again.';
        console.error('Error fetching instances:', err);
      } finally {
        loading.value = false;
      }
    };
  
      const getConditionClass = (condition) => {
        switch (condition.toLowerCase()) {
          case 'good':
            return 'text-green-600 font-semibold';
          case 'fair':
            return 'text-yellow-600 font-semibold';
          case 'poor':
            return 'text-blue-600 font-semibold';
          case 'damaged':
            return 'text-red-600 font-semibold';
          default:
            return 'text-gray-600 font-semibold';
        }
      };
  
      const getBorrowedStatusClass = (borrowedBy, isLastBorrower = false) => {
        const classes = 'px-2 inline-flex text-sm leading-5 font-semibold rounded-full';
        if (isLastBorrower) {
          return `${classes} bg-blue-100 text-blue-800`; // Last borrower blue
        }
        return borrowedBy
          ? `${classes} bg-red-100 text-red-800` // Currently borrowed
          : `${classes} bg-green-100 text-green-800`; // Available
      };
  
      const getBorrowerStatus = (instance, type) => {
        if (type === 'current' && instance.borrowed_by) {
          return `${instance.borrowed_by.first_name} ${instance.borrowed_by.last_name}`;
        }
        if (type === 'last' && instance.last_borrowed_by) {
          return `${instance.last_borrowed_by.first_name} ${instance.last_borrowed_by.last_name}`;
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
        if (!instance.borrowed_by && !cartStore.isInCart(instance.id)) {
          cartStore.addToCart(instance);
        }
      };
  
      const removeFromCart = (instanceId) => {
        cartStore.removeFromCart(instanceId);
      };
  
      const isInCart = (instanceId) => {
        return cartStore.isInCart(instanceId);
      };
  
      const finalizeBorrowing = async () => {
        if (!selectedUser.value || !selectedRoom.value) {
          alert('Please select a user and a room');
          return;
        }
  
        try {
          const borrowData = {
            user_id: selectedUser.value,
            room_id: selectedRoom.value,
            instances: cartStore.cartItems.map(item => item.id)
          };
  
          await axios.post('/api/manual-borrow/', borrowData);
          alert('Items borrowed successfully');
          cartStore.clearCart();
          closeBorrowModal();
          fetchInstances(); // Refresh the instances list
        } catch (err) {
          console.error('Error finalizing borrowing:', err);
          alert('Failed to borrow items. Please try again.');
        }
      };
  
      const openBorrowModal = () => {
        showBorrowModal.value = true;
      };
  
      const closeBorrowModal = () => {
        showBorrowModal.value = false;
        selectedUser.value = '';
        selectedRoom.value = '';
      };
  
      const fetchUsers = async () => {
        try {
          const response = await axios.get('/api/user-list/');
          users.value = response.data;
        } catch (err) {
          console.error('Error fetching users:', err);
        }
      };
  
      const fetchRooms = async () => {
        try {
          const response = await axios.get('/api/room-list/');
          rooms.value = response.data;
        } catch (err) {
          console.error('Error fetching rooms:', err);
        }
      };

      const printAllBarcodes = () => {
  if (instances.value.length === 0) {
    alert("No instances available to print.");
    return;
  }

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
        <html>
      <head>
        <title>Print Barcodes</title>
        <style>
          @page { size: auto; margin: 0; }
          body { 
            margin: 0; 
            padding: 20px;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 10px;
            justify-items: center;
            align-items: center;
          }
          .barcode-container {
            width: 150px;
            height: 100px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            border: 1px solid #ccc;
            padding: 10px;
            box-sizing: border-box;
          }
          img { 
            width: 100%;
            height: auto;
            max-height: 80px;
          }
          .barcode-text {
            margin-top: 5px;
            font-size: 12px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        ${instances.value.map(instance => `
          <div class="barcode-container">
            <img src="${instance.barcode}" alt="Barcode for ${instance.item.name}" />
            <div class="barcode-text">${instance.item.name}</div>
          </div>
        `).join('')}
      </body>
    </html>

  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
};

    const openAddInstances = () => {
      showAddInstanceForm.value = true;
    };

    const closeAddInstances = () => {
      showAddInstanceForm.value = false;
    };

    const handleInstanceAdded = (newInstancesData) => {
      instances.value.push(newInstancesData);
      fetchInstances();
      closeAddInstances();
    };


      return {
        instances,
        loading,
        error,
        tableHeaders,
        showBarcodePopup,
        currentBarcode,
        showBorrowModal,
        selectedUser,
        selectedRoom,
        users,
        rooms,
        cartStore,
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
        openBorrowModal,
        closeBorrowModal,
        finalizeBorrowing,
        printAllBarcodes,

        showAddInstanceForm,
        openAddInstances,
        closeAddInstances,
        handleInstanceAdded,
        batches,
        currentItemBatches,
        fetchBatches,
        fetchUsers,
        fetchRooms,
        fetchInstances,
        currentItemId,
        items,
        useCartStore
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
  </style>
  