<template>
  <div class="attendance-history-wrapper">
    <div class="attendance-header">
      <div>
        <h1 class="text-2xl font-bold">Student Attendance History</h1>
        <p v-if="student">{{ student.first_name }} {{ student.last_name }}</p>
      </div>
      <div class="date-range-selector">
        <div class="form-control">
          <div class="input-group">
            <span>From</span>
            <input 
              type="date" 
              v-model="startDate" 
              class="input input-bordered" 
              @change="loadAttendanceHistory"
            />
            <span>To</span>
            <input 
              type="date" 
              v-model="endDate" 
              class="input input-bordered" 
              @change="loadAttendanceHistory"
            />
            <button @click="applyPresetRange('month')" class="btn">This Month</button>
            <button @click="applyPresetRange('semester')" class="btn">Semester</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loader"></div>
      <p>Loading attendance history...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p class="text-red-500">{{ error }}</p>
      <button @click="loadAttendanceHistory" class="btn btn-primary mt-4">
        Try Again
      </button>
    </div>

    <div v-else class="attendance-container">
      <!-- Summary Statistics -->
      <div class="stats-card shadow-xl mb-6">
        <div class="stats-grid">
          <div class="stat">
            <div class="stat-title">Period</div>
            <div class="stat-desc">{{ formatDate(startDate) }} - {{ formatDate(endDate) }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Total Days</div>
            <div class="stat-value">{{ summary.totalDays }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Present</div>
            <div class="stat-value text-success">{{ summary.presentCount }}</div>
            <div class="stat-desc">{{ Math.round(summary.presentRate) }}% Attendance Rate</div>
          </div>
          <div class="stat">
            <div class="stat-title">Absent</div>
            <div class="stat-value text-error">{{ summary.absentCount }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Excused</div>
            <div class="stat-value text-warning">{{ summary.excusedCount }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Total Hours</div>
            <div class="stat-value">{{ formatHours(summary.totalHours) }}</div>
            <div class="stat-desc">{{ formatHours(summary.averageHours) }} avg/day</div>
          </div>
        </div>

        <!-- Attendance Chart -->
        <div class="attendance-chart">
          <canvas ref="attendanceChart" width="400" height="200"></canvas>
        </div>
      </div>

      <!-- Detailed Records Table -->
      <div class="overflow-x-auto">
        <h2 class="text-xl font-semibold mb-4">Attendance Records</h2>

        <div class="filter-container mb-4">
          <select v-model="statusFilter" class="select select-bordered">
            <option value="">All Statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="excused">Excused</option>
          </select>
        </div>

        <table class="table w-full">
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Duration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in filteredRecords" :key="record.id">
              <td>{{ formatDate(record.attendance_date) }}</td>
              <td>
                <div :class="getStatusClass(record.status)">
                  {{ record.status }}
                </div>
              </td>
              <td>{{ formatTime(record.clock_in) }}</td>
              <td>{{ formatTime(record.clock_out) }}</td>
              <td>{{ calculateDuration(record.clock_in, record.clock_out) }}</td>
              <td>
                <div class="btn-group">
                  <button 
                    @click="openEditModal(record)" 
                    class="btn btn-xs btn-outline">
                    Edit
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredRecords.length === 0">
              <td colspan="6" class="text-center py-4">
                No attendance records found for the selected period.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit Record Modal -->
    <div class="modal" :class="{ 'modal-open': showEditModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Edit Attendance Record</h3>
        <div class="py-4" v-if="editingRecord">
          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Date</span>
            </label>
            <input 
              type="date" 
              v-model="editingRecord.attendance_date" 
              class="input input-bordered" 
            />
          </div>
          
          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Status</span>
            </label>
            <select v-model="editingRecord.status" class="select select-bordered w-full">
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="excused">Excused</option>
            </select>
          </div>
          
          <div class="form-control mb-4" v-if="editingRecord.status === 'present'">
            <label class="label">
              <span class="label-text">Clock In</span>
            </label>
            <input 
              type="datetime-local" 
              v-model="editingRecord.clock_in_formatted" 
              class="input input-bordered" 
            />
          </div>
          
          <div class="form-control mb-4" v-if="editingRecord.status === 'present' && editingRecord.clock_in">
            <label class="label">
              <span class="label-text">Clock Out</span>
            </label>
            <input 
              type="datetime-local" 
              v-model="editingRecord.clock_out_formatted" 
              class="input input-bordered" 
            />
          </div>
        </div>
        <div class="modal-action">
          <button @click="closeEditModal" class="btn">Cancel</button>
          <button @click="saveRecord" class="btn btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAttendance } from '~/composables/useAttendance'
import { useRoute } from 'vue-router'
import Chart from 'chart.js/auto'

const route = useRoute()
const studentId = computed(() => route.params.id)

const { 
  fetchStudentAttendance, 
  updateAttendanceStatus,
  formatTime,
  formatDate,
  calculateDuration
} = useAttendance()

// State
const loading = ref(true)
const error = ref(null)
const student = ref(null)
const records = ref([])
const summary = ref({
  totalDays: 0,
  presentCount: 0,
  absentCount: 0,
  excusedCount: 0,
  presentRate: 0,
  totalHours: 0,
  averageHours: 0
})
const statusFilter = ref('')
const showEditModal = ref(false)
const editingRecord = ref(null)
const attendanceChart = ref(null)
const chartInstance = ref(null)

// Get the current month's start and end dates
const today = new Date()
const startDate = ref(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0])
const endDate = ref(new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0])

// Computed properties
const filteredRecords = computed(() => {
  if (!statusFilter.value) return records.value
  
  return records.value.filter(record => record.status === statusFilter.value)
})

// Methods
const loadAttendanceHistory = async () => {
  if (!studentId.value) return
  
  loading.value = true
  error.value = null
  
  try {
    const result = await fetchStudentAttendance(
      studentId.value, 
      startDate.value, 
      endDate.value
    )
    
    records.value = result.records
    summary.value = result.summary
    student.value = await fetchStudentDetails(studentId.value)
    
    // Update the chart with new data
    renderAttendanceChart()
  } catch (err) {
    error.value = 'Failed to load attendance history: ' + (err.message || 'Unknown error')
  } finally {
    loading.value = false
  }
}

const fetchStudentDetails = async (id) => {
  // You would typically call your student service here
  // For now, we'll just use a mock implementation
  try {
    const { data } = await useFetch(`/api/students/${id}`)
    return data.value
  } catch (error) {
    console.error('Error fetching student details:', error)
    return { first_name: 'Student', last_name: `#${id}` }
  }
}

const applyPresetRange = (preset) => {
  const today = new Date()
  
  if (preset === 'month') {
    // Current month
    startDate.value = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString().split('T')[0]
    endDate.value = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString().split('T')[0]
  } else if (preset === 'semester') {
    // Approximate semester (adjust as needed for your school calendar)
    const currentMonth = today.getMonth()
    
    if (currentMonth >= 0 && currentMonth <= 4) {
      // Spring semester (January-May)
      startDate.value = new Date(today.getFullYear(), 0, 1)
        .toISOString().split('T')[0]
      endDate.value = new Date(today.getFullYear(), 4, 31)
        .toISOString().split('T')[0]
    } else if (currentMonth >= 5 && currentMonth <= 7) {
      // Summer semester (June-August)
      startDate.value = new Date(today.getFullYear(), 5, 1)
        .toISOString().split('T')[0]
      endDate.value = new Date(today.getFullYear(), 7, 31)
        .toISOString().split('T')[0]
    } else {
      // Fall semester (September-December)
      startDate.value = new Date(today.getFullYear(), 8, 1)
        .toISOString().split('T')[0]
      endDate.value = new Date(today.getFullYear(), 11, 31)
        .toISOString().split('T')[0]
    }
  }
  
  loadAttendanceHistory()
}

const getStatusClass = (status) => {
  switch (status) {
    case 'present': return 'badge badge-success'
    case 'absent': return 'badge badge-error'
    case 'excused': return 'badge badge-warning'
    default: return 'badge badge-ghost'
  }
}

const formatHours = (hours) => {
  if (isNaN(hours) || hours === 0) return '0h'
  
  const roundedHours = Math.round(hours * 10) / 10
  return `${roundedHours}h`
}

const openEditModal = (record) => {
  // Create a copy of the record for editing
  editingRecord.value = { ...record }
  
  // Format dates for datetime-local inputs
  if (editingRecord.value.clock_in) {
    editingRecord.value.clock_in_formatted = new Date(editingRecord.value.clock_in)
      .toISOString().slice(0, 16)
  }
  
  if (editingRecord.value.clock_out) {
    editingRecord.value.clock_out_formatted = new Date(editingRecord.value.clock_out)
      .toISOString().slice(0, 16)
  }
  
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editingRecord.value = null
}

const saveRecord = async () => {
  if (!editingRecord.value) return
  
  try {
    // Convert formatted datetime values back to ISO strings
    if (editingRecord.value.clock_in_formatted) {
      editingRecord.value.clock_in = new Date(editingRecord.value.clock_in_formatted).toISOString()
    }
    
    if (editingRecord.value.clock_out_formatted) {
      editingRecord.value.clock_out = new Date(editingRecord.value.clock_out_formatted).toISOString()
    }
    
    // Call your API to update the record
    await updateAttendanceRecord(editingRecord.value.id, {
      status: editingRecord.value.status,
      attendance_date: editingRecord.value.attendance_date,
      clock_in: editingRecord.value.clock_in,
      clock_out: editingRecord.value.clock_out
    })
    
    closeEditModal()
    await loadAttendanceHistory()
  } catch (err) {
    console.error('Error updating attendance record:', err)
    // Show error notification
  }
}

const updateAttendanceRecord = async (id, data) => {
  // This would call your attendance service
  const { data: response } = await useFetch(`/api/attendance/${id}`, {
    method: 'PUT',
    body: data
  })
  return response.value
}

const renderAttendanceChart = () => {
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }
  
  if (!attendanceChart.value) return
  
  // Prepare data for chart
  const dates = []
  const statuses = {}
  
  // Sort records by date
  const sortedRecords = [...records.value].sort((a, b) => {
    return new Date(a.attendance_date) - new Date(b.attendance_date)
  })
  
  // Extract dates and status counts
  sortedRecords.forEach(record => {
    const date = formatDate(record.attendance_date)
    if (!dates.includes(date)) {
      dates.push(date)
    }
  })
  
  // Create chart
  chartInstance.value = new Chart(attendanceChart.value, {
    type: 'bar',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Present',
          data: dates.map(date => {
            return sortedRecords.find(
              r => formatDate(r.attendance_date) === date && r.status === 'present'
            ) ? 1 : 0
          }),
          backgroundColor: 'rgba(72, 187, 120, 0.6)',
          borderColor: 'rgb(72, 187, 120)',
          borderWidth: 1
        },
        {
          label: 'Absent',
          data: dates.map(date => {
            return sortedRecords.find(
              r => formatDate(r.attendance_date) === date && r.status === 'absent'
            ) ? 1 : 0
          }),
          backgroundColor: 'rgba(245, 101, 101, 0.6)',
          borderColor: 'rgb(245, 101, 101)',
          borderWidth: 1
        },
        {
          label: 'Excused',
          data: dates.map(date => {
            return sortedRecords.find(
              r => formatDate(r.attendance_date) === date && r.status === 'excused'
            ) ? 1 : 0
          }),
          backgroundColor: 'rgba(236, 201, 75, 0.6)',
          borderColor: 'rgb(236, 201, 75)',
          borderWidth: 1
        }
      ]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 1,
          ticks: {
            stepSize: 1
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false
    }
  })
}

// Watch for changes to date range
watch([startDate, endDate], () => {
  loadAttendanceHistory()
})

// Watch for changes to studentId
watch(studentId, () => {
  loadAttendanceHistory()
})

// Initialize
onMounted(() => {
  loadAttendanceHistory()
})
</script>

<style scoped>
.attendance-history-wrapper {
  padding: 1rem;
}

.attendance-header {
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

.stats-card {
  background-color: hsl(var(--b1));
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat {
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
  margin-top: 1.5rem;
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