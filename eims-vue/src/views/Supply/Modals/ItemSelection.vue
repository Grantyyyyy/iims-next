<template>
    <div v-if="modelValue" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="fixed inset-0 bg-black/50" @click="$emit('update:modelValue', false)"></div>
      
      <div class="relative min-h-screen flex items-center justify-center p-4">
        <div class="relative bg-white rounded-lg shadow-xl w-full max-w-4xl">
          <div class="flex items-center justify-between p-4 border-b">
            <h2 class="text-xl font-semibold text-gray-900">
              Select Replacement Item
            </h2>
            <button
              @click="$emit('update:modelValue', false)"
              class="p-1 hover:bg-gray-100 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
  
          <!-- Search -->
          <div class="p-4 border-b">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by item name or serial number..."
                class="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
  
          <!-- Content -->
          <div class="p-4 max-h-[32rem] overflow-y-auto">
            <div v-if="loading" class="flex justify-center items-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            
            <div v-else-if="filteredItems.length === 0" class="text-center py-8 text-gray-500">
              No items found matching your search.
            </div>
            
            <div v-else class="grid gap-4">
              <div
                v-for="item in filteredItems"
                :key="item.id"
                class="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                @click="selectItem(item)"
              >
                <div class="flex justify-between items-start">
                  <div>
                    <h3 class="font-medium text-gray-900">{{ item.item?.name }}</h3>
                    <p class="text-sm text-gray-500 mt-1">Serial: {{ item.serial_number }}</p>
                    <div class="mt-2 grid grid-cols-2 gap-x-4 text-sm">
                      <div>
                        <span class="text-gray-500">Category:</span>
                        <span class="ml-1 text-gray-900">{{ item.item?.category?.name }}</span>
                      </div>
                      <div>
                        <span class="text-gray-500">Condition:</span>
                        <span class="ml-1 text-gray-900">{{ item.current_condition }}</span>
                      </div>
                      <div class="mt-1">
                        <span class="text-gray-500">Price:</span>
                        <span class="ml-1 text-gray-900">₱{{ item.price }}</span>
                      </div>
                      <div class="mt-1">
                        <span class="text-gray-500">Status:</span>
                        <span class="ml-1 text-gray-900">{{ item.status }}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-medium rounded-full',
                      item.current_condition === 'Good' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    ]"
                  >
                    {{ item.current_condition }}
                  </span>
                </div>
              </div>
            </div>
          </div>
  
          <!-- Footer -->
          <div class="flex justify-end gap-3 p-4 border-t">
            <button
              @click="$emit('update:modelValue', false)"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { defineComponent, ref, computed } from 'vue'
  
  export default defineComponent({
    name: 'ItemSelection',
    
    props: {
      modelValue: {
        type: Boolean,
        required: true
      },
      items: {
        type: Array,
        required: true
      },
      loading: {
        type: Boolean,
        default: false
      }
    },
  
    emits: ['update:modelValue', 'select'],
  
    setup(props, { emit }) {
      const searchQuery = ref('')
  
      const filteredItems = computed(() => {
        if (!searchQuery.value) return props.items
        
        const query = searchQuery.value.toLowerCase()
        return props.items.filter(item => 
          item.item?.name?.toLowerCase().includes(query) ||
          item.serial_number?.toLowerCase().includes(query) ||
          item.item?.category?.name?.toLowerCase().includes(query)
        )
      })
  
      const selectItem = (item) => {
        emit('select', item)
        emit('update:modelValue', false)
      }
  
      return {
        searchQuery,
        filteredItems,
        selectItem
      }
    }
  })
  </script>