<template>
  <div class="certification-detail p-4">
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center space-x-4">
        <NuxtLink to="/certifications" class="text-blue-600 hover:text-blue-800">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
        </NuxtLink>
        <h1 class="text-2xl font-bold">Certification Details</h1>
      </div>
      <div class="flex space-x-3">
        <button 
          @click="openEditModal" 
          class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
        >
          Edit
        </button>
        <NuxtLink 
          :to="`/certifications/${certificationId}/generate`" 
          class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Generate Certificate
        </NuxtLink>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
      <p>{{ error }}</p>
      <button @click="fetchCertificationDetails" class="underline">Try again</button>
    </div>

    <!-- Certification Details -->
    <div v-else-if="certification" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Main Details Card -->
      <div class="col-span-2 bg-white rounded shadow overflow-hidden">
        <div class="p-6 border-b">
          <h2 class="text-xl font-bold mb-1">{{ certification.certification_name }}</h2>
          <p v-if="certification.students" class="text-gray-600">
            Awarded to: {{ certification.students.first_name }} {{ certification.students.last_name }}
          </p>
        </div>
        
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 class="text-sm font-medium text-gray-500">Awarded Date</h3>
              <p class="text-lg">{{ formatDate(certification.awarded_date) }}</p>
            </div>
            <div>
              <h3 class="text-sm font-medium text-gray-500">Expiration Date</h3>
              <p class="text-lg">{{ formatDate(certification.expiration_date) }}</p>
            </div>
          </div>
          
          <div class="mb-6">
            <h3 class="text-sm font-medium text-gray-500 mb-2">Status</h3>
            <span 
              :class="[
                'px-3 py-1 rounded-full text-sm font-medium',
                isExpired(certification.expiration_date) 
                  ? 'bg-red-100 text-red-800' 
                  : daysUntilExpiration(certification.expiration_date) <= 30 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-800'
              ]"
            >
              {{ 
                isExpired(certification.expiration_date) 
                  ? 'Expired' 
                  : daysUntilExpiration(certification.expiration_date) <= 30 
                    ? `Expires in ${daysUntilExpiration(certification.expiration_date)} days` 
                    : 'Valid' 
              }}
            </span>
          </div>
          
          <div v-if="isExpired(certification.expiration_date) || daysUntilExpiration(certification.expiration_date) <= 30">
            <button 
              @click="sendRenewalReminder" 
              :disabled="reminderLoading"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center space-x-2"
            >
              <span v-if="reminderLoading" class="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
              <span v-else>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </span>
              <span>Send Renewal Reminder</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Timeline Card -->
      <div class="bg-white rounded shadow">
        <div class="p-4 border-b">
          <h2 class="font-bold">Certification Timeline</h2>
        </div>
        <div class="p-4">
          <div class="relative pl-8">
            <!-- Timeline track -->
            <div class="absolute left-4 top-0 bottom-0 w-px bg-gray-200"></div>
            
            <!-- Timeline events -->
            <div class="mb-6 relative">
              <div class="absolute left-[-30px] top-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3z"></path>
                  <path d="M10 17a1 1 0 01-.707-.293l-3-3a1 1 0 011.414-1.414L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3A1 1 0 0110 17z"></path>
                </svg>
              </div>
              <div>
                <h3 class="font-medium">Created</h3>
                <p class="text-sm text-gray-600">{{ formatDateWithTime(new Date().toISOString()) }}</p>
              </div>
            </div>
            
            <div class="mb-6 relative">
              <div class="absolute left-[-30px] top-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
              </div>
              <div>
                <h3 class="font-medium">Awarded</h3>
                <p class="text-sm text-gray-600">{{ formatDateWithTime(certification.awarded_date || '') }}</p>
              </div>
            </div>
            
            <div v-if="certification.expiration_date" class="relative">
              <div class="absolute left-[-30px] top-0 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                </svg>
              </div>
              <div>
                <h3 class="font-medium">Expires</h3>
                <p class="text-sm text-gray-600">{{ formatDateWithTime(certification.expiration_date) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Certification Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg w-full max-w-md mx-4 md:mx-0">
        <div class="flex justify-between items-center p-4 border-b">
          <h2 class="text-xl font-bold">Edit Certification</h2>
          <button @click="closeEditModal" class="text-gray-500 hover:text-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <form @submit.prevent="saveCertification" class="p-4">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Certification Name</label>
            <input 
              v-model="editForm.certification_name" 
              type="text" 
              required
              class="w-full border rounded px-3 py-2"
            />
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Awarded Date</label>
            <input 
              v-model="editForm.awarded_date" 
              type="date" 
              required
              class="w-full border rounded px-3 py-2"
            />
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
            <input 
              v-model="editForm.expiration_date" 
              type="date" 
              class="w-full border rounded px-3 py-2"
            />
          </div>
          <div class="flex justify-end space-x-3 mt-6">
            <button 
              type="button" 
              @click="closeEditModal"
              class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button 
              type="submit"
              :disabled="editLoading"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
            >
              <span v-if="editLoading" class="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { format } from 'date-fns'
import useCertifications from '~/composables/useCertifications'

// Get route params
const route = useRoute()
const certificationId = computed(() => route.params.id as string)

// Use the certifications composable
const {
  certification,
  loading,
  error,
  fetchCertification,
  updateCertification,
  sendRenewalNotification,
  formatDate,
  isExpired,
  daysUntilExpiration
} = useCertifications()

// UI State
const showEditModal = ref(false)
const editLoading = ref(false)
const reminderLoading = ref(false)

// Form data
const editForm = ref({
  certification_name: '',
  awarded_date: '',
  expiration_date: ''
})

// Methods
const fetchCertificationDetails = async () => {
  if (!certificationId.value) return
  await fetchCertification(certificationId.value)
}

const formatDateWithTime = (dateString: string) => {
  if (!dateString) return 'N/A'
  try {
    return format(new Date(dateString), 'MMM d, yyyy')
  } catch (e) {
    return 'Invalid Date'
  }
}

const openEditModal = () => {
  if (!certification.value) return
  
  editForm.value = {
    certification_name: certification.value.certification_name || '',
    awarded_date: certification.value.awarded_date || '',
    expiration_date: certification.value.expiration_date || ''
  }
  
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
}

const saveCertification = async () => {
  if (!certificationId.value) return
  
  editLoading.value = true
  try {
    await updateCertification(certificationId.value, editForm.value)
    await fetchCertificationDetails() // Refresh data
    closeEditModal()
  } catch (err) {
    console.error('Error updating certification:', err)
  } finally {
    editLoading.value = false
  }
}

const sendRenewalReminder = async () => {
  if (!certification.value?.student_id || !certificationId.value) return
  
  reminderLoading.value = true
  try {
    await sendRenewalNotification(certification.value.student_id, certificationId.value)
    // Show success message
    alert('Renewal reminder sent successfully')
  } catch (err) {
    console.error('Error sending renewal reminder:', err)
    // Show error message
    alert('Failed to send renewal reminder')
  } finally {
    reminderLoading.value = false
  }
}

// Lifecycle hooks
onMounted(() => {
  fetchCertificationDetails()
})
</script>