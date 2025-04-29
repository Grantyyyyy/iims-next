import { defineStore } from 'pinia'

export const useItemCartStore = defineStore('cart', {
  state: () => ({
    items: []
  }),
  actions: {
    addToCart(item) {
      if (!this.items.some(i => i.id === item.id)) {
        this.items.push(item)
      }
    },
    removeFromCart(itemId) {
      this.items = this.items.filter(item => item.id !== itemId)
    },
    clearCart() {
      this.items = []
    },

    isInCart(itemId) {
      return this.items.some(item => item.id === itemId)
    }
  },
  getters: {
    cartItemCount: (state) => state.items.length,
    cartItems: (state) => state.items
  }
})
