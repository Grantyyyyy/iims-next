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
                    Apparatus 
                </label>
                <select
                  v-model="addInstances.apparatus"
                  class="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  id="apparatus"
                  required
                  :disabled="!!preselectedApparatus"
                >
                  <option v-for="apparatuses in apparatus" :key="apparatuses.id" :value="apparatuses.id">
                    {{ apparatuses.name }}
                  </option>
                </select>
              </div> 
  
              <div>
                <label class="block text-sm font-semibold text-gray-700" for="quantity">
                    Quantity
                </label>
                <input
                  v-model="addInstances.quantity"
                  class="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  id="quantity"
                  type="number"
                  required
                  :disabled="isSubmitting"
                >
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700" for="unit_cost">
                    Unit Cost
                </label>
                <input
                  v-model="addInstances.unit_cost"
                  class="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  id="unit_cost"
                  type="number"
                  required
                  :disabled="isSubmitting"
                >
              </div>

              <div>
                <label class="text-sm font-semibold text-gray-700" for="useful_life">Useful Life (years)</label>
                <input
                  v-model="addInstances.useful_life"
                  class="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  id="useful_life"
                  type="number"
                  required
                  :disabled="isSubmitting"
                >
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700" for="unit_cost">
                    Purchased Date
                </label>
                <input
                  v-model="addInstances.purchase_date"
                  class="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  id="purchased_date"
                  type="date"
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
      apparatus: {
        type: Array,
        required: true,
      },
      preselectedApparatus: {
        type: String,
        default: null,
      }
    },
    setup(props, {emit})  {
      const store = useStore();
      const successMessage = ref('');
      const error = ref('');
      const isSubmitting = ref(false);

      const addInstances = ref({
          apparatus: '',
          quantity: null,
          unit_cost: '',
          useful_life: '',
          purchase_date: '',

        });
      
        watch(() => props.preselectedApparatus, (newValue) => {
          if (newValue) {
            addInstances.value.apparatus = newValue;
          }
        }, { immediate: true });
    
        const submitForm = async () => {
          try {
            const newInstancesData = {
                apparatus: addInstances.value.apparatus,
                quantity: addInstances.value.quantity,
                unit_cost: addInstances.value.unit_cost,
                useful_life: addInstances.value.useful_life,
                purchase_date: addInstances.value.purchase_date,
            };
    
            const response = await axios.post(
              `/api/apparatus/${addInstances.value.apparatus}/instances/`, 
              newInstancesData,
              {
                headers: {
                  'Authorization': `Token ${store.state.token}`
                }
              }
            );
    
            emit('instance-added', response.data);
            emit('close');
          } catch (error) {
            console.error('Error adding stock:', error);
          }
        };
    
        return {
          addInstances,
          submitForm,
          successMessage,
          error,
          isSubmitting
  
  
        };
      }
    });
  
  </script>
  