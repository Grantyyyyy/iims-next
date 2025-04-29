<template>
    <div class="chart-container">
      <BarChart :data="chartData" :options="chartOptions" />
    </div>
  </template>
  
  <script>
  import { defineComponent, ref } from 'vue';
  import { Bar } from 'vue-chartjs';
  import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
  
  // Register chart components
  ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);
  
  export default defineComponent({
    name: 'ChartComponent',
    components: {
      BarChart: Bar
    },
    props: {
      data: Array,
    },
    setup(props) {
      const chartData = ref({
        labels: props.data.map(item => item.batch_number),  // Use batch number or another suitable field
        datasets: [
          {
            label: 'Expiring Batches in 30 Days',
            data: props.data.map(item => item.expiry_count),  // Assuming expiry_count is passed
            backgroundColor: 'rgba(255, 99, 132, 0.6)',  // Adjust color as needed
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          },
        ],
      });
  
      const chartOptions = ref({
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Batches Expiring Soon',
          },
        },
        scales: {
          x: {
            beginAtZero: true,
          },
        },
      });
  
      return {
        chartData,
        chartOptions,
      };
    },
  });
  </script>
  