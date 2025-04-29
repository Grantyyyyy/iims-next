<template>
    <div class="flex h-screen bg-gradient-to-b from-[#F5F4F1] to-[#D4EAF7]">
      <Sidebar />
      <div class="flex-1 overflow-x-auto p-8 ml-64 relative">
        <h1 class="text-2xl font-bold mb-4 text-gray-800">Chemical List</h1>
        <div class="flex justify-end mb-4">
          <button @click="showAddForm = true" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 flex items-center rounded">
            Add Chemical
          </button>
          
        </div>
        <div class="bg-white/50 backdrop-blur-sm shadow-md rounded-lg overflow-hidden">
        <table class="w-full table-auto">
          <thead>
            <tr>
              <th v-for="header in tableHeaders" :key="header" class="px-6 py-3 text-left border-b text-xs font-medium text-gray-700 uppercase tracking-wider bg-white/30">
                {{ header }}
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="chemical in chemicals" :key="chemical.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ chemical.id }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ chemical.name }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ chemical.quantity }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ chemical.unit_details.name }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <ul>
                    <li v-for="alternative in chemical.alternatives_details" :key="alternative.id">{{ alternative.name }} ({{ alternative.unit_details.name }})</li>
                </ul>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ chemical.expiration_date }}</td>
            </tr>
          </tbody>
        </table>
        </div>
        <div v-if="showAddForm" class="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 z-50">
          <ChemicalForm 
            :units="units" 
            :chemicals="chemicals"
            @close="showAddForm = false"
            @chemicalAdded="fetchChemicalsAndUnits"
          />
        </div>
      </div>
    </div>
  </template>

<script>
import { defineComponent, ref, computed } from 'vue'
import { useStore } from 'vuex'
import Sidebar from '../../components/UserType/Sidebar.vue'
import ChemicalForm from './ChemicalForm.vue'
import { fetchData, postData } from '@/utils/api.js'

export default defineComponent({ 
  name: 'ChemicalList',
  components: {
    Sidebar,
    ChemicalForm
  },
  setup() {
    const store = useStore()
    const chemicals = ref([])
    const units = ref([])
    const showAddForm = ref(false)
    const tableHeaders = ['id', 'name', 'quantity', 'unit', 'alternative', 'expiration_date']

    const token = computed(() => store.state.token)

    const fetchChemicalsAndUnits = async () => {
      try {
        const [chemicalsData, unitsData] = await Promise.all([
          fetchData('/api/chemicals/', token.value),
          fetchData('/api/units/', token.value)
        ])
        chemicals.value = chemicalsData
        units.value = unitsData
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchChemicalsAndUnits()

    return {
      chemicals,
      units,
      tableHeaders,
      showAddForm,
      fetchChemicalsAndUnits
    }
  }
})
</script>

<style scoped>
.btn-primary {
  @apply bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 flex items-center rounded;
}
</style>
