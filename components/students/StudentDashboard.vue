<template>
  <div class="student-dashboard-page">
    <div class="container mx-auto py-6 px-4">
      <div v-if="isLoading" class="text-center py-8">
        <p class="text-gray-500">Loading student data...</p>
      </div>
      
      <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{{ error }}</p>
      </div>
      
      <div v-else>
        <!-- Student Header -->
        <div class="mb-6">
          <div class="flex items-start justify-between">
            <div>
              <h1 class="text-2xl font-bold">
                {{ student.first_name }} {{ student.last_name }}
              </h1>
              <p class="text-gray-600">{{ student.email }}</p>
            </div>
            
            <div class="flex space-x-3">
              <NuxtLink 
                :to="`/students/${studentId}/assessments`"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Assessments
              </NuxtLink>
            </div>
          </div>
          
          <!-- Student Status Pills -->
          <div class="mt-3 flex space-x-2">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {{ student.status || 'Current' }}
            </span>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Enrolled: {{ formatDate(student.enrollment_date) }}
            </span>
            <span v-if="student.expected_graduation_date" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Expected Graduation: {{ formatDate(student.expected_graduation_date) }}
            </span>
          </div>
        </div>
        
        <!-- Dashboard Content -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Left Column - Student Information -->
          <div class="md:col-span-1">
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 class="text-lg font-semibold mb-4">Contact Information</h2>
              
              <div class="space-y-3">
                <div>
                  <h3 class="text-sm font-medium text-gray-500">Email</h3>
                  <p>{{ student.email }}</p>
                </div>
                
                <div>
                  <h3 class="text-sm font-medium text-gray-500">Phone</h3>
                  <p>{{ student.phone || 'Not provided' }}</p>
                </div>
                
                <div>
                  <h3 class="text-sm font-medium text-gray-500">Address</h3>
                  <p>{{ student.address || 'Not provided' }}</p>
                  <p v-if="student.city || student.zip_code">
                    {{ student.city || '' }} {{ student.zip_code ? (student.city ? ', ' : '') + student.zip_code : '' }}
                  </p>
                </div>
              </div>
            </div>
            
            <!-- Emergency Contacts -->
            <div v-if="emergencyContacts.length > 0" class="bg-white rounded-lg shadow-md p-6">
              <h2 class="text-lg font-semibold mb-4">Emergency Contacts</h2>
              
              <div v-for="contact in emergencyContacts" :key="contact.id" class="border-b border-gray-200 last:border-b-0 py-3">
                <h3 class="font-medium">{{ contact.name }}</h3>
                <p class="text-sm text-gray-600">{{ contact.relationship || 'Contact' }}</p>
                <p class="text-sm">{{ contact.phone || contact.email || 'No contact info' }}</p>
              </div>
            </div>
          </div>
          
          <!-- Right Column - Assessment Summaries and Other Data -->
          <div class="md:col-span-2 space-y-6">
            <!-- Overall Assessment Summary -->
            <AssessmentsAssessmentSummary 
              :student-id="studentId" 
              title="Overall Performance"
              :limit="10"
            />
            
            <!-- Assessment Type Summaries -->
            <div v-if="assessmentTypes.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AssessmentsAssessmentSummary 
                v-for="type in assessmentTypes.slice(0, 4)" 
                :key="type"
                :student-id="studentId"
                :assessment-type="type"
                :title="type"
                :limit="5"
              />
            </div>
            
            <!-- Recent Documents -->
            <div v-if="documents.length > 0" class="bg-white rounded-lg shadow-md p-6">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-semibold">Recent Documents</h2>
                <NuxtLink 
                  to="#" 
                  class="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View All
                </NuxtLink>
              </div>
              
              <div class="space-y-2">
                <div 
                  v-for="doc in documents.slice(0, 3)" 
                  :key="doc.id"
                  class="p-3 border rounded-md flex justify-between items-center"
                >
                  <div>
                    <p class="font-medium">{{ doc.document_name }}</p>
                    <p class="text-sm text-gray-500">
                      Uploaded: {{ formatDate(doc.uploaded_at) }}
                    </p>
                  </div>
                  
                  <a 
                    v-if="doc.file_url"
                    :href="doc.file_url"
                    target="_blank"
                    class="text-blue-600 hover:text-blue-800"
                  >
                    View
                  </a>
                </div>
              </div>
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
import { useAssessments } from '~/composables/useAssessments'

const route = useRoute()
const studentId = route.params.id as string

const student = ref<any>({})
const emergencyContacts = ref<any[]>([])
const documents = ref<any[]>([])
const isLoading = ref(true)
const error = ref('')

// Get assessment types from composable
const { assessmentTypes, fetchAssessmentTypes } = useAssessments()

// Fetch data on component mount
onMounted(async () => {
  try {
    isLoading.value = true
    
    // Fetch student data
    const studentResponse = await fetch(`/api/students/${studentId}`)
    if (!studentResponse.ok) {
      throw new Error('Failed to load student data')
    }
    student.value = await studentResponse.json()
    
    // Fetch emergency contacts
    const contactsResponse = await fetch(`/api/students/${studentId}/emergency-contacts`)
    if (contactsResponse.ok) {
      emergencyContacts.value = await contactsResponse.json()
    }
    
    // Fetch student documents
    const documentsResponse = await fetch(`/api/students/${studentId}/documents`)
    if (documentsResponse.ok) {
      documents.value = await documentsResponse.json()
    }
    
    // Fetch assessment types
    await fetchAssessmentTypes()
    
  } catch (err: any) {
    error.value = err.message || 'An error occurred while loading student data'
  } finally {
    isLoading.value = false
  }
})

// Format date for display
function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A'
  
  const date = new Date(dateString)
  return date.toLocaleDateString()
}
</script>