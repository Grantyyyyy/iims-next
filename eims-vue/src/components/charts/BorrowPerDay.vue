<template>
  <div class="bg-white w-9/12  rounded-lg border border-gray-200 shadow-lg p-4">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <i class="fas fa-calendar text-blue-600 text-xl"></i>
        <h2 class="text-xl font-bold text-gray-800">
          Weekly {{ tabTitle }} </h2>

      </div>
      
      <!-- Toggle Switch -->
      <div class="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
        <button 
          @click="selectTab('items')"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          :class="{
            'bg-white text-blue-600 shadow-sm': selectedTab === 'items',
            'text-gray-600 hover:text-gray-800 hover:bg-gray-50': selectedTab !== 'items'
          }"
        >
          Items Borrowed
        </button>
        <button 
          @click="selectTab('usage')" 
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          :class="{
            'bg-white text-blue-600 shadow-sm': selectedTab === 'usage',
            'text-gray-600 hover:text-gray-800 hover:bg-gray-50': selectedTab !== 'usage'
          }"        >
          Usage Data
        </button>
        <button 
          @click="selectTab('equipment')" 
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          :class="{
            'bg-white text-blue-600 shadow-sm': selectedTab === 'equipment',
            'text-gray-600 hover:text-gray-800 hover:bg-gray-50': selectedTab !== 'equipment'
          }"        >
          Equipment Borrowed
        </button>
        <button 
          @click="selectTab('apparatus')" 
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          :class="{
            'bg-white text-blue-600 shadow-sm': selectedTab === 'apparatus',
            'text-gray-600 hover:text-gray-800 hover:bg-gray-50': selectedTab !== 'apparatus'
          }"        >
          Apparatus Borrowed
        </button>
      </div>
      
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div class="p-4 bg-blue-50 rounded-lg">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-blue-600">Total 
            {{ selectedTab === 'items'
               ? 'Items Borrowed'
              : selectedTab === 'usage' ? 'Chemical Usage' : 'Equipment Borrowed' }}</p>
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
    const store = useStore()
    const chartCanvas = ref(null)
    const selectedTab = ref('items')
    const userType = computed(() => store.state.userType);

    const selectTab = (tab) => {
      selectedTab.value = tab
    }

    let chartInstance = null

    const tabTitle = computed(() => {
      switch (selectedTab.value) {
        case 'items': return 'Items Borrowed'
        case 'usage': return 'Chemical Usage'
        case 'equipment': return 'Equipment Borrowed'
        case 'apparatus': return 'Apparatus Borrowed'
        default: return ''
      }
    })


    const currentData = computed(() => {
      if (selectedTab.value === 'items') return props.borrowPerDayData
      if (selectedTab.value === 'usage') return props.usagePerDay
      if (selectedTab.value === 'equipment') return props.equipmentBorrowPerDay
      if (selectedTab.value === 'apparatus') return props.apparatusBorrowPerDay
      return []
    })

    const totalCount = computed(() => 
      currentData.value.reduce((sum, day) => sum + day.count, 0)
    )

    const dailyAverage = computed(() =>  {
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
      userType,
      totalCount,
      dailyAverage,
      selectedTab,
      tabTitle,
      selectTab
    }
  }
}
</script>