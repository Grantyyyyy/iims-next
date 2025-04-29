<template>
    <div class="space-y-4">
      <div class="p-4 bg-red-50 rounded-md">
        <p class="text-sm text-red-700">
          Warning: You are about to mark this item as disposed. 
          This action cannot be undone. Are you sure you want to continue?
        </p>
      </div>
  
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Disposal Reason
        </label>
        <textarea
          v-model="disposalReason"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Please provide a reason for disposal..."
        ></textarea>
        <p v-if="errors.reason" class="mt-1 text-sm text-red-600">
          {{ errors.reason }}
        </p>
      </div>
  
      <div class="flex justify-end space-x-3">
        <button 
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button 
          @click="handleSubmit"
          :disabled="isSubmitting"
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          {{ isSubmitting ? 'Processing...' : 'Submit Disposal Request' }}
        </button>
      </div>
    </div>
  </template>
  
  <script>
  import { defineComponent, ref } from 'vue';
  import axios from 'axios';
  
  export default defineComponent({
    name: 'DisposeForm',
    props: {
      itemId: {
        type: [Number, String],
        required: true
      }
    },
    emits: ['close', 'turnover-success'],
    setup(props, { emit }) {
      const disposalReason = ref('');
      const isSubmitting = ref(false);
      const errors = ref({});
  
      const handleSubmit = async () => {
        errors.value = {};
        
        if (!disposalReason.value.trim()) {
          errors.value.reason = 'Please provide a reason for disposal';
          return;
        }
  
        isSubmitting.value = true;
        
        try {
          await axios.post('/api/dispose-requests/', {
            item: [props.itemId],
            disposal_reason: disposalReason.value 
          });
          
          emit('turnover-success', {
          itemId: props.itemId,
          status: 'Disposed'
        });
        } catch (error) {
          errors.value = error.response?.data || { general: 'An error occurred' };
        } finally {
          isSubmitting.value = false;
        }
      };
  
      return {
        disposalReason,
        isSubmitting,
        errors,
        handleSubmit
      };
    }
  });
  </script>