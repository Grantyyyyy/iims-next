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

            <h1 class="text-3xl font-bold mb-6 text-gray-800">Assigned Chemical</h1>

            <input
                v-model="searchQuery"
                type="text"
                placeholder="Search..."
                class="border border-gray-300 rounded py-2 px-4"
            />

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
                            <th v-for="header in visibleHeaders" 
                                :key="header" 
                                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {{ header }}
                            </th>
                        </tr>
                        </thead>    
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr 
                                    v-for="assign in filteredChemicals" 
                                    :key="assign.id" 
                                    class="bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
                                    :class="{
                                        'bg-red-50': assign.remaining_volume === '0.00' && userType !== 'Supply Office',
                                    }"
                                    >   
                                    <td class="px-4 py-4">
                                        <div class="text-sm font-medium text-gray-900">
                                            {{ assign.chemical_stock.price }}
                                        </div>
                                    </td>
                                    <td class="px-4 py-4">
                                        <div class="text-sm font-medium text-gray-900">
                                            <!-- {{ assign.chemical_stock.chemical_batch.chemical_details?.name }} -->
                                        </div>
                                        <div class="text-xs text-gray-600">
                                            {{ assign.chemical_stock.inventory_number }}
                                        </div>
                                        <!-- <div class="text-sm text-gray-500" v-if="userType === 'Dean'">
                                            {{ assign.chemical_stock.chemical_batch.chemical_details?.description }}
                                        </div> -->
                                    </td>
                                    <!-- <td  class="px-4 py-4"  >
                                        <div class="text-sm font-medium text-gray-900">
                                            {{ assign.chemical_stock.chemical_batch.batch_details.batch_number }}
                                        </div>
                                    </td>
                                    <td class="px-4 py-4" v-if ="userType === 'Dean' || userType === 'Lab Technician'" >
                                        <div class="text-sm font-medium " :class="{
                                            'text-red-600': assign.remaining_volume === '0.00'
                                        }">
                                            {{ assign.remaining_volume }} {{ assign.chemical_stock.chemical_batch.chemical_details?.unit }}
                                        </div>
                                    </td>
                                    <td class="px-4 py-4">
                                        <div class="text-sm font-medium text-gray-900">
                                            {{ assign.assigned_volume }} {{ assign.chemical_stock.chemical_batch.chemical_details?.unit }}
                                        </div>
                                    </td>  -->
                                    <td class="px-4 py-4">
                                        <div class="flex">
                                        <div>
                                            <div class="text-xs text-gray-500 uppercase mb-1">Current Assignee</div>
                                            <div class=" px-5 text-xs py-1 bg-red-100 text-red-800 rounded-full mb-2 ">
                                            {{ assign.assignee_name }} 
                                            </div>
                                            <div class="text-xs text-gray-500">
                                                <div>In: {{ assign.room_name }}</div>
                                            </div>
                                            <div class="text-xs text-gray-500">
                                                <div>{{ assign.processed_date ? formatDate(assign.processed_date) : 'N/A' }}</div>
                                            </div>
                                        </div>
                                        </div>
                                    </td>
                                    <td class="px-4 py-4" v-if="userType === 'Lab Technician'" @click.stop >
                                        <div class="flex space-x-2">
                                            <button 
                                            @click="addToCart(assign)"
                                            class="p-1 hover:bg-gray-100 rounded-full" 
                                            title="Add to Cart"
                                            :disabled="isInChemicalCart(assign.id) || assign.remaining_volume === '0.00'"
                                            :class="{ 'opacity-50 cursor-not-allowed': isInChemicalCart(assign.id) || assign.remaining_volume === '0.00' }"
                                            > 
                                            <i class="fas fa-shopping-cart text-gray-600"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>    
                            </tbody>
                    </table>        
                </div> 
            </div>
            <RequestChemical
                :chemicals="requestChemicalStore.chemicals"
                :assigned="assigned"
                @remove-item="removeFromCart"
                @open-borrow="showBorrowModal = true"
                />

            <div v-if="showBorrowModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white p-8 rounded-lg max-w-md w-full">
                    <h2 class="text-2xl font-bold mb-4">Finalize Borrowing</h2>
                    <form @submit.prevent="finalizeBorrowing">
                        <div class="mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" for="user">
                                Select User
                            </label>
                            <select v-model="selectedUser" id="user" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                                <option value="">Select a user</option>
                                <option v-for="user in users" :key="user.id" :value="user.id">{{ user.first_name }} {{ user.last_name }}</option>
                            </select>
                        </div>
                        <div class="mb-5">
                            <label class="block text-gray-600 mb-2" for="purpose">
                                Borrowing Purpose
                            </label>
                            <textarea
                                v-model="borrowingPurpose"
                                id="purpose"
                                placeholder="Describe the purpose of borrowing..."
                                class="block w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            ></textarea>
                        </div>
                        <div class="flex justify-end">
                            <button type="button" @click="closeBorrowModal" class="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded mr-3">
                                Cancel
                            </button>
                            <button type="submit" class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded">
                                Confirm
                            </button>
                        </div>
                    </form>
                </div>
            </div>

        </div>
    </div>
</template>

<script>
import { defineComponent, ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router'; 
import { useRequestChemicalCart } from '@/stores/requestChemical.js'
import Sidebar from '@/components/UserType/Sidebar.vue';
import axios from 'axios';
import RequestChemical from './Modals/RequestChemical.vue';


export default defineComponent({
    name: 'AssignedChemical',
    components: {
        Sidebar,
        RequestChemical
    },
    setup(props) {
        const requestChemicalStore = useRequestChemicalCart();
        const store = useStore();
        const router = useRouter();
        const route = useRoute();
        const loading = ref(true);
        const successMessage = ref(null);
        const errorMessage = ref(null);
        const userType = computed(() => store.state.userType)
        const error = ref(null);
        const assigned = ref([]);
        const isSidebarOpen = ref(false);
        const userBarcode = computed(() => route.params.barcode)
        const showBorrowModal = ref(false);
        const selectedUser = ref('');
        const selectedRoom = ref('');
        const customBorrower = ref('');
        const users = ref([]);
        const rooms = ref([]);
        const searchQuery = ref('');

        const tableHeaders = ['Unit Cost', 'Chemical Name', 'Batch', 'Assigned Volume', 'Remaining Volume', 'Assigned Info', 'Actions'];
        const visibleHeaders = computed(() => {
            if(userType.value === 'Dean' || userType.value === 'Supply Office'){
                return tableHeaders.filter(header => header !== 'Actions' && header !== 'Remaining Volume');
            }else{
                return tableHeaders;
            }
        })

        const fetchData = async () => {
            try {
                const [assignedResponse, usersResponse, roomsResponse] = await Promise.all([
                    axios.get('/api/assigned-chemicals/'),
                    axios.get('/api/user-list/'),
                    axios.get('/api/room-list/')
                ]);
                assigned.value = assignedResponse.data;
                users.value = usersResponse.data;
                rooms.value = roomsResponse.data;
                loading.value = false;
            } catch (err) {
                console.error('Error fetching assigned chemicals, users, and rooms:', err);
            }
        };

        onMounted(() => {
            fetchData();

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
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',



            });
        };

        const isInChemicalCart = (assignedId) => {
            return requestChemicalStore.chemicals.some(chemical => chemical.id === assignedId);
        };

        const addToCart = (assign) => {
            if (!isInChemicalCart(assign.id)) {
                requestChemicalStore.addChemical(assign);
            }
        };

        const removeFromCart = (chemicalId) => {
            requestChemicalStore.removeChemical(chemicalId);
        };

        const finalizeBorrowing = async () => {
            if (!selectedUser.value)  {
                errorMessage.value = 'Please select a user.';
                setTimeout(() => {
                    errorMessage.value = null;
                }, 1000);
                return;
            }

            if (requestChemicalStore.totalChemicals === 0) {
                errorMessage.value = 'Please add at least one chemical to the cart.';
                setTimeout(() => {
                    errorMessage.value = null;
                }, 1000);
                return;
            }

            try {
                const borrowData = {
                    user_id: selectedUser.value || store.state.user.id, 
                    room_id: selectedRoom.value,
                    purpose: customBorrower.value || 'Research', // Use custom borrower text or default
                    chemical_requests: requestChemicalStore.cartChemicals.map(chemical => ({
                        assigned_chemical_id: chemical.id, 
                        quantity_requested: chemical.volume
                    }))
                };

                const response = await axios.post('/api/chemical-request/', borrowData);

                successMessage.value = 'Chemicals borrowed successfully';

                setTimeout(() => {
                    successMessage.value = null;
                }, 5000);

                requestChemicalStore.clearChemicals();
                closeBorrowModal();
                fetchData(); 

            } catch (err) {
                errorMessage.value = 'Failed to borrow chemicals. Please try again.';
                setTimeout(() => {
                    errorMessage.value = null;
                }, 1000);
                console.error('Error finalizing borrowing:', err);
            }
        };


        const openBorrowModal = () => {
            showBorrowModal.value = true;
        };

        const closeBorrowModal = () => {
            showBorrowModal.value = false;
            selectedUser.value = '';
            selectedRoom.value = '';
        };


        const filteredChemicals = computed(() => {
            if (!searchQuery.value) return assigned.value;

            const query = searchQuery.value.toLowerCase();

            return assigned.value.filter(assign => {
                const { chemical_stock } = assign;
                return (
                    assign.chemical_stock.chemical_batch.chemical_details.name.toLowerCase().includes(query) ||
                    assign.chemical_stock.chemical_batch.batch_details.batch_number.toLowerCase().includes(query) ||
                    assign.assignee_name.toLowerCase().includes(query) ||
                    assign.processed_by.toLowerCase().includes(query) ||
                    assign.room_name.toLowerCase().includes(query) ||
                    assign.chemical_stock.inventory_number.toLowerCase().includes(query)

                );
            });
        });



    
    return {
        // State
        loading,
        error,
        successMessage,
        errorMessage,
        tableHeaders,
        visibleHeaders,
        userType,
        assigned,
        isSidebarOpen,
        userBarcode,
        showBorrowModal,
        selectedUser,
        selectedRoom,
        customBorrower,
        users,
        rooms,
        filteredChemicals,
        searchQuery,

        // Methods
        handleSidebarToggle,
        goBack,
        formatDate,
        isInChemicalCart,
        addToCart,
        removeFromCart,
        finalizeBorrowing,
        openBorrowModal,
        closeBorrowModal,

        // Stores
        useRequestChemicalCart,
        requestChemicalStore
    };
    },
})
</script>