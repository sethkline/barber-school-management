<template>
  <div class="py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Page Header with Back Button -->
      <div class="mb-6">
        <div class="flex items-center space-x-4 mb-2">
          <NuxtLink :to="`/students/${studentId}`" class="inline-flex items-center text-blue-600 hover:text-blue-800">
            <i class="pi pi-arrow-left mr-1"></i>
            <span>Back to Student</span>
          </NuxtLink>
        </div>
        
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-2xl font-semibold text-gray-900">
              {{ student.first_name }} {{ student.last_name }} - Hours Tracking
            </h1>
            <p class="mt-1 text-sm text-gray-500">
              View and manage hours progress towards completion requirements.
            </p>
          </div>
          <Button 
            icon="pi pi-plus" 
            label="Add Hours" 
            @click="openAddHoursForm"
          />
        </div>
      </div>
      
      <!-- Loading state -->
      <div v-if="loading" class="flex justify-center items-center py-8">
        <ProgressSpinner style="width:50px;height:50px" strokeWidth="4" />
      </div>
      
      <!-- Error state -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
        <div class="flex">
          <i class="pi pi-exclamation-circle mr-3 mt-0.5"></i>
          <div>
            <h3 class="text-sm font-medium text-red-800">Error Loading Student</h3>
            <p class="mt-1">{{ error }}</p>
            <Button
              label="Try Again"
              icon="pi pi-refresh"
              size="small"
              severity="secondary"
              class="mt-2"
              @click="loadStudentData"
            />
          </div>
        </div>
      </div>
      
      <!-- Main Content -->
      <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Left Column - Progress Information -->
        <div class="space-y-6">
          <!-- Hours Progress Card -->
          <HoursProgressCard
            :student-id="studentId"
            :requirement-hours="requirementHours"
            @add-hours="openAddHoursForm"
            @certificate-generated="refreshData"
          />
          
          <!-- Student Info Card -->
          <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-lg font-medium mb-3">Student Information</h2>
            <div class="space-y-2">
              <div class="flex items-center">
                <span class="text-gray-500 w-32">Student ID:</span>
                <span>{{ studentId }}</span>
              </div>
              <div class="flex items-center">
                <span class="text-gray-500 w-32">Email:</span>
                <span>{{ student.email }}</span>
              </div>
              <div class="flex items-center">
                <span class="text-gray-500 w-32">Status:</span>
                <Tag 
                  :value="formatStatus(student.status)" 
                  :severity="getStatusSeverity(student.status)"
                />
              </div>
              <div class="flex items-center">
                <span class="text-gray-500 w-32">Enrolled:</span>
                <span>{{ formatDate(student.enrollment_date) }}</span>
              </div>
              <div class="flex items-center">
                <span class="text-gray-500 w-32">Expected Graduation:</span>
                <span>{{ formatDate(student.expected_graduation_date) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Right Column - Hours Data -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Monthly Hours Chart -->
          <HoursChartCard :student-id="studentId" />
          
          <!-- Hours Table -->
          <HoursTable
            :student-id="studentId"
            @add-hours="openAddHoursForm"
            @edit-hours="openEditHoursForm"
            @delete-hours="confirmDeleteHours"
          />
        </div>
      </div>
    </div>
    
    <!-- Hours Form Dialog -->
    <HoursForm
      v-model:visible="hoursFormVisible"
      :hours-data="selectedHoursRecord"
      :loading="formSubmitting"
      :student-id="studentId"
      @save="saveHoursRecord"
    />
    
    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="deleteConfirmVisible"
      :style="{width: '450px'}"
      header="Confirm Deletion"
      :modal="true"
      :closable="!deleteLoading"
    >
      <div class="p-4">
        <div class="flex items-start">
          <i class="pi pi-exclamation-triangle text-red-500 text-2xl mr-4 mt-0.5"></i>
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Delete Hours Record</h3>
            <p class="text-gray-600">
              Are you sure you want to delete this hours record? This action cannot be undone.
            </p>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            label="Cancel"
            icon="pi pi-times"
            @click="deleteConfirmVisible = false"
            class="p-button-text"
            :disabled="deleteLoading"
          />
          <Button
            label="Delete"
            icon="pi pi-trash"
            severity="danger"
            :loading="deleteLoading"
            @click="deleteHoursRecord"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';
import Tag from 'primevue/tag';
import HoursProgressCard from '~/components/hours/HoursProgressCard.vue';
import HoursChartCard from '~/components/hours/HoursChartCard.vue';
import HoursTable from '~/components/hours/HoursTable.vue';
import HoursForm from '~/components/hours/HoursForm.vue';
import { useHours, type HoursRecord } from '~/composables/useHours';

const route = useRoute();
const toast = useToast();

// Get student ID from route params
const studentId = route.params.id as string;

// State
const student = ref<any>({});
const loading = ref(true);
const error = ref('');
const requirementHours = ref(1000); // Default hours requirement

// Form state
const hoursFormVisible = ref(false);
const formSubmitting = ref(false);
const selectedHoursRecord = ref<Partial<HoursRecord>>({});

// Delete confirmation state
const deleteConfirmVisible = ref(false);
const deleteLoading = ref(false);
const hoursToDelete = ref<string | null>(null);

// Use hours composable for data management
const {
  createHoursRecord,
  updateHoursRecord,
  deleteHoursRecord: deleteHoursFromService
} = useHours();

// Load data on component mount
onMounted(() => {
  loadStudentData();
});

// Load student data
async function loadStudentData() {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await fetch(`/api/students/${studentId}`);
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.statusMessage || 'Failed to load student data');
    }
    
    student.value = await response.json();
  } catch (err: any) {
    console.error('Error loading student data:', err);
    error.value = err.message || 'An error occurred while loading student data';
  } finally {
    loading.value = false;
  }
}

// Open form for adding new hours
function openAddHoursForm() {
  selectedHoursRecord.value = {
    student_id: studentId,
    date_recorded: new Date().toISOString().split('T')[0],
    hours_completed: 1
  };
  hoursFormVisible.value = true;
}

// Open form for editing hours
function openEditHoursForm(record: HoursRecord) {
  selectedHoursRecord.value = { ...record };
  hoursFormVisible.value = true;
}

// Confirm deletion of hours record
function confirmDeleteHours(record: HoursRecord) {
  hoursToDelete.value = record.id;
  deleteConfirmVisible.value = true;
}

// Save new or updated hours record
async function saveHoursRecord(record: Partial<HoursRecord>) {
  formSubmitting.value = true;
  
  try {
    if (record.id) {
      // Update existing record
      await updateHoursRecord(record.id, record);
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Hours record updated successfully',
        life: 3000
      });
    } else {
      // Create new record
      await createHoursRecord(record);
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Hours record created successfully',
        life: 3000
      });
    }
    
    // Close form and refresh data
    hoursFormVisible.value = false;
    refreshData();
  } catch (error) {
    console.error('Error saving hours record:', error);
  } finally {
    formSubmitting.value = false;
  }
}

// Delete hours record
async function deleteHoursRecord() {
  if (!hoursToDelete.value) return;
  
  deleteLoading.value = true;
  
  try {
    await deleteHoursFromService(hoursToDelete.value);
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Hours record deleted successfully',
      life: 3000
    });
    
    // Close dialog and refresh data
    deleteConfirmVisible.value = false;
    hoursToDelete.value = null;
    refreshData();
  } catch (error) {
    console.error('Error deleting hours record:', error);
  } finally {
    deleteLoading.value = false;
  }
}

// Refresh all data on the page
function refreshData() {
  // Trigger event to refresh child components
  const refreshEvent = new CustomEvent('hours-data-updated');
  window.dispatchEvent(refreshEvent);
}

// Format date for display
function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  
  return new Date(dateString).toLocaleDateString();
}

// Format status for display
function formatStatus(status: string | null): string {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

// Get status severity for Tag component
function getStatusSeverity(status: string | null): string {
  if (!status) return 'secondary';
  
  switch (status.toLowerCase()) {
    case 'current':
      return 'success';
    case 'on_leave':
      return 'warning';
    case 'withdrawn':
      return 'danger';
    case 'graduated':
      return 'info';
    case 'pending':
      return 'help';
    default:
      return 'secondary';
  }
}
</script>