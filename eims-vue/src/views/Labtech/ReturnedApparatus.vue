<template>
  <table class="min-w-full divide-y divide-gray-200">
    <thead class="bg-gray-50">
      <tr>
        <th v-for="header in apparatusHeaders" 
            :key="header" 
            class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            
          {{ header }}
        </th>
      </tr>
    </thead>
    <tbody class="bg-white divide-y divide-gray-200">
      <tr v-for="returned in apparatusReturned" :key="returned.id" 
          :class="{'bg-gray-50': index % 2 === 0}"
          class="hover:bg-gray-100 transition-colors duration-150 ease-in-out">
        <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
          <div class="text-sm font-medium text-gray-900">
            {{ returned.borrow_record.apparatus_instance.apparatus.name }}
          </div>
          <div class="text-sm text-gray-500"> 
            {{ returned.apparatus_instance.inventory_number }}
          </div>
          <div class="text-sm text-gray-500"> 
            {{ returned.borrow_record.serial_number }}
          </div>
        </td>
        <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
          <div class="text-sm font-medium text-gray-900">
            {{ returned.borrow_record.quantity }} pc
          </div>
        </td>
        <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
          <div class="px-5 text-xs py-1 bg-blue-100 w-fit text-blue-800 rounded-full" >
            {{ returned.apparatus_instance.last_borrow_record?.borrower }}
          </div>
        </td>
        <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
          <span :class="[
              getConditionClass(returned.borrow_record.apparatus_instance.current_condition), 
              'text-sm font-medium px-3 py-1 rounded-full'
              ]">
                {{ returned.borrow_record.apparatus_instance.current_condition }}
          </span>
        </td>
        <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
          <div class="text-sm font-medium text-gray-900">
            {{ returned.borrow_record.subject }}
          </div>
        </td>
        <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
          <div class="text-sm font-medium text-gray-900">
            {{ returned.borrow_record.room }}
          </div>
          <div class="text-sm font-medium text-gray-500">
            {{ formatDate(returned.borrow_record.borrowed_date) }}
          </div>
        </td>
        <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
          <div class="text-sm mt-4 font-medium text-gray-500">
            {{ formatDate(returned.borrow_record.returned_date) }}
          </div>
        </td>
        <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
          <div class="text-sm font-medium text-gray-900">
            {{ returned.remarks }}
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>
  
  
<script>
import { defineComponent, ref, onMounted, computed, watch } from 'vue'

export default defineComponent({
  name: 'ReturnedApparatus',
  props: {
    apparatusReturned: {
      type: Array,
      required: true
    },
    apparatusHeaders: {
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
  