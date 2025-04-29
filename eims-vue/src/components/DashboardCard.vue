<template>
    <div class="bg-white rounded-lg shadow-md p-6">
      <h3 class="text-xl font-semibold mb-4">{{ title }}</h3>
      <slot></slot>
    </div>
  </template>
  
  <script>
  export default {
    name: 'DashboardCard',
    props: {
      title: {
        type: String,
        required: true
      }
    }
  }
  </script>