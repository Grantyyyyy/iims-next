<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3 text-center">
        <h3 class="text-lg leading-6 font-medium text-gray-900">Return Item</h3>
        <div class="mt-2">
          <select  v-model="condition" class="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none">
            <option value="">Select Condition</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Poor">Poor</option>
            <option value="Damaged">Damaged</option>
          </select>
        </div>
        <div class="mt-2 px-7 py-3">
          <textarea v-model="notes" class="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none" rows="4" placeholder="Add notes about the item's condition..."></textarea>
        </div>
        <div class="items-center px-4 py-3">
          <button @click="submitReturn" class="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300">
            Confirm Return
          </button>
        </div>
        <div class="items-center px-4 py-3">
          <button @click="$emit('close')" class="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import axios from 'axios'
import { useStore } from 'vuex'

export default {
  name: 'ReturnForm',
  props: ['instanceId'],
  emits: ['close', 'itemReturned'],
  setup(props, { emit }) {
    const store = useStore()
    const notes = ref('')
    const condition = ref('')

    const submitReturn = async () => {
      if (!condition.value) {
        alert('Please select a condition before submitting.')
        return
      }

      try {
        const response = await axios.post(`/api/instances/${props.instanceId}/return/`, 
          { 
            remarks: notes.value,
            condition: condition.value
          },
          { headers: { 'Authorization': `Token ${store.state.token}` } }
        )
        console.log('Returned item:', response.data)
        emit('itemReturned')
        emit('close')
      } catch (err) {
        console.error('Error returning item:', err)
        alert('Error returning item. Please try again.')
      }
    }

    return {
      notes,
      condition,
      submitReturn
    }
  }
}
</script>