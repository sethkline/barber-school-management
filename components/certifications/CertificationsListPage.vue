<template>
  <div class="certifications-container p-4">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Student Certifications</h1>
      <button 
        @click="openNewCertificationModal" 
        class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded"
      >
        Add Certification
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white p-4 rounded shadow mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search certifications..." 
            class="w-full border rounded px-3 py-2" 
            @input="debouncedSearch"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Student</label>
          <select 
            v-model="selectedStudentId" 
            class="w-full border rounded px-3 py-2"
            @change="fetchCertifications"
          >
            <option value="">All Students</option>
            <option v-for="student in students" :key="student.id" :value="student.id">
              {{ student.first_name }} {{ student.last_name }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select 
            v-model="showExpired" 
            class="w-full border rounded px-3 py-2"
            @change="fetchCertifications"
          >
            <option :value="true">All</option>
            <option :value="false">Valid Only</option>
          </select>
        </div>
        <div class="flex items-end">
          <button 
            @click="fetchCertifications" 
            class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded w-full"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
      <p>{{ error }}</p>
      <button @click="fetchCertifications" class="underline">Try again</button>
    </div>

    <!-- Empty state -->
    <div v-else-if="certifications.length === 0" class="bg-white p-8 rounded shadow text-center">
      <p class="text-gray-600 mb-4">No certifications found</p>
      <button 
        @click="openNewCertificationModal" 
        class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded"
      >
        Add Your First Certification
      </button>
    </div>

    <!-- Data table -->
    <div v-else class="bg-white rounded shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certification</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Awarded</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiration</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="cert in certifications" :key="cert.id">
            <td class="px-6 py-4 whitespace-nowrap">
              <div v-if="cert.students">
                {{ cert.students.first_name }} {{ cert.students.last_name }}
              </div>
              <div v-else class="text-gray-500">Unknown</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              {{ cert.certification_name }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              {{ formatDate(cert.awarded_date) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              {{ formatDate(cert.expiration_date) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span 
                :class="[
                  'px-2 py-1 rounded-full text-xs font-medium',
                  isExpired(cert.expiration_date) 
                    ? 'bg-red-100 text-red-800' 
                    : daysUntilExpiration(cert.expiration_date) <= 30 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                ]"
              >
                {{ 
                  isExpired(cert.expiration_date) 
                    ? 'Expired' 
                    : daysUntilExpiration(cert.expiration_date) <= 30 
                      ? `Expires in ${daysUntilExpiration(cert.expiration_date)} days` 
                      : 'Valid' 
                }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button 
                @click="openEditModal(cert)" 
                class="text-indigo-600 hover:text-indigo-900 mr-3"
              >
                Edit
              </button>
              <button 
                @click="openDeleteConfirmation(cert)" 
                class="text-red-600 hover:text-red-900"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- Pagination -->
      <div class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div class="flex justify-between items-center">
          <div class="text-sm text-gray-700">
            Showing <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span> to 
            <span class="font-medium">{{ Math.min(currentPage * pageSize, totalCount) }}</span> of 
            <span class="font-medium">{{ totalCount }}</span> results
          </div>
          <div class="flex space-x-2">
            <button 
              @click="prevPage" 
              :disabled="currentPage === 1" 
              :class="[
                'px-3 py-1 rounded border',
                currentPage === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              ]"
            >
              Previous
            </button>
            <button 
              @click="nextPage" 
              :disabled="currentPage * pageSize >= totalCount" 
              :class="[
                'px-3 py-1 rounded border',
                currentPage * pageSize >= totalCount 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              ]"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Certification Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg w-full max-w-md mx-4 md:mx-0">
        <div class="flex justify-between items-center p-4 border-b">
          <h2 class="text-xl font-bold">{{ isEditing ? 'Edit' : 'Add' }} Certification</h2>
          <button @click="closeModal" class="text-gray-500 hover:text-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <form @submit.prevent="saveCertification" class="p-4">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <select 
              v-model="certForm.student_id" 
              required
              class="w-full border rounded px-3 py-2"
            >
              <option disabled value="">Select a student</option>
              <option v-for="student in students" :key="student.id" :value="student.id">
                {{ student.first_name }} {{ student.last_name }}
              </option>
            </select>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Certification Name</label>
            <input 
              v-model="certForm.certification_name" 
              type="text" 
              required
              class="w-full border rounded px-3 py-2"
            />
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Awarded Date</label>
            <input 
              v-model="certForm.awarded_date" 
              type="date" 
              required
              class="w-full border rounded px-3 py-2"
            />
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
            <input 
              v-model="certForm.expiration_date" 
              type="date" 
              class="w-full border rounded px-3 py-2"
            />
          </div>
          <div class="flex justify-end space-x-3 mt-6">
            <button 
              type="button" 
              @click="closeModal"
              class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button 
              type="submit"
              :disabled="submitLoading"
              class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded flex items-center"
            >
              <span v-if="submitLoading" class="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
              {{ isEditing ? 'Update' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg w-full max-w-md mx-4 md:mx-0">
        <div class="p-4 border-b">
          <h2 class="text-xl font-bold">Confirm Deletion</h2>
        </div>
        <div class="p-4">
          <p>Are you sure you want to delete this certification?</p>
          <p class="font-medium mt-2">{{ selectedCertification?.certification_name }}</p>
          <p class="text-sm text-gray-600 mt-1">This action cannot be undone.</p>
        </div>
        <div class="flex justify-end space-x-3 p-4 border-t">
          <button 
            @click="closeDeleteModal" 
            class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button 
            @click="confirmDelete" 
            :disabled="deleteLoading"
            class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center"
          >
            <span v-if="deleteLoading" class="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import useCertifications from '~/composables/useCertifications'
import type { Tables } from '~/types/supabase'

// Define student type
type Student = {
  id: string
  first_name: string
  last_name: string
  email: string
}

// Use the certifications composable
const {
  certifications,
  loading,
  error,
  totalCount,
  fetchCertifications: fetchCerts,
  createCertification,
  updateCertification,
  deleteCertification,
  formatDate,
  isExpired,
  daysUntilExpiration
} = useCertifications()

// Filter states
const searchQuery = ref('')
const selectedStudentId = ref('')
const showExpired = ref(true)
const currentPage = ref(1)
const pageSize = ref(10)

// Modal states
const showModal = ref(false)
const isEditing = ref(false)
const submitLoading = ref(false)
const showDeleteModal = ref(false)
const deleteLoading = ref(false)
const selectedCertification = ref<Tables<'student_certifications'> | null>(null)

// Form data
const certForm = ref({
  student_id: '',
  certification_name: '',
  awarded_date: '',
  expiration_date: ''
})

// Students data (for select dropdowns)
const students = ref<Student[]>([])

// Fetch all students for the dropdown
const fetchStudents = async () => {
  try {
    const response = await $fetch('/api/students', {
      params: {
        limit: 100 // Adjust as needed
      }
    })
    students.value = response.data || []
  } catch (err) {
    console.error('Error fetching students:', err)
  }
}

// Wrapper for fetchCertifications with pagination and filters
const fetchCertifications = () => {
  fetchCerts({
    studentId: selectedStudentId.value || undefined,
    page: currentPage.value,
    limit: pageSize.value,
    includeExpired: showExpired.value,
    search: searchQuery.value
  })
}

// Debounced search function
const debouncedSearch = useDebounceFn(() => {
  currentPage.value = 1 // Reset to first page when searching
  fetchCertifications()
}, 500)

// Pagination methods
const nextPage = () => {
  if (currentPage.value * pageSize.value < totalCount.value) {
    currentPage.value++
    fetchCertifications()
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchCertifications()
  }
}

// Modal methods
const openNewCertificationModal = () => {
  isEditing.value = false
  certForm.value = {
    student_id: selectedStudentId.value || '',
    certification_name: '',
    awarded_date: new Date().toISOString().split('T')[0],
    expiration_date: ''
  }
  showModal.value = true
}

const openEditModal = (cert: Tables<'student_certifications'>) => {
  isEditing.value = true
  certForm.value = {
    student_id: cert.student_id || '',
    certification_name: cert.certification_name || '',
    awarded_date: cert.awarded_date || '',
    expiration_date: cert.expiration_date || ''
  }
  selectedCertification.value = cert
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedCertification.value = null
}

const saveCertification = async () => {
  submitLoading.value = true
  try {
    if (isEditing.value && selectedCertification.value) {
      await updateCertification(selectedCertification.value.id, certForm.value)
    } else {
      await createCertification(certForm.value)
    }
    closeModal()
    fetchCertifications()
  } catch (err) {
    console.error('Error saving certification:', err)
  } finally {
    submitLoading.value = false
  }
}

const openDeleteConfirmation = (cert: Tables<'student_certifications'>) => {
  selectedCertification.value = cert
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedCertification.value = null
}

const confirmDelete = async () => {
  if (!selectedCertification.value) return
  
  deleteLoading.value = true
  try {
    await deleteCertification(selectedCertification.value.id)
    closeDeleteModal()
    fetchCertifications()
  } catch (err) {
    console.error('Error deleting certification:', err)
  } finally {
    deleteLoading.value = false
  }
}

// Create a custom debounce composable
function useDebounceFn(fn: Function, delay: number) {
  let timeout: ReturnType<typeof setTimeout>
  return function(...args: any[]) {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}

// Lifecycle hooks
onMounted(() => {
  fetchCertifications()
  fetchStudents()
})

// Watch for page changes
watch([currentPage, pageSize], () => {
  fetchCertifications()
})
</script>