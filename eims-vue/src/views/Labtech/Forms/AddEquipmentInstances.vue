<template>
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-xl">
        <h2 class="text-xl font-bold mb-4">Add Equipment Instance</h2>
  
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
                    Equipment 
                </label>
                <select
                  v-model="addInstances.equipment"
                  class="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  id="apparatus"
                  required
                  :disabled="!!preselectedEquipment"
                >
                  <option v-for="equipment in equipments" :key="equipment.id" :value="equipment.id">
                    {{ equipment.name }}
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

              <div class="flex flex-col space-y-2">
                  <label class="text-sm font-semibold text-gray-700" for="useful_life">Useful Life (years)</label>
                <input
                  v-model="addInstances.useful_life"
                  class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  id="useful_life"
                  type="number"
                  required
                >
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700" for="purchase_date">
                    Purchase Date
                </label>
                <input 
                    v-model="addInstances.purchase_date" 
                    class="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" 
                    id="purchase_date" 
                    type="date" 
                    required
                >
              </div>
              <div class="border-t pt-2 mt-2"> </div>
              <!-- <label v-if="latestStartNumber" class="block text-sm  items-center text-gray-700" for="inventory_date">
                  Previous start number: {{ latestStartNumber }}
                </label> -->
              <div class="grid grid-cols-3 gap-4">

                <div>
                  <label class="block text-sm font-semibold text-gray-700" for="inventory_date">
                      Inventory Date
                  </label>
                  <input 
                      v-model="addInstances.inventory_date" 
                      class="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" 
                      id="inventory_date" 
                      type="date" 
                      required
                  >
                </div>

                <div>
                  
                  <label class="block text-sm font-semibold text-gray-700" for="start_number">
                      Start Number
                  </label>
                  <input
                    v-model="addInstances.start_number"
                    class="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    id="start_number"
                    type="number"
                    pattern="\d{4}"
                    placeholder="e.g., 0001"
                    required
                    :disabled="isSubmitting"
                  >
                  <div class="text-sm text-gray-600 mt-1">
                    <span v-if="latestStartNumber">
                      Latest: {{ latestStartNumber.latest_start_number }} | 
                      Next: <span class="font-medium">{{ latestStartNumber.formatted_next_number }}</span>
                    </span>
                    <span v-else>Loading...</span>
                  </div>
                </div>


                <div>
                  <label class="block text-sm font-semibold text-gray-700" for="suffix">
                      Fund Cluster
                  </label>
                  <input
                    v-model="addInstances.suffix"
                    class="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    id="suffix"
                    type="number"
                    pattern="\d{2}"
                    placeholder="e.g., 01"
                    required
                    :disabled="isSubmitting"
                  >


                </div>
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
  import { defineComponent, ref, watch, onMounted } from 'vue';
  import { useStore } from 'vuex';
  import axios from 'axios';
  
  export default defineComponent({
    name: 'StocksForm',  
    props: {
      equipments: {
        type: Array,
        required: true,
        default: () => []
      },
      preselectedEquipment: {
        type: String,
        default: null,
      }
},
    setup(props, {emit})  {
        const store = useStore();
        const successMessage = ref('');
        const loading = ref(false);
        const error = ref('');
        const isSubmitting = ref(false);
        const latestStartNumber = ref(null)

        const addInstances = ref({
            apparatus: '',
            quantity: null,
            unit_cost: '',
            useful_life: null,
            purchase_date: '',
            inventory_date: new Date().toISOString().split('T')[0],  // Today's date as default
            start_number: '',
            suffix: '01',
        });

        const fetchLatestStartNumber = async () => {
          try {
            const response = await axios.get(
              'api/equipment-instances/latest-number/',
              {
                headers: {
                  'Authorization': `Token ${store.state.token}`
                }
              }
            );
            latestStartNumber.value = response.data;
            
            // Auto-fill the start_number with the next number
            if (response.data && response.data.formatted_next_number) {
              addInstances.value.start_number = response.data.formatted_next_number;
            } else {
              addInstances.value.start_number = '0001';
            }
            
          } catch (error) {
            console.error('Error fetching latest start number:', error);
            // Set a default value if there's an error
            addInstances.value.start_number = '0001';
          }
        };

        onMounted(() => {
          fetchLatestStartNumber();
        });
      
        watch(() => addInstances.value.equipment, async (newValue) => {
          if (newValue) {
            await fetchLatestStartNumber(newValue);
          }
        });

        // Watch for preselected equipment
        watch(() => props.preselectedEquipment, async (newValue) => {
          if (newValue) {
            addInstances.value.equipment = newValue;
            // await fetchLatestStartNumber(newValue);
          }
        }, { immediate: true });
    
        const submitForm = async () => {
          try {
            const newInstancesData = {
                equipment: addInstances.value.equipment,
                quantity: addInstances.value.quantity,
                unit_cost: addInstances.value.unit_cost,
                inventory_date: new Date(addInstances.value.inventory_date).toISOString().split('T')[0],
                start_number: addInstances.value.start_number,
                suffix: addInstances.value.suffix
            };
    
            const response = await axios.post(
              `/api/equipments/${addInstances.value.equipment}/instances/`, 
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
          loading,
          error,
          isSubmitting,
          latestStartNumber
  
  
        };
      }
    });
  
  </script>
  
  