<template>
  <div class="flex h-screen bg-gradient-to-b from-[#F5F4F1] to-[#D4EAF7]">
    <Sidebar />
    <div class="flex-1 overflow-x-auto p-8 ml-64 relative">
      <h1 class="text-2xl font-bold mb-4 text-gray-800">Borrow Items for User {{ $route.params.barcode }}</h1>

      <div v-if="borrower" class="mb-6 text-lg">
          <div class="flex items-center space-x-4 mb-2">
            <span class="text-gray-700"><i class="fas fa-user fa-lg"></i></span>
            <p class="text-gray-700">Name: <span class="font-semibold">{{ borrower.name }}</span></p>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-gray-700"><i class="fas fa-id-card fa-lg"></i></span>
            <p class="text-gray-700">Barcode: <span class="font-semibold">{{ borrower.custom_id }}</span></p>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-gray-700"><i class="fas fa-refresh fa-lg"></i></span>
            <p class="text-gray-700">Barcode: <span class="font-semibold">{{ borrower.user_type }}</span></p>
          </div>
      </div>

      <div class="bg-white/50 backdrop-blur-sm shadow-md rounded-lg overflow-hidden p-6">
        <div class="mb-6">
          <h2 class="text-lg font-semibold mb-2">Scan Items</h2>
          <div v-for="borrower in borrowers" :key="borrower.id" class="mb-4">
              <h3 class="text-lg font-semibold mb-2">{{ borrower.username }}</h3>
              <h3>Barcode: {{ borrower.barcode }}</h3>
          </div>
          <div class="border rounded-lg p-4 bg-gray-50 video-container flex justify-center items-center">
            <video ref="video" id="scanner" width="640" height="480"></video>
            <canvas ref="canvas" class="scanner-overlay" width="640" height="480"></canvas>
          </div>
          <button @click="toggleScanning" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4">
            {{ isScanning ? 'Stop Scanning' : 'Start Scanning' }}
          </button>
        </div>

        <div class="mb-6">
          <h2 class="text-lg font-semibold mb-2">Scanned Items</h2>
          <table v-if="scannedItems.length > 0" class="w-full table-auto">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barcode</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(item, index) in scannedItems" :key="index">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ item.name }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ item.barcode }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button @click="removeItem(index)" class="text-red-600 hover:text-red-900">Remove</button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else class="text-gray-500">No items scanned yet.</p>
          <button v-if="scannedItems.length > 0" @click="clearAllItems" class="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
            Clear All Items
          </button>
        </div>

        <div class="mb-6">
          <select v-model="selectedRoom" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
            <option value="">Select a room</option>
            <option v-for="room in rooms" :key="room.id" :value="room.id">{{ room.name }}</option>
          </select>
        </div>

        <div class="text-right">
          <button @click="confirmBorrow" :disabled="scannedItems.length === 0 || !selectedRoom" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed">
            Confirm Borrow
          </button>
        </div>

        <p v-if="error" class="text-red-500 mt-4">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Quagga from 'quagga';
import axios from 'axios';
import Sidebar from '@/components/UserType/Sidebar.vue';

export default {
  name: 'BorrowTest',
  components: { Sidebar },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const video = ref(null);
    const canvas = ref(null);
    const isScanning = ref(false);
    const scannedItems = ref([]);
    const error = ref(null);
    const rooms = ref([]);
    const selectedRoom = ref('');
    const borrower = ref(null);


    
    const fetchBorrower = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/user-barcode/?barcode=${route.params.barcode}`);
        borrower.value = response.data;
      } catch (error) {
        console.error("Error fetching borrower:", error);
        error.value = "Failed to load borrower. Please try again.";
      }
    };

    const fetchRooms = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/room-list/');
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
          width: { ideal: 1280 },
          height: { ideal: 720 },
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
            width: 1280,
            height: 720,
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
        const response = await axios.get(`/api/check-item/${scannedCode}/`);
        if (response.data.exists) {
          if (!scannedItems.value.some(item => item.barcode === scannedCode)) {
            scannedItems.value.push({
              barcode: scannedCode,
              name: response.data.name
            });
          }
          console.log("Item scanned:", scannedCode);
        } else {
          console.log("Scanned barcode does not exist in the database:", scannedCode);
        }
      } catch (error) {
        console.error("Error checking item:", error);
      }
    };

    const confirmBorrow = async () => {
      if (!selectedRoom.value) {
        error.value = 'Please select a room';
        return;
      }
      try {
        const response = await axios.post('/api/borrow-equipment/', {
          userBarcode: route.params.barcode,
          equipments: scannedItems.value.map(item => item.barcode),
          room_id: selectedRoom.value
        });
        console.log(response.data);
        router.push({ 
          name: 'BorrowConfirmation', 
          params: { borrowId: response.data.borrowId }
        });
      } catch (error) {
        error.value = 'Error processing borrow request. Please try again.';
      }
    };

    const drawOverlay = () => {
      const ctx = canvas.value.getContext('2d');
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(50, 50, 300, 200);
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

    onMounted(() => {
      fetchRooms();
      fetchBorrower();
    });

    onBeforeUnmount(() => {
      stopScanning();
    });

    return {
      video,
      canvas,
      isScanning,
      borrower,
      scannedItems,
      error,
      rooms,
      selectedRoom,
      toggleScanning,
      confirmBorrow,
      removeItem,
      clearAllItems
    };
  }
};
</script>

<style scoped>
.video-container {
  position: relative;
  width: 640px;
  height: 480px;
  margin: 0 auto;
}

#scanner {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>