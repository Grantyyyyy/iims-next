<template>
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Add New Equipment</h2>
        <form @submit.prevent="submitForm">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="name">Equipment Name</label>
            <input v-model="addEquipment.name" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="name" type="text" required>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="formula">Description</label>
            <input v-model="addEquipment.description" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="description" type="text" required>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="formula">Quantity</label>
            <input v-model="addEquipment.quantity" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="quantity" type="text" required>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="unit">Batch</label>
            <select v-model="addEquipment.batch" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="batch" required>
              <option value="" disabled>Select a batch</option>
              <option v-for="batch in batches" :key="batch.id" :value="batch.id">{{ batch.batch_number }}</option>
            </select> 
          </div>
          <div class="mb-6">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="expiration_date">Price</label>
            <input v-model="addEquipment.price" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="price"  required>
          </div>
          <div class="flex items-center justify-between">
            <button @click="$emit('close')" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
              Cancel
            </button>
            <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
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
  name: 'EquipmentForm',
  props: ['batches', 'equipments'],
  setup(props, { emit }) {
    const store = useStore()
    const addEquipment = ref({
      name: '',
      description: '',
      quantity: null,
      batch: '',
      price: '',
    })
    

    const submitForm = async () => {
      try {
        const newEquipmentData = {
          ...addEquipment.value,
        }
        await axios.post('api/equipment/', newEquipmentData, {
          headers: {
            'Authorization': `Token ${store.state.token}`
          }
        })
        resetForm()
        emit('equipment-added')
        emit('close')
      } catch (error) {
        console.error('Error adding equipment:', error)
      }
    }

    const resetForm = () => {
      addEquipment.value = {
        name: '',
        description: '',
        quantity: null,
        batch: '',
        price: '',
      }
      }

    return {
      addEquipment,
      submitForm,
      resetForm,
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
