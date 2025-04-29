<template>
    <Bar :data="chartData" :options="chartOptions" />
  </template>
  
  <script>
  import { defineComponent } from 'vue'
  import { Bar } from 'vue-chartjs'
  import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
  
  ChartJS.register(ArcElement, Tooltip, Legend)
  
  export default defineComponent({
    name: 'BarChart',
    components: { Bar },
    props: ['data'],
    setup(props) {
      const chartData = {
        datasets: props.data.datasets
      }
  
      const chartOptions = {
        responsive: true,
        maintainAspectRatio: false
      }
  
      return { chartData, chartOptions }
    }
  })
  </script>