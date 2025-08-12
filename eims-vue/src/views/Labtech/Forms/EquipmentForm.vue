<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
    <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl">
      <h2 class="text-2xl font-bold mb-4">Add New Equipment</h2>
      
      <form @submit.prevent="submitForm" class="space-y-6">
        <div v-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p class="font-bold">Error</p>
          <p>{{ error }}</p>
        </div>
      <div class="grid grid-cols-2 gap-6">
        <div class="space-y-6">
          <!-- Left Column --> 
          <div class="flex flex-col space-y-2">
          <label class="text-sm font-semibold text-gray-700" for="name">Equipment Name</label>
          <input
            v-model="addEquipment.name" 
            class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            id="name"
            type="text"
            required
            @input="addEquipment.name = addEquipment.name.charAt(0).toUpperCase() + addEquipment.name.slice(1)"
          >
        </div>
        
        <div class="flex flex-col space-y-2">
          <label class="text-sm font-semibold text-gray-700" for="category">Category</label>
          <select
            v-model="addEquipment.category_id"
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
            <label class="text-sm font-semibold text-gray-700" for="model">Model</label>
            <input
              v-model="addEquipment.model"
              class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="model"
              type="text"
              placeholder="(Optional)"
              @input="addEquipment.model = addEquipment.model.charAt(0).toUpperCase() + addEquipment.model.slice(1)"
            >
          </div>

          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700" for="unit_cost">Unit Cost*</label>
            <input
              v-model="addEquipment.unit_cost"
              class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="unit_cost"
              type="number"
              step="0.01"
              min="1"
              required
            >
          </div>

          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700" for="quantity">Quantity*</label>
            <input
              v-model="addEquipment.quantity"
              class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="quantity"
              type="number"
              min="1"
              required
            >
          </div>
        </div>

        <div class="space-y-6">
          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700" for="description">Description</label>
            <textarea
              v-model="addEquipment.description"
              class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="description"
              rows="3"
              required
              @input="addEquipment.description = addEquipment.description.charAt(0).toUpperCase() + addEquipment.description.slice(1)"
            ></textarea>
          </div>

          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700" for="useful_life">Useful Life (in years)</label>
            <input
              v-model="addEquipment.useful_life"
              class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="useful_life"
              type="number"
              required
              min="1"
            >
          </div>

          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700" for="purchase_date">Purchase Date</label>
            <input
              v-model="addEquipment.purchase_date"
              class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="purchase_date"
              type="date"
              required
              :max="new Date().toISOString().split('T')[0]"
            >
          </div>            
        </div>
      </div>

      <div class="border-t pt-6">
        <div class="flex justify-between">
          <h3 class="text-lg font-semibold mb-4">Inventory Item Details</h3>
        </div>
        
        <div class="grid grid-cols-3 gap-4">
          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700" for="inventory_date">Inventory Date*</label>
            <input
              v-model="addEquipment.inventory_date"
              class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="inventory_date"
              type="date"
              required
              :min="new Date().toISOString().split('T')[0]"
            >
          </div>

          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700" for="start_number">Start Number*</label>
            <input
              v-model="addEquipment.start_number"
              class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="start_number"
              type="text"
              pattern="\d{4}"
              placeholder="e.g., 0001"
              required
            >
            <div class="text-sm text-gray-600 mt-1">
              <span v-if="latestStartNumber">
                Latest: {{ latestStartNumber.latest_start_number }} | 
                Next: <span class="font-medium">{{ latestStartNumber.formatted_next_number }}</span>
              </span>
              <span v-else>Loading...</span>
            </div>
          </div>

          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700" for="suffix">Fund Cluster*</label>
            <input
              v-model="addEquipment.suffix"
              class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="suffix"
              type="text"
              pattern="\d{2}"
              placeholder="e.g., 01"
              required
            >
          </div>
        </div>
      </div>

        <div class="flex justify-end space-x-3 mt-8 pt-6 border-t">
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

<script setup>
import { ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'

// Props
const props = defineProps(['categories'])

// Emits
const emit = defineEmits(['close', 'equipment-added'])

// Store
const store = useStore()

// Reactive data
const addEquipment = ref({
  name: '',
  description: '',
  category_id: '',
  purchase_date: '',
  useful_life: '',
  unit_cost: '',
  quantity: '',
  model: '',
  inventory_date: new Date().toISOString().split('T')[0],
  start_number: '',
  suffix: '01',
})

const latestStartNumber = ref(null)
const error = ref('')

// Methods
const fetchLatestStartNumber = async () => {
  try {
    const response = await axios.get(
      'api/equipment-instances/latest-number/',
      {
        headers: {
          'Authorization': `Token ${store.state.token}`
        }
      }
    );
    latestStartNumber.value = response.data;
    
    // Auto-fill the start_number with the next number
    if (response.data && response.data.formatted_next_number) {
      addEquipment.value.start_number = response.data.formatted_next_number;
    } else {
      addEquipment.value.start_number = '0001';
    }
    
  } catch (error) {
    console.error('Error fetching latest start number:', error);
    // Set a default value if there's an error
    addEquipment.value.start_number = '0001';
  }
};

const submitForm = async () => {
  try {
    const newEquipmentData = {
      ...addEquipment.value,
    }
    await axios.post('api/equipments/', newEquipmentData, {
      headers: {
        'Authorization': `Token ${store.state.token}`
      }
    })
    resetForm()
    emit('equipment-added')
    emit('close')
  } catch (err) {
    if (err.response && err.response.data) {
      error.value = err.response.data.name ? err.response.data.name[0] : 'Failed to add equipment.'
    } else {
      error.value = 'Failed to add equipment. Please try again.'
    }
    console.error('Error adding equipment:', err)
  }
}

const resetForm = () => {
  addEquipment.value = {
    name: '',
    description: '',
    category_id: '',
    purchase_date: '',
    useful_life: '',
    unit_cost: '',
    quantity: '',
    model: '',
    inventory_date: new Date().toISOString().split('T')[0],
    start_number: '',
    suffix: '01',
  }
}

// Lifecycle
onMounted(() => {
  fetchLatestStartNumber();
});
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