<template>
    <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-8 rounded-lg max-w-md w-full">
        <h2 class="text-2xl font-bold mb-4">Finalize Borrowing</h2>
        
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="user">
            Select User
          </label>
          <select 
            v-model="selectedUser" 
            id="user" 
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.first_name }} {{ user.last_name }}
            </option>
          </select>
        </div>
  
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="room">
            Select Room
          </label>
          <select 
            v-model="selectedRoom" 
            id="room" 
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            <option v-for="room in rooms" :key="room.id" :value="room.id">
              {{ room.name }}
            </option>
          </select>
        </div>
  
        <div class="flex justify-end">
          <button 
            @click="$emit('close')" 
            class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded mr-2 transition-colors">
            Cancel
          </button>
          <button 
            @click="handleBorrow" 
            class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors">
            Confirm Borrowing
          </button>
        </div>
      </div>
    </div>
  </template>

<script>
import { defineComponent, ref } from 'vue';
import axios from 'axios';
import { useCartStore } from '@/stores/cartStore';

export default defineComponent({
  name: 'BorrowModal',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    users: {
      type: Array,
      required: true
    },
    rooms: {
      type: Array,
      required: true
    }
  },
  emits: ['close', 'borrow-success'],
  setup(props, { emit }) {
    const cartStore = useCartStore();
    const selectedUser = ref('');
    const selectedRoom = ref('');

    const handleBorrow = async () => {
      if (!selectedUser.value || !selectedRoom.value) {
        alert('Please select a user and a room');
        return;
      }

      try {
        const borrowData = {
          user_id: selectedUser.value,
          room_id: selectedRoom.value,
          instances: cartStore.cartItems.map(item => item.id)
        };

        await axios.post('/api/manual-borrow/', borrowData);
        cartStore.clearCart();
        selectedUser.value = '';
        selectedRoom.value = '';
        emit('borrow-success');
        emit('close');
      } catch (err) {
        console.error('Error finalizing borrowing:', err);
        alert('Failed to borrow items. Please try again.');
      }
    };

    return {
      selectedUser,
      selectedRoom,
      handleBorrow
    };
  }
});
</script>