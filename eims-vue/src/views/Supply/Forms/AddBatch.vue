  <template>
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div class="bg-white p-8 rounded-lg shadow-xl w-1/4 max-w-2xl">
        <h2 class="text-2xl font-bold mb-4">Add New Batch</h2>
        
        <form @submit.prevent="submitForm" class="space-y-6">
          
          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700" for="batch_number">Batch Number</label>
            <input
              v-model="addBatch.batch_number"
              class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="batch_number"
              type="text"
              required
            />
          </div>

          <div class="flex flex-col space-y-2">
            <label class="text-sm font-semibold text-gray-700" for="batch_type">Batch Type</label>
            <select
              v-model="addBatch.batch_type"
              class="w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              id="batch_type"
              required
            >
              <option value="Items">Items</option>
              <option value="Chemicals">Chemicals</option>
              <option value="Equipments">Equipments</option>
              <option value="Apparatus">Apparatus</option>
            </select>
          </div>

          <div class="flex justify-end space-x-3 mt-4">
            <button
              @click="$emit('close')"
              class="px-4 py-1.5 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add Batch
            </button>
          </div>
        </form>
        </div>
      </div>
  </template>

  
  <script>
  import { defineComponent, ref, watch } from 'vue';
  import { useStore } from 'vuex';
  import axios from 'axios';
  
  export default defineComponent({
  name: 'AddBatch',
  props: {
    items: {
      type: Array,
      required: true
    },
    batches: {
      type: Array,
      required: true
    }
  },
  setup(props, { emit }) {
    const store = useStore();

    const addBatch = ref({
      batch_number: '',
      batch_type: 'Items',
    });
    
    const submitForm = async () => {
      try {
        const newBatchData = {
          ...addBatch.value,
        }
        await axios.post('api/batch/', newBatchData, {
          headers: {
            'Authorization': `Token ${store.state.token}`
          }
        })
        emit('new-batch-added')
        emit('close')
      } catch (error) {
        console.error('Error adding item:', error)
      }
    }
      
    return {
      addBatch,
      submitForm
    };
  }
  });
  </script>