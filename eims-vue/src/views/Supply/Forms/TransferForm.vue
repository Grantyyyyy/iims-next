<template>
  <div class="space-y-4">
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        New Assignee
      </label>
      <select 
        v-model="newAssigneeId"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        :disabled="isSubmitting"
      >
        <option value="">Select an assignee</option>
        <option v-for="user in filteredUsers" 
          :key="user.id" :value="user.id">
          {{ user.first_name }} {{ user.last_name }}
        </option>
      </select>
      <p v-if="errors.assignee" class="mt-1 text-sm text-red-600">
        {{ errors.assignee }}
      </p>
    </div>

    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        New Location
      </label>
      <select 
        v-model="newLocationId"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        :disabled="isSubmitting"
      >
        <option value="">Select an room</option>
        <option v-for="room in rooms" :key="room.id" :value="room.id">
          {{ room.name }} - {{ room.department.name }}
        </option>
      </select>
      <p v-if="errors.room" class="mt-1 text-sm text-red-600">
        {{ errors.room }}
      </p>
    </div>

    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Reason (Optional)
      </label>
      <textarea
        v-model="transferReason"
        rows="3"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        placeholder="Add any additional reason..."
        :disabled="isSubmitting"
      ></textarea>
    </div>

    <div class="flex justify-end space-x-3">
      <button 
        @click="$emit('close')"
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        :disabled="isSubmitting"
      >
        Cancel
      </button>
      <button 
        @click="handleSubmit"
        :disabled="isSubmitting"
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {{ isSubmitting ? 'Submitting...' : 'Submit Transfer Request' }}
      </button>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useStore } from 'vuex';

export default defineComponent({
  name: 'TransferForm',
  props: {
    itemId: {
      type: [Number, String],
      required: true
    }
  },
  emits: ['close', 'turnover-success'],
  setup(props, { emit }) { 
    const newAssigneeId = ref('');
    const newLocationId = ref('');
    const transferReason = ref('');
    const users = ref([]);
    const rooms = ref([]);
    const errors = ref({});
    const isSubmitting = ref(false);
    const store = useStore();
    const currentUser = computed(() => store.getters.user);

    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/user-list/');
        users.value = response.data;
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    const filteredUsers = computed(() => {
      if (!currentUser.value) return [];
      return users.value.filter(user => 
        user.is_staff && user.id !== currentUser.value.id
      );
    });

    const fetchRooms = async () => {
      try {
        const response = await axios.get('/api/room-list/');
        rooms.value = response.data;
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
    };

    const handleSubmit = async () => {
      errors.value = {};
      
      if (!newAssigneeId.value) {
        errors.value.assignee = 'Please select an assignee';
      }
      
      if (!newLocationId.value) {
        errors.value.room = 'Please select a room';
      }

      if (Object.keys(errors.value).length > 0) {
        return;
      }
      
      isSubmitting.value = true;
      
      try {
        await axios.post('/api/transfer-requests/', {
          item: [props.itemId],
          user_id: newAssigneeId.value,
          room_id: newLocationId.value,
          transfer_reason: transferReason.value 
        });
        
        emit('turnover-success', {
          itemId: props.itemId,
          status: 'Pending Transfer'
        });
      } catch (error) {
        errors.value = error.response?.data || { general: 'An error occurred' };
      } finally {
        isSubmitting.value = false;
      }
    };

    onMounted(() => {
      fetchUsers();
      fetchRooms();
    });

    return {
      newAssigneeId,
      newLocationId,
      transferReason,
      users,
      rooms,
      errors,
      isSubmitting,
      handleSubmit,
      currentUser,
      filteredUsers
    };
  }
});
</script>