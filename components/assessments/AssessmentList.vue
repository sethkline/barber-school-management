<template>
  <div class="assessment-list">
    <!-- Filters -->
    <div class="bg-white p-4 rounded-lg shadow-sm mb-4">
      <div class="flex flex-wrap gap-4">
        <!-- Student Filter (only when not in student context) -->
        <div v-if="!studentId" class="flex-1 min-w-[250px]">
          <label class="block text-sm font-medium text-gray-700 mb-1">Student</label>
          <select 
            v-model="selectedStudent"
            @change="onStudentChange"
            class="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
          >
            <option value="">All Students</option>
            <option v-for="student in students" :key="student.id" :value="student.id">
              {{ student.first_name }} {{ student.last_name }}
            </option>
          </select>
        </div>
        
        <!-- Assessment Type Filter -->
        <div class="flex-1 min-w-[250px]">
          <label class="block text-sm font-medium text-gray-700 mb-1">Assessment Type</label>
          <select 
            v-model="selectedType"
            @change="onTypeChange"
            class="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
          >
            <option value="">All Types</option>
            <option v-for="type in assessmentTypes" :key="type" :value="type">
              {{ type }}
            </option>
          </select>
        </div>
        
        <!-- Date Range Filters -->
        <div class="flex-1 min-w-[250px]">
          <label class="block text-sm font-medium text-gray-700 mb-1">From Date</label>
          <input 
            type="date"
            v-model="startDate"
            @change="onDateChange"
            class="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
          />
        </div>
        
        <div class="flex-1 min-w-[250px]">
          <label class="block text-sm font-medium text-gray-700 mb-1">To Date</label>
          <input 
            type="date"
            v-model="endDate"
            @change="onDateChange"
            class="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
          />
        </div>
      </div>
    </div>
    
    <!-- Assessments Table -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <!-- Table Header with Create Button -->
      <div class="flex justify-between items-center p-4 border-b">
        <h2 class="text-xl font-semibold">Assessments</h2>
        <button 
          @click="$emit('create')"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Assessment
        </button>
      </div>
      
      <!-- Loading State -->
      <div v-if="isLoading" class="p-8 text-center">
        <p class="text-gray-500">Loading assessments...</p>
      </div>
      
      <!-- Empty State -->
      <div v-else-if="assessments.length === 0" class="p-8 text-center">
        <p class="text-gray-500">No assessments found.</p>
      </div>
      
      <!-- Assessments Table -->
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th v-if="!studentId" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="assessment in assessments" :key="assessment.id">
              <td class="px-6 py-4 whitespace-nowrap">
                {{ formatDate(assessment.assessment_date) }}
              </td>
              <td v-if="!studentId" class="px-6 py-4 whitespace-nowrap">
                {{ getStudentName(assessment.student_id) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                {{ assessment.assessment_type }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getScoreClass(assessment.score)"
                >
                  {{ assessment.score }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900 truncate max-w-xs" :title="assessment.comment">
                  {{ assessment.comment || '-' }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button 
                  @click="$emit('edit', assessment.id)"
                  class="text-blue-600 hover:text-blue-900 mr-3"
                >
                  Edit
                </button>
                <button 
                  @click="confirmDelete(assessment.id)"
                  class="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      <div v-if="totalPages > 1" class="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6">
        <div class="flex items-center justify-between">
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Showing <span class="font-medium">{{ (currentPage - 1) * limit + 1 }}</span> to
                <span class="font-medium">{{ Math.min(currentPage * limit, totalCount) }}</span> of
                <span class="font-medium">{{ totalCount }}</span> results
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  @click="changePage(currentPage - 1)"
                  :disabled="currentPage === 1"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  :class="{ 'opacity-50 cursor-not-allowed': currentPage === 1 }"
                >
                  Previous
                </button>
                
                <button
                  v-for="page in displayedPages"
                  :key="page"
                  @click="changePage(page)"
                  class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50"
                  :class="page === currentPage ? 'bg-blue-50 text-blue-600 z-10' : 'text-gray-500'"
                >
                  {{ page }}
                </button>
                
                <button
                  @click="changePage(currentPage + 1)"
                  :disabled="currentPage === totalPages"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  :class="{ 'opacity-50 cursor-not-allowed': currentPage === totalPages }"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-xl max-w-md mx-auto">
        <h3 class="text-lg font-semibold mb-4">Confirm Deletion</h3>
        <p class="mb-6">Are you sure you want to delete this assessment? This action cannot be undone.</p>
        <div class="flex justify-end space-x-3">
          <button 
            @click="showDeleteModal = false"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button 
            @click="handleDelete"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            :disabled="isDeletingAssessment"
          >
            {{ isDeletingAssessment ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAssessments } from '~/composables/useAssessments'

const props = defineProps({
  studentId: {
    type: String,
    default: ''
  },
  limit: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits(['create', 'edit', 'delete'])

// State
const selectedStudent = ref(props.studentId || '')
const selectedType = ref('')
const startDate = ref('')
const endDate = ref('')
const students = ref<any[]>([])
const showDeleteModal = ref(false)
const assessmentToDelete = ref<string | null>(null)
const isDeletingAssessment = ref(false)

// Get assessments composable
const { 
  assessments,
  assessmentTypes,
  totalCount,
  currentPage,
  totalPages,
  isLoading,
  error,
  fetchAssessments,
  fetchAssessmentTypes,
  deleteAssessment,
  setPage,
  setFilter
} = useAssessments()

// Computed properties for pagination
const displayedPages = computed(() => {
  const totalPagesToShow = 5
  const pages: number[] = []
  
  if (totalPages.value <= totalPagesToShow) {
    // Show all pages if there are fewer than totalPagesToShow
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i)
    }
  } else {
    // Calculate range to show
    const halfRange = Math.floor(totalPagesToShow / 2)
    let start = Math.max(1, currentPage.value - halfRange)
    let end = Math.min(totalPages.value, start + totalPagesToShow - 1)
    
    // Adjust range if we're at the edges
    if (end - start + 1 < totalPagesToShow) {
      start = Math.max(1, end - totalPagesToShow + 1)
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
  }
  
  return pages
})

// Initialize data on component mount
onMounted(async () => {
  // Initialize filters
  if (props.studentId) {
    setFilter('studentId', props.studentId)
  }
  
  // Fetch assessment types
  await fetchAssessmentTypes()
  
  // Fetch assessments
  await fetchAssessments()
  
  // If not in student context, load student list for filtering
  if (!props.studentId) {
    try {
      const response = await fetch('/api/students')
      const data = await response.json()
      students.value = data.data || []
    } catch (error) {
      console.error('Failed to load students:', error)
    }
  }
})

// Watch for changes in props
watch(() => props.studentId, (newVal) => {
  if (newVal !== selectedStudent.value) {
    selectedStudent.value = newVal
    setFilter('studentId', newVal)
  }
})

// Filter change handlers
function onStudentChange() {
  setFilter('studentId', selectedStudent.value)
}

function onTypeChange() {
  setFilter('assessmentType', selectedType.value)
}

function onDateChange() {
  if (startDate.value) {
    setFilter('startDate', startDate.value)
  }
  
  if (endDate.value) {
    setFilter('endDate', endDate.value)
  }
}

// Pagination handler
function changePage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    setPage(page)
  }
}

// Format date for display
function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A'
  
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

// Get student name from ID
function getStudentName(studentId: string | null): string {
  if (!studentId) return 'N/A'
  
  const student = students.value.find(s => s.id === studentId)
  return student 
    ? `${student.first_name} ${student.last_name}`
    : 'Unknown Student'
}

// Get appropriate CSS class based on score
function getScoreClass(score: number | null): string {
  if (score === null) return 'bg-gray-100 text-gray-800'
  
  if (score >= 90) return 'bg-green-100 text-green-800'
  if (score >= 80) return 'bg-blue-100 text-blue-800'
  if (score >= 70) return 'bg-yellow-100 text-yellow-800'
  if (score >= 60) return 'bg-orange-100 text-orange-800'
  return 'bg-red-100 text-red-800'
}

// Delete handlers
function confirmDelete(id: string) {
  assessmentToDelete.value = id
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!assessmentToDelete.value) return
  
  isDeletingAssessment.value = true
  
  try {
    await deleteAssessment(assessmentToDelete.value)
    emit('delete', assessmentToDelete.value)
    
    // Reload assessments after successful deletion
    await fetchAssessments()
  } catch (error) {
    console.error('Error deleting assessment:', error)
  } finally {
    isDeletingAssessment.value = false
    showDeleteModal.value = false
    assessmentToDelete.value = null
  }
}
</script>