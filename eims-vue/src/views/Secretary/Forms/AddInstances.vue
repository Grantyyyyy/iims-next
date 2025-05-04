<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
    <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-xl">
      <h2 class="text-xl font-bold mb-4">
        Add New {{ selectedItemDetails?.item_type || 'Item' }}
      </h2>

      <div v-if="loading" class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
      
      <form v-else @submit.prevent="submitForm" class="space-y-2">
        <!-- ... error and success messages ... -->

        <div class="grid grid-cols-1 mb-6 gap-4">
          <div class="space-y-3">
            <!-- Item Selection -->
            <div>
              <label class="block text-sm font-semibold text-gray-700" for="item">
                Item 
              </label>
              <select
                v-model="selectedItemId" 
                class="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                id="item"
                required
                :disabled="!!preselectedItem"
                @change="handleItemChange"
              >
                <option value="">Select an item</option>
                <option v-for="item in items" :key="item.id" :value="item.id">
                  {{ item.name }} ({{ item.item_type }})
                </option>
              </select>
            </div>

            <!-- Always show these fields -->

              <div>
                <label class="block text-sm font-semibold text-gray-700" for="quantity">
                  Quantity
                </label>
                <input
                  v-model="formData.quantity"
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
                  v-model="formData.unit_cost"
                  class="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  id="unit_cost"
                  type="number"
                  required
                  :disabled="isSubmitting"
                >
              </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700" for="purchase_date">
                  Purchase Date
                </label>
                <input
                  v-model="formData.purchase_date"
                  class="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  id="purchase_date"
                  type="date"
                  required
                  :disabled="isSubmitting"
                >
              </div>

              <div>
                <label class="text-sm font-semibold text-gray-700" for="useful_life">Useful Life (years)</label>
                <input
                  v-model="formData.useful_life"
                  class="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  id="useful_life"
                  type="number"
                  required
                  :disabled="isSubmitting"
                >
              </div>
            </div>

            <div class="border-t pt-2 mt-2"> </div>
            <div v-if="!isConsumableItem" class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2" for="inventory_date">
                  Inventory Date
                </label>
                <input
                  v-model="formData.inventory_date"
                  class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  id="inventory_date"
                  type="date"
                  required
                />
              </div>

              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2" for="start_number">
                  Start Number
                </label>
                <input
                  v-model="formData.start_number"
                  class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  id="start_number"
                  type="number"
                  pattern="\d{4}"
                  placeholder="e.g., 0001"
                  required
                />
                <div class="text-sm text-gray-600 mt-1">
                  <span v-if="latestNumberInfo">
                    Latest: {{ latestNumberInfo.latest_start_number }} | 
                    Next: <span class="font-medium">{{ latestNumberInfo.formatted_next_number }}</span>
                  </span>
                  <span v-else>Loading...</span>
                </div>
              </div>

              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2" for="suffix">
                  Fund Cluster
                </label>
                <input
                  v-model="formData.suffix"
                  class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  id="suffix"
                  type="text"
                  pattern="\d{2}"
                  placeholder="e.g., 01"
                  required 
                />
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
import { defineComponent, ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';

export default defineComponent({
  name: 'AddInstances',
  
  props: {
    items: {
      type: Array,
      required: true,
      default: () => []
    },
    preselectedItem: {
      type: [String, Number],
      default: null
    },
    selectedItemDetails: {
      type: Object,
      default: null
    }
  },

  setup(props, { emit }) {
    const store = useStore();
    const selectedItemId = ref(props.preselectedItem || null);
    const isSubmitting = ref(false);
    const loading = ref(false);
    const error = ref('');
    const successMessage = ref('');
    const latestNumberInfo = ref(null);

    // Computed property to determine if current item is consumable
    const isConsumableItem = computed(() => {
      if (props.selectedItemDetails) {
        return props.selectedItemDetails.item_type === 'Consumables';
      }
      const selectedItem = props.items.find(item => item.id === selectedItemId.value);
      return selectedItem?.item_type === 'Consumables';
    });

    // Initialize form data
    const formData = ref({
      quantity: null,
      unit_cost: '',
      purchase_date: new Date().toISOString().split('T')[0],
      useful_life: '',
      inventory_date: new Date().toISOString().split('T')[0],
      start_number: '',
      suffix: '01',
    });

    // Fetch latest start number on component mount
    const fetchLatestStartNumber = async () => {
      try {
        const response = await axios.get(
          'api/item-instances/latest-number/',
          {
            headers: {
              'Authorization': `Token ${store.state.token}`
            }
          }
        );
        latestNumberInfo.value = response.data;
        
        // If non-consumable item, auto-fill the start number with the next formatted number
        if (!isConsumableItem.value) {
          formData.value.start_number = response.data.formatted_next_number;
        }
      } catch (error) {
        console.error('Error fetching latest start number:', error);
      }
    };

    onMounted(() => {
      // Fetch latest number on component mount
      fetchLatestStartNumber();
      
      // If preselected item is provided, set up the form accordingly
      if (props.preselectedItem) {
        selectedItemId.value = props.preselectedItem;
        handleItemChange();
      }
    });

    // Watch for changes in selected item type
    watch(() => isConsumableItem.value, (isConsumable) => {
      if (isConsumable) {
        // Reset inventory-related fields for consumables
        formData.value.inventory_date = '';
        formData.value.start_number = '';
        formData.value.suffix = '';
      } else {
        // Set default values for non-consumables
        formData.value.inventory_date = new Date().toISOString().split('T')[0];
        
        // Auto-fill the start number with the next formatted number if available
        if (latestNumberInfo.value && latestNumberInfo.value.formatted_next_number) {
          formData.value.start_number = latestNumberInfo.value.formatted_next_number;
        } else {
          formData.value.start_number = '0001';
        }
        
        formData.value.suffix = '01';
      }
    });

    const handleItemChange = async () => {
      // If a new item is selected, handle the form updates based on item type
      const selectedItem = props.items.find(item => item.id === selectedItemId.value);
      
      if (selectedItem) {
        // Reset form data for a new item selection
        formData.value = {
          ...formData.value,
          quantity: null,
          unit_cost: '',
          purchase_date: new Date().toISOString().split('T')[0],
          useful_life: '',
        };
        
        if (selectedItem.item_type === 'Consumables') {
          // For consumables, clear inventory-related fields
          formData.value.inventory_date = '';
          formData.value.start_number = '';
          formData.value.suffix = '';
        } else {
          // For non-consumables, set default values and fetch latest number
          formData.value.inventory_date = new Date().toISOString().split('T')[0];
          formData.value.suffix = '01';
          
          // Ensure we have the latest number information
          if (!latestNumberInfo.value) {
            await fetchLatestStartNumber();
          } else {
            // Auto-fill the start number with the next formatted number
            formData.value.start_number = latestNumberInfo.value.formatted_next_number;
          }
        }
      }
    };

    const submitForm = async () => {
      try {
        isSubmitting.value = true;
        const submitData = {
          item: selectedItemId.value,
          quantity: formData.value.quantity,
          unit_cost: formData.value.unit_cost,
          purchase_date: formData.value.purchase_date,
          useful_life: formData.value.useful_life,
        };

        // Only include inventory fields for non-consumable items
        if (!isConsumableItem.value) {
          submitData.inventory_date = formData.value.inventory_date;
          submitData.start_number = formData.value.start_number;
          submitData.suffix = formData.value.suffix;
        }

        const response = await axios.post(
          `/api/items/${selectedItemId.value}/instances/`,
          submitData,
          {
            headers: {
              'Authorization': `Token ${store.state.token}`
            }
          }
        );

        emit('instance-added', response.data);
        emit('close');
      } catch (err) {
        error.value = err.response?.data?.message || 'An error occurred while adding the instance';
        console.error('Form submission error:', err);
      } finally {
        isSubmitting.value = false;
      }
    };

    return {
      formData,
      selectedItemId,
      isSubmitting,
      loading,
      error,
      successMessage,
      latestNumberInfo,
      isConsumableItem,
      handleItemChange,
      submitForm
    };
  }
});
</script>