<template>
  <div>
    <h3 class="text-lg font-medium text-gray-900 mb-4">Communication History</h3>
    
    <div v-if="loading" class="flex justify-center my-4">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
    </div>
    
    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <strong>Error:</strong> {{ error }}
    </div>
    
    <div v-else-if="communications.length === 0" class="text-center py-4 text-gray-500">
      No communication history found.
    </div>
    
    <div v-else class="space-y-4 max-h-96 overflow-y-auto pr-2">
      <div 
        v-for="communication in communications" 
        :key="communication.id"
        class="bg-white border border-gray-200 rounded-md p-4 shadow-sm"
      >
        <div class="flex justify-between items-start">
          <h4 class="font-medium text-gray-900">{{ communication.subject }}</h4>
          <div class="text-sm text-gray-500">
            {{ formatDate(communication.sent_at) }}
          </div>
        </div>
        
        <div class="mt-2">
          <div class="text-sm text-gray-500">
            To: {{ communication.to_email }}
          </div>
          
          <div class="mt-2 text-gray-700">
            <button 
              @click="toggleMessageDisplay(communication.id)" 
              class="text-blue-600 hover:text-blue-800 text-sm"
            >
              {{ expandedMessages.includes(communication.id) ? 'Hide Message' : 'Show Message' }}
            </button>
            
            <div v-if="expandedMessages.includes(communication.id)" class="mt-2 bg-gray-50 p-3 rounded text-sm">
              <div v-html="communication.body"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="hasMoreRecords" class="mt-4 text-center">
      <button 
        @click="loadMore" 
        class="text-blue-600 hover:text-blue-800"
        :disabled="loadingMore"
      >
        {{ loadingMore ? 'Loading...' : 'Load more' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, onMounted } from 'vue'

const props = defineProps({
  studentId: {
    type: String,
    default: ''
  },
  leadId: {
    type: String,
    default: ''
  }
})

interface Communication {
  id: string
  subject: string
  body: string
  to_email: string
  sent_at: string
  type: string
  student_id?: string
  lead_id?: string
  template_id?: string
}

const communications = ref<Communication[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const error = ref<string | null>(null)
const page = ref(1)
const totalCount = ref(0)
const expandedMessages = ref<string[]>([])
const limit = ref(10)

onMounted(async () => {
  await fetchCommunications()
})

// Function to load more communications
async function loadMore() {
  page.value++
  await fetchCommunications(true)
}

async function fetchCommunications(append = false) {
  // Either studentId or leadId must be provided
  if (!props.studentId && !props.leadId) {
    error.value = 'Student ID or Lead ID is required'
    loading.value = false
    return
  }

  const queryParams: Record<string, string> = {
    page: page.value.toString(),
    limit: '10'
  }
  
  if (props.studentId) {
    queryParams.studentId = props.studentId
  } else if (props.leadId) {
    queryParams.leadId = props.leadId
  }
  
  const queryString = new URLSearchParams(queryParams).toString()
  
  try {
    if (append) {
      loadingMore.value = true
    } else {
      loading.value = true
    }
    
    error.value = null
    
    const response = await $fetch(`/api/communications/history/all?${queryString}`)
    
    if (append) {
      communications.value = [...communications.value, ...response.data]
    } else {
      communications.value = response.data
    }
    
    totalCount.value = response.count
  } catch (err: any) {
    error.value = err.message || 'Failed to load communication history'
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function formatDate(dateString: string): string {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  return date.toLocaleString()
}

function toggleMessageDisplay(id: string) {
  const index = expandedMessages.value.indexOf(id)
  
  if (index === -1) {
    expandedMessages.value.push(id)
  } else {
    expandedMessages.value.splice(index, 1)
  }
}