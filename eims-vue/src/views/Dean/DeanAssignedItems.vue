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

            <div 
                v-if="successMessage" 
                class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center justify-between"
            >
                <span>{{ successMessage }}</span>
                <button 
                    @click="successMessage = null" 
                    class="ml-4 text-white hover:text-green-100"
                >
                    ×
                </button>
            </div>

            <div 
                v-if="errorMessage" 
                class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center justify-between"
            >
                <span>{{ errorMessage }}</span>
                <button 
                    @click="errorMessage = null" 
                    class="ml-4 text-white hover:text-red-100"
                >
                    ×
                </button>
            </div>

            <h1 class="text-3xl font-bold mb-6 text-gray-800">Dean Items</h1>

            <div class="mb-4 flex items-center space-x-4">
                <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Search..."
                    class="border border-gray-300 rounded py-2 px-4"
                />

                <select 
                    v-model="selectedCategory" 
                    class="border border-gray-300 rounded py-2 px-4 w-screen md:w-auto"
                >
                    <option :value="null">All Categories</option>
                    <option 
                        v-for="category in categories" 
                        :key="category.id" 
                        :value="category.id"
                    >
                        {{ category.name }} 
                    </option>
                </select>
            </div>

            <div v-if="loading" class="flex justify-center items-center h-64">
                <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            <div v-else-if="assigned.length === 0 && filteredItems.length === 0" class="text-center text-gray-500 text-lg my-8">
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
                                    v-for="assign in filteredItems" 
                                    @click="navigateToItemDetails(assign.item_instance.id)"
                                    :key="assign.id" 
                                    class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
                                >   
                                    <td class="px-4 py-4">
                                        <div class="text-sm font-medium text-gray-900">
                                            {{ assign.item_instance.unit_cost }}
                                        </div>
                                    </td>
                                    <td class="px-4 py-4">
                                        <div class="text-sm font-medium text-gray-900">
                                            {{ assign.item_instance.item.name }}
                                        </div>
                                        <div class="text-sm text-gray-500">
                                            {{ assign.item_instance.item.description }}
                                        </div>
                                        <div class="text-xs text-gray-500 " >
                                           SN# {{ assign.item_instance.serial_number }}
                                        </div>
                                    </td>
                                    <td class="px-4 py-4">
                                        <div class="text-sm w-36 bg-gray-100 rounded-full" @click.stop>
                                            {{ assign.inventory_number }}
                                        </div>
                                    </td> 
                                    <td class="px-4 py-4">
                                        <span :class="[
                                        getConditionClass(assign.item_instance.current_condition),
                                        'text-sm'
                                        ]">
                                            {{ assign.item_instance.current_condition }}
                                        </span>
                                    </td>
                                    <td class="px-4 py-4">
                                        <div class="grid grid-cols-2 gap-4">
                                            <div>
                                            <div class="text-xs text-gray-500 uppercase mb-1">Current borrower</div>
                                            <div :class="[
                                                getBorrowedStatusClass(assign.item_instance.current_borrow_record),
                                                'text-xs mb-1'
                                            ]">
                                                {{ getBorrowerStatus(assign, 'current') }}
                                            </div>
                                            <div v-if="assign.item_instance.current_borrow_record" class="text-xs text-gray-500">
                                                <div>At: {{ formatDate(assign.item_instance.current_borrow_record.borrow_date) }}</div>
                                                <div>In: {{ assign.item_instance.current_borrow_record.room }}</div>
                                            </div>
                                            </div>
                                            <div>
                                            <div class="text-xs text-gray-500 uppercase mb-1">Last borrower</div>
                                            <div :class="[
                                                getBorrowedStatusClass(assign.item_instance.last_borrow_record, true),
                                                'text-xs'
                                            ]">
                                                {{ getBorrowerStatus(assign, 'last') }}
                                            </div>
                                            <div v-if="assign.item_instance.last_borrow_record" class="text-xs text-gray-500">
                                                <div>At: {{ formatDate(assign.item_instance.last_borrow_record.return_date) }}</div>
                                                <div>In: {{ assign.item_instance.last_borrow_record.room }}</div>
                                            </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-4 py-4" v-if="userType === 'Secretary'"  @click.stop>
                                        <div class="flex space-x-2">
                                        <button 
                                            @click="printBarcode(assign.item_instance.barcode)"
                                            class="p-1 hover:bg-gray-100 rounded-full" 
                                            title="Print Barcode"
                                            >
                                            <i class="fas fa-print text-gray-600"></i>
                                        </button>
                                        <button 
                                            @click="addToCart(assign)"
                                            class="p-1 hover:bg-gray-100 rounded-full" 
                                            title="Add to Cart"
                                            :disabled="assign.item_instance.current_borrow_record || isInCart(assign.item_instance.id)"
                                            :class="{ 
                                                'opacity-50 cursor-not-allowed': assign.item_instance.current_borrow_record || isInCart(assign.item_instance.id),
                                                'text-blue-600': isInCart(assign.item_instance.id)
                                            }"
                                        >
                                            <i class="fas fa-shopping-cart" :class="{
                                                'text-gray-600': !isInCart(assign.item_instance.id),
                                                'text-blue-600': isInCart(assign.item_instance.id)
                                            }"></i>
                                        </button>
                                        <button 
                                            @click="openBarcodePopup(instance.barcode)" 
                                            class="p-1 hover:bg-gray-100 rounded-full" 
                                            title="View Barcode"
                                            >
                                            <i class="fas fa-barcode text-gray-600"></i>
                                        </button>
                                        </div>
                                    </td>
                                </tr>    
                            </tbody>
                    </table>        
                </div> 
            </div>
            <BorrowCart
                v-if="userType === 'Secretary'"
                :items="cartStore.cartItems"
                @remove-item="removeFromCart"
                @open-borrow="showBorrowModal = true"
            />

            <div v-if="showBorrowModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white p-8 rounded-lg max-w-md w-full">
                    <h2 class="text-2xl font-bold mb-4">Finalize Borrowing</h2>
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="user">
                            Select User (Optional)
                        </label>
                        <select v-model="selectedUser" id="user" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                            <option v-for="user in users" :key="user.id" :value="user.id" >{{ user.first_name }} {{ user.last_name }} </option> 
                        </select>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="room">
                            Select Room
                        </label>
                        <select v-model="selectedRoom" id="room" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                            <option v-for="room in rooms" :key="room.id" :value="room.id">{{ room.name }}</option> 
                        </select>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="room">
                            Custom Borrower
                        </label>
                        <textarea
                            v-model="customBorrower"
                            rows="3"
                            class="block w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Custom Borrower if user is not available"
                        ></textarea>
                    </div>
                    <div class="flex justify-end">
                    <button @click="closeBorrowModal" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded mr-2">
                        Cancel
                    </button>
                    <button @click="finalizeBorrowing" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                        Confirm Borrowing
                    </button>
                    </div>
                </div>
            </div>
            
        </div>
    </div>
</template>

<script>
import { defineComponent, ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router'; 
import { useItemCartStore } from '@/stores/newCart.js'
import Sidebar from '@/components/UserType/Sidebar.vue';
import axios from 'axios';
import BorrowCart from '../Secretary/Modals/BorrowCart.vue';
import ConfirmButton from '@/components/buttons/ConfirmButton.vue';


export default defineComponent({
    name: 'DeanAssignedList',
    components: {
        Sidebar, BorrowCart, ConfirmButton
    },
    setup(props) {
        const cartStore = useItemCartStore();
        const successMessage = ref(null);
        const errorMessage = ref(null);
        const store = useStore();
        const router = useRouter();
        const route = useRoute();
        const loading = ref(true);
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
        const categories = ref([]);
        const searchQuery = ref('');
        const selectedCategory = ref(null);

        const tableHeaders = ['Unit Cost', 'Item Name', 'Inventory Item No.', 'Condition', 'Borrower Info', 'Actions'];
        const visibleHeaders = computed(() => {
            if(userType.value === 'Dean'){
                return tableHeaders.filter(header => header !== 'Actions');
            }else{
                return tableHeaders;
            }
        })

        const fetchData = async () => {
            try {
                const [assignedResponse, usersResponse, roomsResponse, categoriesResponse] = await Promise.all([
                    axios.get('/api/dean-assigned-items/'),
                    axios.get('/api/user-list/'),
                    axios.get('/api/room-list/'),
                    axios.get('/api/category/')
                ]);
                assigned.value = assignedResponse.data;
                users.value = usersResponse.data;
                rooms.value = roomsResponse.data;
                categories.value = categoriesResponse.data;
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                loading.value = false;
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
                day: 'numeric'
            });
        };

        const getConditionClass = (condition) => {
            switch (condition.toLowerCase()) {
                case 'good':
                    return 'text-green-600';
                case 'fair':
                    return 'text-yellow-600';
                case 'poor':
                    return 'text-orange-600';
                case 'damaged':
                    return 'text-red-600';
                default:
                    return 'text-gray-600';
            }
        };

        const getBorrowedStatusClass = (borrowedBy, isLastBorrower = false) => {
            if (isLastBorrower) {
                return 'px-5 text-xs py-1 bg-blue-100 w-32 text-blue-800 rounded-full'; 
            }
            return borrowedBy
                ? 'px-5 py-1 bg-red-100 text-red-800 w-32 rounded-full' 
                : 'px-5 py-1 bg-green-100 text-green-800 w-32 rounded-full'; 
        };

        const getBorrowerStatus = (assign, type) => {
            if (type === 'current' && assign.item_instance.current_borrow_record) {
                return `${assign.item_instance.current_borrow_record.borrower} `;
            }
            // Here was the error - using 'instance' instead of 'assign'
            if (type === 'last' && assign.item_instance.last_borrow_record) {
                return `${assign.item_instance.last_borrow_record.borrower}`;
            }
            return type === 'last' ? 'None' : 'Available';
        };

        const addToCart = (assign) => {
            if (!assign.item_instance.borrowed_by && !cartStore.isInCart(assign.item_instance.id)) {
                cartStore.addToCart(assign.item_instance);
            }
        };

        const removeFromCart = (instanceId) => {
            cartStore.removeFromCart(instanceId);
        };

        const isInCart = (instanceId) => {
            return cartStore.isInCart(instanceId);
        };

        const finalizeBorrowing = async () => {
            if (!selectedUser.value && !customBorrower.value) {
                errorMessage.value = 'Please select a user or provide a custom borrower';
                setTimeout(() => {
                    errorMessage.value = null;
                }, 1000);
                return;
            }
            if (!selectedRoom.value) {
                errorMessage.value = 'Please select a room';
                setTimeout(() => {
                    errorMessage.value = null;
                }, 1000);
                return;
            }
            try {
                const borrowData = {
                    user_id: selectedUser.value || null,
                    custom_borrower: customBorrower.value,
                    room_id: selectedRoom.value,
                    instances: cartStore.cartItems.map(item => item.id)
                };

                await axios.post('/api/manual-borrow/', borrowData);
                successMessage.value = 'Items borrowed successfully';

                setTimeout(() => {
                    successMessage.value = null;
                }, 5000);

                cartStore.clearCart();
                closeBorrowModal();
                fetchData(); 

            } catch (err) {
                console.error('Error finalizing borrowing:', err);
                errorMessage.value = 'Error finalizing borrowing';

                setTimeout(() => {
                    errorMessage.value = null;
                }, 5000);
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

        const navigateToItemDetails = (itemId) => {
            router.push({ name: 'ItemInstancesDetail', params: { id: itemId } })
        }

        const filteredItems = computed(() => {
            let result = assigned.value;
            if (searchQuery.value) {
                const query = searchQuery.value.toLowerCase();
                result = result.filter(assign => {
                    const { item_instance } = assign;
                    return (
                        item_instance.item.name.toLowerCase().includes(query) ||
                        item_instance.serial_number.toLowerCase().includes(query) ||
                        (item_instance.unit_cost && item_instance.unit_cost.toString().includes(query)) ||
                        (item_instance.current_condition && item_instance.current_condition.toLowerCase().includes(query)) ||
                        (item_instance.item_batch?.batch_details?.batch_number && item_instance.item_batch.batch_details.batch_number.toLowerCase().includes(query)) ||
                        (item_instance.current_borrow_record && item_instance.current_borrow_record.borrower.toLowerCase().includes(query)) ||
                        (item_instance.last_borrow_record && item_instance.last_borrow_record.borrower.toLowerCase().includes(query))

                    );
                });
            }

            if (selectedCategory.value) {
                result = result.filter(assign => 
                    assign.item_instance.item.category.id === selectedCategory.value
                );
            }
            return result;
        });

        return {
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
            handleSidebarToggle,
            goBack,
            formatDate,
            getConditionClass,
            getBorrowedStatusClass,
            getBorrowerStatus,
            cartStore,
            addToCart,
            removeFromCart,
            isInCart,
            finalizeBorrowing,
            openBorrowModal,
            closeBorrowModal,
            showBorrowModal,
            selectedUser,
            selectedRoom,
            customBorrower,
            users,
            rooms,
            categories,
            selectedCategory,
            navigateToItemDetails,
            filteredItems,
            searchQuery,
            useItemCartStore
        };
    },
})
</script>
