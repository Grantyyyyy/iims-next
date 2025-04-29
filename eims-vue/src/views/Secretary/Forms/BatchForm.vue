<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
    <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
      <h2 class="text-xl font-bold mb-4">Add New Batch</h2>
      <form @submit.prevent="submitForm">
        <!-- Item Selection - Always enabled -->
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="item">Item</label>
          <select
            v-model="addBatch.item_id"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="item"
            required
          >
            <option value="">Select an item</option>
            <option v-for="item in items" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>
        </div>
        <!-- Batch Selection - Disabled when preselected -->
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="batch">Batch</label>
          <select
            v-model="addBatch.batch_number"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="batch"
            required
            :disabled="!!preselectedBatch"
          >
            <option value="">Select a batch</option>
            <option v-for="batch in batches" :key="batch.id" :value="batch.id">
              {{ batch.batch_number }}
            </option>
          </select>
        </div>
        <!-- Manufacture Date -->
        <!-- <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="manufacture_date">Manufacture Date</label>
          <input 
            v-model="addBatch.manufacture_date" 
            type="date" 
            id="manufacture_date" 
            required 
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
        </div> -->
        <!-- Expiry Date -->
        <!-- <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="expiry_date">Expiry Date</label>
          <input 
            v-model="addBatch.expiry_date" 
            type="date" 
            id="expiry_date" 
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
        </div> -->
        <!-- Quantity -->
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="quantity">Quantity</label>
          <input 
            v-model="addBatch.quantity" 
            type="number" 
            min="0" 
            id="quantity" 
            required 
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="quantity">Price</label>
          <input 
            v-model="addBatch.price" 
            type="number" 
            min="0" 
            id="price" 
            required 
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
        </div>
        <!-- Buttons -->
        <div class="flex items-center justify-between">
          <button 
            @click="$emit('close')" 
            type="button" 
            class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Add Batch
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
name: 'BatchForm',
props: {
  items: {
    type: Array,
    required: true
  },
  batches: {
    type: Array,
    required: true
  },
  preselectedBatch: {
    type: String,
    default: null
  }
},
setup(props, { emit }) {
  const store = useStore();

  // Initialize addBatch with empty item selection
  const addBatch = ref({
    item_id: '', // Empty by default - user must select
    batch_number: '',
    quantity: null,
    price: '',
  });

  // Watch for preselectedBatch changes and update batch_number
  watch(() => props.preselectedBatch, (newValue) => {
    if (newValue) {
      addBatch.value.batch_number = newValue;
    }
  }, { immediate: true });
  
    const submitForm = async () => {
        try {
            const newInstancesData = {
                item_id: addBatch.value.item_id,
                batch_number: addBatch.value.batch_number,
                quantity: addBatch.value.quantity,
                price: addBatch.value.price
            };
            // Send a POST request to the correct item instance endpoint
            const response = await axios.post(`/api/batch/${addBatch.value.batch_number}/instances/`, newInstancesData, {
                headers: {
                    'Authorization': `Token ${store.state.token}`
                }
            });
            emit('batch-added', response.data);
            emit('close');
        } catch (error) {
            console.error('Error adding instances:', error);
        }
    };
    
  return {
    addBatch,
    submitForm
  };
}
});
</script>