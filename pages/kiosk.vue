<script setup lang="ts">
import { ref, computed, watch } from 'vue'

definePageMeta({
  layout: false, // No authenticated layout
})

interface Student {
  id: string
  name: string
  imageUrl: string | null
}

const students = ref<Student[]>([])
const selectedStudent = ref<Student | null>(null)
const searchQuery = ref('')
const loading = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | 'info'>('info')
const isClockedIn = ref(false)
const currentTime = ref(new Date())

// Update current time every second
let timeInterval: NodeJS.Timeout
onMounted(() => {
  fetchStudents()
  timeInterval = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
})

const formattedTime = computed(() => {
  return currentTime.value.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
})

const formattedDate = computed(() => {
  return currentTime.value.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const filteredStudents = computed(() => {
  if (!searchQuery.value) return students.value

  const query = searchQuery.value.toLowerCase()
  return students.value.filter(student =>
    student.name.toLowerCase().includes(query)
  )
})

const fetchStudents = async () => {
  try {
    const data = await $fetch('/api/public/students')
    students.value = data as Student[]
  } catch (error) {
    console.error('Failed to fetch students:', error)
    showMessage('Failed to load students', 'error')
  }
}

const selectStudent = async (student: Student) => {
  selectedStudent.value = student
  searchQuery.value = ''

  // Check current clock status
  try {
    const status = await $fetch(`/api/public/attendance/status?studentId=${student.id}`)
    isClockedIn.value = status.isClockedIn
  } catch (error) {
    console.error('Failed to check status:', error)
  }
}

const clearSelection = () => {
  selectedStudent.value = null
  isClockedIn.value = false
  message.value = ''
}

const clockIn = async () => {
  if (!selectedStudent.value) return

  try {
    loading.value = true
    const response = await $fetch('/api/public/attendance/clock-in', {
      method: 'POST',
      body: { studentId: selectedStudent.value.id },
    })

    isClockedIn.value = true
    showMessage(`${response.studentName} clocked in successfully!`, 'success')

    // Auto-clear after 3 seconds
    setTimeout(() => {
      clearSelection()
    }, 3000)
  } catch (error: any) {
    showMessage(error.data?.message || 'Failed to clock in', 'error')
  } finally {
    loading.value = false
  }
}

const clockOut = async () => {
  if (!selectedStudent.value) return

  try {
    loading.value = true
    const response = await $fetch('/api/public/attendance/clock-out', {
      method: 'POST',
      body: { studentId: selectedStudent.value.id },
    })

    isClockedIn.value = false
    showMessage(`${response.studentName} clocked out successfully!`, 'success')

    // Auto-clear after 3 seconds
    setTimeout(() => {
      clearSelection()
    }, 3000)
  } catch (error: any) {
    showMessage(error.data?.message || 'Failed to clock out', 'error')
  } finally {
    loading.value = false
  }
}

const showMessage = (msg: string, type: 'success' | 'error' | 'info') => {
  message.value = msg
  messageType.value = type

  setTimeout(() => {
    message.value = ''
  }, 5000)
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-primary-800 mb-2">Student Check-In</h1>
        <p class="text-2xl text-primary-600 font-semibold">{{ formattedTime }}</p>
        <p class="text-sm text-primary-500">{{ formattedDate }}</p>
      </div>

      <!-- Main Card -->
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <!-- Message Display -->
        <div
          v-if="message"
          class="mb-6 p-4 rounded-lg text-center font-semibold"
          :class="{
            'bg-green-100 text-green-800': messageType === 'success',
            'bg-red-100 text-red-800': messageType === 'error',
            'bg-blue-100 text-blue-800': messageType === 'info',
          }"
        >
          {{ message }}
        </div>

        <!-- Student Selection -->
        <div v-if="!selectedStudent">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            Select Your Name
          </label>

          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search for your name..."
            class="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none mb-4"
          />

          <div class="max-h-96 overflow-y-auto border-2 border-gray-200 rounded-lg">
            <button
              v-for="student in filteredStudents"
              :key="student.id"
              @click="selectStudent(student)"
              class="w-full px-4 py-4 text-left hover:bg-primary-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3 transition-colors"
            >
              <div
                v-if="student.imageUrl"
                class="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0"
              >
                <img :src="student.imageUrl" :alt="student.name" class="w-full h-full object-cover" />
              </div>
              <div
                v-else
                class="w-12 h-12 rounded-full bg-primary-200 flex items-center justify-center flex-shrink-0"
              >
                <span class="text-primary-800 font-bold text-lg">
                  {{ student.name.charAt(0) }}
                </span>
              </div>
              <span class="text-lg font-medium text-gray-800">{{ student.name }}</span>
            </button>

            <div v-if="filteredStudents.length === 0" class="p-8 text-center text-gray-500">
              No students found
            </div>
          </div>
        </div>

        <!-- Clock In/Out Interface -->
        <div v-else class="text-center">
          <!-- Student Info -->
          <div class="mb-8">
            <div
              v-if="selectedStudent.imageUrl"
              class="w-24 h-24 rounded-full bg-gray-200 overflow-hidden mx-auto mb-4"
            >
              <img :src="selectedStudent.imageUrl" :alt="selectedStudent.name" class="w-full h-full object-cover" />
            </div>
            <div
              v-else
              class="w-24 h-24 rounded-full bg-primary-200 flex items-center justify-center mx-auto mb-4"
            >
              <span class="text-primary-800 font-bold text-3xl">
                {{ selectedStudent.name.charAt(0) }}
              </span>
            </div>
            <h2 class="text-2xl font-bold text-gray-800">{{ selectedStudent.name }}</h2>
            <p class="text-sm text-gray-500 mt-2">
              {{ isClockedIn ? 'Currently Checked In' : 'Not Checked In' }}
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="space-y-4">
            <button
              v-if="!isClockedIn"
              @click="clockIn"
              :disabled="loading"
              class="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold text-xl rounded-lg shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="!loading">Clock In</span>
              <span v-else>Processing...</span>
            </button>

            <button
              v-else
              @click="clockOut"
              :disabled="loading"
              class="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold text-xl rounded-lg shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="!loading">Clock Out</span>
              <span v-else>Processing...</span>
            </button>

            <button
              @click="clearSelection"
              :disabled="loading"
              class="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-6 text-sm text-primary-600">
        <p>Need help? Contact the front desk</p>
      </div>
    </div>
  </div>
</template>
