<template>
  <div class="bg-white rounded-lg border border-gray-200 shadow-lg p-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <i class="fas fa-calendar text-blue-600 text-xl"></i>
        <h2 class="text-xl font-bold text-gray-800">Weekly {{ tabTitle }}</h2>
      </div>

      <div class="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
        <button 
          @click="selectTab('usage')"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          :class="{
            'bg-white text-blue-600 shadow-sm': selectedTab === 'usage',
            'text-gray-600 hover:text-gray-800 hover:bg-gray-50': selectedTab !== 'usage'
          }"
        >
          Chemical Usage
        </button>
        <button 
          @click="selectTab('equipment')" 
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          :class="{
            'bg-white text-blue-600 shadow-sm': selectedTab === 'equipment',
            'text-gray-600 hover:text-gray-800 hover:bg-gray-50': selectedTab !== 'equipment'
          }" 
        >
          Equipment Borrowed
        </button>
        <button 
          @click="selectTab('apparatus')" 
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          :class="{
            'bg-white text-blue-600 shadow-sm': selectedTab === 'apparatus',
            'text-gray-600 hover:text-gray-800 hover:bg-gray-50': selectedTab !== 'apparatus'
          }" 
        >
          Apparatus Borrowed
        </button>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <!-- Total Borrows -->
      <div class="p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-blue-600">Total Usage</p>
          <i class="fas fa-users text-blue-600 opacity-70"></i>
        </div>
        <p class="text-2xl font-bold text-gray-900 mt-2">{{ totalBorrows }}</p>
        <p class="text-sm text-gray-600 mt-1">Past 7 days</p>
      </div>

      <!-- Daily Average -->
      <div class="p-4 bg-green-50 rounded-lg border border-green-100">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-green-600">Daily Average</p>
          <i class="fas fa-chart-line text-green-600 opacity-70"></i>
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
      },
      equipmentBorrowPerDay: {
        type: Array,
        required: true
      },
      apparatusBorrowPerDay: {
        type: Array,
        required: true
      }
    },
    setup(props) {
      const chartCanvas = ref(null)
      const selectedTab = ref('usage')

      const selectTab = (tab) => {
        selectedTab.value = tab
      }

      let chartInstance = null

      const tabTitle = computed(() => {
        switch (selectedTab.value) {
          case 'usage': return 'Chemical Usage'
          case 'equipment': return 'Equipment Borrowed'
          case 'apparatus': return 'Apparatus Borrowed'
          default: return ''
        }
      })

      const currentData = computed(() => {
        switch (selectedTab.value) {
          case 'usage': return props.usagePerDay
          case 'equipment': return props.equipmentBorrowPerDay
          case 'apparatus': return props.apparatusBorrowPerDay
          default: return []
        }
      })

      const totalBorrows = computed(() => {
        return currentData.value.reduce((sum, day) => sum + day.count, 0)
      })

      const borrowsToday = computed(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return currentData.value.reduce((sum, day) => {
          const dayDate = new Date(day.day)
          dayDate.setHours(0, 0, 0, 0)
          return dayDate.getTime() === today.getTime() ? sum + day.count : sum
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
                label: tabTitle.value,
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
      watch([currentData, selectedTab], createChart)
  
      return { 
        chartCanvas,
        totalBorrows,
        borrowsToday,
        selectTab,
        selectedTab,
        tabTitle
      }
    }
  }
  </script>