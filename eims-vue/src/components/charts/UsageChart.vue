<template>
    <div class="bg-white rounded-lg border border-gray-200 shadow-lg p-6">
      <!-- Header Section -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-2">
          <i class="fas fa-calendar text-blue-600 text-xl"></i>
          <h2 class="text-xl font-bold text-gray-800">Weekly Chemical Usage</h2>
        </div>
        <span class="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
          Last 7 days
        </span>
      </div>
  
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <!-- Total Borrows -->
        <div class="p-4 bg-blue-50 rounded-lg">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-blue-600">Total Usage</p>
            <i class="fas fa-users text-blue-600"></i>
          </div>
          <p class="text-2xl font-bold text-gray-900 mt-2">{{ totalBorrows }}</p>
          <p class="text-sm text-gray-600 mt-1">Past 7 days</p>
        </div>
  
        <!-- Daily Average -->
        <div class="p-4 bg-green-50 rounded-lg">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-green-600">Daily Average</p>
            <i class="fas fa-chart-line text-green-600"></i>
          </div>
          <p class="text-2xl font-bold text-gray-900 mt-2">{{ borrowsToday }}</p>
          <p class="text-sm text-gray-600 mt-1">Usage per day</p>
        </div>
  
      </div>
  
  
      <div class="h-[300px] mt-4">
        <canvas ref="chartCanvas"></canvas>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted, watch, computed } from 'vue'
  import Chart from 'chart.js/auto'
  
  export default {
    name: 'UsagePerDay',
    props: {
      usagePerDay: {
        type: Array,
        required: true
      }
    },
    setup(props) {
      const chartCanvas = ref(null)
      let chartInstance = null
  
      const totalBorrows = computed(() => {
        return props.usagePerDay.reduce((sum, day) => sum + day.count, 0)
      })
  
      const borrowsToday = computed(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        return props.usagePerDay.reduce((sum, day) => {
          const dayDate = new Date(day.day)
          dayDate.setHours(0, 0, 0, 0)
          
          if (dayDate.getTime() === today.getTime()) {
            return sum + day.count
          }
          return sum
        }, 0)
      })
  
      const generateFullWeekData = (data) => {
        const days = []
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date()
          date.setDate(today.getDate() - i)
          date.setHours(0, 0, 0, 0)
          
          const formattedDate = date.toISOString().split('T')[0]
          
          const matchedDay = data.find(d => {
            const dayDate = new Date(d.day)
            dayDate.setHours(0, 0, 0, 0)
            return dayDate.getTime() === date.getTime()
          })
          
          days.push({
            day: date,
            count: matchedDay ? matchedDay.count : 0
          })
        }
  
        return days.map(item => ({
          day: item.day.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
          count: item.count
        }))
      }
  
      const createChart = () => {
        if (chartCanvas.value && props.usagePerDay) {
          if (chartInstance) {
            chartInstance.destroy()
          }
  
          const formattedData = generateFullWeekData(props.usagePerDay)
  
          chartInstance = new Chart(chartCanvas.value, {
            type: 'bar',
            data: {
              labels: formattedData.map(item => item.day),
              datasets: [{
                label: 'Borrow Count',
                data: formattedData.map(item => item.count),
                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                borderColor: 'rgb(37, 99, 235)',
                borderWidth: 2,
                borderRadius: 6,
                barThickness: 20
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    drawBorder: false
                  },
                  ticks: {
                    precision: 0
                  }
                },
                x: {
                  grid: {
                    display: false
                  }
                }
              }
            }
          })
        }
      }
  
      onMounted(createChart)
      watch(() => props.usagePerDay, createChart)
  
      return { 
        chartCanvas,
        totalBorrows,
        borrowsToday,
      }
    }
  }
  </script>