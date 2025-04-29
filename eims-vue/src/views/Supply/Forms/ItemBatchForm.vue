<template>
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 class="text-xl font-bold mb-4">Add New Item Batch</h2>
        
        <form @submit.prevent="submitForm" class="grid grid-cols-2 gap-4">
          <!-- Left Column -->
          <div class="space-y-3">
            <div>
              <label class="text-sm font-semibold text-gray-700" for="item">Item</label>
              <select
                v-model="form.item"
                class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                id="item"
                required
              >
                <option value="" disabled>Select an item</option>
                <option v-for="item in items" :key="item.id" :value="item.id">
                  {{ item.name }}
                </option>
              </select>
            </div>
  
            <div>
              <label class="text-sm font-semibold text-gray-700" for="batch">Batch</label>
              <select
                v-model="form.batch"
                class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                id="batch"
                required
                :disabled="!!preselectedBatch"
              >
                <option value="" disabled>Select a batch</option>
                <option v-for="batch in batches" :key="batch.id" :value="batch.id">
                  {{ batch.batch_number }}
                </option>
              </select>
            </div>
  
            <div>
              <label class="text-sm font-semibold text-gray-700" for="unit_cost">Unit Cost</label>
              <input
                v-model.number="form.unit_cost"
                class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                id="unit_cost"
                type="number"
                step="0.01"
                required
              >
            </div>
          </div>
  
          <!-- Right Column -->
          <div class="space-y-3">
            <div>
              <label class="text-sm font-semibold text-gray-700" for="manufacture_date">Manufacture Date</label>
              <input
                v-model="form.manufacture_date"
                class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                id="manufacture_date"
                type="date"
                required
              >
            </div>
  
            <div>
              <label class="text-sm font-semibold text-gray-700" for="expiry_date">Expiry Date</label>
              <input
                v-model="form.expiry_date"
                class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                id="expiry_date"
                type="date"
              >
            </div>
  
            <div>
              <label class="text-sm font-semibold text-gray-700" for="quantity">Quantity</label>
              <input
                v-model.number="form.quantity"
                class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                id="quantity"
                type="number"
                min="0"
                required
              >
            </div>
          </div>
  
          <!-- Footer - Full Width -->
          <div class="col-span-2 flex justify-end space-x-3 mt-4">
            <button
              @click="$emit('close')"
              type="button"
              class="px-4 py-1.5 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  </template>
  
  <script>
  import { defineComponent, ref, watch } from 'vue'
  import axios from 'axios'
  
  export default defineComponent({
    name: 'AddItemBatch',
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
      },
    },
    setup(props, { emit }) {
      const form = ref({
        item: '',
        batch: '',
        unit_cost: '',
        manufacture_date: '',
        expiry_date: '',
        quantity: 0,
      })
  
      watch(() => props.preselectedBatch, (newValue) => {
        if (newValue) {
          form.value.batch = newValue;
        }
      }, { immediate: true });
  
      const resetForm = () => {
        form.value = {
          item: '',
          batch_number: '',
          unit_cost: '',
          manufacture_date: '',
          expiry_date: '',
          quantity: 0,
        }
      }
  
      const submitForm = async () => {
        try {
          console.log('Form data before submission:', form.value);
  
          // Create the data object that matches your Django model 
          const newInstancesData = {
            item: form.value.item,  // Changed from item_id
            batch: form.value.batch, // Changed from batch_id
            unit_cost: parseFloat(form.value.unit_cost),
            manufacture_date: form.value.manufacture_date,
            expiry_date: form.value.expiry_date || null,
            quantity: parseInt(form.value.quantity),
          };
  
          console.log('Data being sent to server:', newInstancesData);
  
          const response = await axios.post('/api/item-batch/', newInstancesData);
          console.log('Server response:', response.data);
  
          resetForm();
          emit('item-added', response.data);
          emit('close');
        } catch (error) {
          console.error('Error submitting form:', error);
          if (error.response) {
            console.error('Server error response:', error.response.data);
          }
        }
      }
  
      
  
      return {
        form,
        submitForm,
        resetForm
      }
    },
  })
  </script>