<template>
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900">Hours Progress</h3>
        <NuxtLink 
          v-if="studentId"
          :to="`/students/${studentId}/hours`" 
          class="text-sm text-primary-600 hover:text-primary-800 flex items-center"
        >
          View Details
          <i class="pi pi-arrow-right ml-1"></i>
        </NuxtLink>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center items-center p-6" style="min-height: 200px">
      <ProgressSpinner style="width:50px;height:50px" strokeWidth="4" />
    </div>

    <div v-else-if="error" class="p-6 text-center text-red-600" style="min-height: 200px">
      <div class="flex flex-col justify-center items-center h-full">
        <i class="pi pi-exclamation-circle text-3xl mb-2"></i>
        <p>{{ error }}</p>
        <Button 
          label="Try Again" 
          icon="pi pi-refresh" 
          class="mt-3" 
          severity="secondary"
          @click="loadSummary"
        />
      </div>
    </div>

    <div v-else-if="!summary" class="p-6 text-center text-gray-500" style="min-height: 200px">
      <div class="flex flex-col justify-center items-center h-full">
        <i class="pi pi-clock text-3xl mb-2 text-gray-400"></i>
        <p>No hours data available</p>
        <Button 
          v-if="studentId"
          label="Add Hours" 
          icon="pi pi-plus" 
          class="mt-3" 
          @click="$emit('add-hours')"
        />
      </div>
    </div>

    <div v-else class="p-4">
      <!-- Progress Bar -->
      <div class="mb-4">
        <div class="flex justify-between items-center mb-1">
          <span class="text-sm font-medium text-gray-700">
            {{ summary.totalHours }} of {{ summary.requirementHours }} hours
          </span>
          <span 
            class="text-sm font-medium"
            :class="summary.requirementMet ? 'text-green-600' : 'text-blue-600'"
          >
            {{ summary.progressPercentage }}%
          </span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="h-2 rounded-full" 
            :class="summary.requirementMet ? 'bg-green-600' : 'bg-blue-600'"
            :style="`width: ${summary.progressPercentage}%`"
          ></div>
        </div>
        <div class="mt-1 text-xs text-gray-500">
          <span v-if="summary.requirementMet" class="text-green-600 font-medium">
            <i class="pi pi-check-circle mr-1"></i> Requirement completed!
          </span>
          <span v-else>
            {{ remainingHours }} hours remaining
          </span>
        </div>
      </div>

      <!-- Recent Hours Activity -->
      <div class="mt-4">
        <h4 class="text-sm font-medium text-gray-700 mb-2">Recent Activity</h4>
        <div v-if="recentHours.length === 0" class="text-center text-sm text-gray-500 py-2">
          No recent hours recorded
        </div>
        <div v-else class="space-y-2">
          <div 
            v-for="record in recentHours" 
            :key="record.id" 
            class="flex justify-between items-center p-2 hover:bg-gray-50 rounded"
          >
            <div>
              <div class="text-sm font-medium">{{ formatDate(record.date_recorded) }}</div>
              <div class="text-xs text-gray-500">{{ timeAgo(record.created_at) }}</div>
            </div>
            <div class="text-sm font-medium">{{ record.hours_completed }} hours</div>
          </div>
        </div>
      </div>

      <!-- Add Hours Button -->
      <div class="mt-4" v-if="studentId">
        <Button
          icon="pi pi-plus"
          label="Add Hours"
          class="w-full"
          @click="$emit('add-hours')"
          :disabled="!studentId"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import ProgressSpinner from 'primevue/progressspinner';
import Button from 'primevue/button';
import type { HoursSummary, HoursRecord } from '~/composables/useHours';
import { useHours } from '~/composables/useHours';

const props = defineProps({
  studentId: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['add-hours']);

// State
const loading = ref(true);
const error = ref('');
const summary = ref<HoursSummary | null>(null);
const recentHours = ref<HoursRecord[]>([]);

// Use hours composable
const {
  fetchHoursSummary,
  fetchHoursRecords
} = useHours();

// Compute remaining hours
const remainingHours = computed(() => {
  if (!summary.value) return 0;
  return Math.max(0, summary.value.requirementHours - summary.value.totalHours);
});

// Watch for student ID changes
watch(() => props.studentId, () => {
  if (props.studentId) {
    loadData();
  }
});

// Load data on component mount
onMounted(() => {
  if (props.studentId) {
    loadData();
  } else {
    loading.value = false;
  }
});

// Load all hours data
async function loadData() {
  if (!props.studentId) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    // Load summary and recent hours in parallel
    await Promise.all([
      loadSummary(),
      loadRecentHours()
    ]);
  } finally {
    loading.value = false;
  }
}

// Load hours summary
async function loadSummary() {
  if (!props.studentId) return;
  
  try {
    const data = await fetchHoursSummary(props.studentId);
    summary.value = data;
  } catch (err: any) {
    console.error('Error loading hours summary:', err);
    error.value = err.message || 'Failed to load hours data';
  }
}

// Load recent hours
async function loadRecentHours() {
  if (!props.studentId) return;
  
  try {
    // Set up filters for the most recent hours records
    const filters = {
      studentId: props.studentId,
      limit: 3
    };
    
    const { data } = await fetchHoursRecords(filters);
    recentHours.value = data || [];
  } catch (err: any) {
    console.error('Error loading recent hours:', err);
    // Don't set the error message here to avoid overriding the summary error
  }
}

// Format date for display
function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  
  return new Date(dateString).toLocaleDateString();
}

// Format relative time (e.g., "2 days ago")
function timeAgo(dateString: string | null): string {
  if (!dateString) return '';
  
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000; // seconds in a year
  
  if (interval > 1) {
    return Math.floor(interval) + ' years ago';
  }
  interval = seconds / 2592000; // seconds in a month
  if (interval > 1) {
    return Math.floor(interval) + ' months ago';
  }
  interval = seconds / 86400; // seconds in a day
  if (interval > 1) {
    return Math.floor(interval) + ' days ago';
  }
  interval = seconds / 3600; // seconds in an hour
  if (interval > 1) {
    return Math.floor(interval) + ' hours ago';
  }
  interval = seconds / 60; // seconds in a minute
  if (interval > 1) {
    return Math.floor(interval) + ' minutes ago';
  }
  return Math.floor(seconds) + ' seconds ago';
}
</script>