<template>
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900">Hours Progress</h3>
        <Button
          v-if="canGenerateCertificate"
          icon="pi pi-file-pdf"
          label="Certificate"
          class="p-button-sm"
          severity="secondary"
          @click="generateCertificate"
          :loading="certificateLoading"
        />
      </div>
    </div>

    <div v-if="loading" class="flex justify-center items-center p-6" style="height: 200px">
      <ProgressSpinner style="width:50px;height:50px" strokeWidth="4" />
    </div>

    <div v-else-if="error" class="p-6 text-center text-red-600">
      <i class="pi pi-exclamation-circle text-3xl mb-2"></i>
      <p>{{ error }}</p>
      <Button 
        label="Try Again" 
        icon="pi pi-refresh" 
        class="mt-2" 
        severity="secondary"
        @click="loadSummary"
      />
    </div>

    <div v-else-if="!summary" class="p-6 text-center text-gray-500">
      <i class="pi pi-clock text-3xl mb-2 text-gray-400"></i>
      <p>No hours data available</p>
    </div>

    <div v-else class="p-4">
      <!-- Progress Bar -->
      <div class="mb-6">
        <div class="flex justify-between items-center mb-2">
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
        <div class="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            class="h-2.5 rounded-full" 
            :class="summary.requirementMet ? 'bg-green-600' : 'bg-blue-600'"
            :style="`width: ${summary.progressPercentage}%`"
          ></div>
        </div>
        <div class="mt-2 text-xs text-gray-500">
          <span v-if="summary.requirementMet" class="text-green-600 font-medium">
            <i class="pi pi-check-circle mr-1"></i> Requirement completed!
          </span>
          <span v-else>
            {{ remainingHours }} hours remaining
          </span>
        </div>
      </div>

      <!-- Additional Info -->
      <div class="grid grid-cols-2 gap-4 mt-4">
        <div class="border rounded-lg p-3 bg-gray-50">
          <div class="text-sm text-gray-500">Total Hours</div>
          <div class="text-xl font-bold">{{ summary.totalHours }}</div>
        </div>
        <div class="border rounded-lg p-3 bg-gray-50">
          <div class="text-sm text-gray-500">Last Recorded</div>
          <div class="text-xl font-bold">{{ formatDate(summary.lastRecorded) }}</div>
        </div>
      </div>

      <!-- Bottom CTA Button -->
      <div class="mt-4">
        <Button
          icon="pi pi-plus"
          label="Add Hours"
          class="w-full"
          @click="$emit('add-hours')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import ProgressSpinner from 'primevue/progressspinner';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import type { HoursSummary } from '~/composables/useHours';

const props = defineProps({
  studentId: {
    type: String,
    required: true
  },
  requirementHours: {
    type: Number,
    default: 1000
  }
});

const emit = defineEmits(['add-hours', 'certificate-generated']);

// State
const loading = ref(true);
const error = ref('');
const summary = ref<HoursSummary | null>(null);
const certificateLoading = ref(false);
const toast = useToast();

// Compute remaining hours
const remainingHours = computed(() => {
  if (!summary.value) return 0;
  return Math.max(0, summary.value.requirementHours - summary.value.totalHours);
});

// Determine if certificate can be generated
const canGenerateCertificate = computed(() => {
  return summary.value?.requirementMet === true;
});

// Watch for student ID changes
watch(() => props.studentId, () => {
  if (props.studentId) {
    loadSummary();
  }
});

// Load data on component mount
onMounted(() => {
  if (props.studentId) {
    loadSummary();
  }
});

// Load hours summary data
async function loadSummary() {
  if (!props.studentId) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    const response = await fetch(`/api/hours/summary/${props.studentId}?requirementHours=${props.requirementHours}`);
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.statusMessage || 'Failed to load hours summary');
    }
    
    const data = await response.json();
    summary.value = data;
  } catch (err: any) {
    console.error('Error loading hours summary:', err);
    error.value = err.message || 'Failed to load hours data';
  } finally {
    loading.value = false;
  }
}

// Generate completion certificate
async function generateCertificate() {
  if (!props.studentId) return;
  
  certificateLoading.value = true;
  
  try {
    const response = await fetch(`/api/hours/certificate/${props.studentId}`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.statusMessage || 'Failed to generate certificate');
    }
    
    const data = await response.json();
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Certificate generated successfully',
      life: 3000
    });
    
    // Open the certificate in a new tab if URL is provided
    if (data.certificateUrl) {
      window.open(data.certificateUrl, '_blank');
    }
    
    emit('certificate-generated', data);
  } catch (err: any) {
    console.error('Error generating certificate:', err);
    
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to generate certificate',
      life: 3000
    });
  } finally {
    certificateLoading.value = false;
  }
}

// Format date for display
function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  
  return new Date(dateString).toLocaleDateString();
}
</script>