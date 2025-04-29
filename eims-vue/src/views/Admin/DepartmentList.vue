<template>
    <div class="flex h-screen bg-gradient-to-b from-[#F5F4F7] to-[#D4EAF7]">
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
          
          <h1 class="text-3xl font-bold mb-6 text-gray-800">Department List</h1>
  
          <div class="flex justify-between mb-4">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search departments..."
              class="border border-gray-300 rounded py-2 px-4"
            />
            <!-- <PrimaryButton  v-if="userType === 'Admin'" @click="showAddForm = true ">
              <template #icon>
                <i class="fas fa-plus mr-2"></i>
              </template>
              Add Room
            </PrimaryButton> -->
          </div>
  
          <!-- Loading and Error States -->
          <div v-if="loading" class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <div v-else-if="departments.length === 0" class="text-center text-gray-500 text-lg my-8">
              No department found.
          </div>
   
          <!-- Room Table -->
          <div v-else class="overflow-x-auto">
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
                                  v-for="department in filteredDepartments" 
                                  :key="department.id"
                                  class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
                              >
                                  <td class="px-4 py-4">
                                      <div class="text-sm font-medium text-gray-900">
                                          {{ department.name }}
                                      </div>
                                  </td>
                                  <!-- <td class="px-4 py-4" v-if="userType === 'Admin'">
                                    <div class="flex space-x-2 justify-start">
                                      
                                      <button
                                        @click.stop="handleDeleteClick(department.id)"
                                        class="p-1 hover:bg-gray-100 rounded-full"
                                        title="Delete">
                                        <i class="fas fa-trash text-red-600"></i>
                                      </button>
                                  </div>
                                  </td>  -->
                            </tr>
                      </tbody>
                  </table>
            </div>
  
        </div>
  
  
        <div v-if="showAddForm" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-xl">
            <h2 class="text-xl font-bold mb-4">Add New Department</h2>
            
            <form @submit.prevent="submitForm" class="space-y-4">
              <div v-if="successMessage" class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded" role="alert">
                <p class="font-bold">Success</p>
                <p>{{ successMessage }}</p>
              </div>
              <div v-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
                <p class="font-bold">Error</p>
                <p>{{ error }}</p>
              </div>
          

                <div>
                  <label class="text-sm font-semibold text-gray-700" for="name">Room Name</label>
                  <input
                    v-model="addRoom.name"
                    class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    id="name"
                    type="text"
                    required
                  />
                </div>
  
              <div class="col-span-2 flex justify-end space-x-3 mt-4">
                <button
                  @click="showAddForm = false"
                  type="button"
                  class="px-4 py-1.5 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-4 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add Room
                </button>
              </div>
            </form>
          </div>
        </div>
        <ConfirmButton
          v-model:visible="showDialog"
          title="Delete Department"
          message="Are you sure you want to delete this department?"
          @confirm="confirmDelete"
          @cancel="handleCancel"
        />
      </div>
    </div>
  </template>
  
  <script>
  import { defineComponent, ref, computed, onMounted, watch } from 'vue'
  import { useStore } from 'vuex'
  import axios from 'axios'
  import Sidebar from '@/components/UserType/Sidebar.vue';
  import router from '@/router';
  import PrimaryButton from '@/components/buttons/PrimaryButton.vue';
  import ConfirmButton from '@/components/buttons/ConfirmButton.vue';
  
  export default defineComponent({
    name: 'DepartmentList',
    components: {
      Sidebar, PrimaryButton, ConfirmButton
    },
    setup() {
      const store = useStore();
      const departments = ref([]);
      const loading = ref(true);
      const error = ref(null);
      const searchQuery = ref('');
      const isSidebarOpen = ref(true);
      const tableHeaders = ['Department Name', ];
      const visibleHeaders = computed(() => tableHeaders.filter(header => header !== 'Actions' || userType.value !== 'Dean'));
      const addRoom = ref({
        name: '',
        department: '',
        location: ''
      });
      const showAddForm = ref(false);
      const showDialog = ref(false)
      const roomToDelete = ref(null)
      const userType = computed(() => store.state.userType);
  
      const fetchDepartments = async () => {
        try {
          const response = await axios.get('/api/department/');
          departments.value = response.data;
          loading.value = false;
        } catch (err) {
          console.error("Error fetching departments:", err);
          error.value = "Failed to fetch departments. Please try again.";
        }
      }
  
      const handleDeleteClick = (roomId) => {
        roomToDelete.value = roomId
        showDialog.value = true
      }
  
      const confirmDelete = async () => {
        if (roomToDelete.value) {
          try {
            await axios.delete(`/api/department/${roomToDelete.value}/delete/`);
            successMessage.value = "Department deleted successfully.";
            fetchDepartments();           
          } catch (err) {
            console.error("Error deleting department:", err);
            error.value = "Failed to delete department. Please try again.";
          } finally {
            showDialog.value = false
            roomToDelete.value = null   
          }
        }
      }
  
      const handleCancel = () => {
        showDialog.value = false
        roomToDelete.value = null
      }
  
      const navigatetoRoomDetail = (roomId) => {
        router.push({ name: 'room-detail', params: { id: roomId } });
      }
  
      const submitForm = async () => {
        try {
          const newRoomData = { ...addRoom.value };
          await axios.post('/api/department/', newRoomData, {
            headers: {
              'Authorization': `Token ${store.state.token}`
            }
          });
          rooms.value.push(newRoomData); // Update room list with new room
          showAddForm.value = false; // Close the form modal
        } catch (err) {
          console.error('Error adding room:', err);
          error.value = "Failed to add room. Please try again.";
        }
      }
  
      onMounted(() => {
        fetchDepartments();
  
        isSidebarOpen.value = window.innerWidth >= 1024;
      })
  
      const filteredDepartments = computed(() => {
        if (!searchQuery.value) return departments.value;
        return departments.value.filter(department =>
          department.name.toLowerCase().includes(searchQuery.value.toLowerCase())
        );
      });
  
      return {
        departments,
        loading,
        error,
        tableHeaders,
        visibleHeaders,
        addRoom,
        submitForm,
        searchQuery,
        filteredDepartments,
        showAddForm,
        navigatetoRoomDetail,
        isSidebarOpen,
        handleDeleteClick,
        confirmDelete,
        handleCancel,
        showDialog,
        userType
      }
    }
  })
  </script>
  
  <style scoped>
  /* Add any additional styles here */
  </style>
  