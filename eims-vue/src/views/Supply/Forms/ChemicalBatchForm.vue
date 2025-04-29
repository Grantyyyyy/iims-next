<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
    <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
      <h2 class="text-xl font-bold mb-4">Add New Chemical Batch</h2>
      
      <form @submit.prevent="handleSubmit" class="grid grid-cols-2 gap-4">
        <!-- Left Column -->
        <div class="space-y-3">
          <div>
            <label class="text-sm font-semibold text-gray-700" for="chemical">Chemical</label>
            <select
              v-model="form.chemical"
              class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="chemical"
              required
            >
              <option value="" disabled>Select a chemical</option>
              <option v-for="chemical in chemicals" :key="chemical.id" :value="chemical.id">
                {{ chemical.name }}
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
              <option v-for="batch in batches" :key="batch.id" :value="batch.id">
                {{ batch.batch_number }}
              </option>
            </select>
          </div>

          <div>
            <label class="text-sm font-semibold text-gray-700" for="price">Price</label>
            <input
              v-model.number="form.price"
              class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="price"
              type="number"
              step="0.01"
              :required="false"
            >
          </div>
        </div>

        <!-- Right Column -->
        <div class="space-y-3">
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
            <label class="text-sm font-semibold text-gray-700" for="volume">Volume</label>
            <input
              v-model.number="form.volume"
              class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="volume"
              type="number"
              min="0"
              step="0.01"
              required
            >
          </div>
        </div>

        <!-- Footer - Full Width -->
        <div class="col-span-2 flex justify-end space-x-3 mt-4">
          <button
            @click="handleClose"
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
import { defineComponent, ref, watch } from 'vue';
import axios from 'axios';

export default defineComponent({
  name: 'ChemicalBatchForm',
  props: {
    chemicals: {
      type: Array,
      required: true,
    },
    batches: {
      type: Array,
      required: true,
    },
    preselectedBatch: {
      type: String,
      default: null,
    },
  },
  setup(props, { emit }) {
    const form = ref({
      chemical: '',
      batch: '',
      price: '',
      expiry_date: '',
      volume: 0,
    });
    
    const isSubmitting = ref(false);

    watch(
      () => props.preselectedBatch,
      (newValue) => {
        if (newValue) {
          form.value.batch = newValue;
        }
      },
      { immediate: true }
    );

    const handleClose = () => {
      form.value = {
        chemical: '',
        batch: '',
        price: '',
        expiry_date: '',
        volume: 0,
      };
      emit('close');
    };

    const handleSubmit = async () => {
      if (isSubmitting.value) return;
      
      isSubmitting.value = true;
      try {
        const token = localStorage.getItem('token');
        const chemicalBatchData = {
          chemical: form.value.chemical,
          batch: form.value.batch,
          price: parseFloat(form.value.price) || null,
          expiry_date: form.value.expiry_date || null,
          volume: parseFloat(form.value.volume),
        };

        const response = await axios.post('/api/chemical-batch/', chemicalBatchData, {
          headers: { 'Authorization': `Token ${token}` },
        });
        
        emit('chemical-added', response.data);
        handleClose();
      } catch (error) {
        console.error('Error adding chemical batch:', error);
        // Add error handling here if needed
      } finally {
        isSubmitting.value = false;
      }
    };

    return {
      form,
      isSubmitting,
      handleSubmit,
      handleClose,
    };
  },
});
</script>
