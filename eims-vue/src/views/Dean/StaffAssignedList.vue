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

            
            <h1 class="text-3xl font-bold mb-6 text-gray-800">Assigned Items {{ userName }}</h1>

            <div v-if="loading" class="flex justify-center items-center h-64">
                <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>

            <div v-else-if="assigned.length === 0" class="text-center text-gray-500 text-lg my-8">
                No assigned items found.
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
                        </tr>
                        </thead>    
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr 
                                    v-for="assign in assigned" 
                                    :key="assign.id"
                                    @click="navigateToItemDetails(assign.item_instance.id)"
                                    class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
                                >
                                    <td class="px-4 py-4">
                                        <div class="text-sm font-medium text-gray-900">
                                            {{ assign.item_instance.item.name }}
                                        </div>
                                        <div class="text-sm text-gray-500">
                                            {{ assign.item_instance.item.description }}
                                        </div>
                                    </td>
                                    <td class="px-4 py-4">
                                        <div class="text-sm text-gray-900" @click.stop>
                                            {{ assign.item_instance.serial_number }}
                                        </div>
                                    </td> 
                                    <td class="px-4 py-4">
                                        <div class="text-sm text-gray-900">
                                            {{ assign.item_instance.current_condition }}
                                        </div>
                                    </td>
                                    <td class="px-4 py-4">
                                        <div class="text-sm text-gray-900">
                                            {{ assign.item_instance.item_batch.batch_details.batch_number }}
                                        </div>
                                    </td>
                                    <td class="px-4 py-4">
                                        <div    class="flex">
                                        <div>
                                            <div class="text-xs text-gray-500 uppercase mb-1">Current Assignee</div>
                                            <div class=" px-5 text-xs py-1 bg-red-100 text-red-800 rounded-full ">
                                            {{ assign.assignee.first_name }} {{ assign.assignee.last_name }}
                                            </div>
                                            <div class="text-xs text-gray-500">
                                            <div>At: {{ formatDate(assign.assign_date) }}</div>
                                            <div>In: {{ assign.room.name }}</div>
                                            </div>
                                        </div>
                                        </div>
                                    </td>
                                </tr>    
                            </tbody>
                    </table>
                                
                </div> 
            </div>  
        </div>
    </div>
</template>

<script>
import { defineComponent, ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router'; 
import Sidebar from '@/components/UserType/Sidebar.vue';
import axios from 'axios';

export default defineComponent({
    name: 'StaffAssignedList',
    components: {
        Sidebar
    },
    setup(props) {
        const store = useStore();
        const router = useRouter();
        const route = useRoute();
        const loading = ref(true);
        const userType = computed(() => store.state.userType)
        const error = ref(null);
        const assigned = ref([]);
        const isSidebarOpen = ref(false);
        const userName =  computed(() => route.params.username);
        const userBarcode = computed(() => route.params.barcode)

        const tableHeaders = ['Item Name', 'Serial Number', 'Condition', 'Batch',  'Assigned Info'];
        

        const fetchAssignedItems = async () => {
            try {
                const response = await axios.get(`/api/staff-assigned-items/?barcode=${userBarcode.value}`);
                assigned.value = response.data;
                loading.value = false; // Add this line to set loading to false on success
            } catch (err) {
                if (err.response && err.response.status === 403) {
                    error.value = "You are not authorized to view this data";
                } else {
                    error.value = err.message;
                }
                loading.value = false;
            }
        };

        onMounted(() => {
            fetchAssignedItems();

            isSidebarOpen.value = window.innerWidth >= 1024;
        });

        const handleSidebarToggle = (isOpen) => {
            isSidebarOpen.value = isOpen;
        };

        const goBack = () => {
            router.go(-1);
        };

        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
            });
        };

      const navigateToItemDetails = (itemId) => {
            router.push({ name: 'ItemInstancesDetail', params: { id: itemId } })
        }


    
    return {
        loading,
        error,
        assigned,
        
        tableHeaders,
        userType,
        assigned,
        isSidebarOpen,
        userBarcode,
        userName,
        handleSidebarToggle,
        goBack,
        formatDate,
        navigateToItemDetails
    };
    },
})
</script>