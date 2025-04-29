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
  
        <h1 class="text-3xl font-bold mb-6 text-gray-800">Borrowed Items</h1> 
  
        <div v-if="loading" class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <div v-else-if="error" class="text-center text-red-500">{{ error }}</div>
        <div v-else-if="borrowedItems.length === 0" class="text-center text-gray-500 text-lg my-8">
          No borrowed items found.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th v-for="header in tableHeaders" 
                    :key="header" 
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ header }}
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" v-if="userType === 'Secretary'">
                  Action
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="borrowedItem in borrowedItems" :key="borrowedItem.id" class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer">
                <td class="px-4 py-4">
                  <div class="text-sm font-medium text-gray-900">
                    {{ borrowedItem.item_instance.item.name }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-900">
                    {{ borrowedItem.borrower.first_name }} {{ borrowedItem.borrower.last_name }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-900">
                    {{ borrowedItem.room.name }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-900">
                    {{ formatDate(borrowedItem.borrow_date) }}
                  </div>
                </td>
                <td class="px-4 py-4" v-if="userType === 'Secretary'">
                  <div class="flex justify-end">
                    <button @click.stop="openReturnForm(borrowedItem.item_instance.id)" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                      Return
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        </div>  
      </div>
      <ReturnForm
        v-if="showReturnForm" 
        :instanceId="selectedInstanceId" 
        @close="closeReturnForm" 
        @itemReturned="fetchBorrowedItems"
      />
    </div>
  </template>
  
  <script>
  import { defineComponent, ref, onMounted, computed } from 'vue';
  import { useStore } from 'vuex';
  import { useRouter, useRoute } from 'vue-router'; 
  import Sidebar from '@/components/UserType/Sidebar.vue';
  import ReturnForm from '../Secretary/ReturnForm.vue';
  import axios from 'axios';
  
  export default defineComponent({
    name: 'StaffBorrowedList',
    components: {
      Sidebar,
      ReturnForm
    },
    setup() {
      const store = useStore();
      const router = useRouter();
      const route = useRoute();
      const loading = ref(true);
      const error = ref(null);
      const borrowedItems = ref([]);
      const isSidebarOpen = ref(false);
      const userType = computed(() => store.state.userType);
      const showReturnForm = ref(false);
      const selectedInstanceId = ref(null);
      const userBarcode = computed(() => route.params.barcode);
  
      const tableHeaders = ['Item', 'Borrower', 'Room', 'Borrow Date'];
  
      const fetchBorrowedItems = async () => {
        try {
          const response = await axios.get(`/api/staff-borrowed-items/?barcode=${userBarcode.value}`);
          borrowedItems.value = response.data;
          loading.value = false;
        } catch (err) {
          if (err.response && err.response.status === 403) {
            error.value = "You are not authorized to view this data";
          } else {
            error.value = err.message;
          }
          loading.value = false;
        }
      };
  
      const openReturnForm = (instanceId) => {
        selectedInstanceId.value = instanceId;
        showReturnForm.value = true;
      };
  
      const closeReturnForm = () => {
        showReturnForm.value = false;
        selectedInstanceId.value = null;
      };
  
      const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString()
       }
  
      const handleSidebarToggle = (isOpen) => {
        isSidebarOpen.value = isOpen;
      };
  
      const goBack = () => {
        router.go(-1);
      };
  
      onMounted(() => {
        fetchBorrowedItems();
        isSidebarOpen.value = window.innerWidth >= 1024;
      });
  
      return {
        loading,
        error,
        tableHeaders,
        userType,
        borrowedItems,
        isSidebarOpen,
        userBarcode,
        showReturnForm,
        selectedInstanceId,
        openReturnForm,
        closeReturnForm,
        formatDate,
        handleSidebarToggle,
        goBack
      };
    }
  });
  </script>