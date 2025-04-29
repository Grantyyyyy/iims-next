import { defineStore } from 'pinia';

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: []
  }),

  actions: {
    addToCart(itemInstance) {
      const existingItem = this.items.find(item => item.id === itemInstance.id);
      
      if (existingItem) {
        return; // Item already exists, no need to add again
      }

      const newItem = {
        id: itemInstance.id,
        name: itemInstance.item.name,
        item_type: itemInstance.item.item_type,
        available_quantity: itemInstance.item_batch?.quantity || 1,
        requested_quantity: itemInstance.item.item_type === 'Consumables' ? 0 : 1,
        max_quantity: itemInstance.item_batch?.quantity || 1,
        original_item: itemInstance // Keep reference to original item
      };

      this.items.push(newItem);
    },

    updateRequestedVolume(chemicalId, volume) {
      const chemical = this.chemicals.find(c => c.id === chemicalId);
      if (chemical) {
        if (volume > chemical.maxVolume) {
          throw new Error(`Maximum available volume is ${chemical.maxVolume} ${chemical.unit}`);
        }
        chemical.requestedVolume = parseFloat(volume);
      }
    },
    
    removeFromCart(itemId) {
      this.items = this.items.filter(item => item.id !== itemId);
    },
    
    clearCart() {
      this.items = [];
    },
    
    isInCart(itemId) {
      return this.items.some(item => item.id === itemId);
    }
  },

  getters: {
    cartItemCount: (state) => state.items.length,
    
    cartItems: (state) => state.items,
    
    consumableItems: (state) => {
      return state.items.filter(item => item.item_type === 'Consumables');
    },
    
    nonConsumableItems: (state) => {
      return state.items.filter(item => item.item_type !== 'Consumables');
    },
    
    totalQuantity: (state) => {
      return state.items.reduce((total, item) => {
        return total + (item.requested_quantity || 1);
      }, 0);
    }
  }
});