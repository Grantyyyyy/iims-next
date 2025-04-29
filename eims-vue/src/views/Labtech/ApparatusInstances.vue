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
            Apparatus Instances
          </h1>
          
          <div class="flex justify-between mb-4">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search instances..."
              class="border border-gray-300 rounded py-2 px-4"
            />
  
            <PrimaryButton @click="openAddInstancesForm" class="flex items-center" v-if ="userType === 'Lab Technician'">
              <template #icon>
                <i class="fas fa-plus mr-2"></i>
              </template>
              Add Instance
            </PrimaryButton>
          </div>
  
          <div v-if="loading" class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <div v-if="apparatuses.length === 0 " class="text-center text-gray-500 text-lg my-8">
            No instances found
          </div>
          <div v-else-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
            <p class="font-bold">Error</p>
            <p>{{ error }}</p>
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
                      v-for="instance in apparatuses" 
                      :key="instance.id" 
                      @click="navigateToItemDetails(instance)"
                      :class="[
                        'transition-colors duration-150 ease-in-out cursor-pointer',
                        instance.current_borrow_record || instance.current_condition === 'Damaged' ? 'opacity-50' : 'hover:bg-gray-50'
                      ]"
                  >
                    <td class="px-4 py-4">
                        <div class="text-sm text-gray-900">
                            ₱ {{ Number(instance.unit_cost).toLocaleString() }}
                        </div>
                    </td>
                    <td class="px-4 py-4">
                        <div class="text-sm text-gray-900">
                            {{ instance.quantity }} pc
                        </div>
                    </td>
                    
                    <td class="px-4 py-4"> 
                      <div class="text-sm font-medium text-gray-900">
                          {{ instance.apparatus.name }}
                      </div>
                      <div 
                          :title="instance.apparatus.description"
                          class="truncate max-w-xs text-sm text-gray-900"
                      >
                          {{ instance.apparatus.description }}
                      </div>
                      <div class="text-xs text-gray-500">
                          SN# {{ instance.serial_number ? instance.serial_number : 'None' }}
                      </div>
                      <div class="text-xs text-gray-500">
                          Useful Life: {{ instance.useful_life ? `${instance.useful_life} years` : 'None' }}
                      </div>
                    </td>
                    <td class="px-4 py-4"> 
                        <div class="text-xs font-medium text-gray-900">
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
                      <div class="text-sm font-medium text-gray-900">
                        {{ instance.purchase_date ? formatDate(instance.purchase_date) : 'None' }}
                      </div>
                    </td>
                    <td class="px-4 py-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                         <div v-if="instance.apparatus.apparatus_type === 'Consumables'" class="text-xs text-gray-500 uppercase mb-1">Distributed to</div>
                          <div v-else class="text-xs text-gray-500 uppercase mb-1">Current borrower</div>
                            <div :class="[
                                getBorrowedStatusClass(instance.current_borrow_record),
                                'text-xs mb-1'
                            ]">
                                {{ getBorrowerStatus(instance, 'current') }}
                            </div>
                                <div v-if="instance.current_borrow_record" class="text-xs text-gray-500">
                                    <div>At: {{ formatDate(instance.current_borrow_record.borrowed_date) }}</div>
                                    <div>In: {{ instance.current_borrow_record?.room }}</div>
                                </div>
                        </div>
                        <div>
                         <div v-if="instance.apparatus.apparatus_type === 'Consumables'" class="text-xs text-gray-500 uppercase mb-1">Last Distributed to</div>
                          <div v-else class="text-xs text-gray-500 uppercase mb-1">Last borrower</div>
                            <div :class="[
                                getBorrowedStatusClass(instance.last_borrowed_record, true),
                                'text-xs'
                            ]">
                                {{ getBorrowerStatus(instance, 'last') }}
                            </div>
                                <div v-if="instance.last_borrow_record" class="text-xs text-gray-500">
                                    <div>At: {{ formatDate(instance.last_borrow_record.returned_date) }}</div>
                                    <div>In: {{ instance.last_borrow_record?.room }}</div>
                                </div>
                        </div>
                    </div>
                </td>
                    <td class="px-4 py-4" @click.stop v-if="userType === 'Lab Technician'">
                      <div class="flex space-x-1">
                        <button
                            class="text-black-500 hover:text-black-800 border border-black-300 rounded-full p-1 flex items-center justify-center w-7 h-7" 
                            title="Add to Cart"
                            @click="addToCart(instance)"
                            :disabled="instance.apparatus.apparatus_type === 'Consumables' ? instance.quantity <= 0 : instance?.current_borrow_record || isInCart(instance.id)"
                            :class="{ 'opacity-50  cursor-not-allowed': instance.apparatus.apparatus_type === 'Consumables' ? instance.quantity <= 0 : instance?.current_borrow_record || isInCart(instance.id) }"
                        >
                            <i class="pi pi-shopping-cart" style="font-size: 14px"></i>
                        </button>
                        <button 
                          @click.stop="editInstance(instance)" 
                          class="text-blue-500 hover:text-blue-800 border border-blue-300 rounded-full p-1 flex items-center justify-center w-7 h-7"
                          :disabled="instance.current_borrow_record"
                          :class="{'opacity-50 cursor-not-allowed': instance.current_borrow_record}"
                          title="Edit Instance"
                        >
                          <i class="pi pi-pencil" style="font-size: 14px"></i>
                        </button>
                        <button 
                          @click.stop="handleDeleteClick(instance.id)" 
                          class="text-red-500 hover:text-red-800 border border-red-300 rounded-full p-1 flex items-center justify-center w-7 h-7"
                          :disabled="instance.current_borrow_record"
                          :class="{'opacity-50 cursor-not-allowed': instance.current_borrow_record}"
                          title="Delete Instance"
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

      <ApparatusCart
          v-if ="userType === 'Lab Technician'"
          :apparatus="cartStore.cartItems"
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
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        @confirm="confirmDelete"
        @cancel="handleCancel"
      />

      <UpdateApparatusInstances
        v-if="showUpdateForm"
        :apparatusId="selectedInstance"
        :preselectedApparatus="currentApparatusId"
        @close="closeUpdateForm"
        @instance-updated="handleInstanceUpdated"
      />
    
      <AddApparatusInstances
        v-if="showAddInstancesForm"
        :apparatus="apparatus"
        :preselectedApparatus="currentApparatusId"
        @close="closeAddInstancesForm"
        @instance-added="handleItemAdded"
      />
    </div>
  </template>
  
  <script>
  import { defineComponent, ref, onMounted, computed, watch} from 'vue';
  import axios from 'axios';
  import { useRouter } from 'vue-router';
  import { useStore } from 'vuex';
  import Sidebar from '@/components/UserType/Sidebar.vue';
  import { useApparatusCart } from '@/stores/borrowApparatus';
  import AddApparatusInstances from './Forms/AddApparatusInstances.vue';
  import UpdateApparatusInstances from './Forms/UpdateApparatusInstances.vue';
  import PrimaryButton from '@/components/buttons/PrimaryButton.vue';
  import ApparatusCart from './Modals/ApparatusCart.vue';
  import ConfirmButton from '@/components/buttons/ConfirmButton.vue';

  export default defineComponent({
    name: 'ApparatusInstances',
    components: { Sidebar, ApparatusCart, AddApparatusInstances,
       PrimaryButton, ConfirmButton, UpdateApparatusInstances
    },
    props: {
    apId:{
        type: String,
        required: true
      },
    },
    setup(props) {
      const store = useStore()
      const router = useRouter();
      const errorMessage = ref(null);
      const successMessage = ref(null);
      const cartStore = useApparatusCart();
      const loading = ref(true);
      const apparatus = ref([]);
      const error = ref(null);
      const tableHeaders = ['Unit Cost', 'Quantity', 'Item Name',  'Inventory Item No.', 'Condition', 'Purchased Date', 'Borrowing Info', 'Actions'];
      const visibleHeaders = computed(() => {
        if(userType.value === 'Dean' || userType.value === 'Staff'){
            return tableHeaders.filter(header => header !== 'Actions');
        }else{
            return tableHeaders;
        }
    })
      const selectedInstance = ref(null);
      const showUpdateForm = ref(false);
      const showBorrowModal = ref(false);
      const showAddInstancesForm = ref(false);
      const selectedUser = ref('');
      const selectedRoom = ref('');
      const selectedSubject = ref('');
      const borrowingPurpose = ref('');

      const users = ref([]);
      const apparatuses = ref([]);
      const rooms = ref([]);
      const subjects = ref([]);
      const searchQuery = ref('');
      const batches = ref([]);
      const customBorrower = ref('');
      const currentUser = computed(() => store.getters.user);
  
      const currentApparatusId = computed(() => props.apId);
      const showAddForm = ref(false);
      const isSidebarOpen = ref(true);
      const token = computed(() => store.state.token)
      
      const currentPage = ref(1);
      const totalPages = ref(0);
      const pageSize = ref(10);

      const userType = computed(() => store.state.userType);

      const itemToDelete = ref(null);
      const showDialog = ref(false);
  
      const handleSidebarToggle = (isOpen) => {
          isSidebarOpen.value = isOpen;
        };
  
      onMounted(() => {
        fetchItemsAndUsersAndRooms();
        fetchInstances();
        
        isSidebarOpen.value = window.innerWidth >= 1024;
      });
  
      const navigateToItemDetails = (instance) => {
        router.push({ name: 'apparatus-detail', params: { apId: instance.id.toString() } });
      }
  
      const goBack = () => { 
        router.back();
      };
  
      const fetchItemsAndUsersAndRooms = async () => {
        try {
          const [apparatusResponse, usersResponse, roomsResponse, subjectsResponse] = await Promise.all([
            axios.get('/api/apparatus/', {
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
            axios.get('/api/subject-list/', {
              headers: {
                'Authorization': `Token ${token.value}`,
              },
            }),
          ]);
          apparatus.value = apparatusResponse.data;
          users.value = usersResponse.data;
          rooms.value = roomsResponse.data.results;
          subjects.value = subjectsResponse.data;
        } catch (err) {
          console.error('Error fetching apparatus, users, and rooms:', err);
          error.value = "Failed to fetch apparatus, users, and rooms. Please try again.";
        }
      };
  
  
      const fetchInstances = async () => {
        try {
          const response = await axios.get(`/api/apparatus/${props.apId}/instances/`, {
            headers: {
                'Authorization': `Token ${token.value}`,
            },
            params: {
                page: currentPage.value,
                page_size: pageSize.value,
                search: searchQuery.value
            },
          });
          apparatuses.value = response.data.results || response.data;
          totalPages.value = Math.ceil(response.data.count / pageSize.value) || 1;
  
        } catch (err) {
          error.value = "Failed to fetch apparatus instances. Please try again.";
          console.error('Error fetching instances:', err);
        } finally {
          loading.value = false;
        }
      };

      const handleDeleteClick = (apparatusId) => {
        itemToDelete.value = apparatusId
        showDialog.value = true
      }

      const confirmDelete = async () => {
        if (itemToDelete.value) {
          try {
            await axios.delete(`/api/apparatus-instances/${itemToDelete.value}/delete/`, {
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

      const editInstance = (apparatus) => {
        selectedInstance.value = apparatus.id;
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
          return 'px-2 py-1 bg-blue-100 w-fit text-blue-800 rounded-full text-center'; // Last borrower
        }
        return borrowedBy
          ? 'px-2 py-1 bg-red-100  w-fit text-red-800 rounded-full text-center' // Currently borrowed
          : 'px-2 py-1 bg-green-100 w-fit text-green-800 rounded-full text-center'; // Available
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
  
      // New methods for cart functionality
      const addToCart = (instance) => {
      if (instance.apparatus.apparatus_type === 'Consumables') {
        if (instance.quantity > 0 && !cartStore.isInCart(instance.id)) {
          cartStore.addToCart(instance);
        }
      } else {
        if (!instance?.current_borrow_record && !cartStore.isInCart(instance.id)) {
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
                subject_id: selectedSubject.value,
                purpose: borrowingPurpose.value,
                apparatuses: cartStore.cartApparatus.map(apparatus => ({
                    id: apparatus.id,
                    quantity: apparatus.requested_quantity || 1,
                })),
  
            };
  
            await axios.post('/api/borrow-apparatus/', borrowData);
            successMessage.value = 'Apparatus borrowed successfully';
  
            setTimeout(() => {
              successMessage.value = null;
            }, 3000);
  
            cartStore.clearCart();
            closeBorrowModal();
            fetchInstances();
  
        } catch (err) {
            console.error('Error finalizing borrowing:', err);
            errorMessage.value = 'Error finalizing borrowing';
  
            setTimeout(() => {
                errorMessage.value = null;
            }, 3000);
        }
      };

      const filteredUsers = computed(() => {
        if (!currentUser.value) return [];
        return users.value.filter(user => 
          user.is_staff && 
          user.id !== currentUser.value.id  && 
          user.department && user.department.name === 'Marine Biology'
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
  
    
  
  
      return {
        loading,
        error,
        userType,
        errorMessage,
        successMessage,
        totalPages,
        currentPage,
        pageSize,
        tableHeaders,
        visibleHeaders,
        filteredUsers,
        currentUser,
        showBorrowModal,
        selectedUser,
        selectedRoom,
        selectedSubject,
        borrowingPurpose,
        customBorrower,
        users,
        rooms,
        subjects,
        apparatus,
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
        searchQuery,
        showAddInstancesForm,
        currentApparatusId,
        apparatuses,
        batches,
        showAddForm,
        handleItemAdded,
        useApparatusCart,
        isSidebarOpen,
        handleSidebarToggle,
        nextPage,
        prevPage,
        handleDeleteClick,
        confirmDelete,
        handleCancel,
        showDialog,
        itemToDelete,
        editInstance,
        closeUpdateForm,
        handleInstanceUpdated,
        showUpdateForm,
        selectedInstance,
        
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
  