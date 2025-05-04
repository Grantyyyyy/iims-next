<template>
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-xl">
        <h2 class="text-xl font-bold mb-4">Update Equipment</h2>
        
        <form @submit.prevent="submitForm" class="space-y-6">
          <div v-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
            <p class="font-bold">Error</p>
            <p>{{ error }}</p>
          </div>
          <div v-if="successMessage" class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4" role="alert">
            <p class="font-bold">Success</p>
            <p>{{ successMessage }}</p>
          </div>
          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700" for="name">Equipment Name</label>
            <input
              v-model="formData.name" 
              class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="name"
              type="text"
              required
              @input="formData.name = $event.target.value.charAt(0).toUpperCase() + $event.target.value.slice(1)"
            >
          </div>
          
          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700" for="description">Description</label>
            <textarea
              v-model="formData.description"
              class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="description"
              rows="3"
              required
              @input="formData.description = $event.target.value.charAt(0).toUpperCase() + $event.target.value.slice(1)"
            ></textarea>
          </div>

          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700" for="description">Model</label>
            <input
              v-model="formData.model"
              class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="model"
              rows="3"
              required
              @input="formData.model = $event.target.value.charAt(0).toUpperCase() + $event.target.value.slice(1)"
            >
          </div>
          
          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700" for="category">Category</label>
            <select
              v-model="formData.category_id"
              class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="category"
              required
            >
              <option value="" disabled>Select a category</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>

          <div class="flex justify-end space-x-3 mt-4">
            <button
              @click="$emit('close')"
              type="button"
              class="px-4 py-2 bg-gray-500 text-white font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Update Equipment
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
    name: 'UpdateEquipmentForm',
    props: {
      equipmentId: {
        type: Number,
        required: true
      },
      categories: {
        type: Array,
        required: true
      }
    },
  
    emits: ['close', 'equipment-updated'],
  
    setup(props, { emit }) {
      const store = useStore()
      const error = ref(null)
      const successMessage = ref(null)
      const formData = ref({
        name: '',
        description: '',
        category_id: '',
        manufacture_date: '',
        model: '',
      })
  
      const fetchEquipmentDetails = async () => {
        try {
          const response = await axios.get(`/api/equipments/${props.equipmentId}/update/`, {
            headers: {
              'Authorization': `Token ${store.state.token}`
            }
          })
          const equipment = response.data
          formData.value = {
            name: equipment.name,
            description: equipment.description,
            category_id: equipment.category.id,
            manufacture_date: equipment.manufacture_date,
            model: equipment.model,
            purchase_date: equipment.purchase_date,
            useful_life: equipment.useful_life
          }
        } catch (err) {
          console.error('Error fetching equipment details:', err);
          error.value = err.response?.data?.message || 'Failed to  fetch equipment details. Please try again.';
        }
      }
  
      const submitForm = async () => {
        try {
          error.value = null
          const response = await axios.put(
            `/api/equipments/${props.equipmentId}/update/`,
            formData.value,
            {
              headers: {
                'Authorization': `Token ${store.state.token}`
              }
            }
          )
          if (response.status === 200) {
            successMessage.value = 'Equipment updated successfully.'
            setTimeout(() => {
              successMessage.value = null
              emit('equipment-updated')
              emit('close')
            }, 1500)
          }
        } catch (err) {
          if (err.response && err.response.data) {
            error.value = err.response.data.name ? err.response.data.name[0] : 'Failed to update equipment.'
          } else {
            error.value = 'Failed to update equipment. Please try again.'
          }
          console.error('Error updating equipment:', err)
        }
      }
  
      onMounted(() => {
        fetchEquipmentDetails()
      })
  
      return {
        formData,
        error,
        successMessage,
        submitForm
      }
    }
  })
  </script>