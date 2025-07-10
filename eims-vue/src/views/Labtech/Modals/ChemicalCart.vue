<template>
    <div class="fixed bottom-0 right-0 z-50 p-4">
      <!-- Toast Notification -->
      <div v-if="showToast" role="alert" class="fixed bottom-24 right-4 bg-green-500 text-white p-3 rounded-s shadow-md transition-opacity duration-500">
            Volume updated!
      </div>
  
      <!-- Collapsed Cart Button -->
      <button v-if="!isExpanded" @click="toggleCart" class="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg flex items-center space-x-2">
        <span class="font-bold">{{ cartStore.totalChemicals }} Chemicals</span>
        <i class="fa-solid fa-chevron-up"></i>
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
              <i class="fa-solid fa-chevron-down"></i>
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
                    <i class="fa-solid fa-trash"></i>
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
                      <select 
                        v-model="chemical.requestUnit" 
                        @change="handleUnitChange(chemical)"
                        class="px-2 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option v-if="volumeUnits.includes(chemical.unit)" value="ml">ml</option>
                        <option v-if="volumeUnits.includes(chemical.unit)" value="l">l</option>
                        <option v-if="volumeUnits.includes(chemical.unit)" value="gal">gal</option>
                        <option v-if="weightUnits.includes(chemical.unit)" value="g">g</option>
                        <option v-if="weightUnits.includes(chemical.unit)" value="kg">kg</option>
                      </select>
                    </div>
                  </div> 
                  <div class="text-right">
                    <div class="text-sm text-gray-500">Available</div>
                    <div class="font-medium">{{ formatVolume(chemical.maxVolume, chemical.unit) }}</div>
                  </div>
                </div>
              </li>
            </ul>
  
            <!-- Empty State -->
            <div v-if="cartStore.totalChemicals === 0" class="p-8 text-center text-gray-500">
              <i class="fa-solid fa-box-open text-6xl text-gray-400 mx-auto"></i>
              <p class="font-medium">Your cart is empty</p>
              <p class="text-sm mt-1">Add some chemicals to get started</p>
            </div>
          </div>
  
          <!-- Finalize Button -->
          <div v-if="cartStore.totalChemicals > 0" class="p-4 border-t bg-gray-50">
            <button @click="$emit('open-borrow')" 
                    class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2">
              <span>Finalizing Request</span>
              <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </transition>
    </div>
  </template>
  
  <script>
  import { defineComponent, ref } from 'vue';
  import { useChemicalCart } from '@/stores/chemicalCart';
  
  export default defineComponent({
    name: 'ChemicalCart',
    props: {
        stocks:{
            type: Object,
            required: true
        }
    },
    
    setup(props) {
      const cartStore = useChemicalCart();
      const stocks = props.stocks;
      const isExpanded = ref(false);
      const showToast = ref(false);

      const volumeUnits = ['ml', 'l', 'gal'];
      const weightUnits = ['g', 'kg'];

      const toBaseUnit = {
        // Volume (to ml)
        'ml': 1,
        'l': 1000,
        'gal': 3785.41,
        // Weight (to g)
        'g': 1,
        'kg': 1000
      };

      const handleUnitChange = (chemical) => {
        // Convert the current value to the new unit
        const oldValue = chemical.volume;
        const oldUnit = chemical.displayUnit || chemical.unit;
        const newUnit = chemical.requestUnit;
        
        // Convert to base unit first
        const baseValue = oldValue * toBaseUnit[oldUnit];
        
        // Convert from base unit to new unit
        const newValue = baseValue / toBaseUnit[newUnit];
        
        // Update the displayed volume with converted value
        chemical.volume = parseFloat(newValue.toFixed(2));
        
        // Store the display unit
        chemical.displayUnit = newUnit;
        
        // Show toast message
        showToast.value = true;
        setTimeout(() => {
          showToast.value = false;
        }, 2000);
      };

      const formatVolume = (maxVolume, unit) => {
        const v = parseFloat(maxVolume);
        if (isNaN(v)) return maxVolume;

        if (v % 1 === 0) `0 ${unit}`;

        return `${parseFloat(v.toFixed(3))} `;

      }

      const getMaxVolume = (chemical) => {
        const stockMaxVolume = chemical.maxVolume;
        const stockUnit = chemical.unit;
        const displayUnit = chemical.displayUnit || stockUnit;
        
        // If same unit, no conversion needed
        if (displayUnit === stockUnit) {
          return stockMaxVolume;
        }
        
        // Convert stock max volume to display unit
        const baseValue = stockMaxVolume * toBaseUnit[stockUnit];
        const convertedMax = baseValue / toBaseUnit[displayUnit];
        
        return parseFloat(convertedMax.toFixed(2));
      };
    
      const toggleCart = () => {
        isExpanded.value = !isExpanded.value;
      };
  
      const removeFromCart = (chemicalId) => {
        cartStore.removeChemical(chemicalId);
      };
  
      const updateVolume = (chemical) => {
        const displayUnit = chemical.displayUnit || chemical.unit;
        const maxInDisplayUnit = getMaxVolume(chemical); // Calculate the max volume in display unit

        if (chemical.volume < 1) {
          chemical.volume = 1;
        } else if (chemical.volume > maxInDisplayUnit) { // Use the calculated value instead of non-existent property
          chemical.volume = maxInDisplayUnit;
        }

        const volumeInBaseUnit = chemical.volume * toBaseUnit[displayUnit];
        const volumeInChemicalUnit = volumeInBaseUnit / toBaseUnit[chemical.unit];

        cartStore.updateRequestedVolume(chemical.id, chemical.volume, displayUnit);
        
        showToast.value = true;
        setTimeout(() => {
          showToast.value = false;
        }, 2000);
      };
  
      return {
        stocks,
        cartStore,
        isExpanded,
        showToast,
        toggleCart,
        removeFromCart,
        updateVolume,
        handleUnitChange,
        getMaxVolume,
        volumeUnits,
        weightUnits,
        toBaseUnit,
        formatVolume
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