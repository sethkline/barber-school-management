<template>
  <div class="performance-analytics bg-white p-6 rounded-lg shadow-md">
    <h2 class="text-xl font-semibold mb-4">Performance Analytics</h2>
    
    <!-- Type Selection -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-1">Assessment Type</label>
      <select 
        v-model="selectedType"
        @change="loadAnalyticsData"
        class="w-full sm:w-64 p-2 border rounded-md focus:ring-primary focus:border-primary"
      >
        <option value="" disabled>Select Assessment Type</option>
        <option v-for="type in assessmentTypes" :key="type" :value="type">
          {{ type }}
        </option>
      </select>
    </div>
    
    <!-- Analytics Content -->
    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <p class="text-gray-500">Loading analytics data...</p>
    </div>
    
    <div v-else-if="!selectedType" class="flex justify-center items-center h-64 border rounded-md bg-gray-50">
      <p class="text-gray-500">Please select an assessment type to view analytics.</p>
    </div>
    
    <div v-else-if="!hasData" class="flex justify-center items-center h-64 border rounded-md bg-gray-50">
      <p class="text-gray-500">No data available for the selected assessment type.</p>
    </div>
    
    <div v-else>
      <!-- Performance Overview -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-blue-700 mb-1">Average Score</h3>
          <p class="text-2xl font-bold">{{ averageScore.toFixed(1) }}</p>
        </div>
        
        <div class="bg-green-50 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-green-700 mb-1">Highest Score</h3>
          <p class="text-2xl font-bold">{{ highestScore.toFixed(1) }}</p>
        </div>
        
        <div class="bg-purple-50 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-purple-700 mb-1">Total Assessments</h3>
          <p class="text-2xl font-bold">{{ totalAssessments }}</p>
        </div>
      </div>
      
      <!-- Score Distribution Chart -->
      <div class="mb-8">
        <h3 class="text-lg font-medium mb-3">Score Distribution</h3>
        <div class="h-64">
          <canvas ref="distributionCanvas"></canvas>
        </div>
      </div>
      
      <!-- Performance Over Time Chart -->
      <div class="mb-8">
        <h3 class="text-lg font-medium mb-3">Performance Over Time</h3>
        <div class="h-64">
          <canvas ref="timeSeriesCanvas"></canvas>
        </div>
      </div>
      
      <!-- Student Performance Table -->
      <div>
        <h3 class="text-lg font-medium mb-3">Student Performance</h3>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Score</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latest Score</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="student in studentPerformance" :key="student.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div>
                      <div class="text-sm font-medium text-gray-900">
                        {{ student.name }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getScoreClass(student.averageScore)"
                  >
                    {{ student.averageScore.toFixed(1) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getScoreClass(student.latestScore)"
                  >
                    {{ student.latestScore.toFixed(1) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-500">
                    {{ getTrendIcon(student.trend) }} {{ getTrendText(student.trend) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import Chart from 'chart.js/auto'
import { useAssessments } from '~/composables/useAssessments'

interface StudentPerformance {
  id: string
  name: string
  averageScore: number
  latestScore: number
  trend: 'up' | 'down' | 'stable'
}

// Chart references
const distributionCanvas = ref<HTMLCanvasElement | null>(null)
const timeSeriesCanvas = ref<HTMLCanvasElement | null>(null)
const distributionChart = ref<Chart | null>(null)
const timeSeriesChart = ref<Chart | null>(null)

// State
const selectedType = ref('')
const assessmentData = ref<any[]>([])
const studentData = ref<any[]>([])
const studentPerformance = ref<StudentPerformance[]>([])
const averageScore = ref(0)
const highestScore = ref(0)
const totalAssessments = ref(0)

// Get needed functions from composable
const { 
  assessmentTypes,
  isLoading,
  error,
  fetchAssessmentTypes
} = useAssessments()

// Computed properties
const hasData = computed(() => {
  return assessmentData.value.length > 0
})

// Initialize data on component mount
onMounted(async () => {
  await fetchAssessmentTypes()
  if (assessmentTypes.value.length > 0) {
    selectedType.value = assessmentTypes.value[0]
    await loadAnalyticsData()
  }
})

// Watch for changes in selected type
watch(selectedType, () => {
  loadAnalyticsData()
})

// Load analytics data for the selected assessment type
async function loadAnalyticsData() {
  if (!selectedType.value) return
  
  isLoading.value = true
  
  try {
    // Fetch assessment data for the selected type
    const response = await fetch(`/api/assessments?assessmentType=${encodeURIComponent(selectedType.value)}&limit=500`)
    const data = await response.json()
    assessmentData.value = data.data || []
    
    // Calculate statistics
    calculateStatistics()
    
    // Fetch student data for additional analysis
    await fetchStudentData()
    
    // Analyze student performance
    analyzeStudentPerformance()
    
    // Update charts
    updateCharts()
  } catch (error) {
    console.error('Error loading analytics data:', error)
  } finally {
    isLoading.value = false
  }
}

// Calculate statistics from assessment data
function calculateStatistics() {
  if (assessmentData.value.length === 0) {
    averageScore.value = 0
    highestScore.value = 0
    totalAssessments.value = 0
    return
  }
  
  // Total assessments
  totalAssessments.value = assessmentData.value.length
  
  // Calculate scores
  const scores = assessmentData.value
    .filter(a => a.score !== null)
    .map(a => a.score)
  
  if (scores.length > 0) {
    // Average score
    averageScore.value = scores.reduce((sum, score) => sum + score, 0) / scores.length
    
    // Highest score
    highestScore.value = Math.max(...scores)
  }
}

// Fetch student data
async function fetchStudentData() {
  try {
    const response = await fetch('/api/students?limit=100')
    const data = await response.json()
    studentData.value = data.data || []
  } catch (error) {
    console.error('Failed to load students:', error)
    studentData.value = []
  }
}

// Analyze student performance for the selected assessment type
function analyzeStudentPerformance() {
  studentPerformance.value = []
  
  // Group assessments by student
  const studentGroups = new Map()
  
  // Initialize with all students in the dataset
  studentData.value.forEach(student => {
    studentGroups.set(student.id, [])
  })
  
  // Add assessments to their respective student groups
  assessmentData.value.forEach(assessment => {
    if (assessment.student_id) {
      const studentAssessments = studentGroups.get(assessment.student_id) || []
      studentAssessments.push(assessment)
      studentGroups.set(assessment.student_id, studentAssessments)
    }
  })
  
  // Calculate performance metrics for each student
  studentGroups.forEach((assessments, studentId) => {
    if (assessments.length === 0) {
      return
    }
    
    // Sort by date
    assessments.sort((a, b) => {
      return new Date(a.assessment_date).getTime() - new Date(b.assessment_date).getTime()
    })
    
    // Get scores
    const scores = assessments.map(a => a.score).filter(s => s !== null)
    
    if (scores.length === 0) {
      return
    }
    
    // Calculate average
    const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length
    
    // Get latest score
    const latest = scores[scores.length - 1]
    
    // Determine trend
    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (scores.length >= 2) {
      const firstHalf = scores.slice(0, Math.floor(scores.length / 2))
      const secondHalf = scores.slice(Math.floor(scores.length / 2))
      
      const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length
      
      if (secondAvg - firstAvg > 2) {
        trend = 'up'
      } else if (firstAvg - secondAvg > 2) {
        trend = 'down'
      }
    }
    
    // Find student details
    const student = studentData.value.find(s => s.id === studentId)
    
    if (student) {
      studentPerformance.value.push({
        id: studentId,
        name: `${student.first_name} ${student.last_name}`,
        averageScore: avg,
        latestScore: latest,
        trend
      })
    }
  })
  
  // Sort by average score, descending
  studentPerformance.value.sort((a, b) => b.averageScore - a.averageScore)
}

// Update charts with the latest data
function updateCharts() {
  updateDistributionChart()
  updateTimeSeriesChart()
}

// Update the score distribution chart
function updateDistributionChart() {
  if (!distributionCanvas.value) return
  
  // Destroy existing chart if it exists
  if (distributionChart.value) {
    distributionChart.value.destroy()
  }
  
  // Prepare data for score distribution chart
  const scores = assessmentData.value
    .filter(a => a.score !== null)
    .map(a => a.score)
  
  // Create score brackets
  const brackets = {
    '0-59': 0,
    '60-69': 0,
    '70-79': 0,
    '80-89': 0,
    '90-100': 0
  }
  
  scores.forEach(score => {
    if (score < 60) brackets['0-59']++
    else if (score < 70) brackets['60-69']++
    else if (score < 80) brackets['70-79']++
    else if (score < 90) brackets['80-89']++
    else brackets['90-100']++
  })
  
  // Create chart
  distributionChart.value = new Chart(distributionCanvas.value, {
    type: 'bar',
    data: {
      labels: Object.keys(brackets),
      datasets: [{
        label: 'Number of Assessments',
        data: Object.values(brackets),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(255, 205, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(54, 162, 235, 0.7)'
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(255, 159, 64)',
          'rgb(255, 205, 86)',
          'rgb(75, 192, 192)',
          'rgb(54, 162, 235)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Count'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Score Range'
          }
        }
      }
    }
  })
}

// Update the performance over time chart
function updateTimeSeriesChart() {
  if (!timeSeriesCanvas.value) return
  
  // Destroy existing chart if it exists
  if (timeSeriesChart.value) {
    timeSeriesChart.value.destroy()
  }
  
  // Prepare data for time series chart
  const assessmentsByMonth: {[key: string]: number[]} = {}
  
  assessmentData.value.forEach(assessment => {
    if (assessment.assessment_date && assessment.score !== null) {
      // Format as YYYY-MM
      const month = assessment.assessment_date.substring(0, 7)
      
      if (!assessmentsByMonth[month]) {
        assessmentsByMonth[month] = []
      }
      
      assessmentsByMonth[month].push(assessment.score)
    }
  })
  
  // Sort months chronologically
  const sortedMonths = Object.keys(assessmentsByMonth).sort()
  
  // Calculate average score per month
  const monthlyAverages = sortedMonths.map(month => {
    const scores = assessmentsByMonth[month]
    return scores.reduce((sum, score) => sum + score, 0) / scores.length
  })
  
  // Format months for display (MMM YYYY)
  const formattedMonths = sortedMonths.map(month => {
    const date = new Date(month)
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
  })
  
  // Create chart
  timeSeriesChart.value = new Chart(timeSeriesCanvas.value, {
    type: 'line',
    data: {
      labels: formattedMonths,
      datasets: [{
        label: 'Average Score',
        data: monthlyAverages,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
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
          beginAtZero: false,
          min: Math.max(0, Math.min(...monthlyAverages) - 10),
          max: Math.min(100, Math.max(...monthlyAverages) + 10),
          title: {
            display: true,
            text: 'Average Score'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Month'
          }
        }
      }
    }
  })
}

// Helper function to get CSS class based on score
function getScoreClass(score: number): string {
  if (score === null) return 'bg-gray-100 text-gray-800'
  
  if (score >= 90) return 'bg-green-100 text-green-800'
  if (score >= 80) return 'bg-blue-100 text-blue-800'
  if (score >= 70) return 'bg-yellow-100 text-yellow-800'
  if (score >= 60) return 'bg-orange-100 text-orange-800'
  return 'bg-red-100 text-red-800'
}

// Helper function to get trend icon
function getTrendIcon(trend: string): string {
  if (trend === 'up') return '↑'
  if (trend === 'down') return '↓'
  return '→'
}

// Helper function to get trend text
function getTrendText(trend: string): string {
  if (trend === 'up') return 'Improving'
  if (trend === 'down') return 'Declining'
  return 'Stable'
}
</script>