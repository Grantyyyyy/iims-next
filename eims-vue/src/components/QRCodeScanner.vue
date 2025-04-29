<template>
  <div class="scanner-container">
    <div class="video-container">
      <video ref="video" id="scanner" class="video" playsinline></video>
    </div>
    <button @click="toggleScanning" :disabled="!isCameraReady">
      {{ isScanning ? 'Stop' : 'Start' }} Scanning
    </button>
    <p v-if="error" class="error">{{ error }}</p>

    <div class="scanned-items">
      <h2>Scanned Items</h2>
      <ul>
        <li v-for="item in scannedItems" :key="item.id">
          {{ item.name }} - {{ item.price }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { Html5Qrcode } from 'html5-qrcode';

export default {
  name: 'QRCodeScannerPOS',
  setup() {
    const isScanning = ref(false);
    const isCameraReady = ref(false);
    const error = ref(null);
    const scannedItems = ref([]);
    const video = ref(null);
    let html5QrCode = null;

    const itemsDB = {
      '123456': { id: 1, name: 'Item A', price: '$10' },
      '789012': { id: 2, name: 'Item B', price: '$20' },
      '345678': { id: 3, name: 'Item C', price: '$30' }
    };

    const fetchItemDetails = (qrCode) => {
      return itemsDB[qrCode] || null;
    };

    const handleQRCodeScanned = (decodedText) => {
      const item = fetchItemDetails(decodedText);
      if (item) {
        scannedItems.value.push(item);
      } else {
        error.value = 'Item not found for the scanned QR code';
      }
    };

    const setupCamera = async () => {
      if (video.value) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
          video.value.srcObject = stream;
          video.value.play();
          isCameraReady.value = true;
        } catch (err) {
          error.value = `Error accessing camera: ${err.message}`;
        }
      } else {
        error.value = 'Video element is not available.';
      }
    };

    const toggleScanning = async () => {
      if (isScanning.value) {
        stopScanning();
      } else {
        await startScanning();
      }
    };

    const startScanning = async () => {
      if (!isCameraReady.value) {
        error.value = 'Camera is not ready yet. Please wait.';
        return;
      }

      isScanning.value = true;
      error.value = null;

      const videoElement = video.value;
      const width = videoElement ? videoElement.videoWidth : 0;
      const height = videoElement ? videoElement.videoHeight : 0;

      if (width === 0 || height === 0) {
        error.value = 'Video dimensions are invalid. Please check your camera.';
        isScanning.value = false;
        return;
      }

      html5QrCode = new Html5Qrcode('scanner');
      try {
        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: Math.min(width, height) * 0.7, height: Math.min(width, height) * 0.7 }
          },
          (decodedText) => handleQRCodeScanned(decodedText),
          (errorMessage) => console.warn('QR Code scanning in progress:', errorMessage)
        );
      } catch (err) {
        console.error('Failed to start scanner:', err);
        error.value = `Failed to start scanner: ${err.message || 'Unknown error'} ${err.name || ''}`;
        isScanning.value = false;
      }
    };

    const stopScanning = () => {
      if (html5QrCode && isScanning.value) {
        html5QrCode.stop().then(() => {
          isScanning.value = false;
          error.value = null;
        });
      }
    };

    onMounted(() => {
      setupCamera();
    });

    onUnmounted(() => {
      stopScanning();
      if (video.value && video.value.srcObject) {
        video.value.srcObject.getTracks().forEach(track => track.stop());
      }
    });

    return {
      isScanning,
      isCameraReady,
      error,
      scannedItems,
      toggleScanning
    };
  }
};
</script>

<style scoped>
.scanner-container {
  position: relative;
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
}

.video-container {
  position: relative;
  width: 100%;
  padding-top: 75%;
}

.video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

button {
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 16px;
}

.error {
  color: red;
  margin-top: 10px;
}

.scanned-items {
  margin-top: 20px;
}

.scanned-items ul {
  list-style-type: none;
  padding: 0;
}

.scanned-items li {
  background: #f0f0f0;
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 4px;
}
</style>
