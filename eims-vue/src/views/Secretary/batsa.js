<template>
  <div class="flex h-screen bg-gradient-to-b from-[#F5F4F1] to-[#D4EAF7]">
    <Sidebar @sidebarToggle="handleSidebarToggle" />
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
                <video ref="video" id="scanner" width="640" height="500"></video>
                <canvas ref="canvas" class="scanner-overlay" width="640" height="480"></canvas>
              </div>
              <button @click="toggleScanning" 
                      class="mt-3 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors duration-150">
                {{ isScanning ? 'Stop Scanning' : 'Start Scanning' }}
              </button>
            </div>

            <!-- Right Column: Manual Input and Scanned Items List -->
            <div class="space-y-6">
              <!-- Manual Barcode Input (Search) -->
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
                        <p class="text-xs text-gray-500">Unit Cost: {{ item.unit_cost }}</p>
                        <p class="text-xs text-gray-500">Barcode: {{ item.barcode }}</p>
                        <p class="text-xs text-gray-500">Condition: {{ item.condition }}</p>
                        <p class="text-xs text-gray-500">Status: {{ item.availability }}</p>
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
import Quagga from 'quagga';
import axios from 'axios';
import Sidebar from '@/components/UserType/Sidebar.vue';

export default {
  name: 'ItemBorrow',
  components: { Sidebar },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const video = ref(null);
    const canvas = ref(null);
    const isScanning = ref(false);
    const scannedItems = ref([]);
    const error = ref(null);
    const success = ref(null);
    const rooms = ref([]);
    const selectedRoom = ref('');
    const borrower = ref(null);
    const manualBarcode = ref('');


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

    const toggleScanning = () => {
      isScanning.value ? stopScanning() : startScanning();
    };

    const startScanning = () => {
      isScanning.value = true;

      navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "environment"
        }
      })
        .then(stream => {
          video.value.srcObject = stream;
          video.value.play();
        })
        .catch(err => console.error("Error accessing the camera:", err));

      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: video.value,
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment"
          },
        },
        decoder: {
          readers: [
            "code_39_reader",
            "ean_reader",
            "ean_8_reader",
            "code_128_reader",
            "code_39_vin_reader",
            "codabar_reader",
            "upc_reader",
            "upc_e_reader",
            "i2of5_reader"
          ],
        },
        locator: {
          patchSize: "medium",
          halfSample: true
        },
        numOfWorkers: 4,
        frequency: 10,
        locate: true,
      }, (err) => {
        if (err) {
          console.log(err);
          return;
        }
        console.log("Initialization finished. Ready to start");
        Quagga.start();
        drawOverlay();
      });

      Quagga.onDetected(onBarcodeDetected);
    };

    const stopScanning = () => {
      if (isScanning.value) {
        Quagga.stop();
        isScanning.value = false;
        clearOverlay();
      }
    };

    const onBarcodeDetected = async (result) => {
      const scannedCode = result.codeResult.code;
      try {
        const itemResponse = await axios.get(`/api/check-item/${scannedCode}/`);
        if (itemResponse.data.exists) {
          if (!scannedItems.value.some(item => item.barcode === scannedCode)) {
            scannedItems.value.push({
              barcode: scannedCode,
              unit_cost: itemResponse.data.unit_cost,
              name: itemResponse.data.name,
              condition: itemResponse.data.condition,
              availability: itemResponse.data.availability,

            });
          }
          console.log("Item scanned:", scannedCode);
        } else {
          console.log("Scanned barcode is not an item:", scannedCode);
          error.value = "This barcode doesn't belong to an item. Please scan an item barcode.";
          setTimeout(() => { error.value = null; }, 3000);
        }
      } catch (err) {
        console.error("Error checking item:", err);
        error.value = "Error checking item. Please try again.";
        setTimeout(() => { error.value = null; }, 3000);
      }
    };

    const addManualBarcode = async () => {
      if (manualBarcode.value) {
        // Convert the manualBarcode to uppercase (or lowercase)
        const formattedBarcode = manualBarcode.value.toUpperCase(); // or .toLowerCase() if preferred
        
        try {
          const itemResponse = await axios.get(`/api/check-item/${formattedBarcode}/`);
          if (itemResponse.data.exists) {
            if (!scannedItems.value.some(item => item.barcode === formattedBarcode)) {
              scannedItems.value.push({
                
                barcode: formattedBarcode, 
                unit_cost: itemResponse.data.unit_cost,
                name: itemResponse.data.name,
                condition: itemResponse.data.condition,
                availability: itemResponse.data.availability,
              });
              manualBarcode.value = ''; // Clear the input after adding
            } else {
              error.value = "This item has already been added.";
            }
          } else {
            error.value = "This barcode doesn't belong to an item. Please enter a valid item barcode.";
          }
        } catch (err) {
          console.error("Error checking item:", err);
          error.value = "Error checking item. Please try again.";
        }
        
        // Clear the error after 3 seconds
        setTimeout(() => { error.value = null; }, 3000);
      }
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

      // Handle success
      success.value = 'Items borrowed successfully!';
      setTimeout(() => {
        success.value = null;
        router.push({ 
          name: 'BorrowedList', 
          params: { borrowId: response.data.borrowId }
        });
      }, 3000);
    } catch (err) {
      if (err.response && err.response.status === 400) {
        // Display the error message returned from the backend
        error.value = err.response.data.error || 'Item is already borrowed, or something went wrong. Please try again.';

      } else {
        // General error message for other cases
        error.value = 'Error processing borrow request. Please try again.';
      }
      setTimeout(() => { error.value = null; }, 3000);
    }
  };

    const drawOverlay = () => {
      const ctx = canvas.value.getContext('2d');
      const width = video.value.videoWidth;
      const height = video.value.videoHeight;
      canvas.value.width = width;
      canvas.value.height = height;
      
      const rectWidth = width * 0.5;
      const rectHeight = height * 0.3;
      const rectX = (width - rectWidth) / 2;
      const rectY = (height - rectHeight) / 2;

      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.lineWidth = 3;
      ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
    };

    const clearOverlay = () => {
      const ctx = canvas.value.getContext('2d');
      ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
    };

    const removeItem = (index) => {
      scannedItems.value.splice(index, 1);
    };

    const clearAllItems = () => {
      scannedItems.value = [];
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

    });

    onBeforeUnmount(() => {
      stopScanning();
    });

    return {
      video,
      canvas,
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
      drawOverlay,
      clearOverlay,
      manualBarcode,
      addManualBarcode
    };
  }
};
</script>

<style scoped>
.scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;

}
.video-container {
  position: relative;
  display: flex;
    justify-content: center;
    align-items: center;
  height: 480px;
  overflow: hidden;
  
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.success-message, .error-message {
  position: fixed; /* Or absolute if it makes more sense */
  top: 10px; /* Adjust based on your layout */
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000; /* Ensure it overlays other content */
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