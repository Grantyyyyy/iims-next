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
        
        <h1 class="text-3xl font-bold mb-6 text-gray-800">Room List</h1>

        <div class="flex justify-between mb-4">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search rooms..."
            class="border border-gray-300 rounded py-2 px-4"
          />
          <PrimaryButton  v-if="userType === 'Admin'" @click="showAddForm = true ">
            <template #icon>
              <i class="fas fa-plus mr-2"></i>
            </template>
            Add Room
          </PrimaryButton>
        </div>

        <!-- Loading and Error States -->
        <div v-if="loading" class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <div v-else-if="rooms.length === 0" class="text-center text-gray-500 text-lg my-8">
            No assigned items found.
        </div>
 
        <!-- Room Table -->
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
                                v-for="room in filteredRooms" 
                                :key="room.id"
                                @click="navigatetoRoomDetail(room.id)"
                                class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
                            >
                                <td class="px-4 py-4">
                                    <div class="text-sm font-medium text-gray-900">
                                        {{ room?.name }}
                                    </div>
                                </td>
                                <td class="px-4 py-4">
                                    <div class="text-sm text-gray-900">
                                        {{ room.department?.name }}
                                    </div>
                                </td>
                                <td class="px-4 py-4">
                                    <div class="text-sm text-gray-900" @click.stop>
                                        {{ room.location }}
                                    </div>
                                </td>
                                <td class="px-4 py-4" v-if="userType === 'Admin'">
                                  <div class="flex space-x-2 justify-start">
                                    <button
                                        @click.stop="navigatetoRoomDetail(room.id)"
                                        class="text-blue-500 hover:text-blue-800 border border-blue-300 rounded-full p-1 flex items-center justify-center w-7 h-7"
                                        title="View Details"
                                      >
                                      <i class="pi pi-info" style="font-size: 14px"></i>
                                    </button>
                                    <button
                                      @click.stop="handleDeleteClick(room.id)"
                                      class="text-red-500 hover:text-red-800 border border-red-300 rounded-full p-1 flex items-center justify-center w-7 h-7"
                                      title="Delete">
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


      <div v-if="showAddForm" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
        <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-xl">
          <h2 class="text-xl font-bold mb-4">Add New Room</h2>
          
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

              <div>
                <label class="text-sm font-semibold text-gray-700" for="location">Location</label>
                <input
                  v-model="addRoom.location"
                  class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  id="location"
                  type="text"
                  required
                />
              </div>

              <div>
                <label class="text-sm font-semibold text-gray-700" for="department">Department</label>
                <select
                  v-model="addRoom.department_id"
                  class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  id="department"
                  required
                >
                  <option value="" disabled>Select a department</option>
                  <option v-for="department in departments" :key="department.id" :value="department.id">
                    {{ department.name }}
                  </option>
                </select>
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
        title="Delete Room"
        message="Are you sure you want to delete this room?"
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
  name: 'RoomList',
  components: {
    Sidebar, PrimaryButton, ConfirmButton
  },
  setup() {
    const store = useStore();
    const rooms = ref([]);
    const departments = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const successMessage = ref(null);
    const searchQuery = ref('');
    const isSidebarOpen = ref(true);
    const tableHeaders = ['Room Name', 'Department', 'Location', 'Actions'];
    const visibleHeaders = computed(() => tableHeaders.filter(header => header !== 'Actions' || userType.value !== 'Dean'));
    const addRoom = ref({
      name: '',
      department_id: '',
      location: ''
    });
    const showAddForm = ref(false);
    const showDialog = ref(false)
    const roomToDelete = ref(null)
    const userType = computed(() => store.state.userType);
    const currentPage = ref(1)
    const pageSize = ref(10)
    const totalPages = ref(0)

    const fetchRooms = async () => {
      loading.value = true;
      error.value = null;
      try {
        const response = await axios.get('/api/room-list/', {
          params: {
            search: searchQuery.value,
            page: currentPage.value,
            page_size: pageSize.value
          }
        });
        rooms.value = response.data.results;
        totalPages.value = Math.ceil(response.data.count / pageSize.value) || 1;
      } catch (err) {
        console.error("Error fetching rooms:", err);
        error.value = "Failed to fetch rooms. Please try again.";
      } finally {
        loading.value = false;
      }
    }

    const fetchDepartments = async () => {
      try {
        const response = await axios.get('/api/department/');
        departments.value = response.data;
      } catch (err) {
        console.error("Error fetching departments:", err);
        error.value = "Failed to fetch departments. Please try again.";
      }
    }

    watch(searchQuery, () => {
      currentPage.value = 1;  
      fetchRooms();
    });

    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
        fetchRooms();
      }
    };

    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--;
        fetchRooms();
      }
    };

    const handleDeleteClick = (roomId) => {
      roomToDelete.value = roomId
      showDialog.value = true
    }

    const confirmDelete = async () => {
      if (roomToDelete.value) {
        try {
          await axios.delete(`/api/rooms/${roomToDelete.value}/delete/`);
          fetchRooms();
          console.log('Deleted room:', roomToDelete.value);
        } catch (err) {
          console.error("Error deleting item:", err);
          error.value = "Failed to delete item. Please try again.";
        } finally {
          showDialog.value = false
          roomToDelete.value = null
        }
      }
    }

    const goBack = () => {
      router.go(-1)
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
        await axios.post('/api/add-room/', newRoomData, {
          headers: {
            'Authorization': `Token ${store.state.token}`
          }
        });
        successMessage.value = "Room added successfully.";
        setTimeout(() => {
          successMessage.value = null;
        }, 3000);
        fetchRooms(); 
        showAddForm.value = false;
      } catch (err) {
        console.error('Error adding room:', err);
        error.value = "Failed to add room. Please try again.";
      }
    }

    onMounted(() => {
      fetchRooms();
      fetchDepartments();

      isSidebarOpen.value = window.innerWidth >= 1024;
    })

    const filteredRooms = computed(() => {
      if (!searchQuery.value) return rooms.value;
      return rooms.value.filter(room =>
        room?.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        room?.department?.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        room?.location.toLowerCase().includes(searchQuery.value.toLowerCase())
      );
    });

    return {
      rooms,
      departments,
      loading,
      goBack,
      successMessage,
      error,
      tableHeaders,
      visibleHeaders,
      addRoom,
      submitForm,
      searchQuery,
      filteredRooms,
      showAddForm,
      navigatetoRoomDetail,
      isSidebarOpen,
      handleDeleteClick,
      confirmDelete,
      handleCancel,
      showDialog,
      userType,
      currentPage,
      pageSize,
      totalPages,
      nextPage,
      prevPage,
    }
  }
})
</script>

<style scoped>
/* Add any additional styles here */
</style>
