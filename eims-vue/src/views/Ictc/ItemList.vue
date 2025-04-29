<template>
    <div class="flex h-screen bg-gradient-to-b from-[#F5F4F1] to-[#D4EAF7]">
      <Sidebar />
      <div class="flex-1 overflow-x-auto p-8 ml-64 relative">
        <div class="max-w-full bg-white/80 backdrop-blur-md shadow-lg rounded-lg p-8">
  
          <button @click="goBack" class="flex items-center mb-6 text-gray-700 hover:text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          <h1 class="text-3xl font-bold mb-6 text-gray-800">Inventory</h1>
  
          <div class="flex justify-end mb-4">
            <button @click="openAddItemForm" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center">
              <i class="fas fa-plus mr-2"></i> Add Item
            </button>

            <button @click="openAddCategoryForm" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 ml-4 px-4 rounded flex items-center">
              <i class="fas fa-tags mr-2"></i> Add Category
            </button>

          </div>
    
  
          <!-- Loading and Error States -->
          <div v-if="loading" class="flex justify-center 
          
          s-center h-64">
            <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <div v-else-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
            <p class="font-bold">Error</p>
            <p>{{ error }}</p>
          </div>
  
          <!-- Items Table -->
          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th v-for="header in tableHeaders" :key="header" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ header }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr 
                  v-for="item in items" 
                  :key="item.id" 
                  @click="navigateToItemInstances(item.id)"
                  class="hover:bg-gray-100 transition-colors duration-150 ease-in-out cursor-pointer"
                >
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-blue-600 hover:text-blue-800 font-medium">
                      {{ item.name }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {{ item.category.name }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {{ item.item_type }}
                  </td>
                  <td class="px-6 py-4">
                    <div 
                      :title="item.description"
                      class="truncate max-w-xs"
                    >
                      {{ item.description }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {{ formatDate(item.manufacture_date) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {{ item.quantity }}
                  </td>
                  
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CartSummary
        :items="cartStore.cartItems"
        @remove-item="removeFromCart"
        @open-borrow="showBorrowModal = true"
      />

      <!-- <div v-if="showAddForm" class="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 z-50">
        <ItemForm
          :item="items"
          :batches="batches"
          :categories="categories"
          @close="showAddForm = false"
          @item-added="handleItemAdded"
        />
      </div> -->
      <div v-if="showAddCategoryForm" class="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 z-50">
        <CategoryForm
          :categories="categories"
          @close="showAddCategoryForm = false"
          @category-added="handleCategoryAdded "
        />
      </div>
    </div>
  </template>
  
  <script>
  import { defineComponent, ref, computed, onMounted, } from 'vue'
  import { useStore } from 'vuex'
  import { useRouter } from 'vue-router'
    import { useCartStore } from '@/stores/cartStore'
  import axios from 'axios'
  import Sidebar from '@/components/UserType/Sidebar.vue'
  // import ItemForm from './Froms/ItemForm.vue'
  import CategoryForm from './Forms/CategoryForm.vue'  
import CartSummary from './Modals/CartSummary.vue'
  
  export default defineComponent({
    name: 'IctcItemList',
    components: {
      Sidebar, CategoryForm, CartSummary
    },
    setup() {
      const store = useStore()
      const router = useRouter()
      const items = ref([])
      const cartStore = useCartStore();
      const categories = ref([])
      const loading = ref(false)
      const error = ref(null)
      const showAddForm = ref(false)
      const showAddCategoryForm = ref(false)

      const tableHeaders = ['Name', 'Category', 'Item Type', 'Description', 'Manufacture Date', 'Total Quantity', 'Actions']
  
      const token = computed(() => store.state.token)
  
      const handleItemAdded = () => {
        showAddForm.value = false;
        fetchItems();
        fetchCategories();
      };
  
      const handleCategoryAdded  = () => {
        fetchCategories(); // Refresh categories after adding a new one
      };

      const fetchData = async (url, token) => {
        try {
          const response = await axios.get(url, {
            headers: { 'Authorization': `Token ${token}` }
          });
          console.log(`Fetched data from ${url}:`, response.data);
          return response.data;
        } catch (err) {
          console.error(`Error fetching data from ${url}:`, err);
          throw new Error(`Failed to fetch data from ${url}`);
        }
      };

      const fetchItems = async () => {
        try {
          const response = await axios.get('/api/ictc-item/');
          console.log('Fetched items:', response.data);
          items.value = response.data;
        } catch (err) {
          console.error("Error fetching items:", err);
          error.value = "Failed to fetch items. Please try again.";
        }
      }
  
      const fetchCategories = async () => {
        try {
          const response = await axios.get('/api/ictc-category/');
          console.log('Fetched categories:', response.data);
          categories.value = response.data;
        } catch (err) {
          console.error("Error fetching categories:", err);
          error.value = "Failed to fetch categories. Please try again.";
        }
      }
  
      onMounted(fetchItems);
      onMounted(fetchCategories);
  
      const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      }
  
      const openAddItemForm = () => {
        showAddForm.value = true
      }

      const closeAddBatchForm = () => {
        showAddForm.value = false
      }

      const openAddCategoryForm = () => {
        showAddCategoryForm.value = true
      }

      const closeAddCategoryForm = () => {
        showAddCategoryForm.value = false
      }

      const addToCart = (instance) => {
        if (!instance.borrowed_by && !cartStore.isInCart(instance.id)) {
          cartStore.addToCart(instance);
        }
      };
  
      const removeFromCart = (instanceId) => {
        cartStore.removeFromCart(instanceId);
      };
  
      const isInCart = (instanceId) => {
        return cartStore.isInCart(instanceId);
      };
  
      const goBack = () => {
        router.back()
      }
  
      const navigateToItemInstances = (itemId) => {
        router.push({ name: 'IctcItemInstances', params: { id: itemId } })
      }
  
  
      return {
        items,
        loading,
        categories,
        error,  
        showAddForm,
        tableHeaders,
        formatDate,
        navigateToItemInstances,
        goBack,
        openAddItemForm,
        handleItemAdded,
        openAddCategoryForm,
        showAddCategoryForm,
        closeAddCategoryForm,

        addToCart,
        removeFromCart,
        isInCart,
        cartStore
        
      }
    }
  })
  </script>
  
  <style scoped>
  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  </style>