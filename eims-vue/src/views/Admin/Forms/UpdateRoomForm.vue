// UpdateItemForm.vue
<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
    <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Update Item</h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <form @submit.prevent="submitForm" class="grid grid-cols-2 gap-4">
        <!-- Left Column -->
        <div class="space-y-3">
          <div>
            <label class="text-sm font-semibold text-gray-700" for="name">Item Name</label>
            <input
              v-model="formData.name"
              class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="name"
              type="text"
              required
            >
          </div>

          <div>
            <label class="text-sm font-semibold text-gray-700" for="description">Description</label>
            <textarea
              v-model="formData.description"
              class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="description"
              rows="3"
              required
            ></textarea>
          </div>

          <div>
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
        </div>

        <!-- Right Column -->
        <div class="space-y-3">
          <div>
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

          <div>
            <label class="text-sm font-semibold text-gray-700" for="manufacture_date">Manufacture Date</label>
            <input
              v-model="formData.manufacture_date"
              class="mt-1 block w-full px-3 py-1.5 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="manufacture_date"
              type="date"
              required
            >
          </div>
        </div>

        <!-- Status Messages -->
        <div v-if="error" class="col-span-2 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p class="font-bold">Error</p>
          <p>{{ error }}</p>
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
      manufacture_date: ''
    })

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
          emit('item-updated')
          emit('close')
        }
      } catch (err) {
        console.error('Error updating item:', err)
        error.value = 'Failed to update item. Please try again.'
      }
    }

    onMounted(() => {
      fetchItemDetails()
    })

    return {
      formData,
      submitForm,
      error
    }
  }
})
</script>