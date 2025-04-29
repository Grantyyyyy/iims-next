<!-- components/charts/FeatureCard.vue -->
<template>
    <div class="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group">
      <div class="p-8">
        <div class="flex items-center justify-center mb-6">
          <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
            <i :class="[icon, 'text-2xl text-blue-600 group-hover:text-white transition-colors duration-300']"></i>
          </div>
        </div>
        <h3 class="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">{{ title }}</h3>
        <p class="text-gray-600 leading-relaxed">
          {{ description }}
        </p>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'FeatureCard',
    props: {
      title: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true
      },
      icon: {
        type: String,
        required: true
      }
    }
  };
  </script>