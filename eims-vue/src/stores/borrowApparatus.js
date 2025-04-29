import { defineStore } from 'pinia';

export const useApparatusCart = defineStore('borrowApparatusCart', {
  state: () => ({
    apparatuses: []
  }),

  actions: {
    addToCart(apparatus) {
      const existingItem = this.apparatuses.find(item => item.id === apparatus.id);
      if (existingItem) return;

      this.apparatuses.push({
        id: apparatus.id,
        inventory_number: apparatus.inventory_number,
        name: apparatus.apparatus.name,
        apparatus_type: apparatus.apparatus.apparatus_type,
        available_quantity: apparatus.quantity,
        requested_quantity: apparatus.apparatus.apparatus_type === 'Consumables' ? 1 : 1,
        description: apparatus.apparatus.description,
        unit_cost: apparatus.unit_cost,
        original_item: apparatus
      });
    },

    removeFromCart(apparatusId) {
      this.apparatuses = this.apparatuses.filter(item => item.id !== apparatusId);
    },

    clearCart() {
      this.apparatuses = [];
    },

    isInCart(apparatusId) {
      return this.apparatuses.some(item => item.id === apparatusId);
    },

    updateQuantity(apparatusId, quantity) {
      const apparatus = this.apparatuses.find(item => item.id === apparatusId);
      if (!apparatus) return;

      const parsedQuantity = parseInt(quantity);
      if (parsedQuantity > apparatus.available_quantity) {
        throw new Error(`Maximum available quantity is ${apparatus.available_quantity}`);
      }
      apparatus.requested_quantity = parsedQuantity;
    }
  },

  getters: {
    cartApparatusCount: state => state.apparatuses.length,
    cartApparatus: state => state.apparatuses,
    consumableItems: state => state.apparatuses.filter(item => item.apparatus_type === 'Consumables'),
    nonConsumableItems: state => state.apparatuses.filter(item => item.apparatus_type !== 'Consumables'),
    totalQuantity: state => state.apparatuses.reduce((total, item) => total + (item.requested_quantity || 1), 0)
  }
});