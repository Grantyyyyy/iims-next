<template>
  <div class="flex h-screen bg-gradient-to-b from-[#F5F4F1] to-[#D4EAF7]">
    <Sidebar @sidebarToggle="handleSidebarToggle" />
    <div 
      :class="[
        'flex-1 overflow-x-auto p-6 md:p-8 transition-all duration-300 ease-in-out',
        isSidebarOpen ? 'lg:ml-64' : 'ml-0'
      ]"
    >
      <div class="max-w-full bg-white/90 backdrop-blur-md shadow-lg rounded-2xl p-6 md:p-8">

        <!-- Back Button -->
        <button 
          @click="goBack" 
          class="flex items-center mb-6 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" 
               class="h-5 w-5 mr-2" 
               fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <!-- Title -->
        <h1 class="text-2xl md:text-3xl font-bold mb-6 text-gray-800">Damaged Items</h1>

        <!-- Filters + Actions -->
        <div class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <!-- Filters -->
          <div class="flex flex-col md:flex-row md:items-center gap-3 flex-grow">
            <!-- Search -->
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search instances..."
              class="border border-gray-300 rounded-lg py-2 px-4 text-sm w-full md:w-56 focus:ring-2 focus:ring-blue-400"
            />

            <!-- Category -->
            <select 
              v-model="selectedCategory" 
              class="border border-gray-300 rounded-lg py-2 px-4 text-sm w-full md:w-auto focus:ring-2 focus:ring-blue-400"
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

            <!-- Value -->
            <select 
              v-model="selectedValue" 
              class="border border-gray-300 rounded-lg py-2 px-4 text-sm w-full md:w-auto focus:ring-2 focus:ring-blue-400"
            >
              <option :value="null">All Values</option>
              <option value="high">High Value (≥5000)</option>
              <option value="low">Low Value (≤4999)</option>
            </select>

            <!-- Date Range -->
            <div class="flex items-center space-x-2">
              <input
                type="date"
                v-model="startDate"
                class="border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-400"
              />
              <span class="text-gray-500 text-sm">to</span>
              <input
                type="date"
                v-model="endDate"
                class="border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                @click="clearDateFilter"
                class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg bg-white hover:bg-gray-50 transition"
                title="Clear date filter"
              >
                <i class="fas fa-times mr-1"></i> Clear
              </button>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex space-x-2 shrink-0">
            <button 
              @click="printSelectedItems"
              :disabled="selectedRows.length === 0"
              class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i class="fas fa-print mr-2"></i> Print Selected
            </button>
            <button 
              @click="printAllItems"
              class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:ring-2 focus:ring-gray-400 transition"
            >
              <i class="fas fa-print mr-2"></i> Print All
            </button>
          </div>
        </div>

        <!-- States -->
        <div v-if="loading" class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <div v-else-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
          <p class="font-bold">Error</p>
          <p>{{ error }}</p>
        </div>
        <div v-else-if="instances.length === 0" class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg">
          <p class="font-bold">No instances found</p>
          <p>There are no matching items for your filters.</p>
        </div>

        <!-- Table -->
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <input 
                    type="checkbox" 
                    :checked="selectAll" 
                    @change="toggleSelectAll"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  >
                </th>
                <th 
                  v-for="header in tableHeaders" 
                  :key="header" 
                  class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr 
                v-for="instance in instances" 
                :key="instance.id" 
                @click="navigateToItemDetails(instance.id)"
                class="hover:bg-gray-50 transition cursor-pointer"
              >
                <td class="px-4 py-4">
                  <input 
                    type="checkbox" 
                    v-model="selectedRows"
                    :value="instance.id"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    @click.stop
                  >
                </td>
                <td class="px-4 py-4 text-sm text-gray-900">₱ {{ Number(instance.unit_cost).toLocaleString() }}</td>
                <td class="px-4 py-4 text-sm text-gray-900">{{ instance.quantity }}</td>
                <td class="px-4 py-4">
                  <div class="text-sm font-medium text-gray-900">{{ instance.item.name }}</div>
                  <div class="text-xs text-gray-500">{{ instance.item.description }}</div>
                  <div class="text-xs text-gray-700 mt-1" @click.stop>
                    SN#: {{ instance.serial_number || 'None' }}
                  </div>
                </td>
                <td class="px-4 py-4 text-xs text-gray-900">{{ instance.inventory_number }}</td>
                <td class="px-4 py-4">
                  <span :class="[getConditionClass(instance.current_condition), 'text-sm font-medium']">
                    {{ instance.current_condition }}
                  </span>
                </td>
                <td class="px-4 py-4 text-xs text-gray-900">
                  {{ instance?.purchase_date ? formatDate(instance.purchase_date) : 'None' }}
                </td>
                <td class="px-4 py-4 text-xs text-gray-700">
                  <div v-if="instance.last_borrow_record">
                    <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {{ instance.last_borrow_record?.borrower }}
                    </span>
                    <div class="mt-2 text-gray-500">
                      <div>At: {{ formatDate(instance.last_borrow_record?.return_date) }}</div>
                      <div>In: {{ instance.last_borrow_record?.room }}</div>
                    </div>
                  </div>
                  <span v-else class="text-gray-400 italic">No record</span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination -->
          <div class="flex items-center mt-6 space-x-4">
            <button 
              @click="prevPage" 
              :disabled="currentPage === 1"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 focus:ring-2 focus:ring-blue-300"
            >
              Previous
            </button>
            <button 
              @click="nextPage" 
              :disabled="currentPage === totalPages"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 focus:ring-2 focus:ring-blue-300"
            >
              Next
            </button>
            <span class="text-gray-700 text-sm font-medium">
              Page <span class="font-bold">{{ currentPage }}</span> of <span class="font-bold">{{ totalPages }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Barcode Popup -->
    <div 
      v-if="showBarcodePopup" 
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" 
      @click="closeBarcodePopup"
    >
      <transition name="fade">
        <div class="bg-white p-6 rounded-xl shadow-lg" @click.stop>
          <img :src="currentBarcode" alt="Barcode" class="max-w-full h-auto" />
          <button 
            @click="closeBarcodePopup" 
            class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Close
          </button>
        </div>
      </transition>
    </div>
  </div>
</template>




<script setup>
import { defineComponent, ref, onMounted, computed, watch} from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import Sidebar from '@/components/UserType/Sidebar.vue';
import { formatDate, printAllDamagedItems, printSelectedDamagedItems } from '@/utils/itemPrint.js'

const props = defineProps({
  id: {
    type: String,
    required: true
  }
});

const store = useStore()
const router = useRouter();
const errorMessage = ref(null);
const successMessage = ref(null);
const instances = ref([]);
const loading = ref(true);
const error = ref(null);
const tableHeaders = ['Unit Cost', 'Quantity', 'Item Name',  'Inventory Item No.', 'Condition', 'Purchase Date', 'Previous Borrower'];
const printHeaders = ['Unit Cost', 'Quantity', 'Description',  'Inventory Item No.', 'Previous Borrower'];
const categories = ref([]);
const searchQuery = ref('');
const selectedCategory = ref(null);
const selectedValue = ref(null);
const startDate = ref(null);
const endDate = ref(null);
const isSidebarOpen = ref(true);
const token = computed(() => store.state.token)
const currentPage = ref(1);
const totalPages = ref(0);
const pageSize = ref(10);
const selectedRows = ref([]);
const selectAll = computed({
  get: () => instances.value.length > 0 && selectedRows.value.length === instances.value.length,
  set: (value) => {
    selectedRows.value = value ? instances.value.map(instance => instance.id) : [];
  }
});
const userType = computed(() => store.state.userType);
const user = computed(() => store.getters.user);

const toggleSelectAll = () => {
  selectAll.value = !selectAll.value;
};

const printAllItems = async () => {
  try {
    await  printAllDamagedItems(instances.value, {
    headers: printHeaders,
    user: user.value,
    userType: userType.value,
    onBeforePrint: () => console.log('Starting print all damaged items...'),
    onAfterPrint: () => console.log('Print all completed')

  })
  } catch (error) {
    console.error('Error printing all items:', error);
  }

}

const printSelectedItems = async() => {
  try {
    await printSelectedDamagedItems(instances.value, selectedRows.value, {
    headers: printHeaders,
    user: user.value,
    userType: userType.value,
    onBeforePrint: () => console.log('Starting print selected damaged items...'),
    onAfterPrint: () => console.log('Print selected completed')
  })
  } catch (error) {
    console.error('Error printing selected items:', error);
  }
}

const handleSidebarToggle = (isOpen) => {
  isSidebarOpen.value = isOpen;
  // Force layout recalculation
  window.requestAnimationFrame(() => {
    window.dispatchEvent(new Event('resize'));
  });
};

onMounted(() => {
  fetchInstances();
  fetchCategories();
  
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
      isSidebarOpen.value = true;
    } else {
      isSidebarOpen.value = false;
    }
  });
});

const navigateToItemDetails = (itemId) => {
  router.push({ name: 'ItemInstancesDetail', params: { id: itemId } })
}

const goBack = () => {
  router.back();
};

const fetchCategories = async () => {
  try {
    const response = await axios.get('/api/category/', {
      headers: {
        'Authorization': `Token ${token.value}`,
      },
    });
    categories.value = response.data;
  } catch (err) {
    error.value = "Failed to fetch categories. Please try again.";
    console.error('Error fetching categories:', err);
  } finally {
    loading.value = false;
  }
};

const fetchInstances = async () => {
  try {
    const response = await axios.get('/api/damaged-items/', {
      headers: {
        'Authorization': `Token ${token.value}`,
      },
      params: {
        page: currentPage.value,
        page_size: pageSize.value,
        search: searchQuery.value,
        category: selectedCategory.value || null,
        value_filter: selectedValue.value || null,
        start_date: startDate.value || null,
        end_date: endDate.value || null

      },
    });
    instances.value = response.data.results;
    totalPages.value = Math.ceil(response.data.count / pageSize.value);

  } catch (error) {
    error.value = "Failed to fetch item instances. Please try again.";
    console.error('Error fetching instances:', error);
  } finally {
    loading.value = false;
  }
};

const clearDateFilter = () => {
  startDate.value = null;
  endDate.value = null;
};

watch([searchQuery, selectedCategory, selectedValue, startDate, endDate], () => {
  currentPage.value = 1;  
  fetchInstances();
}, { immediate: true });
  
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchInstances();
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchInstances();
  }
};

const getConditionClass = (condition) => {
  switch (condition.toLowerCase()) {
    case 'good':
      return 'text-green-600';
    case 'fair':
      return 'text-yellow-600';
    case 'poor':
      return 'text-blue-600';
    case 'damaged':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
.transition-all {
  will-change: margin-left;
}
</style>
