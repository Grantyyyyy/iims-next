<template>
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="$emit('close')">
      <div class="bg-white p-4 rounded-lg" @click.stop>
        <img :src="barcode" alt="Barcode" class="max-w-full h-auto" />
        <button 
          @click="$emit('close')" 
          class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full"
        >
          Close
        </button>
      </div>
    </div>
  </template>
  
  <script>
  import { defineComponent } from 'vue';
  
  export default defineComponent({
    name: 'BarcodePopup',
    props: {
      barcode: {
        type: String,
        required: true
      }
    },
    emits: ['close']
  });
  </script>