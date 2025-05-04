// UpdateItemForm.vue
<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
    <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-[450px]">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Update Item</h2>
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
            <label class="text-sm font-semibold text-gray-700" for="name">Item Name</label>
            <input
              v-model="formData.name"
              class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="name"
              type="text"
              required
            >
          </div>

          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700" for="model">Model</label>
            <input
              v-model="formData.model"
              class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="model"
              type="text"
              placeholder="Not set"
            >
          </div>

          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700" for="description">Description</label>
            <textarea
              v-model="formData.description"
              class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="description"
              rows="3"
              required
            ></textarea>
          </div>

 
          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700" for="item_type">Item Type</label>
            <select
              v-model="formData.item_type"
              class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="item_type"
              required
            >
              <option value="" disabled>Select an item type</option>
              <option value="Consumables">Consumables</option>
              <option value="Non-Consumables">Non-Consumables</option>
            </select>
          </div>

          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700" for="category">Category</label>
            <select
              v-model="formData.category_id"
              class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="category"
              required
            >
              <option value="" disabled>Select a category</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
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
              Update Item
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
  name: 'UpdateItemForm',
  props: {
    itemId: {
      type: Number,
      required: true
    },
    categories: {
      type: Array,
      required: true
    }
  },
  
  setup(props, { emit }) {
    const store = useStore()
    const error = ref(null)
    const formData = ref({
      name: '',
      description: '',
      item_type: '',
      category_id: '',
      manufacture_date: '',
      model: ''
    })
    const successMessage = ref(null)

    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toISOString().split('T')[0]
    }

    const fetchItemDetails = async () => {
      try {
        const response = await axios.get(`/api/items/${props.itemId}/update/`, {
          headers: {
            'Authorization': `Token ${store.state.token}`
          }
        })
        const item = response.data
        formData.value = {
          name: item.name,
          description: item.description,
          item_type: item.item_type,
          category_id: item.category.id,
          model: item.model,
          manufacture_date: formatDate(item.manufacture_date)
        }
      } catch (err) {
        console.error('Error fetching item details:', err)
        error.value = 'Failed to load item details. Please try again.'
      }
    }

    const submitForm = async () => {
      try {
        error.value = null
        const response = await axios.put(
          `/api/items/${props.itemId}/update/`,
          formData.value,
          {
            headers: {
              'Authorization': `Token ${store.state.token}`
            }
          }
        )
        if (response.status === 200) {
          successMessage.value = 'Item updated successfully.'
          setTimeout(() => {
            successMessage.value = null
            emit('item-updated')
            emit('close')
          }, 1500)
        }
      } catch (err) {
        if (err.response && err.response.data) {
          error.value = err.response.data.name ? err.response.data.name[0] : 'Failed to update item.'
        } else {
          error.value = 'Failed to update item. Please try again.'
        }
        console.error('Error updating item:', err)
      }
    }

    onMounted(() => {
      fetchItemDetails()
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
