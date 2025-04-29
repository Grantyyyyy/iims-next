<template>
  <div class="flex h-screen bg-gradient-to-b from-[#F5F4F1] to-[#D4EAF7]">
    <Sidebar />
    <div class="flex-1 overflow-x-auto p-8 ml-64 relative">
      <h1 class="text-2xl font-bold mb-4 text-gray-800">Barcode Scanner</h1>

      <div class="bg-white/50 backdrop-blur-sm shadow-md rounded-lg overflow-hidden p-6">
        <!-- Scan Barcode Section -->
        <div class="mb-6">
          <h2 class="text-lg font-semibold mb-2">Scan Barcode</h2>
          <div class="border rounded-lg p-4 bg-gray-50 video-container flex justify-center items-center">
            <video ref="video" id="scanner" width="640" height="480"></video>
            <canvas ref="canvas" class="scanner-overlay" width="640" height="480"></canvas>
          </div>
          <button @click="toggleScanning" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4">
            {{ isScanning ? 'Stop Scanning' : 'Start Scanning' }}
          </button>
        </div>

        <!-- Manual Barcode Input Section -->
        <div class="mb-6">
          <h2 class="text-lg font-semibold mb-2">Enter User Barcode Manually</h2>
          <div class="flex">
            <input v-model="manualBarcode" 
                   type="text" 
                   placeholder="Enter barcode manually" 
                   class="flex-grow pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-l-md">
            <button @click="submitManualBarcode" 
                    class="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-r-md transition-colors duration-150">
              Submit
            </button>
          </div>
        </div>

        <!-- Scanned Code Section -->
        <div class="mb-6">
          <h2 class="text-lg font-semibold mb-2">Scanned Code</h2>
          <p v-if="scannedCode" class="text-gray-700">Last scanned code: <span class="font-semibold">{{ scannedCode }}</span></p>
          <p v-else class="text-gray-500">No code scanned yet.</p>
        </div>

        <p v-if="error" class="text-red-500 mt-4">{{ error }}</p>
      </div>
    </div>
  </div>
</template>


<script>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import Quagga from 'quagga';
import axios from 'axios';
import Sidebar from '@/components/UserType/Sidebar.vue';

export default {
  name: 'BarcodeDetailScanner',
  components: { Sidebar },
  setup() {
    const router = useRouter();
    const video = ref(null);
    const canvas = ref(null);
    const isScanning = ref(false);
    const scannedCode = ref(null);
    const manualBarcode = ref(''); // Manual barcode input
    const error = ref(null);

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
        if (video.value.srcObject) {
          video.value.srcObject.getTracks().forEach(track => track.stop());
        }
      }
    };

    const onBarcodeDetected = async (result) => {
      scannedCode.value = result.codeResult.code;
      console.log("Barcode detected:", scannedCode.value);
      await getUserByBarcode(scannedCode.value);
    };

    const getUserByBarcode = async (barcode) => {
      try {
        const response = await axios.get('/api/user-barcode/', {
          params: { barcode: barcode }
        });
        router.push({ 
          name: 'LandingPage', 
          params: { barcode: barcode }
        });
      } catch (err) {
        if (err.response && err.response.status === 404) {
          error.value = 'User not found. Please try again.';
        } else {
          error.value = 'An error occurred. Please try again.';
        }
        setTimeout(() => {
          error.value = null;
        }, 3000);
      }
    };

    const submitManualBarcode = async () => {
      if (manualBarcode.value.trim() !== '') {
        await getUserByBarcode(manualBarcode.value.trim());
        manualBarcode.value = ''; // Clear input after submission
      }
    };

    const drawOverlay = () => {
      const ctx = canvas.value.getContext('2d');
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(170, 130, 300, 200);
    };

    const clearOverlay = () => {
      const ctx = canvas.value.getContext('2d');
      ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
    };

    onBeforeUnmount(() => {
      stopScanning();
    });

    return {
      video,
      canvas,
      isScanning,
      scannedCode,
      manualBarcode,
      error,
      toggleScanning,
      submitManualBarcode
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