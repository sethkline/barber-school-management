<template>
  <div class="student-progress bg-white p-6 rounded-lg shadow-md">
    <h2 class="text-xl font-semibold mb-4">Student Progress</h2>
    
    <!-- Type Selection -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-1">Assessment Type</label>
      <select 
        v-model="selectedType"
        @change="loadProgressData"
        class="w-full sm:w-64 p-2 border rounded-md focus:ring-primary focus:border-primary"
      >
        <option value="">All Types</option>
        <option v-for="type in assessmentTypes" :key="type" :value="type">
          {{ type }}
        </option>
      </select>
    </div>
    
    <!-- Progress Chart -->
    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <p class="text-gray-500">Loading progress data...</p>
    </div>
    
    <div v-else-if="!hasData" class="flex justify-center items-center h-64 border rounded-md bg-gray-50">
      <p class="text-gray-500">No assessment data available for this student.</p>
    </div>
    
    <div v-else>
      <!-- Progress Chart -->
      <div class="h-64 mb-8">
        <canvas ref="chartCanvas"></canvas>
      </div>
      
      <!-- Summary Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-blue-700 mb-1">Latest Score</h3>
          <p class="text-2xl font-bold">{{ latestScore }}</p>
        </div>
        
        <div class="bg-green-50 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-green-700 mb-1">Average Score</h3>
          <p class="text-2xl font-bold">{{ averageScore }}</p>
        </div>
        
        <div class="bg-purple-50 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-purple-700 mb-1">Assessments Completed</h3>
          <p class="text-2xl font-bold">{{ assessmentCount }}</p>
        </div>
      </div>
      
      <!-- Class Average Comparison (if type selected) -->
      <div v-if="selectedType && classAverage" class="mt-6 p-4 border rounded-lg bg-gray-50">
        <h3 class="text-sm font-medium text-gray-700 mb-2">Comparison to Class Average</h3>
        <div class="flex items-center">
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              class="h-2.5 rounded-full" 
              :class="comparisonColor"
              :style="{ width: `${Math.min(100, (averageScore / 100) * 100)}%` }"
            ></div>
          </div>
          <span class="ml-3 text-sm">
            {{ differenceText }}
          </span>
        </div>
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
  }
})

// State
const chartCanvas = ref<HTMLCanvasElement | null>(null)
const chart = ref<Chart | null>(null)
const selectedType = ref('')
const progressData = ref<{ labels: string[], values: number[] }>({ labels: [], values: [] })
const classAverage = ref<number | null>(null)
const classCount = ref<number>(0)

// Get needed functions from composable
const { 
  assessmentTypes,
  isLoading,
  error,
  fetchAssessmentTypes,
  fetchStudentProgress,
  fetchAverageScore
} = useAssessments()

// Computed properties
const hasData = computed(() => {
  return progressData.value.labels.length > 0
})

const latestScore = computed(() => {
  if (!hasData.value) return 'N/A'
  return progressData.value.values[progressData.value.values.length - 1].toFixed(1)
})

const averageScore = computed(() => {
  if (!hasData.value) return 'N/A'
  
  const sum = progressData.value.values.reduce((acc, val) => acc + val, 0)
  return (sum / progressData.value.values.length).toFixed(1)
})

const assessmentCount = computed(() => {
  return progressData.value.values.length
})

const comparisonColor = computed(() => {
  if (!classAverage.value) return 'bg-gray-500'
  
  const avg = parseFloat(averageScore.value as string)
  const diff = avg - classAverage.value
  
  if (diff >= 5) return 'bg-green-600'
  if (diff > 0) return 'bg-green-400'
  if (diff === 0) return 'bg-blue-500'
  if (diff > -5) return 'bg-yellow-500'
  return 'bg-red-500'
})

const differenceText = computed(() => {
  if (!classAverage.value) return 'No class data'
  
  const avg = parseFloat(averageScore.value as string)
  const diff = avg - classAverage.value
  const classAvg = classAverage.value.toFixed(1)
  
  if (diff === 0) return `Equal to class average (${classAvg})`
  if (diff > 0) return `${diff.toFixed(1)} points above class average (${classAvg})`
  return `${Math.abs(diff).toFixed(1)} points below class average (${classAvg})`
})

// Initialize data on component mount
onMounted(async () => {
  await fetchAssessmentTypes()
  await loadProgressData()
})

// Watch for changes in selected type
watch(selectedType, () => {
  loadProgressData()
})

// Load progress data for the student
async function loadProgressData() {
  // Get student progress data
  const data = await fetchStudentProgress(props.studentId, selectedType.value)
  progressData.value = data
  
  // If a specific type is selected, also get the class average
  if (selectedType.value) {
    const avgData = await fetchAverageScore(selectedType.value)
    classAverage.value = avgData.average
    classCount.value = avgData.count
  } else {
    classAverage.value = null
  }
  
  // Update chart
  updateChart()
}

// Create/update the progress chart
function updateChart() {
  if (!chartCanvas.value) return
  
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
        label: selectedType.value || 'All Assessments',
        data: progressData.value.values,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.1,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Score'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Assessment Date'
          }
        }
      }
    }
  })
}
</script>