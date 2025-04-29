<template>
  <div class="flex h-screen bg-gradient-to-b from-[#F5F4F1] to-[#D4EAF7]">
    <Sidebar />
    <div class="flex-1 overflow-x-auto p-8 ml-64 relative">
      <div class="max-w-8xl w-full h-full bg-white/80 backdrop-blur-md shadow-lg rounded-lg overflow-hidden">
        <div class="p-8">
          <h1 class="text-3xl font-bold mb-6 text-gray-800">Borrow Items</h1>

          <!-- Borrower Information -->
          <div v-if="borrower" class="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div v-for="(value, key) in borrowerDisplayInfo" :key="key" 
                 class="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors duration-150">
              <span :class="iconClasses[key]">
                <i :class="icons[key]"></i>
              </span>
              <div>
                <p class="text-xs text-gray-500">{{ labels[key] }}</p>
                <p class="text-sm font-semibold text-gray-800">{{ value || 'N/A' }}</p>
              </div>
            </div>
          </div>

          <!-- Main Content Area -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <!-- Left Column: Scanning Area -->
            <div>
              <h2 class="text-xl font-semibold mb-3">Scan Items</h2>
              <div class="border rounded-lg p-3 bg-gray-50 video-container">
                <video ref="video" id="scanner" class="w-full h-full object-cover"></video>
              </div>
              <button @click="toggleScanning" 
                      class="mt-3 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors duration-150">
                {{ isScanning ? 'Stop Scanning' : 'Start Scanning' }}
              </button>
            </div>

            <!-- Right Column: Manual Input and Scanned Items List -->
            <div class="space-y-6">
              <!-- Manual Barcode Input -->
              <div>
                <h3 class="text-lg font-semibold mb-2">Search or Add Item</h3>
                <div class="flex">
                  <input v-model="manualBarcode" 
                         type="text" 
                         placeholder="Enter barcode or search item" 
                         class="flex-grow pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-l-md">
                  <button @click="addManualBarcode" 
                          class="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-r-md transition-colors duration-150">
                    Add
                  </button>
                </div>
              </div>

              <!-- Scanned Items List -->
              <div>
                <h2 class="text-xl font-semibold mb-3">Scanned Items</h2>
                <div class="border rounded-lg p-3 bg-white h-[calc(100vh-36rem)] overflow-y-auto">
                  <ul class="divide-y divide-gray-200">
                    <li v-for="(item, index) in scannedItems" :key="index" 
                        class="py-3 flex justify-between items-center">
                      <div>
                        <p class="text-sm font-medium text-indigo-600 truncate">{{ item.name }}</p>
                        <p class="text-xs text-gray-500">Barcode: {{ item.barcode }}</p>
                        <p class="text-xs text-gray-500">Condition: {{ item.condition }}</p>
                        <p class="text-xs text-gray-500">Status: {{ item.status }}</p>
                      </div>
                      <button @click="removeItem(index)" 
                              class="text-red-500 hover:text-red-700 transition-colors duration-150">
                        <i class="fas fa-times"></i>
                      </button>
                    </li>
                  </ul>
                </div>
                <button v-if="scannedItems.length > 0" @click="clearAllItems" 
                        class="mt-3 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors duration-150">
                  Clear All
                </button>
              </div>
            </div>
          </div>

          <!-- Room Selection and Confirm Borrow -->
          <div class="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 mt-6">
            <select v-model="selectedRoom" 
                    class="flex-grow pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md">
              <option value="">Select a room</option>
              <option v-for="room in rooms" :key="room.id" :value="room.id">{{ room.name }}</option>
            </select>
            <button @click="confirmBorrow" 
                    :disabled="scannedItems.length === 0 || !selectedRoom" 
                    class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
              Confirm Borrow
            </button>
          </div>

          <!-- Error and Success Messages -->
          <transition name="fade">
            <div v-if="error" class="mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
              <p class="font-bold">Error</p>
              <p>{{ error }}</p>
            </div>
            <div v-else-if="success" class="mt-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded" role="alert">
              <p class="font-bold">Success</p>
              <p>{{ success }}</p>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';
import axios from 'axios';
import Sidebar from '@/components/UserType/Sidebar.vue';

export default {
  name: 'ItemBorrow',
  components: { Sidebar },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const video = ref(null);
    const isScanning = ref(false);
    const scannedItems = ref([]);
    const lastScannedCode = ref(null);
    const error = ref(null);
    const success = ref(null);
    const rooms = ref([]);
    const selectedRoom = ref('');
    const borrower = ref(null);
    const manualBarcode = ref('');
    const codeReader = ref(null);
    const isProcessing = ref(false);

    

    const fetchBorrower = async () => {
      try {
        const response = await axios.get(`/api/user-barcode/?barcode=${route.params.barcode}`);
        borrower.value = response.data;
      } catch (error) {
        console.error("Error fetching borrower:", error);
        error.value = "Failed to load borrower. Please try again.";
      }
    };

    const fetchRooms = async () => {
      try {
        const response = await axios.get('/api/room-list/');
        rooms.value = response.data;
      } catch (error) {
        console.error("Error fetching rooms:", error);
        error.value = "Failed to load rooms. Please try again.";
      }
    };

    const toggleScanning = async () => {
      if (isScanning.value) {
        await stopScanning();
      } else {
        await startScanning();
      }
    };

    const debugLog = (message, data = null) => {
      console.log(`[Scanner Debug] ${message}`, data || '');
    };

    const processScannedCode = async (code) => {
      debugLog('Processing scanned code:', code);
      
      try {
        // Clean the scanned code
        const cleanedCode = code.trim().replace(/[^a-zA-Z0-9]/g, '');
        debugLog('Cleaned code:', cleanedCode);
        
        // Store last scanned code for debugging
        lastScannedCode.value = cleanedCode;
        
        // Log the full URL being called
        const url = `/api/check-item/${cleanedCode}/`;
        debugLog('Making request to:', url);

        // Add explicit error handling for the request
        try {
          const itemResponse = await axios.get(url, {
            // Add timeout and additional config for debugging
            timeout: 5000,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          debugLog('Response received:', itemResponse.data);

          if (itemResponse.data.exists) {
            if (!scannedItems.value.some(item => item.inventory_number === cleanedCode)) {
              scannedItems.value.push({
                inventory_number: cleanedCode,
                name: itemResponse.data.name,
                condition: itemResponse.data.condition,
                status: itemResponse.data.availability,
                item_type: itemResponse.data.item_type
              });
              success.value = "Item scanned successfully!";
            } else {
              error.value = "This item has already been scanned.";
            }
          } else {
            error.value = "Invalid item inventory number. Please try again.";
          }
        } catch (requestError) {
          debugLog('Request error:', requestError);
          throw requestError; // Re-throw for outer catch block
        }

      } catch (err) {
        debugLog('Error in processScannedCode:', err);
        
        if (err.response) {
          debugLog('Error response:', {
            data: err.response.data,
            status: err.response.status,
            headers: err.response.headers
          });
          error.value = err.response.data.message || "Error checking item. Please try again.";
        } else if (err.request) {
          debugLog('No response received:', err.request);
          error.value = "No response from server. Please check your connection.";
        } else {
          debugLog('Error setting up request:', err.message);
          error.value = "Error setting up request. Please try again.";
        }
      }

      // Reset flags and messages after delay
      setTimeout(() => {
        error.value = null;
        success.value = null;
        isProcessing = false;
      }, 3000);
    };

    // Add manual test function
    const testScannerConnection = async () => {
      debugLog('Testing scanner connection');
      const testCode = '123456'; // Replace with a valid inventory number from your system
      await processScannedCode(testCode);
    };

    // Update these parts in your existing code

const startScanning = async () => {
  debugLog('Starting scanner');
  
  try {
    if (!codeReader.value) {
      debugLog('Initializing BrowserMultiFormatReader');
      codeReader.value = new BrowserMultiFormatReader();
    }
    
    // First, check if we have camera access
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the test stream
      debugLog('Camera permission granted');
    } catch (err) {
      debugLog('Camera permission denied:', err);
      error.value = "Camera access denied. Please check your browser permissions.";
      return;
    }
    
    isScanning.value = true;
    
    // Configure hints for better barcode detection
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    
    const constraints = {
      video: {
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 },
        aspectRatio: { ideal: 1.7777777778 }
      }
    };
    
    debugLog('Setting up video stream with constraints:', constraints);

    // Start scanning with continuous callback
    await codeReader.value.decodeFromVideoDevice(
      undefined, 
      video.value,
      async (result, error) => {
        // Log both successful reads and errors
        if (error) {
          debugLog('Scanning error:', error);
          return;
        }
        
        if (result && !isProcessing.value) {
          debugLog('Barcode detected:', result);
          isProcessing.value = true;
          
          const scannedCode = result.getText();
          debugLog('Scanned code value:', scannedCode);
          
          // Play a beep sound to indicate successful scan
          const beep = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");
          beep.play();
          
          // Process the scanned code
          await processScannedCode(scannedCode);
          
          // Reset processing flag after delay
          setTimeout(() => {
            isProcessing.value = false;
          }, 1000);
        }
      },
      constraints
    );
    
    debugLog('Scanner started successfully');
  } catch (err) {
    debugLog('Error starting scanner:', err);
    error.value = `Failed to start scanner: ${err.message}`;
    isScanning.value = false;
  }
};

    const stopScanning = async () => {
      debugLog('Stopping scanner');
      if (codeReader.value) {
        await codeReader.value.reset();
        isScanning.value = false;
        debugLog('Scanner stopped');
      }
    };

    // Add test button click handler
    const handleTestClick = () => {
      debugLog('Test button clicked');
      testScannerConnection();
    };

    onMounted(() => {
      debugLog('Component mounted');
    });

    onBeforeUnmount(() => {
      debugLog('Component unmounting');
      stopScanning();
    });

   
    const addManualBarcode = async () => {
      if (manualBarcode.value) {
        await processScannedCode(manualBarcode.value);
        manualBarcode.value = '';
      }
    };

    const removeItem = (index) => {
      scannedItems.value.splice(index, 1);
    };

    const clearAllItems = () => {
      scannedItems.value = [];
    };

    const confirmBorrow = async () => {
      if (!selectedRoom.value) {
        error.value = 'Please select a room';
        return;
      }

      try {
        const response = await axios.post('/api/borrow/', {
          userBarcode: route.params.barcode,
          items: scannedItems.value.map(item => item.barcode),
          room_id: selectedRoom.value,
        });

        success.value = 'Items borrowed successfully!';
        setTimeout(() => {
          success.value = null;
          router.push({ 
            name: 'BorrowedList', 
            params: { borrowId: response.data.borrowId }
          });
        }, 3000);
      } catch (err) {
        error.value = err.response?.data?.error || 'Error processing borrow request. Please try again.';
        setTimeout(() => { error.value = null; }, 3000);
      }
    };

    const icons = {
      name: 'fas fa-user-circle',
      custom_id: 'fas fa-id-card',
      user_type: 'fas fa-user-tag',
      contact_number: 'fas fa-phone'
    };

    const iconClasses = {
      name: 'text-blue-600',
      custom_id: 'text-green-600',
      user_type: 'text-purple-600',
      contact_number: 'text-yellow-600'
    };

    const labels = {
      name: 'Name',
      custom_id: 'ID No.',
      user_type: 'User Type',
      contact_number: 'Contact'
    };

    const borrowerDisplayInfo = computed(() => {
      if (!borrower.value) return {};
      return {
        name: borrower.value.name,
        custom_id: borrower.value.custom_id,
        user_type: borrower.value.user_type,
        contact_number: borrower.value.contact_number || 'N/A'
      };
    });

    onMounted(() => {
      fetchBorrower();
      fetchRooms();
      codeReader.value = new BrowserMultiFormatReader();
    });

    onBeforeUnmount(() => {
      stopScanning();
      if (codeReader.value) {
        codeReader.value.reset();
      }
    });

    return {
      video,
      isScanning,
      toggleScanning,
      scannedItems,
      removeItem,
      clearAllItems,
      confirmBorrow,
      rooms,
      selectedRoom,
      error,
      success,
      borrower,
      icons,
      iconClasses,
      labels,
      borrowerDisplayInfo,
      manualBarcode,
      addManualBarcode,
      handleTestClick,
      lastScannedCode
    };
  }
};
</script>

<style scoped>
.video-container {
  position: relative;
  height: 480px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.success-message, .error-message {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>