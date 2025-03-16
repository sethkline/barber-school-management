<template>
  <div class="attendance-wrapper">
    <div class="attendance-header">
      <h1 class="text-2xl font-bold">Daily Attendance</h1>
      <div class="attendance-date-selector">
        <button 
          @click="prevDay" 
          class="btn btn-circle btn-sm mr-2">
          <i class="fas fa-chevron-left"></i>
        </button>
        <div class="date-picker-wrapper">
          <input 
            type="date" 
            v-model="selectedDate" 
            class="input input-bordered" 
            @change="loadAttendance"
          />
        </div>
        <button 
          @click="nextDay" 
          class="btn btn-circle btn-sm ml-2"
          :disabled="isToday">
          <i class="fas fa-chevron-right"></i>
        </button>
        <button 
          @click="goToToday" 
          class="btn btn-sm ml-4"
          :disabled="isToday">
          Today
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loader"></div>
      <p>Loading attendance data...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p class="text-red-500">{{ error }}</p>
      <button @click="loadAttendance" class="btn btn-primary mt-4">
        Try Again
      </button>
    </div>

    <div v-else class="attendance-container">
      <div class="stats-banner">
        <div class="stat">
          <div class="stat-title">Total Students</div>
          <div class="stat-value">{{ students.length }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">Present</div>
          <div class="stat-value text-success">
            {{ presentCount }}
          </div>
          <div class="stat-desc">
            {{ presentPercentage }}% Attendance Rate
          </div>
        </div>
        <div class="stat">
          <div class="stat-title">Absent</div>
          <div class="stat-value text-error">
            {{ absentCount }}
          </div>
        </div>
        <div class="stat">
          <div class="stat-title">Excused</div>
          <div class="stat-value text-warning">
            {{ excusedCount }}
          </div>
        </div>
        <div class="stat">
          <div class="stat-title">Unmarked</div>
          <div class="stat-value text-info">
            {{ unmarkedCount }}
          </div>
        </div>
      </div>

      <div class="attendance-actions mt-4 mb-6">
        <div class="flex items-center">
          <div class="search-container w-64 mr-4">
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Search students..."
              class="input input-bordered w-full" 
            />
          </div>
          
          <div class="filter-container mr-4">
            <select v-model="statusFilter" class="select select-bordered">
              <option value="">All Statuses</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="excused">Excused</option>
              <option value="unmarked">Unmarked</option>
            </select>
          </div>
          
          <button 
            @click="openBulkMarkModal" 
            class="btn btn-primary"
            :disabled="selectedStudents.length === 0">
            Mark {{ selectedStudents.length }} Selected
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="table w-full">
          <thead>
            <tr>
              <th>
                <input 
                  type="checkbox" 
                  class="checkbox" 
                  :checked="allSelected"
                  @change="toggleSelectAll" 
                />
              </th>
              <th>Student</th>
              <th>Status</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Duration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in filteredStudents" :key="student.student_id" 
                :class="{ 'bg-base-200': selectedStudents.includes(student.student_id) }">
              <td>
                <input 
                  type="checkbox" 
                  class="checkbox" 
                  :checked="selectedStudents.includes(student.student_id)"
                  @change="toggleSelect(student.student_id)" 
                />
              </td>
              <td>
                <div class="flex items-center space-x-3">
                  <div class="avatar placeholder">
                    <div class="bg-neutral-focus text-neutral-content rounded-full w-8">
                      <span>{{ student.first_name[0] }}{{ student.last_name[0] }}</span>
                    </div>
                  </div>
                  <div>
                    <div class="font-bold">{{ student.first_name }} {{ student.last_name }}</div>
                    <div class="text-sm opacity-50">{{ student.email }}</div>
                  </div>
                </div>
              </td>
              <td>
                <div :class="getStatusClass(student.status)">
                  {{ student.status }}
                </div>
              </td>
              <td>{{ formatTime(student.clock_in) }}</td>
              <td>{{ formatTime(student.clock_out) }}</td>
              <td>{{ calculateDuration(student.clock_in, student.clock_out) }}</td>
              <td>
                <div class="btn-group">
                  <button 
                    v-if="student.status === 'unmarked' || student.status === 'absent' || student.status === 'excused'"
                    @click="markPresent(student.student_id)" 
                    class="btn btn-xs btn-success">
                    Present
                  </button>
                  <button 
                    v-if="student.status === 'unmarked' || student.status === 'present' || student.status === 'excused'"
                    @click="markAbsent(student.student_id)" 
                    class="btn btn-xs btn-error">
                    Absent
                  </button>
                  <button 
                    v-if="student.status === 'unmarked' || student.status === 'present' || student.status === 'absent'"
                    @click="openExcusedModal(student.student_id)" 
                    class="btn btn-xs btn-warning">
                    Excused
                  </button>
                  <button 
                    v-if="student.status === 'present' && !student.clock_in"
                    @click="clockIn(student.student_id)" 
                    class="btn btn-xs btn-primary">
                    Clock In
                  </button>
                  <button 
                    v-if="student.status === 'present' && student.clock_in && !student.clock_out"
                    @click="clockOut(student.student_id)" 
                    class="btn btn-xs btn-primary">
                    Clock Out
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modals -->
    <!-- Excused Modal -->
    <div class="modal" :class="{ 'modal-open': showExcusedModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Mark Student as Excused</h3>
        <div class="py-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Reason for Excuse</span>
            </label>
            <textarea v-model="excuseReason" class="textarea textarea-bordered" placeholder="Enter reason..."></textarea>
          </div>
        </div>
        <div class="modal-action">
          <button @click="closeExcusedModal" class="btn">Cancel</button>
          <button @click="markExcused" class="btn btn-primary">Submit</button>
        </div>
      </div>
    </div>

    <!-- Bulk Mark Modal -->
    <div class="modal" :class="{ 'modal-open': showBulkMarkModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Mark Selected Students</h3>
        <div class="py-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Select Status</span>
            </label>
            <select v-model="bulkStatus" class="select select-bordered w-full">
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="excused">Excused</option>
            </select>
          </div>
          <div class="form-control" v-if="bulkStatus === 'excused'">
            <label class="label">
              <span class="label-text">Reason</span>
            </label>
            <textarea v-model="bulkReason" class="textarea textarea-bordered" placeholder="Enter reason..."></textarea>
          </div>
        </div>
        <div class="modal-action">
          <button @click="closeBulkMarkModal" class="btn">Cancel</button>
          <button @click="applyBulkMark" class="btn btn-primary">Apply to {{ selectedStudents.length }} Students</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAttendance } from '~/composables/useAttendance'

const { 
  fetchDailyAttendance, 
  clockInStudent, 
  clockOutStudent, 
  updateAttendanceStatus,
  formatTime,
  calculateDuration
} = useAttendance()

// State
const selectedDate = ref(new Date().toISOString().split('T')[0])
const loading = ref(true)
const error = ref(null)
const students = ref([])
const searchQuery = ref('')
const statusFilter = ref('')
const selectedStudents = ref([])
const showExcusedModal = ref(false)
const excuseReason = ref('')
const excusedStudentId = ref(null)
const showBulkMarkModal = ref(false)
const bulkStatus = ref('present')
const bulkReason = ref('')

// Computed properties
const isToday = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return selectedDate.value === today
})

const presentCount = computed(() => 
  students.value.filter(s => s.status === 'present').length
)

const absentCount = computed(() => 
  students.value.filter(s => s.status === 'absent').length
)

const excusedCount = computed(() => 
  students.value.filter(s => s.status === 'excused').length
)

const unmarkedCount = computed(() => 
  students.value.filter(s => s.status === 'unmarked').length
)

const presentPercentage = computed(() => {
  const marked = presentCount.value + absentCount.value + excusedCount.value
  if (marked === 0) return 0
  return Math.round((presentCount.value / students.value.length) * 100)
})

const filteredStudents = computed(() => {
  let result = [...students.value]
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(student => 
      student.first_name.toLowerCase().includes(query) || 
      student.last_name.toLowerCase().includes(query) || 
      student.email.toLowerCase().includes(query)
    )
  }
  
  // Apply status filter
  if (statusFilter.value) {
    result = result.filter(student => student.status === statusFilter.value)
  }
  
  return result
})

const allSelected = computed(() => {
  return filteredStudents.value.length > 0 && 
         filteredStudents.value.every(student => 
           selectedStudents.value.includes(student.student_id)
         )
})

// Methods
const loadAttendance = async () => {
  loading.value = true
  error.value = null
  
  try {
    const result = await fetchDailyAttendance(selectedDate.value)
    students.value = result.students
    // Clear selection when loading new data
    selectedStudents.value = []
  } catch (err) {
    error.value = 'Failed to load attendance data: ' + (err.message || 'Unknown error')
  } finally {
    loading.value = false
  }
}

const prevDay = () => {
  const date = new Date(selectedDate.value)
  date.setDate(date.getDate() - 1)
  selectedDate.value = date.toISOString().split('T')[0]
}

const nextDay = () => {
  if (isToday.value) return
  
  const date = new Date(selectedDate.value)
  date.setDate(date.getDate() + 1)
  selectedDate.value = date.toISOString().split('T')[0]
}

const goToToday = () => {
  selectedDate.value = new Date().toISOString().split('T')[0]
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedStudents.value = []
  } else {
    selectedStudents.value = filteredStudents.value.map(s => s.student_id)
  }
}

const toggleSelect = (studentId) => {
  const index = selectedStudents.value.indexOf(studentId)
  if (index === -1) {
    selectedStudents.value.push(studentId)
  } else {
    selectedStudents.value.splice(index, 1)
  }
}

const getStatusClass = (status) => {
  switch (status) {
    case 'present': return 'badge badge-success'
    case 'absent': return 'badge badge-error'
    case 'excused': return 'badge badge-warning'
    default: return 'badge badge-ghost'
  }
}

const markPresent = async (studentId) => {
  try {
    await updateAttendanceStatus(studentId, 'present', selectedDate.value)
    await loadAttendance()
  } catch (err) {
    console.error('Error marking student as present:', err)
    // Show error notification
  }
}

const markAbsent = async (studentId) => {
  try {
    await updateAttendanceStatus(studentId, 'absent', selectedDate.value)
    await loadAttendance()
  } catch (err) {
    console.error('Error marking student as absent:', err)
    // Show error notification
  }
}

const openExcusedModal = (studentId) => {
  excusedStudentId.value = studentId
  excuseReason.value = ''
  showExcusedModal.value = true
}

const closeExcusedModal = () => {
  showExcusedModal.value = false
  excusedStudentId.value = null
}

const markExcused = async () => {
  try {
    await updateAttendanceStatus(
      excusedStudentId.value, 
      'excused', 
      selectedDate.value, 
      excuseReason.value
    )
    closeExcusedModal()
    await loadAttendance()
  } catch (err) {
    console.error('Error marking student as excused:', err)
    // Show error notification
  }
}

const clockIn = async (studentId) => {
  try {
    await clockInStudent(studentId, selectedDate.value)
    await loadAttendance()
  } catch (err) {
    console.error('Error clocking in student:', err)
    // Show error notification
  }
}

const clockOut = async (studentId) => {
  try {
    await clockOutStudent(studentId, selectedDate.value)
    await loadAttendance()
  } catch (err) {
    console.error('Error clocking out student:', err)
    // Show error notification
  }
}

const openBulkMarkModal = () => {
  bulkStatus.value = 'present'
  bulkReason.value = ''
  showBulkMarkModal.value = true
}

const closeBulkMarkModal = () => {
  showBulkMarkModal.value = false
}

const applyBulkMark = async () => {
  try {
    // Process each selected student
    const promises = selectedStudents.value.map(studentId => {
      return updateAttendanceStatus(
        studentId,
        bulkStatus.value,
        selectedDate.value,
        bulkStatus.value === 'excused' ? bulkReason.value : undefined
      )
    })
    
    await Promise.all(promises)
    closeBulkMarkModal()
    await loadAttendance()
  } catch (err) {
    console.error('Error applying bulk attendance update:', err)
    // Show error notification
  }
}

// Watch for date changes
watch(selectedDate, () => {
  loadAttendance()
})

// Initial load
onMounted(() => {
  loadAttendance()
})
</script>

<style scoped>
.attendance-wrapper {
  padding: 1rem;
}

.attendance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.attendance-date-selector {
  display: flex;
  align-items: center;
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
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat {
  background-color: hsl(var(--b1));
  padding: 1rem;
  border-radius: 0.5rem;
  flex: 1;
}

.stat-title {
  font-size: 0.875rem;
  color: hsl(var(--bc) / 0.6);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
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