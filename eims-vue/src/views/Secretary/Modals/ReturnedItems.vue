<template>
  <table class="min-w-full divide-y divide-gray-200">
    <thead class="bg-gray-50">
      <tr>
        <th v-for="header in itemHeaders" :key="header"
          class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          {{ header }}
        </th>
      </tr>
    </thead>
    <tbody class="bg-white divide-y divide-gray-200">
      <tr v-for="returnedItem in itemReturned" :key="returnedItem.id"
        class="hover:bg-gray-100 transition-colors duration-150 ease-in-out">
        <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
          <div>
            {{ returnedItem.item_instance.item.name }}
          </div>
          <div class="text-sm text-gray-500">
            {{ returnedItem.item_instance.inventory_number }}
          </div>
        </td>
        <td class="px-4 py-4">
          <div class="text-sm font-medium text-gray-900">
            {{ returnedItem.borrow_record.quantity }}
          </div>
        </td>
        <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
          <div class="px-5 text-xs py-1 bg-blue-100 w-fit text-blue-800 rounded-full">
            {{ returnedItem.item_instance.last_borrow_record.borrower }}
          </div>
        </td>
        <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
          <span :class="[
              getConditionClass(returnedItem.item_instance.current_condition),
              'text-sm font-medium px-3 py-1 rounded-full'
            ]">
            {{ returnedItem.item_instance.current_condition }}
          </span>
        </td>
        <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
          <div class="text-sm font-medium text-gray-900">
            {{ returnedItem.borrow_record.room.name }}
          </div>
        </td>
        <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
          <div class="text-sm font-medium text-gray-900">
            {{ formatDate(returnedItem.borrow_record.borrow_date) }}
          </div>
        </td>
        <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
          <div class="text-sm mt-4 font-medium text-gray-500">
            {{ formatDate(returnedItem.return_date) }}
          </div>
        </td>
        <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
          <div class="text-sm font-medium text-gray-900">
            {{ returnedItem.notes }}
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>
    
<script>
import { defineComponent, ref, onMounted, computed, watch } from 'vue'

export default defineComponent({
  name: 'ReturnedItems',
  props: {
    itemReturned: {
      type: Array,
      required: true
    },
    itemHeaders: {
      type: Array,
      required: true
    },
    getConditionClass: {
      type: Function,
      required: true
    },
    formatDate: {
      type: Function,
      required: true
    },
    openApparatusReturnForm: {
      type: Function,
      required: true
    },
    userType: {
      type: String,
      required: true
    }
  }
})
</script>