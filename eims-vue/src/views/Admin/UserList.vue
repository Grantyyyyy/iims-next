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

        <h1 class="text-3xl font-bold mb-6 text-gray-800">User List</h1>

        <div class="mb-4 flex items-center space-x-4 justify-between">
          <div class="flex items-center space-x-4 flex-grow">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search users..."
              class="border border-gray-300 rounded py-2 px-4 w-full md:w-auto"
            />

            <div class="relative">
                  <select 
                      v-model=" selectedDepartment" 
                      class="border border-gray-300 rounded py-2 px-4 w-screen md:w-auto"
                  >
                    <option :value=null>All Departments</option>
                    <option 
                        v-for="department in departments" 
                        :key="department.id" 
                        :value="department.id"
                    >
                        {{ department.name }} 
                    </option>
                  </select>
              </div>
        
            <div class="relative">
              <select 
                  v-model="selectedUserType" 
                  class="border border-gray-300 rounded py-2 px-4 w-screen md:w-auto"
              >
                <option :value="null" :selected="selectedUserType === null">All User Types</option>
                <option value="Dean">Dean</option>
                <option value="Admin">Admin</option>
                <option value="Secretary">Secretary</option>
                <option value="Lab Technician">Lab Technician</option>
                <option value="Staff">Staff</option>
              </select>
            </div>

          </div>
          <PrimaryButton 
            class="inline-flex items-center md:w-auto"
            @click="showAddForm = true"
          >
            <template #icon>
              <i class="fas fa-plus mr-2"></i>
            </template>
            Add User
          </PrimaryButton>
        </div>

        <div v-if="loading" class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <div v-else-if="users.length === 0" class="text-center text-gray-500 text-lg my-8">
          No user found.
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
                <th v-for="header in tableHeaders" 
                    :key="header" 
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ header }}
                </th>
              </tr>
            </thead>    
            <tbody class="bg-white divide-y divide-gray-200">
              <tr 
                v-for="user in users" 
                :key="user.id" 
                class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
              > 
                <td class="px-4 py-4">
                  <div class="text-sm font-medium text-gray-900"> 
                    {{ user.username }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm font-medium text-gray-900"> 
                    {{ user.first_name }} {{ user.last_name }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm font-medium text-gray-900"> 
                    {{ user.user_type }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm font-medium text-gray-900"> 
                    {{ user.department?.name ? user.department?.name : '--' }}
                  </div>
                </td>
                <td @click.stop class="px-4 py-4" >
                  <div class="flex space-x-1.5">
                    <button 
                      @click="viewUserDetails(user)" 
                      class="text-black-500 hover:text-black-800 border border-black-300 rounded-full p-1 flex items-center justify-center w-7 h-7" 
                      title="View User Details"
                    >
                      <i class="pi pi-id-card" style="font-size: 14px"></i>
                    </button>
                    <button 
                      @click="editUser(user)" 
                      class="text-blue-500 hover:text-blue-800 border border-blue-300 rounded-full p-1 flex items-center justify-center w-7 h-7" 
                      title="Edit User"
                    >
                      <i class="pi pi-pencil" style="font-size: 14px"></i>
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
        <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-[450px]">
          <h2 class="text-xl font-bold mb-4">Add New User</h2>
          
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
                <label class="text-sm font-semibold text-gray-700" for="username">Username</label>
                <input
                  v-model="addUser.username"
                  class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  id="username"
                  type="text"
                  required
                />
              </div>

              <div>
                <label class="text-sm font-semibold text-gray-700" for="password">Password</label>
                <input
                  v-model="addUser.password"
                  class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  id="password"
                  type="password"
                  required
                />
              </div>

              <div>
                <label class="text-sm font-semibold text-gray-700" for="first_name">First Name</label>
                <input
                  v-model="addUser.first_name"
                  class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  id="first_name"
                  type="text"
                  required
                />
              </div>


              <div>
                <label class="text-sm font-semibold text-gray-700" for="last_name">Last Name</label>
                <input
                  v-model="addUser.last_name"
                  class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  id="last_name"
                  type="text"
                  required
                />
              </div>

              <div>
                <label class="text-sm font-semibold text-gray-700" for="department">Department</label>
                <select
                  v-model="addUser.department_id"
                  class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  id="department"
                  required
                >
                  <option v-for="department in departments" :key="department.id" :value="department.id">
                    {{ department.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="text-sm font-semibold text-gray-700" for="user_type">User Type</label>
                <select
                  v-model="addUser.user_type"
                  class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  id="user_type"
                  required
                >
                <option value="">Select user type</option>
                <option v-if="!hasDean" value="Dean">Dean</option>
                <option v-if="!hasAdmin" value="Admin">Admin</option>
                <option v-if="!hasSecretary" value="Secretary">Secretary</option>
                <option value="Lab Technician">Lab Technician</option>
                <option value="Staff">Staff</option>
                </select>
              </div>

            <!-- Form Footer -->
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
                Add User
              </button>
            </div>
          </form>
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
      <UpdateUserForm 
        v-if="showUpdateForm"
        :user="selectedUser"  
        @close="closeForm" 
        @user-updated="handleUserUpdated"
      />
      <UserDetail
        v-if="showDetailModal"
        :user="selectedUser"
        @close="closeDetailModal"
      />  
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex';
import { useRouter } from 'vue-router'; 
import axios from 'axios'
import Sidebar from '@/components/UserType/Sidebar.vue';
import PrimaryButton from '@/components/buttons/PrimaryButton.vue';
import UpdateUserForm from './Forms/UpdateUserForm.vue';
import UserDetail from './UserDetail.vue';

export default defineComponent({
  name: 'UserList',
  components: {
    Sidebar, PrimaryButton, UpdateUserForm, UserDetail
  },
  setup() {
    const store = useStore();
    const router = useRouter();
    const successMessage = ref(null);
    const error = ref(null);
    const users = ref([]);
    const departments = ref([]);
    const loading = ref(true);
    const searchQuery = ref('');
    const isSidebarOpen = ref(true);
    const tableHeaders = ['Username', 'Name', 'User Type', 'Department', 'Actions'];
    const showBarcodePopup = ref(false);
    const selectedUserType = ref(null);
    const selectedDepartment = ref(null);
    const currentBarcode = ref('');
    const addUser = ref({
      username: '',
      password: '',
      first_name: '',
      last_name: '',
      user_type: '',
      department_id: ''
    });
    const selectedUser = ref(null);
    const isDetailModalOpen = ref(false);
    const showDetailModal = ref(false);
    const showAddForm = ref(false);
    const showUpdateForm = ref(false);
    const token = computed(() => store.state.token)
    const currentPage = ref(1)
    const pageSize = ref(10)
    const totalPages = ref(0)

    const allUserTypes = ref([]);

    const handleSidebarToggle = (isOpen) => {
      isSidebarOpen.value = isOpen;
    };


    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/user-list/', {
          headers: {
            'Authorization': `Token ${token.value}`,
          },
          params: {
            search: searchQuery.value,
            page: currentPage.value,
            page_size: pageSize.value,
            user_type: selectedUserType.value || null,
            department:   selectedDepartment.value || null

          }
        });
        users.value = response.data.results;
        totalPages.value = Math.ceil(response.data.count / pageSize.value) || 1;
      } catch (err) {
        console.error("Error fetching users:", err);
        error.value = "Failed to fetch users. Please try again.";
      } finally {
        loading.value = false;
      }
    }

    const navigateToUserDetail = (userId) => {
      router.push({ name: 'user-detail', params: { id: userId } });
    }

    const openUserDetail = (userId) => {
      selectedUser.value = userId;
      isDetailModalOpen.value = true;
    };

    const closeDetailModal = () => {
      showDetailModal.value = false;
      selectedUser.value = null;
    };

    const viewUserDetails = (user) => {
      openUserDetail(user);
      showDetailModal.value = true;

    };

    const fetchAllUserTypes = async () => {
      try {
        const response = await axios.get('/api/user-types/', {
          headers: {
            'Authorization': `Token ${token.value}`,
          }
        });
        allUserTypes.value = response.data;
      } catch (err) {
        console.error("Error fetching user types:", err);
      }
    };

    const hasDean = computed(() => {
      return allUserTypes.value.includes('Dean');
    });

    const hasAdmin = computed(() => {
      return allUserTypes.value.includes('Admin');
    });

    const hasSecretary = computed(() => {
      return allUserTypes.value.includes('Secretary');
    });

    const hasLabTech = computed(() => {
      return allUserTypes.value.includes('Lab Technician');
    });


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

    watch([searchQuery, selectedUserType,   selectedDepartment], () => {
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

    const submitForm = async () => {
      try {
        await axios.post('/api/add-user/', {
          username: addUser.value.username,
          password: addUser.value.password,
          first_name: addUser.value.first_name,
          last_name: addUser.value.last_name,
          department_id: addUser.value.department_id,
          is_secretary: addUser.value.user_type === 'Secretary',
          is_admin: addUser.value.user_type === 'Admin',
          is_staff: addUser.value.user_type === 'Staff',
          is_labtech: addUser.value.user_type === 'Lab Technician',
          is_ictc: addUser.value.user_type === 'ICT Technician',
          is_superuser: addUser.value.user_type === 'Superuser',
          is_dean: addUser.value.user_type === 'Dean'
        });
        successMessage.value = "User added successfully."; 
        setTimeout(() => {
          successMessage.value = null;
        }, 3000);
        fetchUsers();
        showAddForm.value = false; 
        addUser.value = {  
          username: '',
          password: '',
          first_name: '',
          last_name: '',
          user_type: '',

        };

      } catch (err) {
        console.error("Error adding user:", err);
        error.value = "Failed to add user. Please try again.";
      }
    };

    const editUser = (user) => {
      selectedUser.value = user;
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

    onMounted(() => {
      fetchUsers();
      fetchDepartments();
      fetchAllUserTypes();

      isSidebarOpen.value = window.innerWidth >= 1024;
    })

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
        return users.value;
      }
      return users.value.filter(user =>
        user?.username.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        user.first_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        user.user_type.toLowerCase().includes(searchQuery.value.toLowerCase())
      );
    });

    const goBack = () => {
      router.go(-1);
    };

    return {
      users,
      departments,
      addUser,
      submitForm,
      loading,
      error,
      successMessage,
      tableHeaders,
      searchQuery,
      filteredUsers,
      showAddForm,
      isSidebarOpen,
      isDetailModalOpen,
      viewUserDetails,
      closeDetailModal,
      openUserDetail,
      navigateToUserDetail,
      openBarcodePopup,
      closeBarcodePopup,
      handleSidebarToggle,
      selectedUserType,
        selectedDepartment,
      showUpdateForm,
      showDetailModal,
      editUser,
      selectedUser,
      closeForm,
      currentBarcode,
      showBarcodePopup,
      handleUserUpdated,
      goBack,
      currentPage,
      pageSize,
      totalPages,
      nextPage,
      prevPage,

      hasAdmin,
      hasDean,
      hasSecretary,
      hasLabTech,

    }
  }
})
</script>

