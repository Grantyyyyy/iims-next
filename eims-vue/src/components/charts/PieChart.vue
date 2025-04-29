<template>
    <Pie :data="chartData" :options="chartOptions" />
  </template>
  
  <script>
  import { defineComponent } from 'vue'
  import { Pie } from 'vue-chartjs'
  import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
  
  ChartJS.register(ArcElement, Tooltip, Legend)
  
  export default defineComponent({
    name: 'PieChart',
    components: { Pie },
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