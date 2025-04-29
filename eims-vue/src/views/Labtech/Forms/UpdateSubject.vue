<template>
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-xl">
          <h2 class="text-xl font-bold mb-4">Update Subject</h2>
  
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
                    Name
                </label>
                <input
                  v-model="formData.name"
                  class="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  id="name"
                  type="text"
                  required
                  :disabled="isSubmitting"
                >
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700" for="description">
                  Code
                </label>
                <input
                  v-model="formData.code"
                  class="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  id="code"
                  rows="3"
                  required
                  :disabled="isSubmitting"
                >
              </div>

            </div>
          </div>
  
          <!-- Form Actions -->
          <div class="flex justify-end space-x-3 mt-8">
            <button
              @click="handleClose"
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
              {{ isSubmitting ? 'Updating...' : 'Update' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </template>
    
    <script>
    import { defineComponent, ref, onMounted } from 'vue';
    import axios from 'axios';
    
    export default defineComponent({
      name: 'UpdateSubjectForm',
      
      props: {
        subject: {
          type: Object,
          required: true
        }
      },
    
      emits: ['close', 'subject-updated'],
      
      setup(props, { emit }) {
        const loading = ref(true);
        const error = ref(null);
        const isSubmitting = ref(false);
        const successMessage = ref(null);
        
        const formData = ref({
          name: '',
          code: '',
        });
    
        const handleClose = () => {
          if (!isSubmitting.value) {
            emit('close');
          }
        };
    
        const initializeForm = () => {
          if (props.subject) {
            formData.value = {
              name: props.subject.name || '',
              code: props.subject.code || '',
            };
          }
          loading.value = false;
        };
    
        const submitForm = async () => {
          if (isSubmitting.value) return;
    
          isSubmitting.value = true;
          error.value = null;
          
          try {
            const response = await axios.put(
              `/api/subject/${props.subject.id}/update/`,
              formData.value
            );
    
            if (response.status === 200) {
              successMessage.value = 'Subject updated successfully.';
              setTimeout(() => {
                emit('subject-updated', response.data);
                emit('close');
              }, 1500);
            }
          } catch (err) {
            console.error('Error updating subject:', err);
            error.value = err.response?.data?.message || 'Failed to update subject. Please try again.';
          } finally {
            isSubmitting.value = false;
          }
        };
    
        onMounted(initializeForm);
    
        return {
  
          formData,
          loading,
          error,
          isSubmitting,
          successMessage,
          submitForm,
          handleClose
        };
      }
    });
    </script>