<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
    <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
      <h2 class="text-2xl font-bold mb-6">Add New Item</h2>
      
      <form @submit.prevent="submitForm" class="space-y-6">
        <!-- Basic Information Section -->
        <div class="flex flex-col space-y-2">
          <label class="text-sm font-semibold text-gray-700" for="name">Item Name*</label>
          <input
            v-model="addItem.name"
            class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            id="name"
            type="text"
            required
          >
        </div>
        <div class="flex flex-col space-y-2">
          <label class="text-sm font-semibold text-gray-700" for="description">Description</label>
          <textarea
            v-model="addItem.description"
            class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            id="description"
            rows="3"
          ></textarea>
        </div>
        <div class="flex flex-col space-y-2">
          <label class="text-sm font-semibold text-gray-700" for="model">Model</label>
          <input
            v-model="addItem.model"
            class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            id="model"
            type="text"
            placeholder="(Optional)"
          >
        </div>

        <div class="grid grid-cols-2 gap-6">
          <div class="space-y-6">
            <!-- Left Column -->
            <div class="flex flex-col space-y-2">
              <label class="text-sm font-semibold text-gray-700" for="category">Category*</label>
              <select
                v-model="addItem.category_id"
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
              <label class="text-sm font-semibold text-gray-700" for="unit_cost">Unit Cost*</label>
              <input
                v-model="addItem.unit_cost"
                class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                id="unit_cost"
                type="number"
                step="0.01"
                required
              >
            </div>

            <div class="flex flex-col space-y-2">
              <label class="text-sm font-semibold text-gray-700" for="quantity">Quantity*</label>
              <input
                v-model="addItem.quantity"
                class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                id="quantity"
                type="number"
                required
              >
            </div>
          </div>

          <div class="space-y-6">
            <!-- Right Column -->
            <div class="flex flex-col space-y-2">
              <label class="text-sm font-semibold text-gray-700" for="item_type">Item Type*</label>
              <select
                v-model="addItem.item_type"
                class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                id="item_type"
                required
                @change="handleItemTypeChange"
              >
                <option value="" disabled>Select an item type</option>
                <option value="Consumables">Consumables</option>
                <option value="Non-Consumables">Non-Consumables</option>
              </select>
            </div>

            <div class="flex flex-col space-y-2">
              <label class="text-sm font-semibold text-gray-700" for="useful_life">Useful Life</label>
              <input
                v-model="addItem.useful_life"
                class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                id="useful_life"
                type="number"
              >
            </div>

            <div class="flex flex-col space-y-2">
              <label class="text-sm font-semibold text-gray-700" for="purchase_date">Purchase Date*</label>
              <input
                v-model="addItem.purchase_date"
                class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                id="purchase_date"
                type="date"
                required
                :min="new Date().toISOString().split('T')[0]"
              >
            </div>
          </div>
        </div>
        <div v-if="addItem.item_type === 'Non-Consumables'" class="border-t pt-6">
            <h3 class="text-lg font-semibold mb-4">Non-Consumable Items Details</h3>   
          <div class="grid grid-cols-3 gap-4">
            <div class="flex flex-col space-y-2">
              <label class="text-sm font-semibold text-gray-700" for="inventory_date">Inventory Date*</label>
              <input
                v-model="addItem.inventory_date"
                class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                id="inventory_date"
                type="date"
                required
              >
            </div>

            <div class="flex flex-col space-y-2">
              <label class="text-sm font-semibold text-gray-700" for="start_number">Start Number*</label>
              <input
                v-model="addItem.start_number"
                class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                id="start_number"
                type="number"
                pattern="\d{4}"
                placeholder="e.g., 0001"
                required

              >
              <div class="text-sm text-gray-600 mt-1">
                <span v-if="latestNumberInfo">
                  Latest: {{ latestNumberInfo.latest_start_number }} | 
                  Next: <span class="font-medium">{{ latestNumberInfo.formatted_next_number }}</span>
                </span>
                <span v-else>Loading...</span>
              </div>
            </div>

            <div class="flex flex-col space-y-2">
              <label class="text-sm font-semibold text-gray-700" for="suffix">Fund Cluster*</label>
              <input
                v-model="addItem.suffix"
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

        <!-- Form Actions -->
        <div class="flex justify-end space-x-3 mt-8 pt-6 border-t">
          <button
            @click="$emit('close')"
            type="button"
            class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Add Item
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
  name: 'ItemForm',
  
  props: {
    categories: {
      type: Array,
      required: true
    }
  },
  
  setup(props, { emit }) {
    const store = useStore()
    const addItem = ref({
      name: '',
      description: '',
      item_type: '',
      quantity: '',
      model: '',
      category_id: '',
      inventory_date: new Date().toISOString().split('T')[0],
      start_number: '',
      suffix: '01',
      unit_cost: '',
      purchase_date: '',
      useful_life: ''
    })
    const latestNumberInfo = ref(null)

    const fetchLatestStartNumber = async (equipments) => {
      try {
        const response = await axios.get(
          'api/item-instances/latest-number/',
          {
            headers: {
              'Authorization': `Token ${store.state.token}`
            }
          }
        );
        latestNumberInfo.value = response.data;

        if (addItem.value.item_type === 'Non-Consumables') {
          addItem.value.start_number = response.data.formatted_next_number;
        }
      } catch (error) {
        console.error('Error fetching latest start number:', error);
      }
    };

    onMounted(() => {
      fetchLatestStartNumber();
    });


    const handleItemTypeChange = () => {
      if (addItem.value.item_type === 'Consumables') {
        addItem.value.inventory_date = ''
        addItem.value.start_number = ''
        addItem.value.suffix = ''
      } else {
        addItem.value.inventory_date = new Date().toISOString().split('T')[0]

        if (latestNumberInfo.value && latestNumberInfo.value.formatted_next_number) { 
          addItem.value.start_number = latestNumberInfo.value.formatted_next_number;
        } else {
          addItem.value.start_number = '0001';
        }
        
        addItem.value.suffix = '01'

        if (!latestNumberInfo.value) {
          fetchLatestStartNumber();
        }
      }
    }

    const submitForm = async () => {
      try {
        const submissionData = { ...addItem.value }
        
        if (submissionData.item_type === 'Consumables') {
          delete submissionData.inventory_date
          delete submissionData.start_number
          delete submissionData.suffix
        }

        await axios.post('api/items/', submissionData, {
          headers: {
            'Authorization': `Token ${store.state.token}`
          }
        })
        
        resetForm()
        emit('item-added')
        emit('close')
      } catch (error) {
        if (err.response && err.response.data) {
          error.value = err.response.data.name ? err.response.data.name[0] : 'Failed to update item.'
        } else {
          error.value = 'Failed to update item. Please try again.'
        }
        console.error('Error updating item:', err)
      }
    }

    const resetForm = () => {
      addItem.value = {
        name: '',
        description: '',
        item_type: '',
        category_id: '',
        quantity: '',
        model: '',
        inventory_date: new Date().toISOString().split('T')[0],
        start_number: '',
        suffix: '01',
        unit_cost: '',
        purchase_date: '',
        useful_life: ''
      }
    }

    return {
      addItem,
      handleItemTypeChange,
      submitForm,
      resetForm,
      latestNumberInfo,
    }
  }
})
</script>