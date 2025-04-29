<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
    <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-[450px]">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Update Item</h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <form @submit.prevent="submitForm" class="space-y-2">
        <div v-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p class="font-bold">Error</p>
          <p>{{ error }}</p>
        </div>
        <div v-if="successMessage" class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4" role="alert">
          <p class="font-bold">Success</p>
          <p>{{ successMessage }}</p>
        </div>
        
        <div class="grid grid-cols-1 mb-6 gap-4">
          <div>
            <label class="text-sm font-semibold text-gray-500" for="unit_cost">Unit Cost</label>
            <input
              v-model="formData.unit_cost"
              class="mt-1 block w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm bg-gray-100 cursor-not-allowed text-gray-500"
              id="unit_cost"
              type="number"
              required
              disabled
              readonly
            >
          </div>

          <div>
            <label class="text-sm font-semibold text-gray-500" for="item">Item</label>
            <input
              v-model="formData.item"
              class="mt-1 block w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm bg-gray-100 cursor-not-allowed text-gray-500"
              id="item"
              type="text"
              required
              disabled
              readonly
            >
          </div>

          <div>
            <label class="text-sm font-semibold text-gray-500" for="quantity">Quantity</label>
            <input
              v-model="formData.quantity"
              class="mt-1 block w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm bg-gray-100 cursor-not-allowed text-gray-500"
              id="quantity"
              type="number"
              required
              disabled
              readonly
            >
          </div>

          <!-- Editable field -->
          <div>
            <label class="text-sm font-semibold text-gray-700" for="serial_number">Serial Number</label>
            <input
              v-model="formData.serial_number"
              class="mt-1 block w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="serial_number"
              type="text"
            >
          </div>

          <div>
            <label class="text-sm font-semibold text-gray-500" for="inventory_number">Inventory Number</label>
            <input
              v-model="formData.inventory_number"
              class="mt-1 block w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm bg-gray-100 cursor-not-allowed text-gray-500"
              id="inventory_number"
              type="text"
              required
              disabled
              readonly
            >
          </div>

          <div>
            <label class="text-sm font-semibold text-gray-500" for="condition">Condition</label>
            <select
              v-model="formData.current_condition"
              class="mt-1 block w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="condition"
              required
            >
              <option value="" disabled>Select a condition</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
              <option value="Damaged">Damaged</option>
            </select>
          </div>
        </div>      

        <!-- Footer - Full Width -->
        <div class="flex justify-end space-x-3 mt-8">
          <button
            @click="$emit('close')"
            type="button"
            class="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
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
  name: 'UpdateInstanceForm',
  props: {
    instanceId: {
      type: Number,
      required: true
    },
  },
  
  setup(props, { emit }) {
    const store = useStore()
    const error = ref(null)
    const formData = ref({
        unit_cost: '',
        quantity: '',
        item: '',
        serial_number: '', 
        inventory_number: '', 
        current_condition: '',
    })
    const successMessage = ref(null)

    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toISOString().split('T')[0]
    }

    const fetchItemDetails = async () => {
      try {
        const response = await axios.get(`/api/instances/${props.instanceId}/update/`, {
          headers: {
            'Authorization': `Token ${store.state.token}`
          }
        })
        const item = response.data
        formData.value = {
            unit_cost: item.unit_cost,
            quantity: item.quantity,
            item: item.item.name,
            serial_number: item.serial_number,
            inventory_number: item.inventory_number,
            current_condition: item.current_condition,
        }
      } catch (err) {
        console.error('Error fetching instance details:', err)
        error.value = 'Failed to load instance details. Please try again.'
      }
    }

    const submitForm = async () => {
      try {
        error.value = null
        const response = await axios.put(
          `/api/instances/${props.instanceId}/update/`,
          formData.value,
          {
            headers: {
              'Authorization': `Token ${store.state.token}`
            }
          }
        )
        if (response.status === 200) {
          successMessage.value = 'Instance updated successfully.'
          setTimeout(() => {
            successMessage.value = null
            emit('instance-updated')
            emit('close')
          }, 1500)
        }
      } catch (err) {
        if (err.response.status === 400) {
          error.value = 'Instance with this serial number already exists.'
        } else {
          console.error('Error updating instance:', err)
          error.value = err.response.data.message || 'Failed to update instance. Please try again.'
        }
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
