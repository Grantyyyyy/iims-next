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
      <tr v-for="borrow in apparatusBorrowed" :key="borrow.id" 
          class="hover:bg-gray-100 transition-colors duration-150 ease-in-out">
        <td class="px-4 py-4">
          <div class="text-sm font-medium text-gray-900">
            {{ borrow.apparatus_instance.apparatus.name }}
          </div>
          <div class="text-sm text-gray-500"> 
            {{ borrow.apparatus_instance.inventory_number }}
          </div>
        </td>
        <td class="px-4 py-4">
          <div class="text-sm font-medium text-gray-900">
            {{ borrow.apparatus_instance.quantity }} pc
          </div>
        </td> 
        <td class="px-4 py-4">
          <div class="px-5 text-xs py-1 bg-green-100 w-fit text-green-800 rounded-full" >
            {{ borrow.apparatus_instance.current_borrow_record?.borrower }}
          </div>
        </td>
        <td class="px-4 py-4">
          <span :class="[
              getConditionClass(borrow.apparatus_instance.current_condition), 
              'text-sm font-medium px-3 py-1 rounded-full'
              ]">
                {{ borrow.apparatus_instance.current_condition }}
          </span>
        </td>
        <td class="px-4 py-4">
          <div class="text-sm font-medium text-gray-900">
            {{ borrow.subject }}
          </div>
        </td>
        <td class="px-4 py-4">
          <div class="text-sm font-medium text-gray-900">
            {{ borrow.room }}
          </div>
          <div class="text-sm font-medium text-gray-500">
            {{ formatDate(borrow.borrowed_date) }}
          </div>
        </td>
        <td class="px-4 py-4">
          <div class="text-sm font-medium text-gray-900">
            {{ borrow.purpose }}
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700" v-if="userType === 'Lab Technician'">
          <button @click="openApparatusReturnForm(borrow.apparatus_instance.id)" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center">
            <i class="fas fa-undo-alt mr-2"></i> Return
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</template>


<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'BorrowedApparatus',
  props: {
    apparatusBorrowed: {
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
