<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
    <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
      <h2 class="text-xl font-bold mb-4">Update Chemical</h2>
      <form @submit.prevent="submitForm">
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="name">Name</label>
          <input v-model="form.name" id="name" type="text" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="quantity">Quantity</label>
          <input v-model.number="form.quantity" id="quantity" type="number" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="unit">Unit</label>
          <select v-model="form.unit" id="unit" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
            <option v-for="unit in units" :key="unit.id" :value="unit.id">{{ unit.name }}</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="expiration_date">Expiration Date</label>
          <input v-model="form.expiration_date" id="expiration_date" type="date" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2">Alternatives</label>
          <div v-for="(alternative, index) in form.alternatives" :key="index" class="flex items-center space-x-2 mt-2">
            <select 
              v-model="alternative.id" 
              class="flex-grow shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="" disabled>Select a chemical</option>
              <option 
                v-for="chem in availableChemicalsForAlternative(index)" 
                :key="chem.id" 
                :value="chem.id"
              >
                {{ chem.name }}
              </option>
            </select>
            <button type="button" @click="removeAlternative(index)" class="bg-red-500 text-white px-2 py-2 rounded-md hover:bg-red-600 focus:outline-none focus:ring focus:border-red-300">
              Remove
            </button>
          </div>
          <button type="button" @click="addAlternative" class="mt-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:border-blue-300">Add Alternative</button>
        </div>
        <div class="flex justify-end space-x-4">
          <button type="button" @click="$emit('cancel')" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
            Cancel
          </button>
          <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            Update
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'

export default defineComponent({
  name: 'ChemicalUpdateForm',
  props: {
    chemical: {
      type: Object,
      required: true
    },
    units: {
      type: Array,
      default: () => []
    },
    chemicals: {
      type: Array,
      default: () => []
    }
  },
  emits: ['cancel', 'updated'],
  setup(props, { emit }) {
    const store = useStore()
    const form = ref({
      name: props.chemical.name,
      quantity: props.chemical.quantity,
      unit: props.chemical.unit_details.id,
      expiration_date: props.chemical.expiration_date,
      alternatives: props.chemical.alternatives_details.map(alt => ({ id: alt.id }))
    })

    const availableChemicalsForAlternative = (index) => {
      if (!props.chemicals) return []
      const currentAlternativeIds = form.value.alternatives
        .map(alt => alt?.id)
        .filter(id => id != null && id !== '')
      
      return props.chemicals.filter(chem => {
        if (!chem || chem.id === undefined) return false
        if (chem.id === props.chemical.id) return false
        if (index < form.value.alternatives.length && form.value.alternatives[index]?.id === chem.id) return true
        return !currentAlternativeIds.includes(chem.id)
      })
    }

    const addAlternative = () => {
      const availableChems = availableChemicalsForAlternative(form.value.alternatives.length)
      if (availableChems.length > 0) {
        form.value.alternatives.push({ id: '' })
      }
    }

    const removeAlternative = (index) => {
      form.value.alternatives.splice(index, 1)
    }

    const submitForm = async () => {
      try {
        const response = await axios.put(`/api/chemicals/${props.chemical.id}/`, {
          ...form.value,
          alternatives: form.value.alternatives
            .map(alt => alt.id)
            .filter(id => id !== '')
        }, {
          headers: {
            'Authorization': `Token ${store.state.token}`,
            'Content-Type': 'application/json',
          }
        })
        emit('updated', response.data)
        emit('cancel')
      } catch (error) {
        console.error('Error updating chemical:', error.response ? error.response.data : error.message)
      }
    }

    return {
      form,
      availableChemicalsForAlternative,
      addAlternative,
      removeAlternative,
      submitForm
    }
  }
})
</script>


