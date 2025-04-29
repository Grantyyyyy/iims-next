<template>
    <div class="bg-white p-4 rounded shadow">
      <div class="flex items-center">
        <svg class="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path :d="icon" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
        </svg>
        <span class="font-semibold">{{ value }} {{ title }}</span>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      icon: String,
      title: String,
      value: [Number, String],
    },
  };
  </script>