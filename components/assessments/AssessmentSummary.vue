<template>
  <div class="assessment-summary bg-white p-6 rounded-lg shadow-md">
    <h3 class="text-lg font-semibold mb-4">{{ title }}</h3>
    
    <div v-if="isLoading" class="flex justify-center py-4">
      <p class="text-gray-500">Loading...</p>
    </div>
    
    <div v-else-if="!hasAssessments" class="py-4 text-center border rounded-md bg-gray-50">
      <p class="text-gray-500">No assessment data available</p>
    </div>
    
    <div v-else>
      <!-- Summary Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="text-xs font-medium text-blue-700 mb-1">Latest Score</h4>
          <p class="text-2xl font-bold">{{ latestScore }}</p>
        </div>
        
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="text-xs font-medium text-green-700 mb-1">Average</h4>
          <p class="text-2xl font-bold">{{ averageScore }}</p>
        </div>
        
        <div class="bg-purple-50 p-4 rounded-lg md:col-span-1 col-span-2">
          <h4 class="text-xs font-medium text-purple-700 mb-1">Assessments</h4>
          <p class="text-2xl font-bold">{{ assessmentCount }}</p>
        </div>
      </div>
      
      <!-- Mini Line Chart -->
      <div class="h-32">
        <canvas ref="chartCanvas"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import Chart from 'chart.js/auto'
import { useAssessments } from '~/composables/useAssessments'

const props = defineProps({
  studentId: {
    type: String,
    required: true
  },
  assessmentType: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: 'Assessment Summary'
  },
  limit: {
    type: Number,
    default: 5
  }
})

// Chart reference
const chartCanvas = ref<HTMLCanvasElement | null>(null)
const chart = ref<Chart | null>(null)

// Get needed functions from composable
const { isLoading, error, fetchStudentProgress } = useAssessments()

// State
const progressData = ref<{ labels: string[], values: number[] }>({
  labels: [],
  values: []
})

// Computed properties
const hasAssessments = computed(() => progressData.value.values.length > 0)

const latestScore = computed(() => {
  if (!hasAssessments.value) return 'N/A'
  return progressData.value.values[progressData.value.values.length - 1].toFixed(1)
})

const averageScore = computed(() => {
  if (!hasAssessments.value) return 'N/A'
  
  const sum = progressData.value.values.reduce((acc, val) => acc + val, 0)
  return (sum / progressData.value.values.length).toFixed(1)
})

const assessmentCount = computed(() => {
  return progressData.value.values.length
})

// Load data on component mount
onMounted(async () => {
  await loadData()
})

// Watch for prop changes
watch([() => props.studentId, () => props.assessmentType], () => {
  loadData()
})

// Load progress data
async function loadData() {
  const data = await fetchStudentProgress(props.studentId, props.assessmentType)
  
  // Limit to the last X assessments if needed
  if (data.labels.length > props.limit) {
    progressData.value = {
      labels: data.labels.slice(-props.limit),
      values: data.values.slice(-props.limit)
    }
  } else {
    progressData.value = data
  }
  
  // Create/update chart
  updateChart()
}

// Create/update the chart
function updateChart() {
  if (!chartCanvas.value || !hasAssessments.value) return
  
  // Destroy existing chart if it exists
  if (chart.value) {
    chart.value.destroy()
  }
  
  // Create new chart
  chart.value = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels: progressData.value.labels,
      datasets: [{
        label: 'Score',
        data: progressData.value.values,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          display: false
        },
        x: {
          display: false
        }
      }
    }
  })
}
</script>