<template>
  <div class="bg-white w-9/12  rounded-lg border border-gray-200 shadow-lg p-4">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <i class="fas fa-calendar text-blue-600 text-xl"></i>
        <h2 class="text-xl font-bold text-gray-800">Weekly {{ isRegularData ? 'Item Borrow' : 'Chemical Usage' }}</h2>
      </div>
      
      <!-- Toggle Switch -->
      <div class="flex items-center gap-3">
        <button 
          @click="toggleDataType"
          class="px-4 py-2 rounded-lg text-sm font-medium"
          :class="isRegularData ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'"
        >
          Borrowing Data
        </button>
        <button 
          @click="toggleDataType" 
          class="px-4 py-2 rounded-lg text-sm font-medium"
          :class="!isRegularData ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'" 
        >
          Usage Data
        </button>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div class="p-4 bg-blue-50 rounded-lg">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-blue-600">Total {{ isRegularData ? 'Borrows' : 'Usage' }}</p>
          <i class="fas fa-users text-blue-600"></i>
        </div>
        <p class="text-2xl font-bold text-gray-900 mt-2">{{ totalCount }}</p>
        <p class="text-sm text-gray-600 mt-1">Past 7 days</p>
      </div>

      <div class="p-4 bg-green-50 rounded-lg">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-green-600">Daily Average</p>
          <i class="fas fa-chart-line text-green-600"></i>
        </div>
        <p class="text-2xl font-bold text-gray-900 mt-2">{{ dailyAverage }}</p>
        <p class="text-sm text-gray-600 mt-1">Per day</p>
      </div>
    </div>

    <div class="h-[300px] mt-4">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue'
import { useStore } from 'vuex';
import Chart from 'chart.js/auto'

export default {
  name: 'ToggleableBorrowChart',
  props: {
    borrowPerDayData: {
      type: Array,
      required: true
    },
    usagePerDay: {
      type: Array,
      required: true
    }
  },
  
  setup(props) {
    const store = useStore()
    const chartCanvas = ref(null)
    const isRegularData = ref(true)
    const userType = computed(() => store.state.userType);


    let chartInstance = null

    const currentData = computed(() => 
      isRegularData.value ? props.borrowPerDayData : props.usagePerDay
    )

    const totalCount = computed(() => 
      currentData.value.reduce((sum, day) => sum + day.count, 0)
    )

    const dailyAverage = computed(() => 
      Math.round(totalCount.value / 7)
    )

    const toggleDataType = () => {
      isRegularData.value = !isRegularData.value
    }

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
      if (chartCanvas.value && currentData.value) {
        if (chartInstance) {
          chartInstance.destroy()
        }

        const formattedData = generateFullWeekData(currentData.value)

        chartInstance = new Chart(chartCanvas.value, {
          type: 'bar',
          data: {
            labels: formattedData.map(item => item.day),
            datasets: [{
              label: isRegularData.value ? 'Borrow Count' : 'Usage Count',
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
    watch(currentData, createChart)
    watch(isRegularData, createChart)

    return {
      chartCanvas,
      isRegularData,
      userType,
      totalCount,
      dailyAverage,
      toggleDataType
    }
  }
}
</script>