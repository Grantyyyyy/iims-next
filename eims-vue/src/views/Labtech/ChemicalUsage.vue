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

        <h1 class="text-3xl font-bold mb-6 text-gray-800">Chemical Usage</h1>

        <div class="flex justify-between mb-6">
        <input
            v-model="searchQuery"
            type="text"
            placeholder="Search users..."
            class="border border-gray-300 rounded py-2 px-4 "
        />
        </div>

        <div v-if="loading" class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <div v-else-if="usage.length === 0" class="text-center text-gray-500 text-lg my-8">
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
                        v-for="chemical in usage" 
                        :key="chemical.id" 
                        class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
                    >
                        <td class="px-4 py-4">
                            <div class="text-sm font-medium text-gray-900">
                                {{ chemical.requested_chemical?.chemical.name  }}
                            </div>
                            <div class="text-sm text-gray-900">
                                {{ chemical.requested_chemical?.inventory_number }}
                            </div>
                        </td>
                        <td class="px-4 py-4">
                            <div class="text-sm text-gray-900">
                                {{ formatVolume(chemical.quantity_requested)  }} {{ chemical.request_unit }}
                            </div>
                        </td>
                        <td class="px-4 py-4">
                            <div class="px-5 text-xs py-1 bg-blue-100 w-fit text-blue-800 rounded-full" >
                                {{ chemical.borrower }}
                            </div>
                        </td>
                        <td class="px-4 py-4">
                            <div class="text-xs text-gray-900">
                                {{ chemical.subject }}
                            </div>
                        </td>
                        <td class="px-4 py-4">
                            <div class="text-sm text-gray-900">
                                {{ chemical.room?.name || 'No Room' }}
                            </div>
                            <div class="text-sm text-gray-500">
                                {{ formatDate(chemical.date_used) }}
                            </div>
                        </td>
                        <td>
                            <div class="text-sm text-gray-900">
                                {{ chemical.purpose }}
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
    </div>
</div>
</template>

<script>
import { defineComponent, computed, watch } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import Sidebar from '@/components/UserType/Sidebar.vue';
import { onMounted, ref } from 'vue';

export default defineComponent({
    name: 'ChemicalUsage',
    components: {
        Sidebar
    },
    setup() {
        const router = useRouter();
        const usage = ref([]);
        const tableHeaders = ['Chemical', 'Quantity Used', 'Borrower', 'Subject',  'Room', 'Purpose'];
        const isSidebarOpen = ref(false);
        const searchQuery = ref('');
        const currentPage = ref(1);
        const totalPages = ref(0);
        const pageSize = ref(10);

        const fetchUsage = async () => {
            try {
                const response = await axios.get('/api/chemical-usage/', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    },
                    params: {
                        page: currentPage.value,
                        page_size: pageSize.value,
                        search: searchQuery.value
                    }
                });
                usage.value = response.data.results;
                totalPages.value = Math.ceil(response.data.count / pageSize.value);
            } catch (error) {
                console.error('Error fetching usage:', error);
            }
        };

        watch([searchQuery], () => {
            currentPage.value = 1;  
            fetchUsage();
        }, { immediate: true });
            
        const nextPage = () => {
            if (currentPage.value < totalPages.value) {
            currentPage.value++;
            fetchUsage();
            }
        };
    
        const prevPage = () => {
            if (currentPage.value > 1) {
            currentPage.value--;
            fetchUsage();
            }
        };

        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true

                
            });
        };

        const formatVolume = (volume, unit) => {
            const v = parseFloat(volume);
            if (isNaN(v)) return volume;

            if (v % 1 === 0) `0 ${unit}`;

            return `${parseFloat(v.toFixed(3))} `;

        }


        const goBack = () => {
            router.go(-1);
        };

        const handleSidebarToggle = (isOpen) => {
            isSidebarOpen.value = isOpen;
        };

        const filteredUsage = computed(() => {
            if (!searchQuery.value) return usage.value;
            const query = searchQuery.value.toLowerCase();
            return usage.value.filter((usageItem) => {
                return (
                    (usageItem.chemical_stock.chemical_batch.chemical_details.name || '').toLowerCase().includes(query) ||
                    (usageItem.chemical_stock.inventory_number || '').toLowerCase().includes(query) ||
                    (usageItem.chemical_stock.chemical_batch.batch_details.batch_number || '').toLowerCase().includes(query) ||
                    (usageItem.quantity_used?.toString() || '').toLowerCase().includes(query) || // Fixed: using toString for numbers and defaulting to empty string
                    (usageItem.borrower.first_name || '').toLowerCase().includes(query) ||
                    (usageItem.borrower.last_name || '').toLowerCase().includes(query) ||
                    (usageItem.room?.name || '').toLowerCase().includes(query) || // Ensure room.name is not null/undefined
                    (usageItem.date_used || '').toLowerCase().includes(query) || // Ensure date_used is not null/undefined
                    (usageItem.purpose || '').toLowerCase().includes(query)
                );
            });
        });


        onMounted(() => {
            fetchUsage();

            isSidebarOpen.value = window.innerWidth >= 1024;
        });

        return {
            router,
            usage,
            currentPage,
            totalPages,
            pageSize,
            nextPage,
            prevPage,
            tableHeaders,
            isSidebarOpen,
            goBack,
            handleSidebarToggle,
            searchQuery,
            filteredUsage,
            formatDate,
            formatVolume,
        };
    },
})


</script>