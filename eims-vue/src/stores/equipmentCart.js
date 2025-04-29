import { defineStore } from 'pinia'

export const useEquipmentCart = defineStore('equipmentCart', {
  state: () => ({
    equipments: []
  }),
  actions: {
    addToCart(equipment) {
      if (!this.equipments.some(i => i.id === equipment.id)) {
        this.equipments.push(equipment)
      }
    },
    removeFromCart(equipmentId) {
      this.equipments = this.equipments.filter(equipment => equipment.id !== equipmentId)
    },
    clearCart() {
      this.equipments = []
    },

    isInCart(equipmentId) {
      return this.equipments.some(equipment => equipment.id === equipmentId) 
    }
  },
  getters: {
    cartEquipmentCount: (state) => state.equipments.length,
    cartEquipments: (state) => state.equipments
  }
})
