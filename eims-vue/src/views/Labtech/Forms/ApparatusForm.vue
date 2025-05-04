<template>
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 class="text-2xl font-bold mb-4">Add New Apparatus</h2>
        
        <form @submit.prevent="submitForm" class="space-y-6">
          <div v-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
            <p class="font-bold">Error</p>
            <p>{{ error }}</p>
          </div>
          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700" for="name">Apparatus Name</label>
            <input
              v-model="addApparatus.name" 
              class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="name"
              type="text"
              required
              @input="addApparatus.name = addApparatus.name.charAt(0).toUpperCase() + addApparatus.name.slice(1)"
            >
          </div>
          
          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700" for="description">Description</label>
            <textarea
              v-model="addApparatus.description"
              class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="description"
              rows="3"
              required
              @input="addApparatus.description = addApparatus.description.charAt(0).toUpperCase() + addApparatus.description.slice(1)"
            ></textarea>
          </div>

          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700" for="unit_cost">Unit Cost</label>
            <input
              v-model="addApparatus.unit_cost"
              class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="unit_cost"
              type="number"
              required
            >
          </div>
          
          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700" for="category">Category</label>
            <select
              v-model="addApparatus.category_id"
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

          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700" for="quantity">Quantity</label>
            <input
              v-model="addApparatus.quantity"
              class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="quantity"
              type="number"
              required
            >
          </div>    

          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700" for="item_type">Apparatus Type</label>
            <select
              v-model="addApparatus.apparatus_type"
              class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="item_type"
              required
            >
              <option value="" disabled>Select an apparatus type</option>
              <option value="Consumables">Consumables</option>
              <option value="Non-Consumables">Non-Consumables</option>
            </select>
          </div>

          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700" for="purchase_date">Purchase Date</label>
            <input
              v-model="addApparatus.purchase_date"
              class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="purchase_date"
              type="date"
              required
            >
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
              Add Equipment
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
    name: 'ApparatusForm',
    props: ['categories', 'units'],
    
    setup(props, { emit }) {
      const store = useStore()
      const addApparatus = ref({
        name: '',
        description: '',
        unit_cost: '',
        purchase_date: '',
        category_id: '',
        apparatus_type: '',
        quantity: ''

      })
      
  
      const submitForm = async () => {
        try {
          const newEquipmentData = {
            ...addApparatus.value,
          }
          await axios.post('api/apparatus/', newEquipmentData, {
  
            headers: {
              'Authorization': `Token ${store.state.token}`
            }
          })
          resetForm()
          emit('equipment-added')
          emit('close')
        } catch (error) {
            if (err.response && err.response.data) {
            error.value = err.response.data.name ? err.response.data.name[0] : 'Failed to add apparatus.'
          } else {
            error.value = 'Failed to add apparatus. Please try again.'
          }
          console.error('Error adding apparatus:', err)
        }
      }
  
      const resetForm = () => {
          addApparatus.value = {
          name: '',
          description: '',
          category_id: '',
          unit_id: '',
          apparatus_type: '',
          quantity: ''
        }
        }
  
      return {
        addApparatus,
        submitForm,
        resetForm
      }
    }
  })
  </script>
  
    
  
  <style scoped>
  .form-input, .form-select, .form-textarea {
    @apply w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300;
  }
  .btn {
    @apply px-4 py-2 rounded-md focus:outline-none focus:ring;
  }
  .btn-green {
    @apply bg-green-500 text-white hover:bg-green-600 focus:border-green-300;
  }
  .btn-gray {
    @apply bg-gray-300 text-gray-700 hover:bg-gray-400 focus:border-gray-500;
  }
  </style>
  
