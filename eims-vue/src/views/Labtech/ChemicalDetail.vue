<template>
  <div class="flex h-screen bg-gradient-to-b from-[#F5F4F1] to-[#D4EAF7]">
    <Sidebar />
  <div v-if="chemical" class="flex-1 overflow-x-auto p-8 ml-64 relative">
      <h1 class="text-2xl font-bold mb-4 text-gray-800">Chemical Details</h1>
      <div class="w-full ">
      <div class="bg-white/50 backdrop-blur-sm shadow-md rounded-lg overflow-hidden">
        <div class="p-6 ">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="font-semibold">Name:</p>
              <p>{{ chemical.name }}</p>
            </div>
            <div>
              <p class="font-semibold">Quantity:</p>
              <p>{{ chemical.quantity }}</p>
            </div>
            <div>
              <p class="font-semibold">Unit:</p>
              <p>{{ chemical.unit_details.name }}</p>
            </div>
            <div class="mb-4">
              <p class="font-semibold">Alternatives:</p>
              <ul>
                <li v-for="alt in chemical.alternatives_details" :key="alt.id">
                  {{ alt.name }} ({{ alt.unit_details.name }})
                </li>
              </ul>
            </div>
            <div>
              <p class="font-semibold">Expiration Date:</p>
              <p>{{ chemical.expiration_date }}</p>
            </div>
            <!-- Add other details as needed -->
          </div>
        </div>
        <div class="bg-gray-50 px-6 py-4 flex justify-end space-x-4">
          <button @click="showUpdateForm = true" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            Edit
          </button>
          <button @click="$router.back()" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
            Back
          </button>
        </div>
      </div>
    </div>
      <ChemicalUpdateForm 
        v-if="showUpdateForm" 
        :chemical="chemical" 
        :units="units"
        :chemicals="allChemicals"
        @cancel="showUpdateForm = false"
        @updated="handleUpdate"
    />
    </div>
    <div v-else class="flex justify-center items-center h-screen">
      <p>Loading...</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchData } from '@/utils/api'
import ChemicalUpdateForm from './ChemicalUpdateForm.vue'
import Sidebar from '@/components/UserType/Sidebar.vue';

export default {
  name: 'ChemicalDetails',
  components: {
    ChemicalUpdateForm, Sidebar
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const chemical = ref(null)
    const allChemicals = ref([])
    const units = ref([])
    const showUpdateForm = ref(false)

    const fetchChemicalDetails = async () => {
      try {
        const data = await fetchData(`/api/chemicals/${route.params.id}/`)
        chemical.value = data
        console.log('Fetched chemical details:', data)
      } catch (error) {
        console.error('Error fetching chemical details:', error)
        // Handle error (e.g., show error message, redirect to 404 page)
      }
    }

    const fetchUnits = async () => {
      try {
        const data = await fetchData('/api/units/')
        units.value = data
        console.log('Fetched units:', data)
      } catch (error) {
        console.error('Error fetching units:', error)
      }
    }

    const fetchAllChemicals = async () => {
      try {
        const data = await fetchData('/api/chemicals/')
        allChemicals.value = data
        console.log('Fetched all chemicals:', data)
      } catch (error) {
        console.error('Error fetching all chemicals:', error)
      }
    }

    const handleUpdate = async (updatedChemical) => {
      console.log('Handling update with data:', updatedChemical)
      chemical.value = updatedChemical
      showUpdateForm.value = false
    }

    onMounted(() => {
      fetchChemicalDetails()
      fetchUnits()
      fetchAllChemicals()
    })

    return {
      chemical,
      units,
      allChemicals,
      showUpdateForm,
      handleUpdate
    }
  }
}
</script>