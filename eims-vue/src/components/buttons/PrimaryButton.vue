<template>
  <button 
    :type="type" 
    :disabled="disabled"
    @click="$emit('click', $event)"
    class="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[
      size === 'sm' ? 'px-3 py-1 text-xs' : '',
      size === 'lg' ? 'px-6 py-3 text-base' : '',
      fullWidth ? 'w-full' : '',
      variant === 'outline' ? 'bg-transparent border border-blue-500 text-blue-500 hover:bg-blue-50' : '',
      variant === 'ghost' ? 'bg-transparent text-blue-500 hover:bg-blue-50' : '',
    ]"
  >
    <span v-if="loading" class="mr-2">
      <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </span>
    <slot name="icon" v-if="$slots.icon && !loading" class="mr-2"></slot>
    <slot></slot>
  </button>
</template>

<script>
export default {
  name: 'PrimaryButton',
  props: {
    type: {
      type: String,
      default: 'button',
      validator: value => ['button', 'submit', 'reset'].includes(value)
    },
    size: {
      type: String,
      default: 'md',
      validator: value => ['sm', 'md', 'lg'].includes(value)
    },
    variant: {
      type: String,
      default: 'filled',
      validator: value => ['filled', 'outline', 'ghost'].includes(value)
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    fullWidth: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click']
}
</script>