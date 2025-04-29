<template>
  <div v-if="isOpen" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white p-6 rounded-lg w-96">
      <h2 class="text-xl font-semibold mb-4">Turnover Item</h2>
      
      <!-- Turnover Type Buttons -->
      <div class="flex justify-around mb-4">
        <button 
          @click="currentForm = 'transfer'"
          :class="['px-4 py-2 rounded', currentForm === 'transfer' ? 'bg-blue-500 text-white' : 'bg-gray-200']"
        >
          Transfer
        </button>
        <button 
          @click="currentForm = 'replace'"
          :class="['px-4 py-2 rounded', currentForm === 'replace' ? 'bg-blue-500 text-white' : 'bg-gray-200']"
        >
          Replace
        </button>
        <button 
          @click="currentForm = 'dispose'"
          :class="['px-4 py-2 rounded', currentForm === 'dispose' ? 'bg-blue-500 text-white' : 'bg-gray-200']"
        >
          Dispose
        </button>
      </div>

      <!-- Dynamic Form Display -->
      <component 
        :is="currentFormComponent" 
        :item-id="itemId"
        @close="closeModal"
        @turnover-success="handleSuccess"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import TransferForm from '../../Supply/Forms/TransferForm.vue';
import ReplaceForm from '../../Supply/Forms/ReplaceForm.vue';
import DisposeForm from '../../Supply/Forms/DisposeForm.vue';

export default defineComponent({
  name: 'TurnoverModal',
  components: {
    TransferForm,
    ReplaceForm,
    DisposeForm
  },
  props: {
    itemId: {
      type: [Number, String],
      required: true
    }
  },
  data() {
    return {
      isOpen: false,
      currentForm: 'transfer'
    };
  },
  computed: {
    currentFormComponent() {
      switch (this.currentForm) {
        case 'transfer': return 'TransferForm';
        case 'replace': return 'ReplaceForm';
        case 'dispose': return 'DisposeForm';
        default: return 'TransferForm';
      }
    }
  },
  methods: {
    openModal() {
      this.isOpen = true;
    },
    closeModal() {
      this.isOpen = false;
      this.currentForm = 'transfer'; // Reset to default form
    },
    handleSuccess(data) {
      // Pass through the status and itemId to the parent
      this.$emit('turnover-success', {
        itemId: this.itemId,
        status: data.status || 'Pending Transfer'
      });
      this.closeModal();
    }
  }
});
</script>