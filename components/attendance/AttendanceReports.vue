<template>
  <div class="reports-wrapper">
    <div class="reports-header">
      <h1 class="text-2xl font-bold">Attendance Reports & Analytics</h1>
      <div class="date-range-selector">
        <div class="form-control">
          <div class="input-group">
            <span>From</span>
            <input 
              type="date" 
              v-model="startDate" 
              class="input input-bordered" 
              @change="loadReportData"
            />
            <span>To</span>
            <input 
              type="date" 
              v-model="endDate" 
              class="input input-bordered" 
              @change="loadReportData"
            />
            <div class="dropdown dropdown-end">
              <label tabindex="0" class="btn">Presets</label>
              <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                <li><a @click="applyPresetRange('week')">This Week</a></li>
                <li><a @click="applyPresetRange('month')">This Month</a></li>
                <li><a @click="applyPresetRange('quarter')">This Quarter</a></li>
                <li><a @click="applyPresetRange('year')">This Year</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loader"></div>
      <p>Loading attendance data...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p class="text-red-500">{{ error }}</p>
      <button @click="loadReportData" class="btn btn-primary mt-4">
        Try Again
      </button>
    </div>

    <div v-else class="reports-container">
      <!-- Overall Summary Statistics -->
      <div class="stats-banner shadow">
        <div class="stat">
          <div class="stat-title">Total Students</div>
          <div class="stat-value">{{ stats.uniqueStudents }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">School Days</div>
          <div class="stat-value">{{ stats.totalDays }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">Attendance Rate</div>
          <div class="stat-value text-primary">{{ Math.round(stats.presentRate) }}%</div>
        </div>
        <div class="stat">
          <div class="stat-title">Present</div>
          <div class="stat-value text-success">{{ stats.presentCount }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">Absent</div>
          <div class="stat-value text-error">{{ stats.absentCount }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">Excused</div>
          <div class="stat-value text-warning">{{ stats.excusedCount }}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <!-- Attendance Trend Chart -->
        <div class="card shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Attendance Trend</h2>
            <div class="attendance-chart">
              <canvas ref="trendChart" width="400" height="200"></canvas>
            </div>
          </div>
        </div>

        <!-- Status Distribution Chart -->
        <div class="card shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Attendance Status Distribution</h2>
            <div class="attendance-chart">
              <canvas ref="distributionChart" width="400" height="200"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Top/Bottom Attendance Students -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <!-- Top Attendance Students -->
        <div class="card shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Top Attendance</h2>
            <div class="overflow-x-auto">
              <table class="table w-full">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Rate</th>
                    <th>Present</th>
                    <th>Absent</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="student in topAttendanceStudents" :key="student.studentId">
                    <td>
                      <div class="flex items-center space-x-3">
                        <div class="avatar placeholder">
                          <div class="bg-neutral-focus text-neutral-content rounded-full w-8">
                            <span>{{ getInitials(student.firstName, student.lastName) }}</span>
                          </div>
                        </div>
                        <div>
                          <div class="font-bold">{{ student.firstName }} {{ student.lastName }}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="badge badge-success">{{ student.attendanceRate }}%</div>
                    </td>
                    <td>{{ student.presentCount }}</td>
                    <td>{{ student.absentCount }}</td>
                  </tr>
                  <tr v-if="topAttendanceStudents.length === 0">
                    <td colspan="4" class="text-center py-4">
                      No data available for the selected period.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Low Attendance Students -->
        <div class="card shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Low Attendance (Needs Attention)</h2>
            <div class="overflow-x-auto">
              <table class="table w-full">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Rate</th>
                    <th>Present</th>
                    <th>Absent</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="student in lowAttendanceStudents" :key="student.studentId">
                    <td>
                      <div class="flex items-center space-x-3">
                        <div class="avatar placeholder">
                          <div class="bg-neutral-focus text-neutral-content rounded-full w-8">
                            <span>{{ getInitials(student.firstName, student.lastName) }}</span>
                          </div>
                        </div>
                        <div>
                          <div class="font-bold">{{ student.firstName }} {{ student.lastName }}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="badge badge-error">{{ student.attendanceRate }}%</div>
                    </td>
                    <td>{{ student.presentCount }}</td>
                    <td>{{ student.absentCount }}</td>
                  </tr>
                  <tr v-if="lowAttendanceStudents.length === 0">
                    <td colspan="4" class="text-center py-4">
                      No data available for the selected period.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Download Reports Section -->
      <div class="card shadow-xl mt-6">
        <div class="card-body">
          <h2 class="card-title">Download Reports</h2>
          <div class="flex flex-wrap gap-4 mt-4">
            <button @click="downloadReport('attendance_summary')" class="btn btn-primary">
              <i class="fas fa-file-download mr-2"></i>
              Attendance Summary
            </button>
            <button @click="downloadReport('daily_attendance')" class="btn btn-primary">
              <i class="fas fa-file-download mr-2"></i>
              Daily Attendance Log
            </button>
            <button @click="downloadReport('student_details')" class="btn btn-primary">
              <i class="fas fa-file-download mr-2"></i>
              Student Attendance Details
            </button>
            <button @click="downloadReport('alerts')" class="btn btn-primary">
              <i class="fas fa-file-download mr-2"></i>
              Attendance Alerts
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAttendance } from '~/composables/useAttendance'
import Chart from 'chart.js/auto'

const { 
  fetchAttendanceStats,
  formatDate
} = useAttendance()

// State
const loading = ref(true)
const error = ref(null)
const stats = ref({
  totalDays: 0,
  totalRecords: 0,
  presentCount: 0,
  absentCount: 0,
  excusedCount: 0,
  uniqueStudents: 0,
  presentRate: 0
})

// Chart references
const trendChart = ref(null)
const distributionChart = ref(null)
const trendChartInstance = ref(null)
const distributionChartInstance = ref(null)

// Student attendance data
const attendanceByStudent = ref([])
const attendanceTrend = ref([])
const topAttendanceStudents = ref([])
const lowAttendanceStudents = ref([])

// Get the current month's start and end dates
const today = new Date()
const startDate = ref(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0])
const endDate = ref(new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0])

// Methods
const loadReportData = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Fetch attendance statistics from the API
    const result = await fetchAttendanceStats(startDate.value, endDate.value)
    stats.value = result.stats
    
    // Fetch daily attendance data for the trend chart
    await fetchDailyAttendanceData()
    
    // Fetch student attendance summary
    await fetchStudentAttendanceData()
    
    // Render charts
    renderTrendChart()
    renderDistributionChart()
  } catch (err) {
    error.value = 'Failed to load report data: ' + (err.message || 'Unknown error')
  } finally {
    loading.value = false
  }
}

const fetchDailyAttendanceData = async () => {
  try {
    // Call your endpoint that returns daily attendance data
    const { data } = await useFetch('/api/attendance/daily-stats', {
      method: 'GET',
      params: {
        startDate: startDate.value,
        endDate: endDate.value
      }
    })
    
    if (data.value) {
      attendanceTrend.value = data.value
    }
  } catch (err) {
    console.error('Error fetching daily attendance data:', err)
  }
}

const fetchStudentAttendanceData = async () => {
  try {
    // Call your endpoint that returns student attendance data
    const { data } = await useFetch('/api/attendance/student-stats', {
      method: 'GET',
      params: {
        startDate: startDate.value,
        endDate: endDate.value
      }
    })
    
    if (data.value) {
      attendanceByStudent.value = data.value
      
      // Sort by attendance rate
      const sortedStudents = [...attendanceByStudent.value].sort((a, b) => 
        b.attendanceRate - a.attendanceRate
      )
      
      // Get top 5 students
      topAttendanceStudents.value = sortedStudents.slice(0, 5)
      
      // Get bottom 5 students (with attendance rate < 80%)
      lowAttendanceStudents.value = sortedStudents
        .filter(s => s.attendanceRate < 80)
        .slice(-5)
        .reverse() // Reverse to show lowest first
    }
  } catch (err) {
    console.error('Error fetching student attendance data:', err)
  }
}

const applyPresetRange = (preset) => {
  const today = new Date()
  
  switch (preset) {
    case 'week':
      // Current week
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())
      startDate.value = startOfWeek.toISOString().split('T')[0]
      
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      endDate.value = endOfWeek.toISOString().split('T')[0]
      break
      
    case 'month':
      // Current month
      startDate.value = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString().split('T')[0]
      endDate.value = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        .toISOString().split('T')[0]
      break
      
    case 'quarter':
      // Current quarter
      const quarter = Math.floor(today.getMonth() / 3)
      startDate.value = new Date(today.getFullYear(), quarter * 3, 1)
        .toISOString().split('T')[0]
      endDate.value = new Date(today.getFullYear(), quarter * 3 + 3, 0)
        .toISOString().split('T')[0]
      break
      
    case 'year':
      // Current year
      startDate.value = new Date(today.getFullYear(), 0, 1)
        .toISOString().split('T')[0]
      endDate.value = new Date(today.getFullYear(), 11, 31)
        .toISOString().split('T')[0]
      break
  }
  
  loadReportData()
}

const renderTrendChart = () => {
  if (trendChartInstance.value) {
    trendChartInstance.value.destroy()
  }
  
  if (!trendChart.value || attendanceTrend.value.length === 0) return
  
  // Prepare data for chart
  const dates = attendanceTrend.value.map(item => formatDate(item.date))
  const presentData = attendanceTrend.value.map(item => item.present)
  const absentData = attendanceTrend.value.map(item => item.absent)
  const excusedData = attendanceTrend.value.map(item => item.excused)
  
  // Create chart
  trendChartInstance.value = new Chart(trendChart.value, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Present',
          data: presentData,
          backgroundColor: 'rgba(72, 187, 120, 0.2)',
          borderColor: 'rgb(72, 187, 120)',
          tension: 0.1,
          fill: true
        },
        {
          label: 'Absent',
          data: absentData,
          backgroundColor: 'rgba(245, 101, 101, 0.2)',
          borderColor: 'rgb(245, 101, 101)',
          tension: 0.1,
          fill: true
        },
        {
          label: 'Excused',
          data: excusedData,
          backgroundColor: 'rgba(236, 201, 75, 0.2)',
          borderColor: 'rgb(236, 201, 75)',
          tension: 0.1,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          stacked: false
        }
      }
    }
  })
}

const renderDistributionChart = () => {
  if (distributionChartInstance.value) {
    distributionChartInstance.value.destroy()
  }
  
  if (!distributionChart.value) return
  
  // Prepare data for chart
  const presentCount = stats.value.presentCount
  const absentCount = stats.value.absentCount
  const excusedCount = stats.value.excusedCount
  
  // Create chart
  distributionChartInstance.value = new Chart(distributionChart.value, {
    type: 'doughnut',
    data: {
      labels: ['Present', 'Absent', 'Excused'],
      datasets: [
        {
          data: [presentCount, absentCount, excusedCount],
          backgroundColor: [
            'rgb(72, 187, 120)',
            'rgb(245, 101, 101)',
            'rgb(236, 201, 75)'
          ],
          hoverOffset: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right'
        }
      }
    }
  })
}

const getInitials = (firstName, lastName) => {
  return firstName && lastName 
    ? `${firstName.charAt(0)}${lastName.charAt(0)}`
    : '??'
}

const downloadReport = (reportType) => {
  // Create CSV content based on data
  const csvContent = generateCsvContent(reportType)
  
  // Create a Blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${reportType}_${startDate.value}_to_${endDate.value}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const generateCsvContent = (reportType) => {
  // Generate different CSV content based on report type
  switch (reportType) {
    case 'attendance_summary':
      return `Date Range,${startDate.value} to ${endDate.value}
Total Students,${stats.value.uniqueStudents}
School Days,${stats.value.totalDays}
Present Count,${stats.value.presentCount}
Absent Count,${stats.value.absentCount}
Excused Count,${stats.value.excusedCount}
Attendance Rate,${Math.round(stats.value.presentRate)}%`
      
    case 'daily_attendance':
      // Generate daily attendance log
      let dailyContent = 'Date,Present,Absent,Excused,Rate\n'
      attendanceTrend.value.forEach(day => {
        const total = day.present + day.absent + day.excused
        const rate = Math.round((day.present / total) * 100)
        dailyContent += `${day.date},${day.present},${day.absent},${day.excused},${rate}%\n`
      })
      return dailyContent
      
    case 'student_details':
      // Student attendance details
      let studentContent = 'Student,Attendance Rate,Present,Absent,Excused\n'
      
      attendanceByStudent.value.forEach(student => {
        studentContent += `${student.firstName} ${student.lastName},${student.attendanceRate}%,${student.presentCount},${student.absentCount},${student.excusedCount}\n`
      })
      
      return studentContent
      
    case 'alerts':
      // Generate alerts for students with low attendance
      let alertsContent = 'Student,Attendance Rate,Present,Absent,Alert Level\n'
      
      lowAttendanceStudents.value.forEach(student => {
        let alertLevel = 'Medium'
        if (student.attendanceRate < 60) alertLevel = 'High'
        else if (student.attendanceRate < 80) alertLevel = 'Medium'
        else alertLevel = 'Low'
        
        alertsContent += `${student.firstName} ${student.lastName},${student.attendanceRate}%,${student.presentCount},${student.absentCount},${alertLevel}\n`
      })
      
      return alertsContent
      
    default:
      return 'No data available'
  }
}

// Watch for changes to date range
watch([startDate, endDate], () => {
  loadReportData()
})

// Initialize
onMounted(() => {
  loadReportData()
})
</script>

<style scoped>
.reports-wrapper {
  padding: 1rem;
}

.reports-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.stats-banner {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  background-color: hsl(var(--b1));
}

.stat {
  flex: 1;
  min-width: 120px;
  padding: 0.5rem;
}

.stat-title {
  font-size: 0.875rem;
  color: hsl(var(--bc) / 0.6);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.attendance-chart {
  height: 250px;
  margin-top: 1rem;
}

.loader {
  border: 5px solid hsl(var(--b3));
  border-top: 5px solid hsl(var(--p));
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>