<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
    <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-xl">
      <h2 class="text-xl font-bold mb-6">Update User</h2>

      <div class="mb-6 border-b border-gray-200">
        <nav class="-mb-px flex space-x-4">
          <button 
            v-for="tab in tabs" 
            :key="tab"
            @click="currentTab = tab"
            :class="[
              'px-4 py-2 font-medium text-sm rounded-t-lg',
              currentTab === tab 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200'
            ]"
          >
            {{ tab }}
          </button>
        </nav>
      </div>

      <form v-if="currentTab === 'User Details'" @submit.prevent="submitForm" class="space-y-4">
        <div v-if="error" class="col-span-2 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p class="font-bold">Error</p>
          <p>{{ error }}</p>
        </div>
        <div v-if="successMessage" class="col-span-2 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
          <p class="font-bold">Success</p>
          <p>{{ successMessage }}</p>
        </div>

        <div>
          <label class="text-sm font-semibold text-gray-700" for="username">Username</label>
          <input
            v-model="formData.username"
            class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            :class="{ 'border-red-500': validationErrors.username }"
            id="username"
            type="text"
            required
          />
          <span v-if="validationErrors.username" class="text-xs text-red-500">{{ validationErrors.username }}</span>
        </div>

        <div>
          <label class="text-sm font-semibold text-gray-700" for="first_name">First Name</label>
          <input
            v-model="formData.first_name"
            class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            :class="{ 'border-red-500': validationErrors.first_name }"
            id="first_name"
            type="text"
            required
          />
          <span v-if="validationErrors.first_name" class="text-xs text-red-500">{{ validationErrors.first_name }}</span>
        </div>

        <!-- Right Column -->
        <div class="space-y-3">
          <div>
            <label class="text-sm font-semibold text-gray-700" for="last_name">Last Name</label>
            <input
              v-model="formData.last_name"
              class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              :class="{ 'border-red-500': validationErrors.last_name }"
              id="last_name"
              type="text"
              required
            />
            <span v-if="validationErrors.last_name" class="text-xs text-red-500">{{ validationErrors.last_name }}</span>
          </div>

          <div>
            <label class="text-sm font-semibold text-gray-700" for="email">Email</label>
            <input
              v-model="formData.email"
              class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              :class="{ 'border-red-500': validationErrors.email }"
              id="email"
              type="email"
            />
            <span v-if="validationErrors.email" class="text-xs text-red-500">{{ validationErrors.email }}</span>
          </div>

          <div>
            <label class="text-sm font-semibold text-gray-700" for="department">Department</label>
            <select
              v-model="formData.department_id"
              class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="department"
              required
            >
              <option :value="null" disabled>Select department</option>
              <option v-for="department in departments" :key="department.id" :value="department.id">
                {{ department.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="text-sm font-semibold text-gray-700" for="user_type">User Type</label>
            <select
              v-model="formData.user_type"
              class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              :class="{ 'border-red-500': validationErrors.user_type }"
              id="user_type"
              required
            >
              <option value="">Select user type</option>
              <option value="Secretary">Secretary</option>
              <option value="Admin">Admin</option>
              <option value="Staff">Staff</option>
              <option value="Lab Technician">Lab Technician</option>
              <option value="ICT Technician">ICT Technician</option>
              <option value="Dean">Dean</option>
            </select>
            <span v-if="validationErrors.user_type" class="text-xs text-red-500">{{ validationErrors.user_type }}</span>
          </div>
        </div>

        <div class="flex justify-end space-x-3 mt-4">
          <button
            type="button"
            class="px-4 py-1.5 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            :disabled="isSubmitting"
            @click="handleClose"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting">Updating...</span>
            <span v-else>Update User</span>
          </button>
        </div>
      </form>

      <!-- Change Password Form -->
      <form v-if="currentTab === 'Change Password'" @submit.prevent="updatePassword" class="space-y-4">
        <div v-if="error" class="col-span-2 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p class="font-bold">Error</p>
          <p>{{ error }}</p>
        </div>
        <div v-if="successMessage" class="col-span-2 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
          <p class="font-bold">Success</p>
          <p>{{ successMessage }}</p>
        </div>

        <div>
          <label for="new_password" class="text-sm font-semibold text-gray-700">New Password</label>
          <input 
            type="password" 
            id="new_password" 
            v-model="passwords.new" 
            class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" 
          />
        </div>

        <div>
          <label for="confirm_password" class="text-sm font-semibold text-gray-700">Confirm New Password</label>
          <input 
            type="password" 
            id="confirm_password" 
            v-model="passwords.confirm" 
            class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" 
          />
        </div>

        <div class="flex justify-end space-x-3 mt-4">
          <button
            type="button"
            class="px-4 py-1.5 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            :disabled="isSubmitting"
            @click="handleClose"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting">Updating...</span>
            <span v-else>Update Password</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'

export default defineComponent({
  name: 'UpdateUserForm',
  props: {
    user: {
      type: Object,
      required: true
    },
  },
  emits: ['close', 'user-updated'],
  
  setup(props, { emit }) {
    const loading = ref(false);
    const store = useStore()
    const departments = ref([])
    const errorMessages = ref(null)
    const successMessage = ref(null)
    const isSubmitting = ref(false)
    const validationErrors = ref({})
    const tabs = ref(['User Details', 'Change Password']);
    const currentTab = ref(tabs.value[0]);
    const passwords = ref({
      new: '',
      confirm: '',
    });

    const formData = ref({
      username: '',
      password: '',
      email: '',
      first_name: '',
      last_name: '',
      user_type: '',
      department_id: ''
    })

    watch(currentTab, (newTab) => {
      localStorage.setItem('currentTab', newTab);
      fetchUserDetails();
    });

    const fetchUserDetails = async () => {
      try {
        const response = await axios.get(`/api/user/${props.user.id}/update/`, {
          headers: {
            Authorization: `Token ${store.state.token}`
          }
        })
        const userData = response.data
        formData.value = {
          username: userData.username || '',
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          email: userData.email || '',
          user_type: userData.user_type || '', 
          department_id: userData.department?.id || null
        }
      } catch (error) {
        errorMessages.value = 'Failed to load user details'
        console.error('Error fetching user details:', error)
      }
    }

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

    const validateForm = () => {
      const errors = {}
      
      if (!formData.value.username) {
        errors.username = 'Username is required'
      }
      if (!formData.value.first_name) {
        errors.first_name = 'First name is required'
      }
      if (!formData.value.last_name) {
        errors.last_name = 'Last name is required'
      }
      if (!formData.value.user_type) {
        errors.user_type = 'User type is required'
      }
      
      validationErrors.value = errors
      return Object.keys(errors).length === 0
    }
    
    const updatePassword = async () => {
      if (passwords.value.new !== passwords.value.confirm) {
        alert('New passwords do not match!');
        return;
      }
      
      loading.value = true;
      try {
        const response = await axios.post(
          `/api/user/admin/${props.user.id}/change-password/`,
          passwords.value,
          {
            headers: {
              Authorization: `Token ${store.state.token}`
            }
          }
        );
        if (response.status === 200) {
          successMessage.value = 'Password updated successfully.'
          setTimeout(() => {
            successMessage.value = null
            emit('user-updated')
            emit('close')
          }, 1500)
        }
        Object.assign(passwords.value, { new: '', confirm: '' });
      } catch (error) {
        console.error('Error updating password:', error.response?.data || error.message);
        alert(error.response?.data?.error || 'Failed to update password. Please try again.');
      } finally {
        loading.value = false;
      }
    };

    const submitForm = async () => {
      try {
        const response = await axios.put(`/api/user/${props.user.id}/update/`, {
          username: formData.value.username,
          password: formData.value.password,
          first_name: formData.value.first_name,
          email: formData.value.email,
          last_name: formData.value.last_name,
          department_id: formData.value.department_id,
          is_secretary: formData.value.user_type === 'Secretary',
          is_admin: formData.value.user_type === 'Admin',
          is_staff: formData.value.user_type === 'Staff',
          is_labtech: formData.value.user_type === 'Lab Technician',
          is_ictc: formData.value.user_type === 'ICT Technician',
          is_superuser: formData.value.user_type === 'Superuser',
          is_dean: formData.value.user_type === 'Dean'
        });

        if (response.status === 200) {
          successMessage.value = 'User updated successfully.'
          setTimeout(() => {
            successMessage.value = null
            emit('user-updated')
            emit('close')
          }, 1500)
        }
        formData.value = {
          username: '',
          password: '',
          first_name: '',
          last_name: '',
          user_type: ''
        };
      } catch (err) {
        console.error("Error adding user:", err);
        errorMessages.value = err.response?.data?.error || 'Failed to update user. Please try again.';
        setTimeout(() => {
          errorMessages.value = null;
        }, 1000);
      }
    };

    const handleClose = () => {
      if (!isSubmitting.value) {
        emit('close')
      }
    }

    onMounted(() => {
      fetchUserDetails()
      fetchDepartments()
    })

    return {
      loading,
      departments,
      errorMessages,
      successMessage,
      formData,
      isSubmitting,
      validationErrors,
      submitForm,
      handleClose,
      updatePassword,
      tabs,
      currentTab,
      passwords
    }
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
