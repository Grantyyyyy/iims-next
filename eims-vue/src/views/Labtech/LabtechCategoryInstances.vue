<template>
  <div class="flex h-screen bg-gradient-to-b from-[#F5F4F1] to-[#D4EAF7]">
    <Sidebar @sidebarToggle="handleSidebarToggle" />
    <div
      :class="[
        'flex-1 overflow-x-auto p-8 transition-all duration-300 ease-in-out',
        isSidebarOpen ? 'lg:ml-64' : 'ml-0'
      ]"
    >
      <div class="max-w-full bg-white/80 backdrop-blur-md shadow-lg rounded-lg p-8">
        <button @click="goBack" class="flex items-center mb-6 text-gray-700 hover:text-gray-900">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 class="text-3xl font-bold mb-6 text-gray-800">Instances</h1>
        <div class="flex justify-between mb-6">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search users..."
            class="border border-gray-300 rounded py-2 px-4"
          />
        </div>
        <div v-if="loading" class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <div v-else-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
          <p class="font-bold">Error</p>
          <p>{{ error }}</p>
        </div>
        <div v-else-if="instances.length === 0" class="text-gray-500 text-center text-lg mt-6">
          No items found in this category.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th v-for="header in tableHeaders" :key="header" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="instance in filteredInstances" :key="instance.id" class="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer">
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-900">
                    ₱ {{ Number(instance.unit_cost).toLocaleString() }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-900">
                    {{ instance.quantity }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm font-medium text-gray-900">
                    {{ instance.equipment.name }}
                  </div>
                  <div :title="instance.equipment.description" class="truncate max-w-xs text-sm text-gray-900">
                    {{ instance.equipment.description }}
                  </div>
                  <div class="text-xs text-gray-500">
                    SN# {{ instance.serial_number ? instance.serial_number : 'None' }}
                  </div>
                  <div class="text-xs text-gray-500">
                    Useful Life: {{ instance.useful_life ? instance.useful_life : 'None' }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-xs text-gray-900">
                    {{ instance.inventory_number }}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <span :class="[getConditionClass(instance.current_condition), 'text-sm']">
                    {{ instance.current_condition }}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <div class="text-xs text-gray-900">
                    {{ instance.purchase_date ? formatDate(instance.purchase_date) : 'None' }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'
import Sidebar from '../../components/UserType/Sidebar.vue'

export default defineComponent({
  name: 'CategoryInstances',
  components: {
    Sidebar
  },
  props: {
    id: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const loading = ref(true)
    const error = ref(null)
    const route = useRoute()
    const router = useRouter()
    const instances = ref([])
    const tableHeaders = ['Unit Cost', 'Quantity', 'Equipment', 'Inventory Item No.', 'Condition', 'Purchase Date']
    const isSidebarOpen = ref(true)
    const searchQuery = ref('')

    const fetchInstances = async () => {
      try {
        const response = await axios.get(`/api/labtech-category/${route.params.id}/instances/`)
        instances.value = response.data
        loading.value = false
      } catch (err) {
        console.error('Error fetching instances:', err)
        error.value = 'Failed to fetch instances. Please try again.'
      }
    }

    const getConditionClass = (condition) => {
      switch (condition.toLowerCase()) {
        case 'good':
          return 'text-green-600'
        case 'fair':
          return 'text-yellow-600'
        case 'poor':
          return 'text-blue-600'
        case 'damaged':
          return 'text-red-600'
        default:
          return 'text-gray-600'
      }
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    const filteredInstances = computed(() => {
      return instances.value.filter(instance => {
        const query = searchQuery.value.toLowerCase();
        return instance.equipment.name.toLowerCase().includes(query) ||
          instance.inventory_number.toLowerCase().includes(query) ||
          instance.current_condition.toLowerCase().includes(query) || 
          new Date(instance.purchase_date).toLocaleString().toLowerCase().includes(query) || 
          (instance.serial_number && instance.serial_number.toLowerCase().includes(query)) ||
          instance.unit_cost.toString().toLowerCase().includes(query) ||
          instance.quantity.toString().toLowerCase().includes(query);
      });
    });

    onMounted(() => {
      fetchInstances()
    })

    const goBack = () => {
      router.go(-1)
    }

    const handleSidebarToggle = () => {
      isSidebarOpen.value = !isSidebarOpen.value
    }

    return {
      loading,
      error,
      searchQuery,
      instances,
      tableHeaders,
      isSidebarOpen,
      filteredInstances,
      goBack,
      handleSidebarToggle,
      getConditionClass,
      formatDate
    }
  }
})
</script>
