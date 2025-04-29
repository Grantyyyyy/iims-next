<template>
   <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Add New Batch</h2>
        <form @submit.prevent="submitForm">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="item">Item</label>
            <select 
                v-model="addInstances.item" 
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                id="item" 
                required
                :disabled="!!preselectedItem"
            >
                <option v-for="item in items" :key="item.id" :value="item.id">
                {{ item.name }}
                </option>
            </select>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="manufacture_date">Manufacture Date</label>
            <input v-model="addInstances.manufacture_date" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="manufacture_date" type="date" required>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="expiry_date">Expiry Date</label>
            <input v-model="addInstances.expiry_date" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="expiry_date" type="date">
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="quantity">Quantity</label>
            <input v-model="addInstances.quantity" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="quantity" type="number" min="0" required>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="price">Price</label>
            <input v-model="addInstances.price" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="price" type="number" min="0" required>
          </div>
          <div class="flex items-center justify-between">
            <button @click="$emit('close')" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
              Cancel
            </button>
            <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
              Add Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  </template>
  
  <script>
  import { defineComponent, ref, computed, watch } from 'vue';
  import { useStore } from 'vuex'
  import axios from 'axios';
  
  
  export default defineComponent({
    name: 'InstancesForm',
    props: {
      items: {
        type: Array,
        required: true
      },
      preselectedItem: {
        type: String,
        default: null
      }
    },
  
    setup(props, { emit }) {
      const store = useStore();
      const addInstances = ref({
        item: '',
        manufacture_date: '',
        expiry_date: '',
        quantity: null,
        price: '',
        });
  
        watch(() => props.preselectedItem, (newValue) => {
            if (newValue) {
                addInstances.value.item = newValue;
            }
            }, { immediate: true });

      const submitForm = async () => {
        try {
            const newInstancesData = {
                item: addInstances.value.item,
                manufacture_date: addInstances.value.manufacture_date,
                expiry_date: addInstances.value.expiry_date,
                quantity: addInstances.value.quantity,
                price: addInstances.value.price 
            };
            // Send a POST request to the correct item instance endpoint
            const response = await axios.post(`/api/ictc-item/${addInstances.value.item}/instances/`, newInstancesData, {
                headers: {
                    'Authorization': `Token ${store.state.token}`
                }
            });
            emit('instance-added', response.data);
            emit('close');
        } catch (error) {
            console.error('Error adding instances:', error);
        }
    };

  

      return {
        addInstances,       
        submitForm

      };
    }
  });
  </script>
  