<template>
  <div class="py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Page Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-semibold text-gray-900">Student Hours Tracking</h1>
        <p class="mt-1 text-sm text-gray-500">
          Record, track, and visualize student hours progress towards requirements.
        </p>
      </div>
      
      <!-- Main Content -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Left Column - Visualization and Progress -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Student Selector (only if not on student-specific page) -->
          <div v-if="!studentId" class="bg-white rounded-lg shadow p-4">
            <label for="student-select" class="block text-sm font-medium text-gray-700 mb-2">
              Select Student
            </label>
            <Dropdown
              id="student-select"
              v-model="selectedStudentId"
              :options="students"
              optionLabel="label"
              optionValue="value"
              placeholder="Choose a student"
              class="w-full"
              :loading="studentsLoading"
              :filter="true"
              @change="onStudentChange"
            />
          </div>
          
          <!-- Progress Card (only if student is selected) -->
          <HoursProgressCard
            v-if="displayStudentId"
            :student-id="displayStudentId"
            :requirement-hours="requirementHours"
            @add-hours="openAddHoursForm"
            @certificate-generated="refreshData"
          />
        </div>
        
        <!-- Right Column - Hours Data -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Monthly Hours Chart (only if student is selected) -->
          <HoursChartCard
            v-if="displayStudentId"
            :student-id="displayStudentId"
          />
          
          <!-- Hours Table -->
          <HoursTable
            :student-id="displayStudentId"
            :loading="hoursLoading"
            :error="hoursError"
            :hours-records="hoursRecords"
            :total-count="totalCount"
            @page-change="onPageChange"
            @filter-change="onFilterChange"
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
      :student-id="displayStudentId"
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
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import HoursProgressCard from '~/components/hours/ProgressCard.vue';
import HoursChartCard from '~/components/hours/ChartCard.vue';
import HoursTable from '~/components/hours/HoursTable.vue';
import HoursForm from '~/components/hours/HoursForm.vue';
import { useHours, type HoursRecord } from '~/composables/useHours';

const route = useRoute();
const toast = useToast();

// Get student ID from route params if available
const studentId = computed(() => route.params.id as string || '');

// State for student selection
const selectedStudentId = ref('');
const students = ref<{ label: string; value: string }[]>([]);
const studentsLoading = ref(false);

// Form state
const hoursFormVisible = ref(false);
const formSubmitting = ref(false);
const selectedHoursRecord = ref<Partial<HoursRecord>>({});
const requirementHours = ref(1000); // Default hours requirement

// Delete confirmation state
const deleteConfirmVisible = ref(false);
const deleteLoading = ref(false);
const hoursToDelete = ref<string | null>(null);

// Use hours composable for data fetching and state management
const {
  hoursRecords,
  totalCount,
  isLoading: hoursLoading,
  error: hoursError,
  fetchHoursRecords,
  createHoursRecord,
  updateHoursRecord,
  deleteHoursRecord: deleteHoursFromService,
  setPage,
  setFilter
} = useHours();

// Display student ID is either from route or from dropdown selection
const displayStudentId = computed(() => studentId.value || selectedStudentId.value);

// Watch for studentId changes from route
watch(studentId, (newVal) => {
  if (newVal) {
    selectedStudentId.value = newVal;
    fetchHoursRecords();
  }
});

// Watch for selected student changes
watch(selectedStudentId, (newVal) => {
  if (newVal) {
    setFilter('studentId', newVal);
    fetchHoursRecords();
  }
});

// Initialize the page
onMounted(async () => {
  await loadStudents();
  
  if (studentId.value) {
    selectedStudentId.value = studentId.value;
  }
  
  fetchHoursRecords();
});

// Load students for dropdown
async function loadStudents() {
  studentsLoading.value = true;
  try {
    const response = await fetch('/api/students?limit=1000&active=true');
    
    if (!response.ok) {
      throw new Error('Failed to load students');
    }
    
    const data = await response.json();
    
    // Transform to dropdown format
    students.value = data.data.map((student: any) => ({
      label: `${student.first_name} ${student.last_name}`,
      value: student.id
    }));
  } catch (error) {
    console.error('Error loading students:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load students list',
      life: 3000
    });
  } finally {
    studentsLoading.value = false;
  }
}

// Handle student selection
function onStudentChange() {
  setFilter('studentId', selectedStudentId.value);
  fetchHoursRecords();
}

// Handle pagination
function onPageChange(event: { page: number; rows: number }) {
  setPage(event.page);
  fetchHoursRecords();
}

// Handle filter changes
function onFilterChange(filters: any) {
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      setFilter(key as any, value);
    }
  });
  
  fetchHoursRecords();
}

// Open form for adding new hours
function openAddHoursForm() {
  selectedHoursRecord.value = {
    student_id: displayStudentId.value,
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
  fetchHoursRecords();
  
  // Trigger event to refresh child components
  const refreshEvent = new CustomEvent('hours-data-updated');
  window.dispatchEvent(refreshEvent);
}
</script>