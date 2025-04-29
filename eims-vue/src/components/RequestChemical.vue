<template>
    <div v-if="requestChemical" class="request-chemical-details">
      <h2 class="text-2xl font-bold mb-4">Request Chemical Details</h2>
      <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2">Staff:</label>
        <p>{{ requestChemical.staff.username }}</p>
      </div>
      <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2">Chemical:</label>
        <p>{{ requestChemical.chemical.name }}</p>
      </div>
      <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2">Mixture:</label>
        <p>{{ requestChemical.mixture.name }}</p>
        <p>Components: {{ requestChemical.mixture.chemical_1.name }} ({{ requestChemical.mixture.ratio_1 }}) + {{ requestChemical.mixture.chemical_2.name }} ({{ requestChemical.mixture.ratio_2 }})</p>
      </div>
      <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2">Quantity:</label>
        <p>{{ requestChemical.quantity }}</p>
      </div>
      <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2">Status:</label>
        <p>{{ requestChemical.status }}</p>
      </div>
      <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2">Reason:</label>
        <p>{{ requestChemical.reason }}</p>
      </div>
      <button @click="$emit('back')" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">Back</button>
    </div>
    <div v-else>
      <p>Loading...</p>
    </div>
  </template>
  
  <script>
  import axios from 'axios'
  
  export default {
    name: 'RequestChemicals',
    props: {
      requestId: {
        type: Number,
        required: true
      }
    },
    data() {
      return {
        requestChemical: null
      }
    },
    created() {
      this.fetchRequestChemical()
    },
    methods: {
      async fetchRequestChemical() {
        try {
          const response = await axios.get(`/api/request/${this.requestId}/`)
          this.requestChemical = response.data
        } catch (error) {
          console.error('Error fetching request chemical details:', error)
        }
      }
    }
  }
  </script>
  
  <style scoped>
  .request-chemical-details {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
  </style>
  