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

        <h2 class="text-3xl font-bold mb-6 text-gray-800">Profile</h2>

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

        <!-- User Information Tab -->
        <div v-if="currentTab === 'Information'" class="flex flex-col md:flex-row gap-8">
          <div class="md:w-1/3">
            <div class="flex flex-col items-center">
              <div class="relative w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                <img 
                  v-if="user.profile_picture"
                  :src="`${apiURL}${user.profile_picture}`" 
                  :alt="`${user.first_name}'s profile`"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-4xl text-gray-600">
                  {{ getInitials(user.first_name, user.last_name) }}
                </span>
              </div>
            </div>
            <div class="text-center text-gray-700 font-bold mt-2">
              <p>{{ user.user_type }}</p>
            </div>
            <div class="text-center text-gray-600 mt-1">
              <p>{{ user.custom_id }}</p>
              <p>{{ user.email }}</p>
            </div>
          </div>

          <div class="md:flex-grow">
            <div class="mb-4">
              <label class="block text-gray-700 font-bold mb-1">First Name</label>
              <p>{{ user.first_name }}</p>
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 font-bold mb-1">Last Name</label> 
              <p>{{ user.last_name }}</p>
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 font-bold mb-1">Username</label>
              <p>{{ user.username }}</p>
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 font-bold mb-1">Email</label>
              <p>{{ user.email }}</p>
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 font-bold mb-1">Phone Number</label>
              <p>{{ user.contact_number }}</p>
            </div>
          </div>
        </div>

        <div v-if="successMessage" class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded" role="alert">
          <p class="font-bold">Success</p>
          <p>{{ successMessage }}</p>
        </div>
        <div v-if="errorMessage" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
          <p class="font-bold">Error</p>
          <p>{{ errorMessage }}</p>
        </div>

        <!-- Update Profile Tab -->
        <div v-if="currentTab === 'Update Profile'" class="flex flex-col mb-4 md:flex-row gap-8">
          <div class="md:w-1/3">
            <div class="flex flex-col items-center">
              <div class="relative w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                <img 
                  v-if="user.profile_picture"
                  :src="`${apiURL}${user.profile_picture}`" 
                  :alt="`${user.first_name}'s profile`"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-4xl text-gray-600">
                  {{ getInitials(user.first_name, user.last_name) }}
                </span>
              </div>
              <label v-if="!showCropper" for="photo-upload" 
                     class="flex items-center border-2 border-blue-300 text-black p-2 mt-4 rounded-lg cursor-pointer hover:bg-blue-100 transition-all">
                <i class="fas fa-camera mr-2"></i>
                Upload Photo
              </label>
              <input type="file" id="photo-upload" class="hidden" accept="image/*" @change="onFileSelected">
            </div>

            <!-- Image Cropper Modal -->
            <div v-if="showCropper" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div class="bg-white p-6 rounded-lg max-w-2xl w-full mx-4">
                <h3 class="text-xl font-bold mb-4">Crop Profile Picture</h3>
                <div class="h-96">
                  <img ref="cropperImage" :src="imageUrl" class="max-w-full">
                </div>
                <div class="flex justify-end gap-4 mt-4">
                  <button 
                    @click="cancelCrop" 
                    class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    :disabled="loading"
                  >
                    Cancel
                  </button>
                  <button 
                    @click="cropImage" 
                    class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    :disabled="loading"
                  >
                    {{ loading ? 'Processing...' : 'Crop & Upload' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="md:flex-grow">
            <form @submit.prevent="saveChanges">
              <div class="mb-4">
                <label for="first_name" class="block text-gray-800 font-bold mb-1">First Name</label>
                <input type="text" id="first_name" v-model="user.first_name" 
                class="mt-1 block w-full px-3 py-1.5 border rounded-md bg-gray-100 cursor-not-allowed"
                disabled>
              </div>
              <div class="mb-4">
                <label for="last_name" class="block text-gray-800 font-bold mb-1">Last Name</label>
                <input type="text" id="last_name" v-model="user.last_name" 
                class="w-full px-3 py-1.5 border rounded-md bg-gray-100 cursor-not-allowed"
                disabled>
              </div>
              <div class="mb-4">
                <label for="username" class="block text-gray-700 font-bold mb-1">Username</label>
                <input type="text" id="username" v-model="user.username" class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300">
              </div>
              <div class="mb-4">
                <label for="email" class="block text-gray-700 font-bold mb-1">Email</label>
                <input type="email" id="email" v-model="user.email" class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300">
              </div>
              <div class="mb-4">
                <label for="phone" class="block text-gray-700 font-bold mb-1">Phone Number</label>
                <input type="tel" id="phone" v-model="user.contact_number" class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300">
              </div>
              <div class="flex justify-end">
                <button 
                  type="submit" 
                  :disabled="!hasChanges"
                  class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Change Password Tab -->
        <div v-if="currentTab === 'Change Password'" class="flex flex-col md:flex-row gap-8">
          <div class="md:w-1/3">
            <div class="flex flex-col items-center">
              <div class="relative w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                <img 
                  v-if="user.profile_picture"
                  :src="`${apiURL}${user.profile_picture}`" 
                  :alt="`${user.first_name}'s profile`"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-4xl text-gray-600">
                  {{ getInitials(user.first_name, user.last_name) }}
                </span>
              </div>
            </div>
            <div class="text-center text-gray-700 font-bold mt-2">
              <p>{{ user.user_type }}</p>
            </div>
            <div class="text-center text-gray-600 mt-1">
              <p>{{ user.custom_id }}</p>
              <p>{{ user.email }}</p>
            </div>
          </div>

          <div class="md:flex-grow">
            <form @submit.prevent="updatePassword" class="max-w-md">
              <div class="mb-4">
                <label for="current_password" class="block text-gray-700 font-bold mb-1">Current Password</label>
                <div class="relative">
                  <input 
                    :type="showPasswords.current ? 'text' : 'password'" 
                    id="current_password" 
                    v-model="passwords.current" 
                    class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 pr-10"
                  >
                  <button
                    type="button"
                    @click="togglePassword('current')"
                    class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    <i v-if="showPasswords.current" class="fas fa-eye-slash"></i>
                    <i v-else class="fas fa-eye"></i>
                  </button>
                </div>
              </div>

              <div class="mb-4">
                <label for="new_password" class="block text-gray-700 font-bold mb-1">New Password</label>
                <div class="relative">
                  <input 
                    :type="showPasswords.new ? 'text' : 'password'" 
                    id="new_password" 
                    v-model="passwords.new" 
                    class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 pr-10"
                  >
                <button
                  type="button"
                  @click="togglePassword('new')"
                  class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <i v-if="showPasswords.new" class="fas fa-eye-slash"></i>
                  <i v-else class="fas fa-eye"></i>
                </button>
                </div>
              </div>

              <div class="mb-4">
                <label for="confirm_password" class="block text-gray-700 font-bold mb-1">Confirm New Password</label>
                <div class="relative">
                  <input 
                    :type="showPasswords.confirm ? 'text' : 'password'" 
                    id="confirm_password" 
                    v-model="passwords.confirm" 
                    class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 pr-10"
                  >
                  <button
                    type="button"
                    @click="togglePassword('confirm')"
                    class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    <i v-if="showPasswords.confirm" class="fas fa-eye-slash"></i>
                    <i v-else class="fas fa-eye"></i>
                  </button>
                </div>
              </div>
              <div class="flex justify-end">
                <button 
                  type="submit" 
                  :disabled="!hasChanges"
                  class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script> 
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex'
import axios from 'axios';
import Sidebar from '@/components/UserType/Sidebar.vue';
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";


export default {
  name: 'ProfileView',
  components: { Sidebar },
  setup() {
    const store = useStore();
    const router = useRouter();
    const error = ref('');
    const successMessage = ref('');
    const errorMessage = ref('');
    const defaultImageUrl = 'https://via.placeholder.com/150';
    const cropperImage = ref(null);
    const user = reactive({
      first_name: '',
      last_name: '',
      username: '',
      custom_id: '',
      email: '',
      contact_number: '',
      user_type: '',
      profile_picture: ''
    });
    const originalUser = ref({});
    const isSidebarOpen = ref(true);
    const passwords = reactive({
      current: '',
      new: '',
      confirm: '',
    });
    const tabs = ref(['Information', 'Update Profile', 'Change Password']);
    const currentTab = ref(tabs.value[0]);
    const apiURL = 'http://localhost:8000';
    const token = computed(() => store.state.token);
    const showCropper = ref(false);
    const imageUrl = ref('');
    const cropper = ref(null);
    const loading = ref(false);
    const originalValues = ref({});
    const origanlPassword = ref({});

    watch(currentTab, (newTab) => {
      localStorage.setItem('currentTab', newTab);
      fetchUser();
    });

    const showPasswords = ref({
      current: false,
      new: false,
      confirm: false
    });

    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
      };

    const togglePassword = (field) => {
      showPasswords.value[field] = !showPasswords.value[field];
    };

    const updateOriginalValues = () => {
      originalValues.value = {
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
        contact_number: user.contact_number,
      };
      origanlPassword.value = {
        current: passwords.current,
        new: passwords.new,
        confirm: passwords.confirm,
      };
    };

    // Efficient change detection
    const hasChanges = computed(() => {
      const userChanged = Object.entries(originalValues.value).some(([key, value]) => value !== user[key]);
      const passwordChanged = Object.entries(origanlPassword.value).some(([key, value]) => value !== passwords[key]);
      return userChanged || passwordChanged;
    });

    const fetchUser = async () => {
      try {
        const { data } = await axios.get('/api/user/');
        Object.assign(user, data);
        originalUser.value = { ...user };
        updateOriginalValues();
        if (data.profile_image) {
          profileImage.value = data.profile_image;
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    const saveChanges = async () => {
      if (!hasChanges.value) return;
        try {
          // Create a copy of user data without the profile_picture
          const userData = { ...user };
          delete userData.profile_picture;  // Remove profile_picture from the update data
          
          const { data } = await axios.put('/api/user/update/', userData);
          successMessage.value = 'Profile updated successfully!';
          setTimeout(() => {
            successMessage.value = '';
          }, 3000);
          originalUser.value = { ...data };
          updateOriginalValues();
        } catch (error) {
          console.error('Error updating profile:', error);
          alert('Failed to update profile. Please try again.');
        }
    };

    const onFileChange = async (e) => {
      const file = e.target.files[0];
      if (file) {
          const formData = new FormData();
          formData.append('profile', file);

          try {
              // Get CSRF token from cookie
              function getCookie(name) {
                  let cookieValue = null;
                  if (document.cookie && document.cookie !== '') {
                      const cookies = document.cookie.split(';');
                      for (let i = 0; i < cookies.length; i++) {
                          const cookie = cookies[i].trim();
                          if (cookie.substring(0, name.length + 1) === (name + '=')) {
                              cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                              break;
                          }
                      }
                  }
                  return cookieValue;
              }

            const { data } = await axios.put('/api/profile-upload/', formData, {
                  headers: {
                      'Authorization': `Token ${token.value}`,
                      'X-CSRFToken': getCookie('csrftoken'),  // Add CSRF token
                  },
                  withCredentials: true  
              });
              
              profileImage.value = data.profile_picture;
              successMessage.value = 'Profile picture uploaded successfully!';
              setTimeout(() => {
                successMessage.value = '';
              }, 3000);
              fetchUser();
          } catch (error) {
              console.error('Error uploading image:', error);
              alert('Failed to upload image. Please try again.');
          }
        }
    };

    const initializeCropper = () => {
      if (cropperImage.value && imageUrl.value) {
        // Destroy existing cropper instance if it exists
        if (cropper.value) {
          cropper.value.destroy();
        }

        // Initialize new cropper instance
        cropper.value = new Cropper(cropperImage.value, {
          aspectRatio: 1,
          viewMode: 1,
          dragMode: 'move',
          autoCropArea: 1,
          responsive: true,
          restore: false,
          guides: true,
          center: true,
          highlight: false,
          cropBoxMovable: true,
          cropBoxResizable: true,
          toggleDragModeOnDblclick: false,
        });
      }
    };

    watch(() => imageUrl.value, (newValue) => {
      if (newValue) {
        nextTick(() => {
          initializeCropper();
        });
      }
    });

    const onFileSelected = (e) => {
      const file = e.target.files[0];
      if (file) {
        imageUrl.value = URL.createObjectURL(file);
        showCropper.value = true;
      }
    };

    const cancelCrop = () => {
      if (cropper.value) {
        cropper.value.destroy();
        cropper.value = null;
      }
      showCropper.value = false;
      imageUrl.value = '';
    };

    const getCookie = (name) => {
      let cookieValue = null;
      if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
            break;
          }
        }
      }
      return cookieValue;
    };

    const cropImage = async () => {
        if (!cropper.value) {
          error.value = 'Cropper not initialized';
          return;
        }

        try {
          loading.value = true;
          const canvas = cropper.value.getCroppedCanvas({
            width: 300,
            height: 300,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
          });

          const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/jpeg', 0.9);
          });

          const formData = new FormData();
          formData.append('profile', blob, 'profile.jpg');

          const response = await axios.put('/api/profile-upload/', formData, {
            headers: {
              'Authorization': `Token ${token.value}`,
              'X-CSRFToken': getCookie('csrftoken'),
              'Content-Type': 'multipart/form-data'
            },
            withCredentials: true
          });

          user.profile_picture = response.data.profile_picture;
          successMessage.value = 'Profile picture updated successfully!';
          setTimeout(() => {
            successMessage.value = '';
          }, 3000);
          showCropper.value = false;
          cancelCrop();
          await fetchUser();
        } catch (err) {
          error.value = 'Failed to upload image. Please try again.';
          console.error('Error uploading image:', err);
        } finally {
          loading.value = false;
        }
      };



      const updatePassword = async () => {
      // Validate current password
      if (!passwords.current) {
        errorMessage.value = 'Please enter your current password.';
        setTimeout(() => {
          errorMessage.value = '';
        }, 3000);
        return;
      }

      // Validate new password length
      if (!passwords.new || passwords.new.length < 5) {
        errorMessage.value = 'New password must be at least 5 characters long.';
        setTimeout(() => {
          errorMessage.value = '';
        }, 3000);
        return;
      }

      // Validate password confirmation
      if (passwords.new !== passwords.confirm) {
        errorMessage.value = 'The new password and confirm password do not match.';
        setTimeout(() => {
          errorMessage.value = '';
        }, 3000);
        return;
      }

      // Check if new password is same as current password
      if (passwords.new === passwords.current) {
        errorMessage.value = 'New password cannot be the same as the current password.';
        setTimeout(() => {
          errorMessage.value = '';
        }, 3000);
        return;
      }

      loading.value = true;

      try {
        const response = await axios.post('/api/user/change_password/', passwords);
        successMessage.value = response.data.message || 'Password updated successfully!';
        setTimeout(() => {
          successMessage.value = '';
        }, 3000);
        Object.assign(passwords, { current: '', new: '', confirm: '' });
        updateOriginalValues();
      } catch (error) {
        console.error('Error updating password:', error);
        if (error.response?.data?.error) {
          errorMessage.value = error.response.data.error;
        } else if (error.response?.status === 400) {
          errorMessage.value = 'Failed to update password. The current password may be incorrect.';
        } else {
          errorMessage.value = 'Failed to update password. Please try again.';
        }
        setTimeout(() => {
          errorMessage.value = '';
        }, 3000);
      } finally {
        loading.value = false;
      }
    };

    const handleSidebarToggle = () => {
      isSidebarOpen.value = !isSidebarOpen.value;
    };

    const goBack = () => {
      router.go(-1);
    }

    onMounted(() => {
      fetchUser();

      if (imageUrl.value) {
        cropper.value = new Cropper(document.getElementById('image-preview'), {
          aspectRatio: 1,
          viewMode: 1,
          autoCropArea: 1,
        });
      }

      if (!localStorage.getItem('currentTab')) {
        currentTab.value = 'Information';
        localStorage.setItem('currentTab', 'Information');
      }

      axios.defaults.xsrfCookieName = 'csrftoken';
      axios.defaults.xsrfHeaderName = 'X-CSRFToken';
      isSidebarOpen.value = window.innerWidth >= 1024;
    });

    return {
      user,
      tabs,
      error,
      successMessage,
      errorMessage,
      defaultImageUrl,
      togglePassword,
      showPasswords,
      getInitials,
      store,
      router,
      apiURL,
      loading,
      originalUser,
      updateOriginalValues,
      currentTab,
      passwords,
      hasChanges,
      saveChanges,
      updatePassword,
      goBack,
      isSidebarOpen,
      handleSidebarToggle,
      onFileSelected,
      cancelCrop,
      cropImage,
      imageUrl,
      showCropper,
      cropper,
      cropperImage,
      onFileChange

    };
  },
};
</script>