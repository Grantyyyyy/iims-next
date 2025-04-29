<template>
  <div class="flex h-screen bg-gradient-to-b from-[#F5F4F1] to-[#D4EAF7]">
    <Sidebar />
    <div class="flex-1 overflow-x-auto p-8 ml-64 relative">
      <h1 class="text-2xl font-bold mb-4 text-gray-800">Borrow Item</h1>
      <div v-if="loading" class="text-center">Loading...</div>
      <div v-else-if="error" class="text-center text-red-500">{{ error }}</div>
      <form @submit.prevent="borrowItem" v-else class="bg-white/50 backdrop-blur-sm shadow-md rounded-lg p-8">
        <table class="w-full table-auto mb-4">
          <thead>
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="itemInstance in itemInstances" :key="itemInstance.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ itemInstance.id }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div 
                  :title="itemInstance.item.description"
                  class="truncate max-w-xs"
                >
                {{ itemInstance.item.description }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="mt-4">
          <label for="borrower" class="block mb-2 text-sm font-medium text-gray-700">Select Borrower:</label>
          <select
            id="borrower"
            v-model="selectedBorrowerId"
            class="w-full p-2 border border-gray-300 rounded"
            required
          >
            <option value="">Select a borrower</option>
            <option
              v-for="borrower in borrowers"
              :key="borrower.id"
              :value="borrower.id"
            >
              {{ borrower.first_name }} {{ borrower.last_name }}
            </option>
          </select>
        </div>

        <div class="mt-4">
          <label for="room" class="block mb-2 text-sm font-medium text-gray-700">Select Room:</label>
          <select
            id="room"
            v-model="selectedRoomId"
            class="w-full p-2 border border-gray-300 rounded"
            required
          >
            <option value="">Select a room</option>
            <option
              v-for="room in rooms"
              :key="room.id"
              :value="room.id"
            >
              {{ room.name }}
            </option>
          </select>
        </div>

        <button
          type="submit"
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
          :disabled="loading"
        >
          {{ loading ? 'Borrowing...' : 'Confirm Borrow' }}
        </button>
      </form>
      <p v-if="successMessage" class="text-green-500 mt-4 text-center">{{ successMessage }}</p>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import Sidebar from '@/components/UserType/Sidebar.vue'

export default defineComponent({
  name: 'BorrowItem',
  components: {
    Sidebar
  },
  props: {
    instanceId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const loading = ref(false)
    const error = ref(null)
    const successMessage = ref('')
    const itemInstances = ref([])
    const borrowers = ref([])
    const rooms = ref([])
    const selectedBorrowerId = ref('')
    const selectedRoomId = ref('')
    const router = useRouter()
    
    const fetchItemInstance = async () => {
      try {
        loading.value = true
        error.value = null
        const response = await axios.get(`/api/instances/${props.instanceId}/detail/`)
        itemInstances.value = [response.data] // Wrap in array if it's a single instance
      } catch (err) {
        handleError(err, "Failed to fetch item details. Please try again.")
      } finally {
        loading.value = false
      }
    }

    const fetchBorrowers = async () => {
      try {
        const response = await axios.get('/api/user-list/')
        borrowers.value = response.data
      } catch (err) {
        handleError(err, "Failed to fetch borrowers. Please try again.")
      }
    }

    const fetchRooms = async () => {
      try {
        const response = await axios.get('/api/room-list/')
        rooms.value = response.data
      } catch (err) {
        handleError(err, "Failed to fetch rooms. Please try again.")
      }
    }

    const handleError = (err, defaultMessage) => {
      console.error(defaultMessage, err)
      if (err.response) {
        error.value = `Server error: ${err.response.status} - ${JSON.stringify(err.response.data)}`
      } else if (err.request) {
        error.value = "No response received from server. Please try again."
      } else {
        error.value = `Error: ${err.message}`
      }
    }

    const borrowItem = async () => {
      if (!selectedBorrowerId.value) {
        error.value = "Please select a borrower."
        return
      }

      if (!selectedRoomId.value) {
        error.value = "Please select a room."
        return
      }

      try {
        loading.value = true
        error.value = null
        successMessage.value = ''
        const response = await axios.post(`/api/instances/${props.instanceId}/borrow/`, {
          borrower_id: selectedBorrowerId.value,
          room_id: selectedRoomId.value
        })
        successMessage.value = "Item borrowed successfully!"

        setTimeout(() => {
          router.go(-1)
        }, 1000)

      } catch (err) {
        handleError(err, "Error borrowing item.")
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      fetchItemInstance()
      fetchBorrowers()
      fetchRooms()
    })

    return {
      loading,
      error,
      successMessage,
      itemInstances,
      borrowers,
      selectedBorrowerId,
      borrowItem,
      rooms,
      selectedRoomId
    }
  }
})
</script>

<style scoped>
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>