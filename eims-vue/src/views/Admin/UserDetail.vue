<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
    <div class="relative bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl">

      <!-- <div class="max-w-full bg-white/80 backdrop-blur-md shadow-lg rounded-lg p-8"> -->

        <button 
          class="absolute top-4 right-4 text-gray-700 hover:text-gray-900 focus:outline-none"
          @click="handleClose"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span class="sr-only">Close modal</span>
        </button>

        <h1 class="text-2xl font-bold mb-6">User Details</h1>

        

        <div v-if="loading" class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <div v-else-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p class="font-bold">Error</p>
          <p>{{ error }}</p>
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        
        <!-- Profile Card -->
        <div class="bg-white/80 backdrop-blur-md rounded-lg shadow-lg p-6">
          <div class="flex flex-col items-center">
            <div class="relative">
              <div class="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                <img 
                  v-if="showImage && user.profile_picture_url" 
                  :src="user.profile_picture_url"
                  :alt="`${user.first_name}'s profile`"
                  class="w-full h-full object-cover"
                  @error="onImageError"
                />
                <span v-else class="text-4xl text-gray-600">
                  {{ getInitials(user.first_name, user.last_name) }}
                </span>
              </div>
              <span 
                :class="[
                  'absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white',
                  user.is_active ? 'bg-green-400' : 'bg-red-400'
                ]"
              ></span>
            </div>
            
            <h2 class="mt-4 text-xl font-semibold text-gray-900">
              {{ user.first_name }} {{ user.last_name }}
            </h2>
            <p class="text-gray-600">{{ user.user_type }}</p>
            <p class="text-sm text-gray-500">{{ user.department?.name }}</p>

            <div class="mt-6 w-full">
              <div class="flex items-center mb-3">
                <i class="fas fa-envelope text-gray-400 w-5"></i>
                <span class="ml-2 text-gray-600 text-sm">{{ user.email || 'No email provided' }}</span>
              </div>
              <div class="flex items-center mb-3">
                <i class="fas fa-phone text-gray-400 w-5"></i>
                <span class="ml-2 text-gray-600 text-sm">{{ user.contact_number || 'No contact number' }}</span>
              </div>
              <div class="flex items-center">
                <i class="fas fa-id-card text-gray-400 w-5"></i>
                <span class="ml-2 text-gray-600 text-sm">{{ user.custom_id || 'No employee ID' }}</span>
              </div>
            </div>
            </div>  
          </div>


        <!-- Details Section -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Account Information -->
          <div class="bg-white/80 backdrop-blur-md rounded-lg shadow-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-gray-500">Username</label>
                <p class="text-gray-900">{{ user.username }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500">Account Status</label>
                <p>
                  <span 
                    :class="[
                      'px-2 py-1 text-xs font-medium rounded-full',
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    ]"
                  >
                    {{ user.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <!-- System Permissions -->
          <div class="bg-white/80 backdrop-blur-md rounded-lg shadow-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">System Permissions</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div v-for="(value, key) in userPermissions" :key="key" class="flex items-center">
                <span 
                  :class="[
                    'w-3 h-3 rounded-full mr-2',
                    value ? 'bg-green-400' : 'bg-gray-300'
                  ]"
                ></span>
                <span class="text-sm text-gray-700">{{ formatPermissionName(key) }}</span>
              </div>
            </div>
          </div>
        </div>
     </div>
    </div>
  </div>
</template>
  
  <script>
  import { defineComponent, ref, onMounted, computed} from 'vue';
  import { useStore } from 'vuex';
  import { useRoute, useRouter } from 'vue-router'
  import axios from 'axios';
  import Sidebar from '@/components/UserType/Sidebar.vue';

  export default defineComponent({
    name: 'UserDetailsView', 
    components: {
      Sidebar
    },
    props: {
      isOpen: {
        type: Boolean,
        required: true
      },
      user: {
        type: [Number, String],
        required: true
      }
    },
    emits: ['close'],
  
    setup(props , { emit }) {
      const route = useRoute()
      const store = useStore();
      const user = ref(null)
      const router = useRouter();
      const loading = ref(true);
      const userDetails = ref({});
      const error = ref(null);
      const isSidebarOpen = ref(true);
      const apiURL = 'https://iims-django.onrender.com';
      const showImage = ref(true);



      const onImageError = (event) => {
        showImage.value = false;
      }

      const fetchUserDetails = async () => {
        loading.value = true
        error.value = null
        try {
          const response = await axios.get(`/api/user/${props.user.id}/update/`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            },
          })
          user.value = response.data
        } catch (err) {
          console.error("Error fetching user details:", err)
          error.value = "Failed to fetch user details. Please try again."
        } finally {
          loading.value = false
        }
      }

  
      const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
      };
  
      const formatDate = (date) => {
        if (!date) return null;
        return new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      };
  
      const goBack = () => {
        router.go(-1);
      };
  
      const userPermissions = computed(() => ({
        is_admin: user.value.is_admin,
        is_staff: user.value.is_staff,
        is_secretary: user.value.is_secretary,
        is_labtech: user.value.is_labtech,
        is_dean: user.value.is_dean
      }));
  
      const formatPermissionName = (key) => {
        return key
          .replace('is_', '')
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      };
  
      const getActivityIcon = (type) => {
        const icons = {
          login: 'fas fa-sign-in-alt',
          logout: 'fas fa-sign-out-alt',
          update: 'fas fa-edit',
          create: 'fas fa-plus',
          delete: 'fas fa-trash',
          default: 'fas fa-circle'
        };
        return icons[type] || icons.default;
      };

      const handleClose = () => {
        emit('close');
      }

      const handleSidebarToggle = () => {
        isSidebarOpen.value = !isSidebarOpen.value;
      };
  
      onMounted(() => {
        fetchUserDetails();

        isSidebarOpen.value = window.innerWidth >= 1024;
      });
  
      return {
        user,
        loading,
        onImageError,
        showImage,
        userDetails,
        isSidebarOpen,
        error,
        apiURL,
        getInitials,
        formatDate,
        goBack,
        handleClose,
        userPermissions,
        formatPermissionName,
        handleSidebarToggle,
        getActivityIcon
      };
    }
  });
  </script>