<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
    <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-xl">
       <h2 class="text-xl font-bold mb-4">Add New Chemical</h2>
      
      <form @submit.prevent="submitForm" class="space-y-2">
      <div v-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p class="font-bold">Error</p>
        <p>{{ error }}</p>
      </div>
      <div class="grid grid-cols-1 mb-6 gap-4">
        <div class="space-y-3">
          <div>
          <label class="text-sm font-semibold text-gray-700" for="name">Chemical Name</label>
          <input
            v-model="addChemical.name"
            class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            id="name"
            type="text"
            required
            @input="addChemical.name = addChemical.name.charAt(0).toUpperCase() + addChemical.name.slice(1)"
          >
        </div>
        
        <div class="flex flex-col space-y-2">
          <label class="text-sm font-semibold text-gray-700" for="description">Description</label>
          <textarea
            v-model="addChemical.description"
            class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            id="description"
            rows="3"
            required
            @input="addChemical.description = addChemical.description.charAt(0).toUpperCase() + addChemical.description.slice(1)"
          ></textarea>
        </div>
        
        <div >
          <label class="text-sm font-semibold text-gray-700" for="unit">Unit</label>
          <select
            v-model="addChemical.unit"
            class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            id="unit"
            required
          >
            <option value="">Select Unit</option>
            <option value="ml">Milliliters (ml)</option>
            <option value="l">Liters (l)</option>
            <option value="gal">Gallons (gal)</option>
            <option value="g">Grams (g)</option>
            <option value="kg">Kilograms (kg)</option>
          </select>
        </div>

        <div>
          <label class="text-sm font-semibold text-gray-700" for="volume">Reorder Level</label>
          <input
            v-model.number="addChemical.reorder_level"
            class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            id="reorder_level"
            type="number"
            required
            min="1"
          >
        </div>
        
        <div class="flex justify-end space-x-3 mt-4">
          <button
            @click="$emit('close')"
            type="button"
            class="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Chemical
          </button>
        </div>
      </div>
      </div>  
      </form>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'

export default defineComponent({
  name: 'ChemicalForm',
  
  setup(props, { emit }) {
    const store = useStore()
    const addChemical = ref({
      name: '',
      description: '',
      unit: '',
      volume: 0,
      reorder_level: 0,
    })
    const error = ref('')

    const submitForm = async () => {
      try {
        const newChemicalData = {
          ...addChemical.value
        }
        
        await axios.post('api/chemical/', newChemicalData, {
          headers: {
            'Authorization': `Token ${store.state.token}`
          }
        })
        
        resetForm()
        emit('chemical-added')
        emit('close')
      } catch (err) {  // Renamed parameter to avoid shadowing
        if (err.response && err.response.data) {
          error.value = err.response.data.name ? err.response.data.name[0] : 'Failed to add chemical.'
        } else {
          error.value = 'Failed to add chemical. Please try again.'
        }
        console.error('Error adding chemical:', err)
      }
    }

    const resetForm = () => {
      addChemical.value = {
        name: '',
        description: '',
        unit: '',
        volume: null,
        reorder_level: null,
      }
    }

    return {
      addChemical,
      submitForm,
      resetForm,
      error,
    }
  }
})
</script>