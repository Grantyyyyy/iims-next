<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
    <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-xl">
      <h2 class="text-xl font-bold mb-4">Add Stock</h2>

      <div v-if="loading" class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
      
      <form v-else @submit.prevent="submitForm" class="space-y-2">
        <div v-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p class="font-bold">Error</p>
          <p>{{ error }}</p>
        </div>
        <div v-if="successMessage" class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4" role="alert">
          <p class="font-bold">Success</p>
          <p>{{ successMessage }}</p>
        </div>

        <div class="grid grid-cols-1 mb-6 gap-4">
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-semibold text-gray-700" for="name">
                Chemical 
              </label>
              <select
                v-model="addStock.chemical"
                class="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                id="chemical"
                required
                :disabled="!!preselectedChemical"
              >
                <option v-for="chemical in chemicals" :key="chemical.id" :value="chemical.id">
                  {{ chemical.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700" for="volume">
                volume
              </label>
              <input
                v-model="addStock.volume"
                class="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                id="volume"
                type="number"
                required
                :disabled="isSubmitting"
                min="1"
              >
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700" for="purchase_date">
                Purchase Date
              </label>
              <input
                v-model="addStock.purchase_date"
                class="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                id="purchase_date"
                type="date"
                min: 
                required
                :disabled="isSubmitting"
              >
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700" for="price">
                Price
              </label>
              <input
                v-model="addStock.price"
                class="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                id="price"
                type="number"
                required
                min="1"
                :disabled="isSubmitting"

              >
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700" for="expiry_date">
                Expiry Date
              </label>
              <input
                v-model="addStock.expiry_date"
                class="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                id="expiry_date"
                type="date"
                :min="new Date().toISOString().split('T')[0]"
                required
                :disabled="isSubmitting"
              >
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end space-x-3 mt-8">
          <button
            @click="$emit('close')"
            type="button"
            class="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            :disabled="isSubmitting"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? 'Adding...' : 'Add' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, watch } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';

export default defineComponent({
  name: 'StocksForm',  
  props: {
    chemicals: {
      type: Array,
      required: true,
    },
    preselectedChemical: {
      type: String,
      default: null,
    }
  },
  setup(props, {emit})  {
    const store = useStore();
    const successMessage = ref('');
    const error = ref('');
    const isSubmitting = ref(false);
    const addStock = ref({
        chemical: '',
        volume: '',
        purchase_date: '',
        price: '',
        expiry_date: ''
      });
    
      watch(() => props.preselectedChemical, (newValue) => {
        if (newValue) {
          addStock.value.chemical = newValue;
        }
      }, { immediate: true });
  
      const submitForm = async () => {
        try {
          const newStockData = {
            chemical: addStock.value.chemical,
            volume: addStock.value.volume,
            purchase_date: addStock.value.purchase_date,
            price: addStock.value.price,
            expiry_date: addStock.value.expiry_date
          };
  
          const response = await axios.post(
            `/api/chemical/${addStock.value.chemical}/stocks/`, 
            newStockData,
            {
              headers: {
                'Authorization': `Token ${store.state.token}`
              }
            }
          );
  
          emit('stock-added', response.data);
          emit('close');
        } catch (error) {
          console.error('Error adding stock:', error);
        }
      };
  
      return {
        addStock,
        submitForm,
        successMessage,
        error,
        isSubmitting


      };
    }
  });

</script>
