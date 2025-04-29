import { defineStore } from 'pinia'

export const useApparatusCartStore = defineStore('apparatusCart', {
  state: () => ({
    apparatus: []
  }),
  actions: {
    addToCart(apparatus) {
      if (!this.apparatus.some(i => i.id === apparatus.id)) {
        this.apparatus.push(apparatus)
      }
    },
    removeFromCart(apparatusId) {
      this.apparatus = this.apparatus.filter(apparatus => apparatus.id !== apparatusId)
    },
    clearCart() {
      this.apparatus = []
    },

    isInCart(apparatusId) {
      return this.apparatus.some(apparatus => apparatus.id === apparatusId)
    }
  },
  getters: {
    cartApparatusCount: (state) => state.apparatus.length,
    cartApparatus: (state) => state.apparatus
  }
})
