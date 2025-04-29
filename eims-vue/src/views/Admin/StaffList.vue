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

        <h1 class="text-3xl font-bold mb-6 text-gray-800">Staff List</h1>

        <div class="flex justify-between mb-6">
          <input
                v-model="searchQuery"
                type="text"
                placeholder="Search staffs..."
                class="border border-gray-300 rounded py-2 px-4"
              />
        </div>

        <div v-if="loading" class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <div v-else-if="staffs.length === 0" class="text-center text-gray-500 text-lg my-8">
            No assigned items found.
        </div>

        <div v-else class="overflow-x-auto">
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
                          v-for="staff in filteredUsers" 
                          @click.stop="navigateToStaffDetail(staff.id)"
                          :key="staff.id" 
                          class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
                      >   
                          <td class="px-4 py-4">
                              <div class="text-sm font-medium text-gray-900">
                                  {{ staff.custom_id }}
                              </div>
                          </td>
                          <td class="px-4 py-4">
                              <div class="text-sm font-medium text-gray-900">
                                  {{ staff.username }}
                              </div>
                          </td>
                          <td class="px-4 py-4">
                              <div class="text-sm font-medium text-gray-900">
                                  {{ staff.first_name }} {{ staff.last_name }}
                              </div>
                          </td>
                          <td class="px-4 py-4">
                              <div class="text-sm font-medium text-gray-900">
                                  {{ staff.user_type }}
                              </div>
                          </td>
                          <td class="px-4 py-4" @click.stop v-if="userType === 'Admin'">
                            <div class="flex space-x-2 justify-start">
                              <button
                                class="p-1 hover:bg-gray-100 rounded-full"
                                title="View Details"
                              >
                              <i class="fas fa-eye text-gray-600"></i>
                              </button>
                              <button 
                                @click="editUser(staff)" 
                                class="p-1 hover:bg-gray-100 rounded-full" 
                                title="Edit Staff"
                              >
                                <i class="fas fa-edit text-gray-600"></i>
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
        <UpdateStaffForm 
          v-if="showUpdateForm"
          :staff="selectedUser"  
          @close="closeForm" 
          @user-updated="handleUserUpdated"
        />  
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import axios from 'axios'
import Sidebar from '@/components/UserType/Sidebar.vue'
import UpdateStaffForm from './Forms/UpdateStaffForm.vue';

export default defineComponent({
  name: 'StaffList',
  components: {
    Sidebar, UpdateStaffForm
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    const staffs = ref([])
    const loading = ref(true)
    const error = ref(null)
    const searchQuery = ref('')
    const tableHeaders = ['ID No.', 'Username', 'Name', 'User Type', 'Actions']
    const visibleHeaders = computed(() => {
      const userType = store.state.userType;
      return tableHeaders.filter(header => header !== 'Actions' || userType !== 'Dean');
    });
    const userType = computed(() => store.state.userType);

    const showAddForm = ref(false)
    const isSidebarOpen = ref(false)
    const showBarcodePopup = ref(false);
    const currentBarcode = ref('');

    const currentPage = ref(1)
    const pageSize = ref(10)
    const totalPages = ref(0)

    const showUpdateForm = ref(false);
    const selectedUser = ref(null);

    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/staff-list/', {
          params: {
            search: searchQuery.value,
            page: currentPage.value,
            page_size: pageSize.value
          }
        });
        staffs.value = response.data.results;
        totalPages.value = Math.ceil(response.data.count / pageSize.value) || 1;
      } catch (err) {
        error.value = "Failed to fetch users. Please try again."
      } finally {
        loading.value = false
      }
    }

    const goBack = () => {
      router.go(-1)
    }

    const editUser = (staff) => {
      selectedUser.value = staff;
      showUpdateForm.value = true;
    };

    const closeForm = () => {
      showUpdateForm.value = false;
      selectedUser.value = null;
    }

    const handleUserUpdated = () => {
      fetchUsers();
      showUpdateForm.value = false;
      selectedUser.value = null;
    };

    watch(searchQuery, () => {
      currentPage.value = 1;  
      fetchUsers();
    });

    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
        fetchUsers();
      }
    };

    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--;
        fetchUsers();
      }
    };

    const viewBorrowedItems = (staff) => {
      router.push({
        name: 'staff-borrowed-list',
        params: { barcode: staff.barcode_value }
      })
    }

    const viewAssignedItems = (staff) => {
      router.push({
        name: 'staff-assigned-list',
        params: { barcode: staff.barcode_value }
      })
    }

    const navigateToStaffDetail = (staffId) => {
      router.push({ name: 'staff-detail', params: { id: staffId } })
    }

    const openBarcodePopup = (barcodeUrl) => {
      currentBarcode.value = barcodeUrl;
      showBarcodePopup.value = true;
    };

    const closeBarcodePopup = () => {
      showBarcodePopup.value = false;
      currentBarcode.value = '';
    };

    const filteredUsers = computed(() => {
      if (!searchQuery.value) {
        return staffs.value
      }

      const searchValue = searchQuery.value.toLowerCase()

      return staffs.value.filter(user =>
        user.custom_id.toString().includes(searchValue) ||
        user.username.toLowerCase().includes(searchValue) ||
        user.first_name.toLowerCase().includes(searchValue) ||
        user.last_name.toLowerCase().includes(searchValue) ||
        user.user_type.toLowerCase().includes(searchValue)
      )
    })

    const handleSidebarToggle = (isOpen) => {
      isSidebarOpen.value = isOpen;
    };

    onMounted(() => {
      fetchUsers();
      isSidebarOpen.value = window.innerWidth >= 1024;
    });

    return {
      staffs,
      goBack,
      loading,
      error,
      tableHeaders,
      visibleHeaders,
      searchQuery,
      filteredUsers,
      showAddForm,
      viewBorrowedItems,
      viewAssignedItems,
      isSidebarOpen,
      handleSidebarToggle,
      openBarcodePopup,
      closeBarcodePopup,
      currentBarcode,
      showBarcodePopup,
      handleSidebarToggle,
      navigateToStaffDetail,
      nextPage,
      prevPage,
      currentPage,
      pageSize,
      totalPages,
      showUpdateForm,
      selectedUser,
      editUser,
      closeForm,
      handleUserUpdated
    }
  }
})
</script>