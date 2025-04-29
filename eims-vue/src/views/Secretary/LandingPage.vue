<template>
  <div class="flex h-screen bg-gradient-to-b from-[#F5F4F1] to-[#D4EAF7]">
    <Sidebar />
    <div class="flex-1 overflow-x-auto p-8 ml-64 relative">
      <div class="max-w-4xl mx-auto bg-white/80 backdrop-blur-md shadow-lg rounded-lg overflow-hidden">
        <div class="p-8">
          <h1 class="text-3xl font-bold mb-6 text-gray-800">User Information</h1>
          
          <!-- Loading State -->
          <div v-if="loading" class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>

          <!-- User Information -->
          <div v-else-if="user" class="mb-8 space-y-4">
            <div v-for="(value, key) in userDisplayInfo" :key="key" 
                 class="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors duration-150">
              <span :class="iconClasses[key]">
                <i :class="icons[key]"></i>
              </span>
              <div>
                <p class="text-sm text-gray-500">{{ labels[key] }}</p>
                <p class="font-semibold text-gray-800">{{ value }}</p>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div v-if="user" class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <button @click="borrow" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-150 flex items-center justify-center">
              <i class="fas fa-hand-holding mr-2"></i> Borrow Item
            </button>
            <button @click="returnItem" class="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-150 flex items-center justify-center">
              <i class="fas fa-undo mr-2"></i> Return Item
            </button>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="mt-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
            <p class="font-bold">Error</p>
            <p>{{ error }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import Sidebar from '@/components/UserType/Sidebar.vue';

export default defineComponent({
  name: 'LandingPage',
  components: {
    Sidebar
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const user = ref(null);
    const error = ref(null);
    const loading = ref(true);
    const barcode = ref(route.params.barcode);

    const icons = {
      name: 'fas fa-user-circle fa-lg',
      custom_id: 'fas fa-id-card fa-lg',
      user_type: 'fas fa-user-tag fa-lg'
    };

    const iconClasses = {
      name: 'text-blue-600',
      custom_id: 'text-green-600',
      user_type: 'text-purple-600'
    };

    const labels = {
      name: 'Name',
      custom_id: 'ID Number',
      user_type: 'User Type'
    };

    const userDisplayInfo = computed(() => {
      if (!user.value) return {};
      return {
        name: user.value.name,
        custom_id: user.value.custom_id,
        user_type: user.value.user_type
      };
    });

    const fetchUserData = async () => {
      loading.value = true;
      error.value = null;
      try {
        const response = await axios.get(`/api/user-barcode/?barcode=${barcode.value}`);
        user.value = response.data;
      } catch (err) {
        console.error('Error fetching user data:', err);
        error.value = 'Failed to fetch user data. Please try scanning again.';
        user.value = null;
      } finally {
        loading.value = false;
      }
    };

    const borrow = () => {
      if (user.value && barcode.value) {
        router.push({ name: 'ItemBorrow', params: { barcode: barcode.value } });
      } else {
        error.value = 'User data not available. Please try scanning again.';
      }
    };

    const returnItem = () => {
      if (user.value && barcode.value) {
        router.push({ name: 'StaffBorrowedList', params: { barcode: barcode.value } });
      } else {
        error.value = 'User data not available. Please try scanning again.';
      }
    };

    onMounted(fetchUserData);

    return {
      user,
      error,
      loading,
      borrow,
      returnItem,
      icons,
      iconClasses,
      labels,
      userDisplayInfo
    };
  }
});
</script>