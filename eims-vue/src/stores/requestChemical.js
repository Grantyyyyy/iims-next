import { defineStore } from 'pinia';

export const useRequestChemicalCart = defineStore('chemicalRequestCart', {
  state: () => ({
    chemicals: []
  }),

  getters: {
    cartChemicals() {
      return this.chemicals.map(chemical => ({
        ...chemical,
        volume: chemical.requestedVolume || 1,  // Default to 1 if not set
        name: chemical.chemical_stock?.chemical_batch?.chemical_details?.name,
        unit: chemical.chemical_stock?.chemical_batch?.chemical_details?.unit,
        maxVolume: parseFloat(chemical.remaining_volume)
      }));
    },
    totalChemicals: (state) => state.chemicals.length
  },

  actions: {  
    addChemical(assign) {
      // Check if already in cart
      const existingChemical = this.chemicals.find(c => c.id === assign.id);
      if (!existingChemical) {
        this.chemicals.push({
          ...assign,
          requestedVolume: 1,  
          maxVolume: parseFloat(assign.remaining_volume)
        });
      }
    },

    updateRequestedVolume(chemicalId, volume) {
      const chemical = this.chemicals.find(c => c.id === chemicalId);
      if (chemical) {
        if (volume > chemical.maxVolume) {
          chemical.requestedVolume = chemical.maxVolume;
        } else if (volume < 1) {
          chemical.requestedVolume = 1;
        } else {
          chemical.requestedVolume = parseFloat(volume);
        }
      }
    },

    removeChemical(chemicalId) {
      this.chemicals = this.chemicals.filter(c => c.id !== chemicalId);
    },

    clearChemicals() {
      this.chemicals = [];
    }
  }
});