<template>
  <div class="certification-expiration-dashboard p-4">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Certification Expiration Dashboard</h1>
      <div class="flex space-x-3">
        <button 
          @click="refreshData" 
          class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded flex items-center space-x-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <span>Refresh</span>
        </button>
        <button 
          @click="sendAllNotifications" 
          :disabled="bulkNotificationLoading"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center space-x-2"
        >
          <span v-if="bulkNotificationLoading" class="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
          <span v-else>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </span>
          <span>Send All Notifications</span>
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white p-4 rounded shadow">
        <h3 class="text-gray-500 text-sm font-medium">Total Certifications</h3>
        <p class="text-2xl font-bold">{{ totalCertifications }}</p>
      </div>
      <div class="bg-white p-4 rounded shadow">
        <h3 class="text-gray-500 text-sm font-medium">Expired</h3>
        <p class="text-2xl font-bold text-red-600">{{ expiredCount }}</p>
      </div>
      <div class="bg-white p-4 rounded shadow">
        <h3 class="text-gray-500 text-sm font-medium">Expiring Soon (30 days)</h3>
        <p class="text-2xl font-bold text-yellow-600">{{ expiringSoonCount }}</p>
      </div>
      <div class="bg-white p-4 rounded shadow">
        <h3 class="text-gray-500 text-sm font-medium">Valid</h3>
        <p class="text-2xl font-bold text-green-600">{{ validCount }}</p>
      </div>
    </div>

    <!-- Expiration Timeline -->
    <div class="bg-white p-4 rounded shadow mb-6">
      <h2 class="text-lg font-bold mb-4">Expiration Timeline</h2>
      <div class="h-64">
        <!-- This would be a chart in a real implementation -->
        <div class="flex h-full items-end space-x-2">
          <div 
            v-for="(count, index) in expirationTimeline" 
            :key="index"
            class="flex-1 bg-blue-500 rounded-t"
            :style="{ height: `${(count / Math.max(...Object.values(expirationTimeline))) * 100}%` }"
          ></div>
        </div>
        <div class="flex justify-between mt-2">
          <span v-for="(_, index) in expirationTimeline" :key="index" class="text-xs text-gray-600">{{ timelineLabels[index] }}</span>
        </div>
      </div>
    </div>

    <!-- Filter Controls -->
    <div class="bg-white p-4 rounded shadow mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Expiration Period</label>
          <select 
            v-model="expirationDays" 
            class="w-full border rounded px-3 py-2"
            @change="fetchExpiringCertifications"
          >
            <option :value="7">Next 7 days</option>
            <option :value="14">Next 14 days</option>
            <option :value="30">Next 30 days</option>
            <option :value="60">Next 60 days</option>
            <option :value="90">Next 90 days</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <select 
            v-model="sortBy" 
            class="w-full border rounded px-3 py-2"
            @change="sortExpiringCertifications"
          >
            <option value="date">Expiration Date (Earliest First)</option>
            <option value="date-desc">Expiration Date (Latest First)</option>
            <option value="name">Certification Name</option>
            <option value="student">Student Name</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search by name or certification..." 
            class="w-full border rounded px-3 py-2"
            @input="searchCertifications"
          />
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
      <p>{{ error }}</p>
      <button @click="fetchExpiringCertifications" class="underline">Try again</button>
    </div>

    <!-- Empty state -->
    <div v-else-if="displayedCertifications.length === 0" class="bg-white p-8 rounded shadow text-center">
      <p class="text-gray-600">No certifications expiring soon</p>
      <p class="text-sm text-gray-500 mt-2">
        All certifications are valid for more than {{ expirationDays }} days
      </p>
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
          <tr v-for="cert in displayedCertifications" :key="cert.id">
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
                @click="sendNotification(cert)"
                :disabled="cert.notificationSending"
                :class="[
                  'text-blue-600 hover:text-blue-900 mr-3',
                  { 'opacity-50 cursor-not-allowed': cert.notificationSending }
                ]"
              >
                <span v-if="cert.notificationSending">Sending...</span>
                <span v-else>Send Notification</span>
              </button>
              <NuxtLink 
                :to="`/certifications/${cert.id}`" 
                class="text-indigo-600 hover:text-indigo-900"
              >
                View
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import useCertifications from '~/composables/useCertifications'
import type { Tables } from '~/types/supabase'

// Extended certification type with UI state
interface ExtendedCertification extends Tables<'student_certifications'> {
  notificationSending?: boolean;
  students?: {
    first_name: string;
    last_name: string;
    email?: string;
  };
}

// Use the certifications composable
const {
  loading,
  error,
  fetchExpiringCertifications,
  sendRenewalNotification,
  formatDate,
  isExpired,
  daysUntilExpiration
} = useCertifications()

// State
const expirationDays = ref(30)
const expiringCertifications = ref<ExtendedCertification[]>([])
const searchQuery = ref('')
const sortBy = ref('date')
const bulkNotificationLoading = ref(false)

// Fetch expiring certifications
const fetchData = async () => {
  try {
    const certifications = await fetchExpiringCertifications(expirationDays.value)
    expiringCertifications.value = certifications.map(cert => ({
      ...cert,
      notificationSending: false
    }))
  } catch (err) {
    console.error('Failed to fetch expiring certifications:', err)
  }
}

// Filtered and sorted certifications
const displayedCertifications = computed(() => {
  let filteredCerts = [...expiringCertifications.value]
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filteredCerts = filteredCerts.filter(cert => 
      cert.certification_name?.toLowerCase().includes(query) || 
      cert.students?.first_name?.toLowerCase().includes(query) ||
      cert.students?.last_name?.toLowerCase().includes(query)
    )
  }
  
  // Apply sorting
  return filteredCerts.sort((a, b) => {
    switch (sortBy.value) {
      case 'date':
        return new Date(a.expiration_date || '').getTime() - new Date(b.expiration_date || '').getTime()
      case 'date-desc':
        return new Date(b.expiration_date || '').getTime() - new Date(a.expiration_date || '').getTime()
      case 'name':
        return (a.certification_name || '').localeCompare(b.certification_name || '')
      case 'student':
        const aName = `${a.students?.last_name} ${a.students?.first_name}`
        const bName = `${b.students?.last_name} ${b.students?.first_name}`
        return aName.localeCompare(bName)
      default:
        return 0
    }
  })
})

// Summary metrics
const totalCertifications = computed(() => expiringCertifications.value.length)

const expiredCount = computed(() => 
  expiringCertifications.value.filter(cert => isExpired(cert.expiration_date)).length
)

const expiringSoonCount = computed(() => 
  expiringCertifications.value.filter(cert => 
    !isExpired(cert.expiration_date) && 
    daysUntilExpiration(cert.expiration_date) <= 30
  ).length
)

const validCount = computed(() => 
  expiringCertifications.value.filter(cert => 
    !isExpired(cert.expiration_date) && 
    daysUntilExpiration(cert.expiration_date) > 30
  ).length
)

// Expiration timeline data (for chart)
const expirationTimeline = computed(() => {
  const timeline: Record<number, number> = {
    0: 0, // Expired
    1: 0, // 1-7 days
    2: 0, // 8-14 days
    3: 0, // 15-30 days
    4: 0, // 31-60 days
    5: 0, // 61-90 days
    6: 0, // 90+ days
  }
  
  expiringCertifications.value.forEach(cert => {
    const days = daysUntilExpiration(cert.expiration_date)
    
    if (days === null) return
    
    if (days <= 0) timeline[0]++
    else if (days <= 7) timeline[1]++
    else if (days <= 14) timeline[2]++
    else if (days <= 30) timeline[3]++
    else if (days <= 60) timeline[4]++
    else if (days <= 90) timeline[5]++
    else timeline[6]++
  })
  
  return timeline
})

// Timeline labels
const timelineLabels = {
  0: 'Expired',
  1: '1-7d',
  2: '8-14d',
  3: '15-30d',
  4: '31-60d',
  5: '61-90d',
  6: '90d+'
}

// Methods
const refreshData = () => {
  fetchData()
}

const sortExpiringCertifications = () => {
  // Sorting is handled by the computed property
}

const searchCertifications = () => {
  // Filtering is handled by the computed property
}

const sendNotification = async (cert: ExtendedCertification) => {
  if (!cert.student_id) return
  
  // Set loading state for this specific certification
  cert.notificationSending = true
  
  try {
    await sendRenewalNotification(cert.student_id, cert.id)
    // Show success message
    alert(`Renewal notification sent to ${cert.students?.first_name} ${cert.students?.last_name}`)
  } catch (err) {
    console.error('Failed to send notification:', err)
    // Show error message
    alert('Failed to send notification. Please try again.')
  } finally {
    cert.notificationSending = false
  }
}

const sendAllNotifications = async () => {
  bulkNotificationLoading.value = true
  
  try {
    // Filter to certs that are expiring soon but not yet expired
    const certsToNotify = expiringCertifications.value.filter(cert => 
      !isExpired(cert.expiration_date) && 
      daysUntilExpiration(cert.expiration_date) <= 30 &&
      cert.student_id
    )
    
    // Send notifications in sequence
    for (const cert of certsToNotify) {
      if (cert.student_id) {
        await sendRenewalNotification(cert.student_id, cert.id)
      }
    }
    
    // Show success message
    alert(`Sent ${certsToNotify.length} renewal notifications`)
  } catch (err) {
    console.error('Failed to send notifications:', err)
    // Show error message
    alert('Failed to send notifications. Please try again.')
  } finally {
    bulkNotificationLoading.value = false
  }
}

// Lifecycle hooks
onMounted(() => {
  fetchData()
})
</script>