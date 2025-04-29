<template>
    <div class="fixed bottom-0 right-0 z-50 p-4">
      <!-- Toast Notification -->
      <div v-if="showToast" role="alert" class="fixed bottom-24 right-4 bg-green-500 text-white p-3 rounded-s shadow-md transition-opacity duration-500">
            Volume updated!
      </div>
  
      <!-- Collapsed Cart Button -->
      <button v-if="!isExpanded" @click="toggleCart" class="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg flex items-center space-x-2">
        <span class="font-bold">{{ cartStore.totalChemicals }} Chemicals</span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>
  
      <!-- Expanded Cart -->
      <transition name="slide-fade">
        <div v-if="isExpanded" class="bg-white rounded-lg shadow-lg w-96 lg:w-120 flex flex-col" style="max-height: calc(100vh - 2rem);">
          <!-- Cart Header -->
          <div class="p-4 bg-blue-500 text-white flex justify-between items-center rounded-t-lg">
            <div class="flex items-center space-x-2">
              <h3 class="font-bold text-lg">Chemical Cart</h3>
              <span class="bg-blue-400 px-2 py-1 rounded-full text-sm">
                {{ cartStore.totalChemicals }} items
              </span>
            </div>
            <button @click="toggleCart" class="hover:bg-blue-600 rounded-full p-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 15l6-6 6 6" />
              </svg>
            </button>
          </div>
  
          <!-- Cart Content -->
          <div class="overflow-y-auto flex-grow">
            <ul class="p-4 space-y-3">
              <li v-for="chemical in cartStore.cartChemicals" :key="chemical.id" 
                  class="bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors duration-200">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <span class="font-medium text-lg">{{ chemical.name }}</span>
                    <p class="text-sm text-gray-600 mt-1">ID: {{ chemical.id }}</p>
                  </div>
                  <button @click="removeFromCart(chemical.id)" 
                          class="text-gray-400 hover:text-red-600 transition-colors duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
  
                <!-- Volume Input -->
                <div class="flex items-center space-x-3">
                  <div class="flex-1">
                    <label class="text-sm text-gray-600 mb-1 block">Volume</label>
                    <div class="flex items-center space-x-2">
                      <input 
                        type="number" 
                        v-model.number="chemical.volume"
                        @change="updateVolume(chemical)"
                        class="w-24 px-3 py-2 border rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        :min="1"
                        :max="chemical.maxVolume"
                      />
                      <span class="text-sm text-gray-600">{{ chemical.unit }}</span>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm text-gray-500">Available</div>
                    <div class="font-medium">{{ chemical.maxVolume }} {{ chemical.unit }}</div>
                  </div>
                </div>
              </li>
            </ul>
  
            <!-- Empty State -->
            <div v-if="cartStore.totalChemicals === 0" class="p-8 text-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p class="font-medium">Your cart is empty</p>
              <p class="text-sm mt-1">Add some chemicals to get started</p>
            </div>
          </div>
  
          <!-- Finalize Button -->
          <div v-if="cartStore.totalChemicals > 0" class="p-4 border-t bg-gray-50">
            <button @click="$emit('open-borrow')" 
                    class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2">
              <span>Finalize Borrowing</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </transition>
    </div>
  </template>
  
  <script>
  import { defineComponent, ref } from 'vue';
  import { useRequestChemicalCart } from '@/stores/requestChemical.js';
  
  export default defineComponent({
    name: 'RequestChemical',
    props: {
        assigned:{
            type: Object,
            required: true
        }
    },
    
    setup(props) {
      const cartStore = useRequestChemicalCart();
      const assigned = props.assigned;
      const isExpanded = ref(false);
      const showToast = ref(false);
  
      const toggleCart = () => {
        isExpanded.value = !isExpanded.value;
      };
  
      const removeFromCart = (chemicalId) => {
        cartStore.removeChemical(chemicalId);
      };
  
      const updateVolume = (chemical) => {
        if (chemical.volume < 1) {
          chemical.volume = 1;
        } else if (chemical.volume > chemical.maxVolume) {
          chemical.volume = chemical.maxVolume;
        }
  
        cartStore.updateRequestedVolume(chemical.id, chemical.volume);
        
        showToast.value = true;
        setTimeout(() => {
          showToast.value = false;
        }, 2000);
      };
  
      return {
        assigned,
        cartStore,
        isExpanded,
        showToast,
        toggleCart,
        removeFromCart,
        updateVolume
      };
    }
  });
  </script>
  
  <style scoped>
  .slide-fade-enter-active,
  .slide-fade-leave-active {
    transition: all 0.3s ease;
  }
  
  .slide-fade-enter-from,
  .slide-fade-leave-to {
    transform: translateX(20px);
    opacity: 0;
  }
  </style>