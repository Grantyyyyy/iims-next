<template>
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-xl">
        <h2 class="text-xl font-bold mb-4">Update Apparatus</h2>
  
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
                <label class="block text-sm font-semibold text-gray-700" for="name">Name</label>
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
                <label class="block text-sm font-semibold text-gray-700" for="description">Description</label>
                <textarea
                  v-model="formData.description"
                  class="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  id="description"
                  rows="3"
                  required
                  :disabled="isSubmitting"
                ></textarea>
              </div>
  
              <div>
                <label class="block text-sm font-semibold text-gray-700" for="category">Category</label>
                <select
                  v-model="formData.category_id"
                  class="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  id="category"
                  required
                  :disabled="isSubmitting"
                >
                  <option value="" disabled>Select a category</option>
                  <option v-for="category in categories" :key="category.id" :value="category.id">
                    {{ category.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700" for="quantity">Quantity</label>
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
                <label class="block text-sm font-semibold text-gray-700" for="apparatus_type">Type</label>
                <input
                  v-model="formData.apparatus_type"
                  class="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  id="apparatus_type"
                  type="text"
                  required
                  :disabled="isSubmitting"
                >
              </div>
            </div>
          </div>
  
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
  import { useStore } from 'vuex';
  import axios from 'axios';
  
  export default defineComponent({
    name: 'UpdateApparatusForm',
    
    props: {
      apparatusId: {
        type: [String, Number],
        required: true
      },
      categories: {
        type: Array,
        required: true
      }
    },
  
    emits: ['close', 'apparatus-updated'],
    
    setup(props, { emit }) {
      const store = useStore();
      const loading = ref(true);
      const error = ref(null);
      const isSubmitting = ref(false);
      const successMessage = ref(null);
      
      const formData = ref({
        name: '',
        description: '',
        category_id: '',
        apparatus_type: '',
        quanity: '',
      });
  
      const handleClose = () => {
        if (!isSubmitting.value) {
          emit('close');
        }
      };
  
      const fetchApparatusDetails = async () => {
        try {
          const response = await axios.get(`/api/apparatus/${props.apparatusId}/update/`, {
            headers: { 'Authorization': `Token ${store.state.token}` }
          });
          
          formData.value = {
            name: response.data.name,
            description: response.data.description,
            category_id: response.data.category_id,
            apparatus_type: response.data.apparatus_type,
            quantity: response.data.quantity
          };
        } catch (err) {
          console.error('Error fetching apparatus details:', err);
          error.value = 'Failed to load apparatus details';
        } finally {
          loading.value = false;
        }
      };
  
      const submitForm = async () => {
        if (isSubmitting.value) return;
  
        isSubmitting.value = true;
        error.value = null;
        
        try {
          const response = await axios.put(
            `/api/apparatus/${props.apparatusId}/update/`,
            formData.value,
            {
              headers: { 'Authorization': `Token ${store.state.token}` }
            }
          );
  
          successMessage.value = 'Apparatus updated successfully';
          setTimeout(() => {
            emit('apparatus-updated', response.data);
            emit('close');
          }, 1500);
        } catch (err) {
          console.error('Error updating apparatus:', err);
          error.value = err.response?.data?.message || 'Failed to update apparatus';
        } finally {
          isSubmitting.value = false;
        }
      };
  
      onMounted(fetchApparatusDetails);
  
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