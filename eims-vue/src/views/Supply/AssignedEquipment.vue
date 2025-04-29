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

            <h1 class="text-3xl font-bold mb-6 text-gray-800">Assigned Equipments</h1>



            <div class="flex items-center space-x-4 mb-4">
                <input
                v-model="searchQuery"
                type="text"
                placeholder="Search..."
                class="border border-gray-300 rounded py-2 px-4"
            />

                <button 
                    @click="printAssignedEquipment" 
                    :disabled="loading"
                    class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                >
                    Print Records
                </button>
            </div>

            

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
                            <th>
                            </th>
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
                                    class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
                                >   
                                    <td class="px-4 py-4">
                                        <input 
                                        type="checkbox" 
                                        v-model="selected[assign.id]"
                                        @click.stop
                                        class="form-checkbox h-5 w-5 text-blue-600"
                                        >
                                    </td>
                                    <td class="px-4 py-4">
                                        <div class="text-sm font-medium text-gray-900">
                                            {{ assign.equipment_instance.unit_cost }}
                                        </div>
                                    </td>
                                    <td class="px-4 py-4">
                                        <div class="text-sm font-medium text-gray-900">
                                            {{ assign.equipment_instance.equipment.name }}
                                        </div>
                                        <div 
                                            :title="assign.equipment_instance.equipment.description"
                                            class="truncate max-w-xs p-2  text-sm text-gray-900"
                                        >
                                            {{ assign.equipment_instance.equipment.description }}
                                        </div>
                                    </td>
                                    <td class="px-4 py-4">
                                        <div class="text-sm w-fit bg-gray-100 rounded-full" @click.stop>
                                            {{ assign.inventory_number }}
                                        </div>
                                    </td>  
                                    <td class="px-4 py-4">
                                        <span :class="[
                                        getConditionClass(assign.equipment_instance.current_condition),
                                        'text-sm'
                                        ]">
                                            {{ assign.equipment_instance.current_condition }}
                                        </span>
                                    </td>
                                    <td class="px-4 py-4">
                                        <div class="flex">
                                        <div>
                                            <div class="text-xs text-gray-500 uppercase mb-1">Current Assignee</div>
                                            <div class=" px-5 text-xs py-1 bg-red-100 text-red-800 rounded-full ">
                                                {{ assign.assignee }}
                                            </div>
                                            <div class="text-xs text-gray-500">
                                            <div>At: {{ formatDate(assign.assigned_date) }}</div>
                                            <div>In: {{ assign.assigned_location }}</div>
                                            </div>
                                        </div>
                                        </div>
                                    </td>
                                    <td class="px-4 py-4">
                                        <div class="text-sm w-fit bg-green-100 rounded-full" @click.stop>
                                            {{ assign.equipment_instance.status }}
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
import msunLogo from '@/assets/msun.png'
import { useRouter, useRoute } from 'vue-router'; 
import { useItemCartStore } from '@/stores/newCart.js'
import Sidebar from '@/components/UserType/Sidebar.vue';
import axios from 'axios';


export default defineComponent({
    name: 'DeanAssignedList',
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
        const userBarcode = computed(() => route.params.barcode)
        const users = ref([]);
        const rooms = ref([]);
        const searchQuery = ref('');
        const token = computed(() => store.state.token)
        const logoUrl = ref('/images/msun.png');
        const tableHeaders = ['Unit Cost', 'Item Name', 'Serial Number', 'Condition',  'Assigned Info' , 'Status' ];
        const selected = ref({});
        const allSelected = computed(() => 
            selectedItems.value.length === assigned.value.length
        );
        const selectedItems = computed(() => 
            Object.keys(selected.value)
                .filter(id => selected.value[id])
                .map(id => assigned.value.find(assign => assign.id.toString() === id))
            );

        const toggleItemSelection = (assign) => {
            const index = selectedItems.value.findIndex(item => item.id === assign.id);
            if (index > -1) {
            // Item is already selected, so remove it
            selectedItems.value.splice(index, 1);
            } else {
            // Item is not selected, so add it
            selectedItems.value.push(assign);
            }
        };

        const toggleSelectAll = () => {
            if (allSelected.value) {
            // Deselect all
            selectedItems.value = [];
            } else {
            // Select all
            selectedItems.value = [...assigned.value];
            }
        };

        const fetchInstancesAndUsersAndRooms = async () => {
            loading.value = true;
            error.value = null;
            try{
                const [assignedResponse] = await Promise.all([
                    axios.get(`/api/assigned-equipment-list/`,{
                        headers: { 'Authorization': `Token ${token.value}` }
                    }),
                ]);
                assigned.value = assignedResponse.data;
            } catch (err) {
                error.value = `Failed to fetch assigned equipments. Please try again.`;
                console.error('Error fetching assigned equipments:', err);
            } finally {
                loading.value = false;
            }
        };

        const printAssignedEquipment = () => {
        const selectedIds = Object.keys(selected.value)
            .filter(id => selected.value[id]);
        
        if (selectedIds.length === 0) {
            alert('Please select at least one item to print.');
            return;
        }

        // Group items by assignee
        const itemsByAssignee = selectedIds.reduce((acc, id) => {
            const assignedItem = assigned.value.find(assign => assign.id.toString() === id);
            if (assignedItem) {
                const assigneeName = assignedItem.assignee;
                if (!acc[assigneeName]) {
                    acc[assigneeName] = [];
                }
                acc[assigneeName].push(assignedItem);
            }
            return acc;
        }, {});

        const generateICSCode = (unitCost) => {
            const numericCost = parseFloat(unitCost);
            const prefix = numericCost < 5000 ? "SPLV" : "SPHV";
            const currentDate = new Date().toISOString().split("T")[0];
            return `${prefix}-${currentDate}`;
        };

        const createPrintDocument = (assigneeName, itemsToPrint) => {
            const iframe = document.createElement('iframe');
            iframe.style.position = 'absolute';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = 'none';

            document.body.appendChild(iframe);

            const doc = iframe.contentDocument || iframe.contentWindow.document;
            
            doc.write(`
                <html>
                <head>
                    <title>Inventory Custodian Slip</title>
                    <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        display: flex;
                        flex-direction: column;
                        min-height: 100vh;
                        margin: 0;
                        padding: 20mm;
                        box-sizing: border-box;
                    }
                    .content-wrapper {
                        flex-grow: 1;
                    }
                    table {
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-bottom: 20px;
                    }
                    th, td { 
                        border: 1px solid #ddd; 
                        padding: 8px; 
                        text-align: left; 
                        min-width: auto;
                        word-wrap: break-word; 
                    }
                    th { 
                        background-color: #f2f2f2; 
                        font-weight: bold; 
                    }
                    .print-header { 
                        text-align: center; 
                        margin-bottom: 20px; 
                    }
                    .condition-good { color: green; }
                    .condition-fair { color: orange; }
                    .condition-poor { color: red; }
                    .condition-damaged { color: darkred; }
                    .ics-number {
                        text-align: right;
                        margin-bottom: 20px;
                    }
                    .description {
                        white-space: normal;
                        word-wrap: break-word;
                        overflow-wrap: break-word;
                        display: block;
                        line-height: 1.4;
                        min-width: 150px; 
                    }
                    .signature-table {
                        margin-top: auto;
                        width: 100%;
                    }
                    @media print {
                        @page {
                            margin: 0;
                        }
                    }
                    </style>
                </head>
                <body>
                    <div class="content-wrapper">
                        <div class="print-header">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="width: 15%; text-align: left;">
                                    <img src="${logoUrl.value}" alt="MSUN Logo" style="max-width: 100%; max-height: 100%;">
                                </div>

                                <div style="width: 70%; text-align: center;">
                                    <div style="font-weight: bold; font-size: 16px;">
                                        Republic of the Philippines<br>
                                        MINDANAO STATE UNIVERSITY AT NAAWAN
                                    </div>
                                    <div style="font-size: 14px;">
                                        9023 Naawan, Misamis Oriental
                                    </div>
                                </div>
                                
                                <div style="width: 15%; text-align: right;">
                                    <div>Appendix 59</div>
                                </div>
                            </div>
                        
                            <h2>Inventory Custodian Slip</h2>
                        </div>
                        <div class="ics-number">
                            ICS No.: ${generateICSCode(itemsToPrint[0].equipment_instance.unit_cost)}
                        </div>
                        <table>
                        <thead>
                            <tr>
                            <th>Unit Cost</th>
                            <th>Description</th>
                            <th>Serial Number</th>
                            <th>Condition</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsToPrint.map(assign => `
                            <tr>
                                <td>₱ ${assign.equipment_instance.unit_cost.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td>
                                    <div class="description-wrap">
                                        <div class="description">
                                        ${ assign.equipment_instance.equipment.name },
                                        ${ assign.equipment_instance.equipment.description }
                                        </div>
                                    </div>
                                </td>
                                <td>${assign.inventory_number}</td>
                                <td class="condition-${assign.equipment_instance.current_condition.toLowerCase()}">
                                    ${assign.equipment_instance.current_condition}
                                </td>
                            </tr>
                            `).join('')}
                        </tbody>
                        </table>
                    </div>

                    <table class="signature-table">
                        <tr>
                            <td style="border: 1px solid #000; padding: 10px; text-align: center; width: 50%;">
                                <div style="width: 100%; text-align: left; margin-bottom: 30px;">Received from:</div>
                                
                                <div style="font-weight: bold;">RYAN N. GOMEZ</div>
                                <div style="border-bottom: 1px solid #000; width: 80%; margin: 1px auto;"></div>
                                <div>Printed Name & Signature</div>

                                <div style="margin-top: 25px;">Admin. Officer V/Property & Supply</div>
                                <div style="border-bottom: 1px solid #000; width: 80%; margin: 1px auto;"></div>
                                <div>Position/Office</div>

                                <div style="margin-top: 25px;">3/13/2023</div>
                                <div style="border-bottom: 1px solid #000; width: 80%; margin: 1px auto;"></div>
                                <div>Date</div>
                            </td>

                            <td style="border: 1px solid #000; padding: 10px; text-align: center; width: 50%;">
                                <div style="width: 100%; text-align: left; margin-bottom: 30px;">Received by:</div>

                                <div style="margin-top: 25px; font-weight: bold;">${assigneeName.toUpperCase()}</div>
                                <div style="border-bottom: 1px solid #000; width: 80%; margin: 1px auto;"></div>
                                <div>Printed Name & Signature</div>

                                <div style="margin-top: 25px;">Associate Professor V</div>
                                <div style="border-bottom: 1px solid #000; width: 80%; margin: 1px auto;"></div>
                                <div>Position/Office</div>

                                <div style="margin-top: 25px;">${formatDate(itemsToPrint[0].assigned_date)}</div>
                                <div style="border-bottom: 1px solid #000; width: 80%; margin: 1px auto;"></div>
                                <div>Date</div>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `);
            doc.close();
            iframe.contentWindow.print();
                setTimeout(() => document.body.removeChild(iframe), 1000);
            };

            // Create a print document for each unique assignee
            Object.entries(itemsByAssignee).forEach(([assigneeName, items]) => {
                createPrintDocument(assigneeName, items);
            });
        };
        onMounted(() => {
            fetchInstancesAndUsersAndRooms();

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
            return 'Available';
        };

    
    return {
        loading,
        error,
        tableHeaders,
        userType,
        assigned,
        isSidebarOpen,
        printAssignedEquipment,
        userBarcode,
        handleSidebarToggle,
        goBack,
        formatDate,
        getConditionClass,
        getBorrowedStatusClass,
        getBorrowerStatus,
        users,
        rooms,
        searchQuery,
        useItemCartStore,
        selected,
        allSelected,
        selectedItems,
        toggleItemSelection,
        toggleSelectAll,

    };
    },
})
</script>