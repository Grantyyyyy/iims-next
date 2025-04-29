<template>
	<div class="flex h-screen bg-gradient-to-b from-[#F5F4F1] to-[#D4EAF7]">
	      <Sidebar />
	      <div class="flex-1 overflow-x-auto p-8 ml-64 relative">
	        <div class="max-w-full bg-white/80 backdrop-blur-md shadow-lg rounded-lg p-8">
	  
	          <button @click="goBack" class="flex items-center mb-6 text-gray-700 hover:text-gray-900">
	            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
	              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
	            </svg>
	            Back
	          </button>
	  
	          <h1 class="text-3xl font-bold mb-6 text-gray-800">Item Instances</h1>
	          
	        <div class="flex justify-end mb-4">
	            <button 
	                @click="printAllBarcodes" 
	                class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
	                Print All Barcodes
	            </button>
	
	            <button 
	              @click="openAddInstances" 
	              class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 ml-4 px-4 rounded flex items-center">
	              <i class="fas fa-layer-group mr-2"></i> Add Instances
	            </button>
	
	        </div>
	  
	          <!-- Loading and Error States -->
	          <div v-if="loading" class="flex justify-center items-center h-64">
	            <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
	          </div>
	          <div v-else-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
	            <p class="font-bold">Error</p>
	            <p>{{ error }}</p>
	          </div>
	
	          
	  
	          <!-- Instances Table -->
	          <div v-else class="overflow-x-auto">
	            <table class="min-w-full divide-y divide-gray-200">
	              <thead class="bg-gray-50">
	                <tr>
	                  <th v-for="header in tableHeaders" :key="header" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
	                    {{ header }}
	                  </th>
	                </tr>
	              </thead>
	              <tbody class="bg-white divide-y divide-gray-200">
	                <tr 
	                  v-for="instance in instances" 
	                  :key="instance.id" 
	                  @click="navigateToItemDetails(instance.id)"
	                  class="hover:bg-gray-100 transition-colors duration-150 ease-in-out cursor-pointer">
	                  <td class="px-6 py-4 whitespace-nowrap">
	                    <span class="text-blue-600 hover:text-blue-800 font-medium">
	                      {{ instance.item.name }}
	                    </span>
	                  </td>
	                  <td class="px-6 py-4 whitespace-nowrap">
	                    {{ instance.serial_number }}
	                  </td> 
	                  <td class="px-6 py-4 whitespace-nowrap">
	                    <span :class="getConditionClass(instance.current_condition)">
	                      {{ instance.current_condition }}
	                    </span>
	                  </td>
	                  <td class="px-6 py-4">
	                    <div class="grid grid-cols-2 gap-4">
	                      <div>
	                        <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wider">Current borrower</h3>
	                        <div :class="getBorrowedStatusClass(instance.borrowed_by)">
	                          {{ getBorrowerStatus(instance, 'current') }}
	                        </div>
	                        <div v-if="instance.borrowed_by" class="text-xs text-gray-700 mt-1">
	                          <div><strong>Since: </strong> {{ formatDate(instance.borrowed_at) }}</div>
	                          <div><Strong>At: </Strong> {{ instance.current_location.name }}</div>
	                        </div>
	                      </div>
	                      <div>
	                        <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wider">Last borrower</h3>
	                        <div :class="getBorrowedStatusClass(instance.last_borrowed_by, true)">
	                          {{ getBorrowerStatus(instance, 'last') }}
	                        </div>
	                        <div v-if="instance.last_borrowed_by" class="text-xs text-gray-700 mt-1">
	                          <div><strong>Since: </strong>: {{ formatDate(instance.last_borrowed_at) }}</div>
	                          <div><strong>At: </strong> {{ instance.last_location.name }}</div>
	                        </div>
	                      </div>
	                    </div>
	                  </td>
	                  <td class="px-4 py-3 whitespace-nowrap">
	                    <img 
	                      v-if="instance.barcode"
	                      :src="instance.barcode" 
	                      alt="Barcode" 
	                      class="h-20 w-30 cursor-pointer transition-transform duration-300 ease-in-out transform hover:scale-110" 
	                      @click.stop="openBarcodePopup(instance.barcode)"
	                      aria-label="Click to view barcode"
	                    />
	                  </td>
	                  <td class="px-6 py-4 whitespace-nowrap">
	                    <div class="flex flex-col space-y-2">
	                      <button 
	                        @click.stop="printBarcode(instance.barcode)" 
	                        class="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150 ease-in-out"
	                        aria-label="Print Barcode">
	                        Print
	                      </button>
	                      <button 
	                        @click.stop="addToCart(instance)" 
	                        class="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 ease-in-out"
	                        :disabled="instance.borrowed_by || isInCart(instance.id)"
	                        :class="{ 'opacity-50 cursor-not-allowed': instance.borrowed_by || isInCart(instance.id) }"
	                        aria-label="Add to Cart">
	                        {{ isInCart(instance.id) ? 'In Cart' : 'Add to Cart' }}
	                      </button>
	                    </div>
	                  </td>
	                </tr>
	              </tbody>
	            </table>
	          </div>
	        </div>
	      </div>
	      <CartSummary
	        :items="cartStore.cartItems"
	        @remove-item="removeFromCart"
	        @open-borrow="showBorrowModal = true"
	      />
	  
	      <!-- Barcode Popup -->
	      <div v-if="showBarcodePopup" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="closeBarcodePopup">
	        <transition name="fade">
	          <div class="bg-white p-4 rounded-lg" @click.stop>
	            <img :src="currentBarcode" alt="Barcode" class="max-w-full h-auto" />
	            <button @click="closeBarcodePopup" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
	              Close
	            </button>
	          </div>
	        </transition>
	      </div>
	  
	      <!-- Borrow Modal -->
	      <BorrowModal 
	        v-if="showBorrowModal"
	        :show="showBorrowModal"
	        :users="users"
	        :rooms="rooms"
	        @close="closeBorrowModal"
	        @borrow-success="handleBorrowSuccess"
	      />
	
	      <div v-if="showAddInstanceForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
	        <InstancesForm 
	          :items="items"
	          :preselectedItem="currentItemId"
	          @close="closeAddInstances"
	          @instance-added="handleInstanceAdded"
	        />
	      </div>
	    </div>
</template>

<script setup lang="ts">
defineProps<{ 
	goBack: any;
	printAllBarcodes: any;
	openAddInstances: any;
	loading: any;
	error: any;
	tableHeaders: any;
	instances: any;
	navigateToItemDetails: any;
	getConditionClass: any;
	getBorrowedStatusClass: any;
	getBorrowerStatus: any;
	formatDate: any;
	openBarcodePopup: any;
	printBarcode: any;
	addToCart: any;
	isInCart: any;
	cartStore: any;
	removeFromCart: any;
	showBarcodePopup: any;
	closeBarcodePopup: any;
	currentBarcode: any;
	users: any;
	rooms: any;
	closeBorrowModal: any;
	handleBorrowSuccess: any;
	showAddInstanceForm: any;
	items: any;
	currentItemId: any;
	closeAddInstances: any;
	handleInstanceAdded: any;
}>()
const showBorrowModal = defineModel<any>('showBorrowModal', { required: true })
</script>
