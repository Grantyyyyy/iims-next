// CameraBarcodeScanner.vue
<template>
  <div class="scanner-container">
    <!-- Error Messages -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- Camera Feed -->
    <div class="video-container">
      <video 
        ref="video"
        class="camera-feed"
        :class="{ hidden: !isCameraActive }"
      ></video>
      <canvas ref="canvas" class="hidden"></canvas>
    </div>

    <!-- Controls -->
    <div class="controls">
      <button 
        @click="toggleCamera" 
        class="control-button"
      >
        {{ isCameraActive ? 'Stop Camera' : 'Start Camera' }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      Searching for item...
    </div>

    <!-- Last Scanned Code -->
    <div v-if="lastScannedCode" class="last-scanned">
      Last scanned: {{ lastScannedCode }}
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import Quagga from '@ericblade/quagga2';  // Make sure to install: npm install quagga

export default {
  name: 'DetailScanner',

  data() {
    return {
      isCameraActive: false,
      loading: false,
      error: null,
      lastScannedCode: null
    }
  },
  methods: {
    async toggleCamera() {
      if (this.isCameraActive) {
        this.stopCamera();
      } else {
        await this.startCamera();
      }
    },

    async startCamera() {
      try {
        this.error = null;
        
        await Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: this.$refs.video,
            constraints: {
              facingMode: "environment" // Use back camera on mobile devices
            },
          },
          decoder: {
            readers: [
              "code_128_reader",
              "ean_reader",
              "code_39_reader", // Add this for alphanumeric codes
              "upc_reader"
            ],
            debug: {
              drawBoundingBox: true,
              showPattern: true
            }
          }
        });

        Quagga.start();
        this.isCameraActive = true;

        Quagga.onDetected(this.onBarcodeDetected);
      } catch (error) {
        this.error = 'Failed to start camera. Please check permissions.';
        console.error(error);
      }
    },

    stopCamera() {
      if (Quagga) {
        Quagga.stop();
      }
      this.isCameraActive = false;
    },

    async onBarcodeDetected(result) {
      const code = result.codeResult.code;
      if (code && code !== this.lastScannedCode) {
        this.lastScannedCode = code;
        await this.searchItem(code);
      }
    },

    async searchItem(code) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.get(`/api/item-detail/${code}/`);
        
        if (response.data.exists) {
          // Stop camera before navigation
          this.stopCamera();
          
          // Route to item detail page
          this.$router.push({
            name: 'ItemDetail',
            params: { inventoryNumber: code }
          });
        } else {
          this.error = 'Item not found';
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Error searching for item';
      } finally {
        this.loading = false;
      }
    }
  },

  beforeDestroy() {
    this.stopCamera();
  }
}
</script>

<style scoped>
.scanner-container {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.video-container {
  position: relative;
  width: 100%;
  height: 300px;
  margin-bottom: 20px;
  border: 2px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.camera-feed {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hidden {
  display: none;
}

.controls {
  margin-bottom: 20px;
  text-align: center;
}

.control-button {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.control-button:hover {
  background-color: #45a049;
}

.error-message {
  color: red;
  margin-bottom: 10px;
  text-align: center;
}

.loading {
  color: #666;
  text-align: center;
  margin: 10px 0;
}

.last-scanned {
  text-align: center;
  color: #666;
  margin-top: 10px;
}
</style>