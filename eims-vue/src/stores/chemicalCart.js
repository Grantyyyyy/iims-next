import { defineStore } from 'pinia';

export const useChemicalCart = defineStore('chemicalCart', { // Changed ID from 'cart' to 'chemicalCart'
  state: () => ({
    chemicals: []
  }),

  getters: {
    cartChemicals: (state) => state.chemicals,
    totalChemicals: (state) => state.chemicals.length
  },

  actions: {
    addChemical(chemical) {
      // Check if already in cart
      const existingChemical = this.chemicals.find(c => c.id === chemical.id);
      if (!existingChemical) {
        this.chemicals.push({
          id: chemical.id,
          name: chemical.chemical.name,
          volume: 1,
          maxVolume: chemical.volume,
          requestedVolume: 1,
          unit: chemical.chemical.unit,
          requestUnit: chemical.chemical.unit, // Add the request unit with default value
          displayUnit: chemical.chemical.unit 

        });
      }
    },

    updateRequestedVolume(chemicalId, volume, requestUnit) {
      const chemical = this.chemicals.find(c => c.id === chemicalId);
      if (chemical) {

        chemical.requestedVolume = parseFloat(volume);
        if (requestUnit) {
          chemical.requestUnit = requestUnit;
          chemical.displayUnit = requestUnit;
        }
      }
    },

    removeChemical(chemicalId) {
      this.chemicals = this.chemicals.filter(c => c.id !== chemicalId);
    },

    // Add a clear method
    clearChemicals() {
      this.chemicals = [];
    },

    // getRequestPayload() {
    //   return this.chemicals.map(chemical => {
    //     const requested = parseFloat(chemical.requestedVolume);
    
    //     // Ensure requestedVolume is a valid number
    //     if (isNaN(requested) || requested <= 0) {
    //       return null; // Or handle invalid input however you prefer
    //     }
    
    //     // Convert ml to liters only if unit mismatch exists
    //     const isMlToL = chemical.requestUnit === 'ml' && chemical.unit === 'l';
    //     const isGallonsToL = chemical.requestUnit === 'gallons' && chemical.unit === 'l';
    //     const convertedQuantity = isMlToL ? requested / 1000 : isGallonsToL ? requested * 3.78541 : requested;
    
    //     return {
    //       chemical_stock_id: chemical.id,
    //       quantity_requested: parseFloat(convertedQuantity.toFixed(3)), // safer float
    //       unit: chemical.unit,                     // base unit (e.g., "l")
    //       original_quantity: requested,
    //       original_unit: chemical.requestUnit
    //     };
    //   }).filter(item => item !== null); // Filter out invalid entries
    // }
    
    
    getRequestPayload() {
      return this.chemicals.map(chemical => {
        const requested = parseFloat(chemical.requestedVolume);
    
        // Ensure requestedVolume is a valid number
        if (isNaN(requested) || requested <= 0) {
          return null;
        }
    
        // Get conversion factors
        const toBaseFactors = {
          // Volume (to ml)
          'ml': 1,
          'l': 1000,
          'gal': 3785.41,
          // Weight (to g)
          'g': 1,
          'kg': 1000
        };
    
        // Convert from display unit to the chemical's unit
        let convertedQuantity;
        
        // If units are the same, no conversion needed
        if (chemical.requestUnit === chemical.unit) {
          convertedQuantity = requested;
        }
        // Handle specific conversions
        else if (chemical.requestUnit === 'l' && chemical.unit === 'gal') {
          convertedQuantity = requested * 0.264172;
        }
        else if (chemical.requestUnit === 'gal' && chemical.unit === 'l') {
          convertedQuantity = requested * 3.78541;
        }
        else {
          // For other cases, use the base unit approach
          const requestUnitFactor = toBaseFactors[chemical.requestUnit];
          const baseUnitFactor = toBaseFactors[chemical.unit];
          convertedQuantity = (requested * requestUnitFactor) / baseUnitFactor;
        }
    
        // Send the quantity as a string to avoid float/decimal type mismatch
        return {
          chemical_stock_id: chemical.id,
          quantity_requested: convertedQuantity.toFixed(4), // Send as string with fixed precision
          unit: chemical.unit,
          original_quantity: requested.toString(), // Also convert this to string
          original_unit: chemical.requestUnit
        };
      }).filter(item => item !== null);
    }
    
  }
});