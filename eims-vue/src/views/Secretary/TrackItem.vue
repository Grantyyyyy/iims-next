
  <template>
    <div>
      <h1>Track Item</h1>
      <input v-model="qrCodeValue" placeholder="Enter QR code value">
      <button @click="trackItem">Track</button>
      <div v-if="trackedItem">
        <h2>{{ trackedItem.item_name }} ({{ trackedItem.serial_number }})</h2>
        <p>Status: {{ trackedItem.is_borrowed ? 'Borrowed' : 'Available' }}</p>
        <p v-if="trackedItem.is_borrowed">Borrowed at: {{ trackedItem.borrowed_at }}</p>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    name: 'TrackItem',
    data() {
      return {
        qrCodeValue: '',
        trackedItem: null
      }
    },
    methods: {
      async trackItem() {
        try {
          const response = await axios.post('/api/item-instances/track/', { qr_code_value: this.qrCodeValue });
          this.trackedItem = response.data;
        } catch (error) {
          console.error('Error tracking item:', error);
          this.trackedItem = null;
        }
      }
    }
  }
  </script>