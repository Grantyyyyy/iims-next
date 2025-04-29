// UpdateItemForm.vue
<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
    <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Update Category</h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <form @submit.prevent="submitForm" class="space-y-6">
        <div v-if="error" class="col-span-2 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p class="font-bold">Error</p>
          <p>{{ error }}</p>
        </div>
        <div v-if="successMessage" class="col-span-2 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
          <p class="font-bold">Success</p>
          <p>{{ successMessage }}</p>
        </div>

          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700" for="name">Category Name</label>
            <input
              v-model="formData.name"
              class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="name"
              type="text"
              required
            >
          </div>

          <div class="flex justify-end space-x-3 mt-8 pt-6 border-t">
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
              Update Category
            </button>
          </div>
      </form>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'

export default defineComponent({
  name: 'UpdateCategory',
  props: {
    categoryId: {
      type: Number,
      required: true
    },
    categories: {
      type: Array,
      required: true
    }
  },
  
  emits: ['close', 'category-updated'],
  setup(props, { emit }) {
    const store = useStore()
    const error = ref(null)
    const successMessage = ref(null)
    const formData = ref({
      name: '',
    })

    const fetchCategoriesDetails = async () => {
      try {
        const response = await axios.get(`/api/category/${props.categoryId}/update/`, {
          headers: {
            'Authorization': `Token ${store.state.token}`
          }
        })
        const category = response.data
        formData.value = {
            name: category.name,
        }
      } catch (err) {
        console.error('Error fetching category details:', err)
        error.value = 'Failed to load category details. Please try again.'
      }
    }

    const submitForm = async () => {
      try {
        error.value = null
        const response = await axios.put(
          `/api/category/${props.categoryId}/update/`,
          formData.value,
          {
            headers: {
              'Authorization': `Token ${store.state.token}`
            }
          }
        )
        if (response.status === 200) {
          successMessage.value = 'Category updated successfully.'
          setTimeout(() => {
            successMessage.value = null
            emit('category-updated')
            emit('close')
          }, 1500)
        }
      } catch (err) {
        console.error('Error updating category:', err)
        error.value = 'Failed to update category. Please try again.'
      }
    }

    onMounted(() => {
      fetchCategoriesDetails()
    });

    return {
      formData,
      submitForm,
      error,
      successMessage
    }
  }
})
</script>
