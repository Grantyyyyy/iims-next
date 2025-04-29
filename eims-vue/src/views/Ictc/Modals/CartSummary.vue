<!-- CartSummary.vue -->
<template>
  <div class="fixed bottom-0 right-0 z-50 p-4">
    <!-- Toast Notification -->
    <div 
      v-if="showToast" 
      class="fixed bottom-24 right-4 bg-green-500 text-white p-3 rounded-lg shadow-md transition-opacity duration-500"
    >
      Item added to cart!
    </div>

    <!-- Collapsed Cart -->
    <button 
      v-if="!isExpanded"
      @click="toggleCart"
      class="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg flex items-center space-x-2 transition-transform duration-300"
    >
      <span class="font-bold">{{ cartStore.cartItemCount }} Items</span>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" />
      </svg>
    </button>

    <!-- Expanded Cart -->
    <transition name="slide-fade">
      <div 
        v-if="isExpanded" 
        class="bg-white rounded-lg shadow-lg w-80 flex flex-col transition-all duration-300"
        style="max-height: calc(100vh - 2rem);"
      >
        <!-- Cart Header -->
        <div class="p-4 bg-blue-500 text-white flex justify-between items-center rounded-t-lg sticky top-0">
          <h3 class="font-bold">Cart Summary</h3>
          <div class="flex items-center space-x-2">
            <button 
              v-if="!isItemPage"
              @click="goToItems" 
              class="hover:bg-blue-600 rounded-full p-1"
              title="Go to Items"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button @click="toggleCart" class="hover:bg-blue-600 rounded-full p-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 15l6-6 6 6" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Cart Content (Scrollable) -->
        <div class="overflow-y-auto flex-grow">
          <ul class="p-4 space-y-3">
            <li 
              v-for="item in cartStore.cartItems" 
              :key="item.id" 
              class="flex flex-col bg-gray-50 rounded-lg p-3"
            >
              <div class="flex justify-between items-start">
                <div class="flex flex-col">
                  <span class="font-medium">{{ item.item.name }}</span>
                  <span class="text-sm text-gray-600">Item No: {{ item.serial_number }}</span>
                </div>
                <button 
                  @click="removeFromCart(item.id)" 
                  class="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </li>
          </ul>
        </div>

        <!-- Empty State -->
        <div 
          v-if="cartStore.cartItemCount === 0" 
          class="p-8 text-center text-gray-500"
        >
          <p>Your cart is empty</p>
          <button
            v-if="!isItemPage"
            @click="goToItems"
            class="mt-2 text-blue-500 hover:text-blue-700 font-medium"
          >
            Browse Items
          </button>
        </div>

        <!-- Undo Button -->
        <div 
          v-if="recentlyRemoved" 
          class="p-4 bg-yellow-100 text-yellow-800 flex items-center justify-between border-t border-yellow-200"
        >
          <span>Item removed</span>
          <button 
            @click="undoRemove" 
            class="text-blue-500 hover:text-blue-700 font-medium"
          >
            Undo
          </button>
        </div>

        <!-- Finalize Button -->
        <div 
          v-if="cartStore.cartItemCount > 0" 
          class="p-4 border-t bg-white"
        >
          <button 
            @click="$emit('open-borrow')" 
            class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Finalize Borrowing
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCartStore } from '@/stores/cartStore';

export default defineComponent({
  name: 'CartSummary',
  props: {
    redirectUrl: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const router = useRouter();
    const route = useRoute();
    const cartStore = useCartStore();
    const isExpanded = ref(false);
    const showToast = ref(false);
    const recentlyRemoved = ref(null);

    const isItemPage = computed(() => {
      return route.name === 'items' || route.name === 'item-details';
    });

    const toggleCart = () => {
      isExpanded.value = !isExpanded.value;
    };

    const removeFromCart = (instanceId) => {
      recentlyRemoved.value = cartStore.cartItems.find(item => item.id === instanceId);
      cartStore.removeFromCart(instanceId);
    };

    const undoRemove = () => {
      if (recentlyRemoved.value) {
        cartStore.addToCart(recentlyRemoved.value);
        recentlyRemoved.value = null;
      }
    };

    const goToItems = () => {
      router.push('/items');
    };

    const showAddToCartToast = () => {
      showToast.value = true;
      setTimeout(() => {
        showToast.value = false;
      }, 2000);
    };

    return {
      cartStore,
      isExpanded,
      showToast,
      toggleCart,
      removeFromCart,
      undoRemove,
      showAddToCartToast,
      recentlyRemoved,
      isItemPage,
      goToItems
    };
  },
});
</script>
  
  <style scoped>
  .overflow-y-auto::-webkit-scrollbar {
    width: 6px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .overflow-y-auto::-webkit-scrollbar-thumb {
    background-color: rgba(100, 100, 100, 0.3);
    border-radius: 6px;
  }
  
  .overflow-y-auto:hover::-webkit-scrollbar-thumb {
    background-color: rgba(100, 100, 100, 0.6);
  }
  
  .slide-fade-enter-active, .slide-fade-leave-active {
    transition: all 0.3s ease;
  }
  
  .slide-fade-enter-from, .slide-fade-leave-to {
    transform: translateY(20px);
    opacity: 0;
  }
  </style>