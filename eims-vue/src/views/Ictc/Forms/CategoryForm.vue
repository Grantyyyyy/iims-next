<template>
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Add New Batch</h2>
        <form @submit.prevent="submitForm">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="name">Name</label>
            <input
              v-model="addCategory.name"
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="name"
              type="text"
              required
            />
            <p v-if="duplicateError" class="text-red-500 text-xs italic">{{ duplicateError }}</p>
            <p v-if="successMessage" class="text-green-500 text-xs italic">{{ successMessage }}</p>
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
  import { defineComponent, reactive, ref } from 'vue'
  import { useStore } from 'vuex'
  import axios from 'axios'
  
  export default defineComponent({
    name: 'CategoryForm',
    props: {
      categories: Array, // Prop to receive existing categories
    },
    setup(props, { emit }) {
      const store = useStore()
      const addCategory = reactive({
        name: ''
      })
      
      const duplicateError = ref(null)
      const successMessage = ref(null)
  
      const submitForm = async () => {
        // Check for duplicate category
        const exists = props.categories.some(category => category.name.toLowerCase() === addCategory.name.toLowerCase());
        
        if (exists) {
          duplicateError.value = 'Category already exists!';
          successMessage.value = null; // Clear success message
          return;
        }
  
        duplicateError.value = null; // Clear any previous error message
  
        try {
          await axios.post('api/ictc-category/', addCategory, {
            headers: {
              'Authorization': `Token ${store.state.token}`
            }
          });
          successMessage.value = 'Category added successfully!'; // Set success message
          resetForm();
          emit('category-added'); // Emit the correct event
          emit('close');
        } catch (error) {
          console.error('Error adding category:', error);
        }
      };
  
      const resetForm = () => {
        addCategory.name = ''
        successMessage.value = null; // Clear success message on reset
      }
  
      return {
        addCategory,
        submitForm,
        resetForm,
        duplicateError,
        successMessage,
      }
    }
  })
  </script>
  
  <style lang="">
  </style>
  