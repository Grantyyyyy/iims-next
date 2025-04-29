// First, create a new component for the Import Modal (ImportModal.vue)
<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-96">
      <h2 class="text-xl font-bold mb-4">Import Instances</h2>
      
      <div class="mb-4">
        <label class="block mb-2 text-sm font-medium text-gray-700">
          Select File
        </label>
        <input 
          type="file" 
          accept=".csv,.xlsx,.xls"
          @change="handleFileUpload"
          class="w-full border border-gray-300 rounded-md p-2"
        />
      </div>

      <div v-if="fileError" class="text-red-500 mb-4">
        {{ fileError }}
      </div>

      <div class="flex justify-end space-x-2">
        <button 
          @click="closeModal" 
          class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
        <button 
          @click="submitImport"
          :disabled="!selectedFile"
          class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          Import
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import axios from 'axios';

export default {
  name: 'ImportModal',
  emits: ['close', 'import-success'],
  
  setup(props, { emit }) {
    const isOpen = ref(false);
    const selectedFile = ref(null);
    const fileError = ref(null);

    const openModal = () => {
      isOpen.value = true;
    };

    const closeModal = () => {
      isOpen.value = false;
      selectedFile.value = null;
      fileError.value = null;
    };

    const handleFileUpload = (event) => {
      const file = event.target.files[0];
      
      // Validate file type
      const allowedTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
      
      if (!file) {
        fileError.value = 'No file selected';
        selectedFile.value = null;
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        fileError.value = 'Invalid file type. Please upload .csv, .xls, or .xlsx files.';
        selectedFile.value = null;
        return;
      }

      // Validate file size (e.g., max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        fileError.value = 'File is too large. Maximum file size is 10MB.';
        selectedFile.value = null;
        return;
      }

      selectedFile.value = file;
      fileError.value = null;
    };

    const submitImport = async () => {
      if (!selectedFile.value) {
        fileError.value = 'Please select a file to import';
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedFile.value);

      try {
        const response = await axios.post('/api/import-instances/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        // Handle successful import
        emit('import-success', response.data);
        closeModal();
      } catch (error) {
        // Handle import errors
        fileError.value = error.response?.data?.detail || 'An error occurred during import';
        console.error('Import error:', error);
      }
    };

    return {
      isOpen,
      selectedFile,
      fileError,
      openModal,
      closeModal,
      handleFileUpload,
      submitImport
    };
  }
};
</script>