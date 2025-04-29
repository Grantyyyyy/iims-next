<template>
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Add New Batch</h2>
        <form @submit.prevent="submitForm">
            <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="item">Item</label>
            <select 
                v-model="addBatch.item" 
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                id="item" 
                required
                :disabled="!!preselectedItem"
            >
                <option v-for="item in items" :key="item.id" :value="item.id">
                {{ item.name }}
                </option>
            </select>
            </div>
            <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="batch_number">Batch Number</label>
            <input v-model="addBatch.batch_number" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="batch_number" type="text" required>
          </div>  
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="manufacture_date">Manufacture Date</label>
            <input v-model="addBatch.manufacture_date" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="manufacture_date" type="date" required>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="expiry_date">Expiry Date</label>
            <input v-model="addBatch.expiry_date" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="expiry_date" type="date">
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="quantity">Quantity</label>
            <input v-model="addBatch.quantity" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="quantity" type="number" min="0" required>
          </div>
          <div class="flex items-center justify-between">
            <button @click="$emit('close')" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
              Cancel
            </button>
            <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
              Add Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  </template>
  
  <script>
import { defineComponent, ref, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'

export default defineComponent({
  name: 'BatchForm',
  props: {
    items: {
      type: Array,
      required: true
    },
    preselectedItem: {
      type: String,
      default: null
    }
  },
  
  setup(props, { emit }) {
    const store = useStore();
    const addInstances = ref({
      item: '',
      batch_number: '',
      manufacture_date: '',
      expiry_date: '',
      quantity: null,
    });

    // Watch for changes in preselectedItem
    watch(() => props.preselectedItem, (newValue) => {
      if (newValue) {
        addBatch.value.item = newValue;
      }
    }, { immediate: true });

    const submitForm = async () => {
      try {
        const newBatchData = {
          ...addBatch.value,
          item: addBatch.value.item,
        };
        const response = await axios.post('/api/ictc-batch/', newBatchData, {
          headers: {
            'Authorization': `Token ${store.state.token}`
          }
        });
        emit('batch-added', response.data);
        emit('close');
      } catch (error) {
        console.error('Error adding batch:', error);
      }
    };

    return {
      addBatch,
      
      submitForm
    };
  }
});
  </script>
  
  <style scoped>
  .form-input, .form-select, .form-textarea {
    @apply w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300;
  }
  .btn {
    @apply px-4 py-2 rounded-md focus:outline-none focus:ring;
  }
  .btn-green {
    @apply bg-green-500 text-white hover:bg-green-600 focus:border-green-300;
  }
  .btn-gray {
    @apply bg-gray-300 text-gray-700 hover:bg-gray-400 focus:border-gray-500;
  }
  </style>