<template>
  <div class="assessments-page">
    <div class="container mx-auto py-6 px-4">
      <h1 class="text-2xl font-bold mb-6">Assessment Management</h1>
      
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
            @click="activeTab = 'analytics'"
            class="py-2 px-4 border-b-2 font-medium text-sm"
            :class="activeTab === 'analytics' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          >
            Performance Analytics
          </button>
        </nav>
      </div>
      
      <!-- Tab Content -->
      <div v-if="activeTab === 'list'">
        <AssessmentsAssessmentList 
          @create="showCreateForm = true"
          @edit="editAssessment"
        />
      </div>
      
      <div v-else-if="activeTab === 'analytics'">
        <AssessmentsPerformanceAnalytics />
      </div>
      
      <!-- Create Assessment Modal -->
      <div v-if="showCreateForm" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl max-w-4xl mx-auto overflow-auto" style="max-height: 90vh; width: 90vw;">
          <div class="flex justify-between items-center px-6 py-4 border-b">
            <h2 class="text-lg font-semibold">Add New Assessment</h2>
            <button @click="showCreateForm = false" class="text-gray-400 hover:text-gray-500">
              <span class="sr-only">Close</span>
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="p-6">
            <AssessmentsAssessmentForm
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
              :assessment-id="currentAssessmentId"
              @cancel="showEditForm = false"
              @saved="onAssessmentSaved"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const activeTab = ref('list')
const showCreateForm = ref(false)
const showEditForm = ref(false)
const currentAssessmentId = ref('')

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