<template>
  <div class="student-assessments-page">
    <div class="container mx-auto py-6 px-4">
      <div v-if="isLoading" class="text-center py-8">
        <p class="text-gray-500">Loading student data...</p>
      </div>
      
      <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{{ error }}</p>
      </div>
      
      <div v-else>
        <!-- Student Header -->
        <div class="flex items-start justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold">
              {{ student.first_name }} {{ student.last_name }} - Assessments
            </h1>
            <p class="text-gray-600">{{ student.email }}</p>
          </div>
          
          <div>
            <button 
              @click="showCreateForm = true"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add New Assessment
            </button>
          </div>
        </div>
        
        <!-- Tabs -->
        <div class="border-b border-gray-200 mb-6">
          <nav class="flex -mb-px">
            <button 
              @click="activeTab = 'list'"
              class="py-2 px-4 border-b-2 font-medium text-sm mr-8"
              :class="activeTab === 'list' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
            >
              Assessment List
            </button>
            <button 
              @click="activeTab = 'progress'"
              class="py-2 px-4 border-b-2 font-medium text-sm"
              :class="activeTab === 'progress' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
            >
              Progress Tracking
            </button>
          </nav>
        </div>
        
        <!-- Tab Content -->
        <div v-if="activeTab === 'list'">
          <AssessmentsAssessmentList 
            :student-id="studentId"
            @create="showCreateForm = true"
            @edit="editAssessment"
          />
        </div>
        
        <div v-else-if="activeTab === 'progress'">
          <AssessmentsStudentProgress :student-id="studentId" />
        </div>
        
        <!-- Create Assessment Modal -->
        <div v-if="showCreateForm" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg shadow-xl max-w-4xl mx-auto overflow-auto" style="max-height: 90vh; width: 90vw;">
            <div class="flex justify-between items-center px-6 py-4 border-b">
              <h2 class="text-lg font-semibold">Add New Assessment for {{ student.first_name }}</h2>
              <button @click="showCreateForm = false" class="text-gray-400 hover:text-gray-500">
                <span class="sr-only">Close</span>
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div class="p-6">
              <AssessmentsAssessmentForm
                :student-id="studentId"
                @cancel="showCreateForm = false"
                @saved="onAssessmentSaved"
              />
            </div>
          </div>
        </div>
        
        <!-- Edit Assessment Modal -->
        <div v-if="showEditForm" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg shadow-xl max-w-4xl mx-auto overflow-auto" style="max-height: 90vh; width: 90vw;">
            <div class="flex justify-between items-center px-6 py-4 border-b">
              <h2 class="text-lg font-semibold">Edit Assessment</h2>
              <button @click="showEditForm = false" class="text-gray-400 hover:text-gray-500">
                <span class="sr-only">Close</span>
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div class="p-6">
              <AssessmentsAssessmentForm
                :student-id="studentId"
                :assessment-id="currentAssessmentId"
                @cancel="showEditForm = false"
                @saved="onAssessmentSaved"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AssessmentList from '~/components/AssessmentList.vue'
import AssessmentForm from '~/components/AssessmentForm.vue'
import StudentProgress from '~/components/StudentProgress.vue'

const route = useRoute()
const studentId = route.params.id as string

const student = ref<any>({})
const isLoading = ref(true)
const error = ref('')
const activeTab = ref('list')
const showCreateForm = ref(false)
const showEditForm = ref(false)
const currentAssessmentId = ref('')

// Fetch student data on component mount
onMounted(async () => {
  try {
    const response = await fetch(`/api/students/${studentId}`)
    
    if (!response.ok) {
      throw new Error('Failed to load student data')
    }
    
    student.value = await response.json()
  } catch (err: any) {
    error.value = err.message || 'An error occurred while loading student data'
  } finally {
    isLoading.value = false
  }
})

// Handle edit button click
function editAssessment(assessmentId: string) {
  currentAssessmentId.value = assessmentId
  showEditForm.value = true
}

// Handle assessment saved event
function onAssessmentSaved() {
  // Close modals
  showCreateForm.value = false
  showEditForm.value = false
  
  // Reset ID
  currentAssessmentId.value = ''
}
</script>