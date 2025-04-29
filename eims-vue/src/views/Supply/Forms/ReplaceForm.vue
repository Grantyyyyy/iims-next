<template>
    <div class="space-y-4">
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Replacement Reason
        </label>
        <textarea
          v-model="replacementReason"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Please explain why this item needs to be replaced..."
        ></textarea>
        <p v-if="errors.reason" class="mt-1 text-sm text-red-600">
          {{ errors.reason }}
        </p>
      </div>
  
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Additional Notes (Optional)
        </label>
        <textarea
          v-model="notes"
          rows="2"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Add any additional notes..."
        ></textarea>
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
          class="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 disabled:opacity-50"
        >
          {{ isSubmitting ? 'Submitting...' : 'Submit Replacement Request' }}
        </button>
      </div>
    </div>
  </template>
  
  <script>
  import { defineComponent, ref } from 'vue';
  import axios from 'axios';
  
  export default defineComponent({
    name: 'ReplaceForm', 
    props: {
      itemId: {
        type: [Number, String],
        required: true
      }
    },
    emits: ['close', 'turnover-success'],
    setup(props, { emit }) {
      const replacementReason = ref('');
      const notes = ref('');
      const isSubmitting = ref(false);
      const errors = ref({});
  
      const handleSubmit = async () => {
        errors.value = {};
        
        if (!replacementReason.value.trim()) {
          errors.value.reason = 'Please provide a replacement reason';
          return;
        }
  
        isSubmitting.value = true;
        
        try {
          await axios.post('/api/replace-requests/', {
            item: [props.itemId],
            replacement_reason: replacementReason.value, 
          });
          
          emit('turnover-success', {
            itemId: props.itemId,
            status: 'Replaced',
          } );
        } catch (error) {
          errors.value = error.response?.data || { general: 'An error occurred' };
        } finally {
          isSubmitting.value = false;
        }
      };
  
      return {
        replacementReason,
        notes,
        isSubmitting,
        errors,
        handleSubmit
      };
    }
  });
  </script>