<template>
    <div
      v-if="isVisible"
      class="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 z-50"
    >
      <div class="bg-white rounded-lg shadow-lg p-6 w-80">
        <h2 class="text-lg font-bold mb-4 text-gray-800">{{ title }}</h2>
        <p class="text-sm text-gray-600 mb-6">{{ message }}</p>
        <div class="flex justify-end space-x-4">
          <button
            @click="cancel"
            class="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            @click="confirm"
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'ConfirmationDialog',
    props: {
      title: {
        type: String,
        default: 'Confirmation',
      },
      message: {
        type: String,
        default: 'Are you sure?',
      },
      visible: {
        type: Boolean,
        default: false,
      },
    },
    emits: ['confirm', 'cancel', 'update:visible'],
    computed: {
      isVisible: {
        get() {
          return this.visible;
        },
        set(value) {
          this.$emit('update:visible', value);
        },
      },
    },
    methods: {
      confirm() {
        this.$emit('confirm');
        this.isVisible = false;
      },
      cancel() {
        this.$emit('cancel');
        this.isVisible = false;
      },
    },
  };
  </script>
  