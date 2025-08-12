<template>
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
            <th v-for="header in itemHeaders" 
                :key="header" 
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            {{ header }}
            </th>
        </tr>
      </thead>
        <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="borrow in itemBorrowed" :key="borrow .id"   
            :class="{'bg-gray-50': index % 2 === 0}"
            class="hover:bg-gray-100 transition-colors duration-150 ease-in-out">
            <td class="px-4 py-4">
            <div class="text-sm font-medium text-gray-900">
                {{ borrow.item_instance.item.name }}
            </div>
            <div class="text-sm text-gray-500"> 
                {{ borrow.item_instance.inventory_number }}
            </div>
            <div class="text-sm text-gray-500"> 
                {{ borrow.item_instance.serial_number }}
            </div>
            </td>
            <td class="px-4 py-4">
            <div class="px-5 text-xs py-1 bg-green-100 w-fit text-green-800 rounded-full" >
                {{ borrow.item_instance.current_borrow_record.borrower }}
            </div>
            </td>
            <td class="px-4 py-4">
            <span :class="[
                getConditionClass(borrow.item_instance.current_condition), 
                'text-sm font-medium px-3 py-1 rounded-full'
                ]">
                    {{ borrow.item_instance.current_condition }}
            </span>
            </td>
            <td class="px-4 py-4">
            <div class="text-sm font-medium text-gray-900">
                {{ borrow.room.name }}
            </div>
            </td>
            <td class="px-4 py-4">
            <div class="text-sm font-medium text-gray-900">
                {{ formatDate(borrow.borrow_date) }}
            </div>
            </td>
            <td class="px-4 py-4">
            <div class="text-sm font-medium text-gray-900">
                {{ borrow.purpose }}
            </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700" v-if="userType === 'Secretary'">
            <button @click="openReturnForm(borrow.item_instance.id)" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center">
                <i class="fas fa-undo-alt mr-2"></i> Return
            </button>
            </td>
        </tr>
        </tbody>
    </table>
  </template>

<script>
import { defineComponent,  } from 'vue'

export default defineComponent({
  name: 'BorrowedItems',
  props: {
    itemBorrowed: {
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