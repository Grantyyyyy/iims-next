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

        <h1 class="text-3xl font-bold mb-6 text-gray-800">Damaged Items</h1>

        
        <div class="mb-4 flex items-center space-x-4 justify-between">
            <div class="flex items-center space-x-4 flex-grow">
                <input
                v-model="searchQuery"
                type="text"
                placeholder="Search instances..."
                class="border border-gray-300 rounded py-2 px-4 "
                />

              <div class="relative">
                  <select 
                      v-model="selectedCategory" 
                      class="border border-gray-300 rounded py-2 px-4 w-screen md:w-auto"
                  >
                    <option :value=null>All Categories</option>
                    <option 
                        v-for="category in categories" 
                        :key="category.id" 
                        :value="category.id"
                    >
                        {{ category.name }} 
                    </option>
                  </select>
              </div>
              <div class="relative">
                  <select 
                      v-model="selectedValue" 
                      class="border border-gray-300 rounded py-2 px-4 w-screen md:w-auto"
                  >
                      <option :value=null>All Values</option>
                      <option value="high">High Value (≥5000)</option>
                      <option value="low">Low Value (≤4999)</option>
                  </select>
              </div>
            </div>

            <div class="flex space-x-2">
              <button 
                @click="printSelectedRows"
                :disabled="selectedRows.length === 0"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i class="fas fa-print mr-2"></i>
                Print Selected
              </button>
              <button 
                @click="printPage"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 ease-in-out"
              >
                <i class="fas fa-print mr-2"></i>
                Print All
              </button>
            </div>
        </div>

        <div v-if="loading" class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <div v-if="instances.length === 0" class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded" role="alert">
          <p class="font-bold">No instances found</p>
          <p>There are no instances matches.</p>
        </div>
        <div v-else-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
          <p class="font-bold">Error</p>
          <p>{{ error }}</p>
        </div>

        <!-- Instances Table -->
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input 
                    type="checkbox" 
                    :checked="selectAll" 
                    @change="toggleSelectAll"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  >
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
                v-for="instance in instances" 
                :key="instance.id" 
                @click="navigateToItemDetails(instance.id)"
                class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer">
                <td class="px-4 py-4">
                  <input 
                    type="checkbox" 
                    v-model="selectedRows"
                    :value="instance.id"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    @click.stop
                  >
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-900">
                    ₱ {{ Number(instance.unit_cost).toLocaleString() }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-900">
                    {{ instance.quantity }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm font-medium text-gray-900">
                    {{ instance.item.name }} 
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ instance.item.description }}
                  </div>
                  <div class="text-sm text-gray-900" @click.stop>
                   SN#: {{ instance.serial_number ? instance.serial_number : 'None' }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-xs text-gray-900">
                    {{ instance.inventory_number }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <span :class="[
                    getConditionClass(instance.current_condition),
                    'text-sm'
                  ]">
                    {{ instance.current_condition }}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <div class="text-xs text-gray-900">
                    {{ instance?.purchase_date ? formatDate(instance.purchase_date) : 'None' }}
                  </div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                  <div class="px-5 text-xs py-1 bg-blue-100 w-fit text-blue-800 rounded-full" >
                    {{ instance.last_borrow_record?.borrower }}
                  </div>
                  <div class="text-xs mt-2 text-gray-500">
                      <div>At: {{ formatDate(instance.last_borrow_record?.return_date) }}</div>
                      <div>In: {{ instance.last_borrow_record?.room }}</div>
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
    
    <div v-if="showBarcodePopup" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="closeBarcodePopup">
      <transition name="fade">
        <div class="bg-white p-4 rounded-lg" @click.stop>
          <img :src="currentBarcode" alt="Barcode" class="max-w-full h-auto" />
          <button @click="closeBarcodePopup" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            Close
          </button>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, computed, watch} from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import Sidebar from '@/components/UserType/Sidebar.vue';


export default defineComponent({
  name: 'DamagedItems',
  components: { Sidebar,  },
  props: {
    id: {
      type: String,
      required: true
    }
  },
  setup(props) {
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
    const selectedInstance = ref(null);
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

    const toggleSelectAll = () => {
      selectAll.value = !selectAll.value;
    };

    const printSelectedRows = () => {
      const selectedInstances = instances.value.filter(instance => 
        selectedRows.value.includes(instance.id)
      );
      printItems(selectedInstances);
    };



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
            value_filter: selectedValue.value || null
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

    watch([searchQuery, selectedCategory, selectedValue], () => {
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

    const printPage = () => {
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
          <title>Damaged Items Report</title>
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
            .inventory-number {
              font-size:10px;
            }
            .print-header { 
              text-align: center; 
              margin-bottom: 20px; 
            }
            .header-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              margin-bottom: 20px;
            }
            .logo-text-container {
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 20px;
              width: 100%;
              max-width: 800px;
            }
            .logo {
              width: 100px;
            }
            .header-text {
              flex-grow: 1;
              text-align: center;
            }
            .header-title {
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 5px;
            }
            .header-subtitle {
              font-size: 14px;
            }
            .borrower-info { 
              font-size: 10px; 
            }
            .unit-cost { 
              font-size: 10px; 
            }
            .condition-good { color: green; }
            .condition-fair { color: orange; }
            .condition-poor { color: blue; }
            .condition-damaged { color: darkred; }
            .description {
              white-space: normal;
              word-wrap: break-word;
              overflow-wrap: break-word;
              display: block;
              line-height: 1.4;
              min-width: 150px; 
              font-size: 12px;
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
            <div class="header-container">
              <div class="logo-text-container">
                <img src="/api/placeholder/100/100" alt="MSUN Logo" class="logo">
                <div class="header-text">
                  <div class="header-title">
                    Republic of the Philippines<br>
                    MINDANAO STATE UNIVERSITY AT NAAWAN
                  </div>
                  <div class="header-subtitle">
                    9023 Naawan, Misamis Oriental
                  </div>
                </div>
              </div>
              <h2>Damaged Items Report</h2>
            </div>

            <table>
              <thead>
                <tr>
                  ${printHeaders.map(header => `<th> ${header} </th> `).join('')}
                </tr>
              </thead>
              <tbody>
                ${instances.value.map(instance => `
                  <tr>
                    <td class="unit-cost">₱ ${Number(instance.unit_cost).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>${instance.quantity} </td>
                    <td>
                      <div class="description">
                        ${instance.item.name},
                        ${instance.item.description}
                      </div>
                      <div>SN#: ${instance.serial_number || 'None'}</div>
                    </td>
                    <td class="inventory-number">${instance.inventory_number}</td>
                    <td>
                      <div>${instance.last_borrow_record?.borrower}</div>
                      <div class="borrower-info" style="color: #666;">
                        ${formatDate(instance.last_borrow_record?.return_date)}<br>
                        ${instance.last_borrow_record?.room}
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <table class="signature-table">
            <tr>
              <td style="border: 1px solid #000; padding: 10px; text-align: center; width: 50%;">
                <div style="width: 100%; text-align: left; margin-bottom: 30px;">Noted by:</div>

                <div style="font-weight: bold;"></div>
                <div style="border-bottom: 1px solid #000; width: 80%; margin: 1px auto;"></div>
                <div>Printed Name & Signature</div>

                <div style="margin-top: 25px;"></div>
                <div style="border-bottom: 1px solid #000; width: 80%; margin: 1px auto;"></div>
                <div>Position/Office</div>

                <div style="margin-top: 25px;">${formatDate(new Date())}</div>
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

    const printItems = (itemsToPrint) => {
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
          <title>Damaged Items Report</title>
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
            .inventory-number {
              font-size:10px;
            }
            .print-header { 
              text-align: center; 
              margin-bottom: 20px; 
            }
            .header-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              margin-bottom: 20px;
            }
            .logo-text-container {
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 20px;
              width: 100%;
              max-width: 800px;
            }
            .logo {
              width: 100px;
            }
            .header-text {
              flex-grow: 1;
              text-align: center;
            }
            .header-title {
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 5px;
            }
            .header-subtitle {
              font-size: 14px;
            }
            .borrower-info { 
              font-size: 10px; 
            }
            .unit-cost { 
              font-size: 10px; 
            }
            .description {
              white-space: normal;
              word-wrap: break-word;
              overflow-wrap: break-word;
              display: block;
              line-height: 1.4;
              min-width: 150px; 
              font-size: 12px;
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
            <div class="header-container">
              <div class="logo-text-container">
                <img src="/api/placeholder/100/100" alt="MSUN Logo" class="logo">
                <div class="header-text">
                  <div class="header-title">
                    Republic of the Philippines<br>
                    MINDANAO STATE UNIVERSITY AT NAAWAN
                  </div>
                  <div class="header-subtitle">
                    9023 Naawan, Misamis Oriental
                  </div>
                </div>
              </div>
              <h2>Damaged Items Report</h2>
            </div>

            <table>
              <thead>
                <tr>
                  ${printHeaders.map(header => `<th> ${header} </th> `).join('')}
                </tr>
              </thead>
              <tbody>
                ${itemsToPrint.map(instance => `
                  <tr>
                    <td class="unit-cost">₱ ${Number(instance.unit_cost).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>${instance.quantity} </td>
                    <td>
                      <div class="description">
                        ${instance.item.name},
                        ${instance.item.description}
                      </div>
                      <div>SN#: ${instance.serial_number || 'None'}</div>
                    </td>
                    <td class="inventory-number">${instance.inventory_number}</td>
                    <td>
                      <div>${instance.last_borrow_record?.borrower}</div>
                      <div class="borrower-info" style="color: #666;">
                        ${formatDate(instance.last_borrow_record?.return_date)}<br>
                        ${instance.last_borrow_record?.room}
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <table class="signature-table">
            <tr>
              <td style="border: 1px solid #000; padding: 10px; text-align: center; width: 50%;">
                <div style="width: 100%; text-align: left; margin-bottom: 30px;">Noted by:</div>

                <div style="font-weight: bold;"></div>
                <div style="border-bottom: 1px solid #000; width: 80%; margin: 1px auto;"></div>
                <div>Printed Name & Signature</div>

                <div style="margin-top: 25px;"></div>
                <div style="border-bottom: 1px solid #000; width: 80%; margin: 1px auto;"></div>
                <div>Position/Office</div>

                <div style="margin-top: 25px;">${formatDate(new Date())}</div>
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


    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };



  



    return {
      // states
      instances,
      loading,
      error,
      errorMessage,
      successMessage,
      totalPages,
      currentPage,
      pageSize,
      // table
      tableHeaders,
      printHeaders,
      // barcode
      printPage,
      
      // helpers
      getConditionClass,

      formatDate,
      goBack,
      navigateToItemDetails,
      // search
      searchQuery,

      categories,


      isSidebarOpen,
      handleSidebarToggle,
      // pagination
      nextPage,
      prevPage,
      // update form
      selectedCategory,
      selectedInstance,
      selectedValue,
      selectedRows,
      selectAll,
      toggleSelectAll,
      printSelectedRows,
      printItems

      
    };
  }
});
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
