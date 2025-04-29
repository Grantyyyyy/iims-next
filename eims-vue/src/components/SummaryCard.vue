<template>
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center">
        <div :class="`bg-${color}-100 rounded-full p-3`">
          <svg class="w-6 h-6" :class="`text-${color}-500`" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="iconPath"></path>
          </svg>
        </div>
        <div class="ml-4">
          <h2 class="text-sm font-medium text-gray-500">{{ title }}</h2>
          <p class="text-2xl font-semibold text-gray-900">{{ value }}</p>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { defineComponent, computed } from 'vue'
  
  const icons = {
    box: "M20 3H4a2 2 0 00-2 2v14a2 2 0 002 2h16a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H4V5h16v14z",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    folder: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
    users: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
  }
  
  export default defineComponent({
    name: 'SummaryCard',
    props: {
      title: String,
      value: Number,
      icon: String,
      color: String
    },
    setup(props) {
      const iconPath = computed(() => icons[props.icon] || '')
  
      return {
        iconPath
      }
    }
  })
  </script>