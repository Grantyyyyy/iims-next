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
          <!-- Back Button -->
          <button @click="goBack" class="group flex items-center mb-6 text-gray-700 hover:text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
  
          <div class="flex flex-wrap justify-between items-center mb-6 gap-4">
            <h1 class="text-3xl font-bold text-gray-800 flex-grow">
              Apparatus Details
            </h1>
  
            <div v-if="instance" class="flex space-x-4 items-center">
              <div
                v-if="userType === 'Dean'" 
                :class="[ 
                  'px-4 py-2 rounded-full font-semibold text-sm transition-colors duration-200',
                  instance.is_borrowed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800' 
                ]">
                {{ instance.is_borrowed ? 'Currently Borrowed' : 'Available' }}
              </div>
  
              <div 
                class="px-4 py-2 rounded-full font-semibold text-sm bg-gray-100 text-gray-800">
                {{ instance.status }}
              </div>
            </div>
          </div>
  
          <!-- Loading and Error States -->
          <div v-if="loading" class="flex justify-center items-center h-32">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
  
          <div v-else-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
            <div class="flex items-center">
              <svg class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <p class="font-bold">Error Loading Details</p>
            </div>
            <p class="mt-1">{{ error }}</p>
            <button @click="fetchInstanceDetails" class="mt-2 text-sm text-blue-500 hover:underline">
              Retry Loading
            </button>
          </div>
  
          <div v-else-if="instance" class="space-y-6">
            <!-- Quick Overview Card -->
            <div class="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-blue-600">Item Name</span>
                  <span class="text-lg font-semibold">{{ instance.apparatus.name }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-blue-600">Inventory Item No.</span>
                  <span class="text-lg font-mono">{{ instance?.inventory_number }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-blue-600">Condition</span>
                  <span :class="[
                    'text-lg font-semibold px-3 py-1 rounded-full self-start',
                    getConditionClass(instance.current_condition)
                  ]">
                    {{ instance.current_condition }}
                  </span>
                </div>
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-blue-600">Serial No.</span>
                  <span class="text-lg font-semibold">{{ instance.serial_number ? instance.serial_number : 'N/A' }}  </span>
                </div>
              </div>
              <div class="mt-4">
                <span class="text-sm font-medium text-blue-600">Description</span>
                <p class="text-gray-600 mt-2">
                  {{ instance.apparatus.description }}
                </p>
              </div>
            </div>
  
            <div class="bg-white rounded-lg shadow-sm border p-6" >
              <h3 class="text-xl font-semibold mb-4 text-gray-800">Borrowing History</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Current Borrowing -->
                <div v-if="instance.current_borrow_record" class="bg-yellow-50 p-4 rounded-lg">
                  <h4 class="font-medium text-yellow-800 mb-2">Current Borrowing</h4>
                  <div class="space-y-2">
                    <div class="flex items-center">
                      <span class="text-yellow-800">Borrowed By:</span>
                      <span class="ml-2 font-semibold">
                        {{ instance.current_borrow_record?.borrower }} 
                      </span>
                    </div>
                    <div class="flex items-center">
                      <span class="text-yellow-800">Since:</span>
                      <span class="ml-2 font-semibold">{{ formatDate(instance.current_borrow_record?.borrowed_date) }}</span>
                    </div>
                  </div>
                </div>
  
                <!-- Last Borrowing -->
                <div v-if="instance.last_borrow_record" class="bg-gray-50 p-4 rounded-lg">
                  <h4 class="font-medium text-gray-700 mb-2">Previous Borrower</h4>
                  <div class="space-y-2">
                    <div class="flex items-center">
                      <span class="text-gray-600">Borrowed By:</span>
                      <span class="ml-2">
                        {{ instance.last_borrow_record?.borrower }}
                      </span>
                    </div>
                    <div class="flex items-center">
                      <span class="text-gray-600">Condition Before:</span>
                      <span class="ml-2">
                        {{ instance.last_condition }}
                      </span>
                    </div>
                    <div class="flex items-center">
                      <span class="text-gray-600">Date Borrowed:</span>
                      <span class="ml-2">{{ formatDate(instance.last_borrow_record?.borrowed_date) }}</span>
                    </div>
                    <div class="flex items-center">
                      <span class="text-gray-600">Date Returned:</span>
                      <span class="ml-2">
                        {{ formatDate(instance.last_borrow_record?.returned_date) }} 
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
  
            <div v-if="instance.barcode_url" class="bg-white rounded-lg shadow-sm border p-6">
              <h3 class="text-xl font-semibold mb-4 text-gray-800">Barcode</h3>
              <div class="flex justify-center">
                <img :src="instance.barcode_url" alt="Apparatus Barcode" class="h-24 border rounded" />
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { defineComponent, ref,  onMounted, computed,  } from 'vue';
  import { useStore } from 'vuex';
  import axios from 'axios';
  import { onUnmounted } from 'vue';
  import Sidebar from '@/components/UserType/Sidebar.vue';
  import { useRouter } from 'vue-router';
  
  export default defineComponent({
    name: 'ApparatusDetail',
    components: { Sidebar },
    props: {
      apId: {
        type: String,
        required: true
      }
    },
    setup(props) {
      const store = useStore();
      const router = useRouter();
      const instance = ref(null);
      const loading = ref(true);
      const error = ref(null);
      const isSidebarOpen = ref(false);
      const userType =computed(() => store.state.userType);
      const handleResize = () => {
        isSidebarOpen.value = window.innerWidth >= 768;
      }
  
      const getConditionClass = (condition) => {
        const classes = {
          'Good': 'bg-green-100 text-green-800',
          'Fair': 'bg-yellow-100 text-yellow-800',
          'Poor': 'bg-blue-100 text-blue-800',
          'Damaged': 'bg-red-100 text-red-800'
        };
        return classes[condition] || 'bg-gray-100 text-gray-800';
      };
  
      const fetchInstanceDetails = async () => {
        loading.value = true;
        error.value = null;
        try {
          const response = await axios.get(`/api/apparatus-instances/${props.apId}/detail/`);
          instance.value = response.data;
        } catch (err) {
          error.value = "Failed to fetch item instance details";
          console.error(err);
        } finally {
          loading.value = false;
        }
      };
  
      const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      };
  
      const goBack = () => {
        router.back();
      };
  
      onMounted(() => {
        fetchInstanceDetails();
        isSidebarOpen.value = window.innerWidth >= 1024;
        window.addEventListener('resize', handleResize);
      });
  
      onUnmounted(() => {
        window.removeEventListener('resize', handleResize);
      });
  
      const handleSidebarToggle = () => {
        isSidebarOpen.value = !isSidebarOpen.value;
      };
  
      return {
        instance,
        loading,
        error,
        userType,
        formatDate,
        getConditionClass,
        fetchInstanceDetails,
        goBack,
        isSidebarOpen,
        handleSidebarToggle,
        handleResize
  
        
      };
    }
  });
  </script>
  
  <style scoped>
  .info-item {
    @apply mb-2;
  }
  
  @screen md {
    .info-item {
      @apply mb-0;
    }
  }
  </style>