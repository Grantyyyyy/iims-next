<template>
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Add New Chemical</h2>
        <form @submit.prevent="submitForm">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="name">Chemical Name</label>
            <input v-model="addChemical.name" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="name" type="text" required>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="formula">Chemical Formula</label>
            <input v-model="addChemical.formula" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="formula" type="text" required>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="quantity">Quantity in Stock</label>
            <input v-model.number="addChemical.quantity" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="quantity" type="number" required>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="unit">Unit</label>
            <select v-model="addChemical.unit" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="unit" required>
              <option value="" disabled>Select a unit</option>
              <option v-for="unit in units" :key="unit.id" :value="unit.id">{{ unit.name }}</option>
            </select>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">Alternative Chemicals</label>
            <div id="alternatives-container">
                <div v-for="(alternative, index) in alternatives" :key="index" class="flex items-center space-x-2 mt-2">
                <select v-model="alternative.id" class="flex-grow shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
                    <option value="" disabled>Select a chemical</option>
                    <option v-for="chemical in chemicals" :key="chemical.id" :value="chemical.id">{{ chemical.name }}</option>
                </select>
                <button type="button" @click="removeAlternative(index)" class="remove-alternative bg-red-500 text-white px-2 py-2 rounded-md hover:bg-red-600 focus:outline-none focus:ring focus:border-red-300">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
                </div>
            </div>
            <button type="button" @click="addAlternative" class="mt-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:border-blue-300">Add Alternative</button>
         </div>
          <div class="mb-6">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="expiration_date">Expiration Date</label>
            <input v-model="addChemical.expiration_date" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="expiration_date" type="date" required>
          </div>
          <div class="flex items-center justify-between">
            <button @click="$emit('close')" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
              Cancel
            </button>
            <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
              Add Chemical
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
  name: 'ChemicalForm',
  props: ['units', 'chemicals'],
  setup(props, { emit }) {
    const store = useStore()
    const addChemical = ref({
      name: '',
      formula: '',
      quantity: null,
      unit: '',
      notes: '',
      expiration_date: ''
    })
    const alternatives = ref([])

    const addAlternative = () => {
      alternatives.value.push({ id: '' })
    }

    const removeAlternative = (index) => {
      alternatives.value.splice(index, 1)
    }

    const submitForm = async () => {
      try {
        const newChemicalData = {
          ...addChemical.value,
          alternatives: alternatives.value.map(alt => alt.id)
        }
        await axios.post('api/chemicals/', newChemicalData, {
          headers: {
            'Authorization': `Token ${store.state.token}`
          }
        })
        resetForm()
        emit('chemicalAdded')
        emit('close')
      } catch (error) {
        console.error('Error adding chemical:', error)
      }
    }

    const resetForm = () => {
      addChemical.value = {
        name: '',
        formula: '',
        quantity: null,
        unit: '',
        notes: '',
        expiration_date: ''
      }
      alternatives.value = []
    }

    return {
      addChemical,
      submitForm,
      resetForm,
      addAlternative,
      removeAlternative,
      alternatives
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
