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
  
          <h1 class="text-3xl font-bold mb-6 text-gray-800">Equipment Instances</h1>
  
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
              <PrimaryButton @click="openAddInstancesForm" class="flex items-center" v-if ="userType === 'Lab Technician'">
                <template #icon>
                  <i class="fas fa-plus mr-2"></i>
                </template>
                Add Equipment
              </PrimaryButton>
            </div>
          </div>

          <div v-if="loading" class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
  
          <div class="overflow-x-auto">
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
                <tr v-if="instances.length > 0">
                  <th v-for="header in visibleHeaders" 
                      :key="header" 
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ header }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr 
                v-for="equipment in instances" 
                @click="navigateToEquipmentDetails(equipment)"
                :key="equipment.id" 
                :class="[
                    'transition-colors duration-150 ease-in-out cursor-pointer',
                    equipment.current_borrow_record || equipment.current_condition === 'Damaged' ? 'opacity-50' : 'hover:bg-gray-50'
                  ]"
                >   
                  <td class="px-4 py-4">
                    <div class="text-sm font-medium text-gray-900">
                      ₱ {{ Number(equipment.unit_cost).toLocaleString() }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ equipment.quantity }} pc
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ equipment.equipment?.name }}
                    </div>
                    <div 
                      :title="equipment.equipment?.description"
                      class="truncate max-w-xs text-sm text-gray-900"
                    >
                      {{ equipment.equipment?.description }}
                    </div>
                    <div class="text-xs text-gray-500">
                      SN# {{ equipment.serial_number ? equipment.serial_number : 'None' }}
                    </div>
                    <div class="text-xs text-gray-500">
                      Useful Life: {{ equipment.useful_life ? `${equipment.useful_life} years` : 'None' }}  
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-xs font-medium text-gray-900">
                      {{ equipment.inventory_number }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                  <span :class="[
                    getConditionClass(equipment?.current_condition),
                    'text-sm'
                  ]">
                    {{ equipment.current_condition }}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm font-medium text-gray-900">
                    {{ equipment.purchase_date ? formatDate(equipment.purchase_date) : 'None' }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="grid grid-cols-2 gap-4">
                      <div>
                      <div class="text-xs text-gray-500 uppercase mb-1">Current borrower</div>
                      <div :class="[
                          getBorrowedStatusClass(equipment?.current_borrow_record),
                          'text-xs mb-1'
                      ]">
                          {{ getBorrowerStatus(equipment, 'current') }}
                      </div>
                      <div v-if="equipment?.current_borrow_record" class="text-xs text-gray-500">
                          <div>At: {{ formatDate(equipment?.current_borrow_record.borrowed_date) }}</div>
                          <div>In: {{ equipment?.current_borrow_record.room }}</div>
                      </div>
                      </div>
                      <div>
                      <div class="text-xs text-gray-500 uppercase mb-1">Last borrower</div>
                      <div :class="[
                          getBorrowedStatusClass(equipment?.last_borrow_record, true),
                          'text-xs'
                      ]">
                          {{ getBorrowerStatus(equipment, 'last') }}
                      </div>
                      <div v-if="equipment?.last_borrow_record" class="text-xs text-gray-500">
                          <div>At: {{ formatDate(equipment?.last_borrow_record.returned_date) }}</div>
                          <div>In: {{ equipment?.last_borrow_record.room }}</div>
                      </div>
                      </div>
                  </div>
              </td>
              <td class="px-4 py-4" @click.stop v-if="userType === 'Lab Technician'">
                <div class="flex space-x-1">
                  <button 
                    @click="addToCart(equipment)"
                    class="text-black-500 hover:text-black-800 border border-black-300 rounded-full p-1 flex items-center justify-center w-7 h-7"
                    title="Add to Cart"
                    :disabled="equipment.current_borrow_record || isInCart(equipment.id) || equipment.current_condition === 'Damaged'"
                    :class="{ 
                        'opacity-50 cursor-not-allowed': equipment.current_borrow_record || isInCart(equipment.id) || equipment.current_condition === 'Damaged',
                        'text-blue-600': isInCart(equipment.id)
                    }"
                  >
                    <i class="pi pi-shopping-cart" style="font-size: 14px"></i>
                  </button>
                  <button 
                    @click="editInstance(equipment)" 
                    class="text-blue-500 hover:text-blue-800 border border-blue-300 rounded-full p-1 flex items-center justify-center w-7 h-7"
                    :disabled="equipment.current_borrow_record"
                    :class="{'opacity-50 cursor-not-allowed': equipment.current_borrow_record}"
                  >
                    <i class="pi pi-pencil" style="font-size: 14px"></i>
                  </button>
                  <button 
                    @click.stop="handleDeleteClick(equipment.id)" 
                    class="text-red-500 hover:text-red-800 border border-red-300 rounded-full p-1 flex items-center justify-center w-7 h-7"
                    :disabled="equipment.current_borrow_record"
                    :class="{'opacity-50 cursor-not-allowed': equipment.current_borrow_record}"
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
      <EquipmentBorrowCart
          v-if ="userType === 'Lab Technician'"
          :items="cartStore.cartItems"
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

      <AddEquipmentInstances
        v-if="showAddInstancesForm"
        :equipments="equipments || []"
        :preselectedEquipment="currentEquipmentId"
        @close="closeAddInstancesForm"
        @instance-added="handleEquipmentAdded"
      />

      <UpdateEqipmentInstances
        v-if="showUpdateForm"
        :equipmentId="selectedInstance"
        :preselectedEquipment="currentEquipmentId"
        @close="closeUpdateForm"
        @instance-updated="handleInstanceUpdated"
      />

      <ConfirmButton
        v-model:visible="showDialog"
        title="Delete Equipment"
        message="Are you sure you want to delete this equipment?"
        @confirm="confirmDelete"
        @cancel="handleCancel"
      />
  
    </div>
  </template>
  
<script>
import { defineComponent, ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';
import { useStore } from 'vuex'
import { useRouter } from 'vue-router';
import { useBorrowEquipmentCart } from '@/stores/borrowEquipment';
import Sidebar from '@/components/UserType/Sidebar.vue';
import EquipmentCart from './Modals/EquipmentCart.vue';
import EquipmentBorrowCart from './Modals/EquipmentBorrowCart.vue';
import AddEquipmentInstances from './Forms/AddEquipmentInstances.vue';
import PrimaryButton from '@/components/buttons/PrimaryButton.vue';
import UpdateEqipmentInstances from './Forms/UpdateEqipmentInstances.vue';
import ConfirmButton from '@/components/buttons/ConfirmButton.vue';



  
  export default defineComponent({
    name: 'EquipmentInstances',
    components: {
      Sidebar, EquipmentCart, EquipmentBorrowCart, 
      AddEquipmentInstances, PrimaryButton, UpdateEqipmentInstances,
      ConfirmButton
    },
    props: {
      eqId: {
        type: String,
        required: true
      }
    },
    setup(props) {
      const cartStore = useBorrowEquipmentCart();
      const store = useStore()
      const router = useRouter();
      const instances = ref([]);
      const loading = ref(true);
      const successMessage = ref(null);
      const error = ref(null);
      const showBorrowModal = ref(false);
      const selectedUser = ref('');
      const selectedRoom = ref('');
      const customBorrower = ref('');
      const selectedSubject = ref('');
      const borrowingPurpose = ref('');
      const users = ref([]);
      const rooms = ref([]);
      const equipments = ref([]);
      const subjects = ref([]);
      const searchQuery = ref('');
      const isSidebarOpen = ref(false);
      const tableHeaders = [ 'Unit Cost', 'Quantity', 'Equipment', 'Inventory No.', 'Condition', 'Purchased Date', 'Borrowing Info', 'Actions'];
      const visibleHeaders = computed(() => {
          if(userType.value === 'Dean' || userType.value === 'Staff'){
              return tableHeaders.filter(header => header !== 'Actions');
          }else{
              return tableHeaders;
          }
      })
      const token = computed(() => store.state.token)
      const userType = computed(() => store.state.userType);
      const showAddInstancesForm = ref(false);
      const currentEquipmentId = computed(() => props.eqId);
      const showUpdateForm = ref(false);
      const selectedInstance = ref(null);
      const showDialog = ref(false)
      const equipmentToDelete = ref(null)
      const currentUser = computed(() => store.getters.user);
      const latestStartNumber = ref(null);

      const currentPage = ref(1);
      const totalPages = ref(0);
      const pageSize = ref(10);

      const goBack = () => {
        router.back();
      };

      const openAddInstancesForm = () => {
        showAddInstancesForm.value = true;
      };
  
      const closeAddInstancesForm = () => {
        showAddInstancesForm.value = false;
      };

      const handleEquipmentAdded = () => {
        fetchInstancesAndUsersAndRoomsAndSubjects();
        closeAddInstancesForm();
      }
  
      const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      };

      const fetchEquipment = async () => {
        try {
          const response = await axios.get(`/api/equipments/`, {
            headers: { 'Authorization': `Token ${token.value}` }
          });
          equipments.value = response.data.results || response.data;
        } catch (err) {
          console.error('Error fetching equipment:', err);
          return null;
        }
      }

      const fetchInstancesAndUsersAndRoomsAndSubjects = async () => {
        loading.value = true;
        error.value = null;
        try{
            const [instancesResponse, usersResponse, roomsResponse, subjectsResponse] = await Promise.all([
                axios.get(`/api/equipments/${props.eqId}/instances/`,{
                    headers: { 'Authorization': `Token ${token.value}` },
                    params: {
                        search: searchQuery.value,
                    }
                }),
                axios.get('/api/users/', {
                    headers: { 'Authorization': `Token ${token.value}` }
                }),
                axios.get('/api/room-list/',{
                    headers: { 'Authorization': `Token ${token.value}` }
                }),
                axios.get('/api/subject-list/', {
                    headers: { 'Authorization': `Token ${token.value}` }
                })
            ]);
            instances.value = instancesResponse.data.results || instancesResponse.data;
            users.value = usersResponse.data;;
            rooms.value = roomsResponse.data.results;
            subjects.value = subjectsResponse.data;

            totalPages.value = Math.ceil(instancesResponse.data.count / pageSize.value) || 1;
        } catch (err) {
            error.value = `Failed to fetch instances. Please try again.`;
            console.error('Error fetching instances:', err);
        } finally {
            loading.value = false;
        }
      };

      watch(searchQuery, () => {
        currentPage.value = 1;
        fetchInstancesAndUsersAndRoomsAndSubjects();
      });

      const nextPage = () => {
        if (currentPage.value < totalPages.value) {
          currentPage.value++;
          fetchInstancesAndUsersAndRoomsAndSubjects();
        }
      };

      const prevPage = () => {
        if (currentPage.value > 1) {
          currentPage.value--;
          fetchInstancesAndUsersAndRoomsAndSubjects();
        }
      };

      const editInstance = (equipment) => {
        selectedInstance.value = equipment.id;
        showUpdateForm.value = true;
      };

      const closeUpdateForm = () => {
        showUpdateForm.value = false
        selectedInstance.value = null
      }

      const handleInstanceUpdated = () => {
        fetchInstancesAndUsersAndRoomsAndSubjects();
        showUpdateForm.value = false;
      };

      const handleDeleteClick = (equipmentId) => {
        equipmentToDelete.value = equipmentId
        showDialog.value = true
      }

      const confirmDelete = async () => {
        if (equipmentToDelete.value) {
          try {
            await axios.delete(`/api/eq-instances/${equipmentToDelete.value}/delete/`, {
                headers: { 'Authorization': `Token ${token.value}` }
            });
            successMessage.value = "Equipment instance deleted successfully."
            setTimeout(() => {
              successMessage.value = null
            } , 3000)
            fetchInstancesAndUsersAndRoomsAndSubjects();
          } catch (err) {
            console.error("Error deleting equipment:", err);
            error.value = "Failed to delete equipment. Please try again.";
          } finally {
            showDialog.value = false
            equipmentToDelete.value = null
          }
        }
      }

      const handleCancel = () => {
        showDialog.value = false
        equipmentToDelete.value = null
      }

      const filteredUsers = computed(() => {
        if (!currentUser.value) return [];
        return users.value.filter(user => 
          user.is_staff && 
          user.id !== currentUser.value.id  && 
          user.department && user.department.name === 'Marine Biology'
        );
      });

      const navigateToEquipmentDetails = (equipment) => {
        router.push({ name: 'equipment-detail', params: { eqId: equipment.id.toString()  } });
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
  
      const openBorrowModal = () => {
        showBorrowModal.value = true;
      };
  
      const closeBorrowModal = () => {
        showBorrowModal.value = false;
        selectedUser.value = '';
        selectedRoom.value = '';
        borrowingPurpose.value = '';
      };
  

      const finalizeBorrowing = async () => {
          if (!selectedUser.value && !customBorrower.value) {
              errorMessage.value = 'Please select a user or provide a custom borrower';
              await new Promise(resolve => setTimeout(resolve, 2000));
              return;
          }
  
          try {
          const borrowData = {
              user_id: selectedUser.value || null,
              custom_borrower: customBorrower.value,
              room_id: selectedRoom.value || null,
              subject_id: selectedSubject.value || null,
              purpose: borrowingPurpose.value || null,
              equipment_ids: cartStore.cartEquipments.map(equipment => equipment.id)
          };
  
          await axios.post('/api/borrow-equipment/', borrowData);
          cartStore.clearCart();
          successMessage.value = 'Equipment borrowed successfully';
          setTimeout(() => {
            successMessage.value = null
          } , 3000)
          closeBorrowModal();
          await fetchInstancesAndUsersAndRoomsAndSubjects(); 
          } catch (err) {
          console.error('Error finalizing borrowing:', err);
          alert('Failed to borrow equipments. Please try again.');
          }
      };
  
      const addToCart = (equipment) => {
          if (!equipment?.current_borrow_record && !cartStore.isInCart(equipment.id)) {
              cartStore.addToCart(equipment);
          }
      };

      const printPage = () => {
        const printWindow = window.open('', '_blank');
    
        // Create HTML content for printing
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
                ${instances.value.map(equipment => `
                  <div class="barcode-item">
                    <img src="${equipment.barcode}" alt="Barcode ${equipment.inventory_number}" />
                    <div class="barcode-info">
                      <div class="item-name"> ${equipment.equipment.name}</div>
                      <div class="item-model">Model: ${equipment.equipment.model}</div>
                      <div>Inventory Item No: ${equipment.inventory_number}</div>
                      ${equipment.serial_number ? `<div>Serial #: ${equipment.serial_number}</div>` : ''}
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


      const removeFromCart = (instanceId) => {
          cartStore.removeFromCart(instanceId);
      };

      const isInCart = (instanceId) => {
          return cartStore.isInCart(instanceId);
      };

      const getBorrowedStatusClass = (borrowedBy, isLastBorrower = false) => {
            if (isLastBorrower) {
                return 'px-5 text-xs py-1 bg-blue-100 w-32 text-blue-800 rounded-full'; 
            }
            return borrowedBy
                ? 'px-5 py-1 bg-red-100 text-red-800 w-32 rounded-full' 
                : 'px-5 py-1 bg-green-100 text-green-800 w-32 rounded-full'; 
        };

        const getBorrowerStatus = (equipment, type) => {
            if (type === 'current' && equipment?.current_borrow_record) {
                return `${equipment?.current_borrow_record.borrower} `;
            }
            if (type === 'last' && equipment?.last_borrow_record) {
                return `${equipment?.last_borrow_record.borrower}`;
            }
            return 'Available';
        };
      const handleSidebarToggle = (isOpen) => {
              isSidebarOpen.value = isOpen;
          };
  
      onMounted(async () => {
        await fetchInstancesAndUsersAndRoomsAndSubjects();
        await fetchEquipment();
  
        isSidebarOpen.value = window.innerWidth >= 1024;
      });
  
      return {
        instances,
        searchQuery,
        successMessage,
        cartStore,
        users,
        rooms,
        equipments,
        subjects,
        loading,
        error,
        userType,
        tableHeaders,
        visibleHeaders,
        getConditionClass,
        getBorrowedStatusClass,
        getBorrowerStatus,
        isInCart,
        addToCart,
        removeFromCart,
        finalizeBorrowing,
        handleSidebarToggle,
        goBack,
        formatDate,
        openBorrowModal,
        closeBorrowModal,
        showBorrowModal,
        selectedUser,
        selectedRoom,
        borrowingPurpose,
        isSidebarOpen,
        customBorrower,
        selectedSubject,
        openAddInstancesForm,
        closeAddInstancesForm,
        handleEquipmentAdded,
        showAddInstancesForm,
        currentEquipmentId,
        showUpdateForm,
        selectedInstance,
        handleInstanceUpdated,
        navigateToEquipmentDetails,
        editInstance,
        closeUpdateForm,
        handleCancel,
        equipmentToDelete,
        showDialog,
        confirmDelete,
        handleDeleteClick,
        filteredUsers,
        currentUser,
        latestStartNumber,
        printPage,
        
        
        // Pagination
        nextPage,
        prevPage,
        currentPage,
        totalPages

  
  
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