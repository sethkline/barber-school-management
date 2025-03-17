<template>
  <div>
    <!-- Hours Summary Section -->
    <div class="mb-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-900">Hours Summary</h3>
        <div class="flex space-x-2">
          <Button
            v-if="canGenerateCertificate"
            icon="pi pi-file-pdf"
            label="Certificate"
            size="small"
            severity="secondary"
            @click="generateCertificate"
            :loading="certificateLoading"
          />
          <Button icon="pi pi-plus" label="Add Hours" size="small" @click="openAddHoursForm" />
        </div>
      </div>

      <div v-if="summaryLoading" class="flex justify-center items-center py-4">
        <ProgressSpinner style="width: 30px; height: 30px" strokeWidth="4" />
      </div>

      <div v-else-if="!summary" class="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
        <i class="pi pi-clock text-3xl mb-2 text-gray-400"></i>
        <p>No hours data available for this student</p>
      </div>

      <div v-else class="bg-white border rounded-lg p-4">
        <!-- Progress Bar -->
        <div class="mb-4">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-medium text-gray-700">
              {{ summary.totalHours }} of {{ summary.requirementHours }} hours
            </span>
            <span class="text-sm font-medium" :class="summary.requirementMet ? 'text-green-600' : 'text-blue-600'">
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
            <span v-else> {{ remainingHours }} hours remaining </span>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          <div class="border rounded-lg p-3 bg-gray-50">
            <div class="text-sm text-gray-500">Total Hours</div>
            <div class="text-xl font-bold">{{ summary.totalHours }}</div>
          </div>
          <div class="border rounded-lg p-3 bg-gray-50">
            <div class="text-sm text-gray-500">Last Recorded</div>
            <div class="text-xl font-bold">{{ formatDate(summary.lastRecorded) }}</div>
          </div>
          <div class="border rounded-lg p-3 bg-gray-50">
            <div class="text-sm text-gray-500">Status</div>
            <div class="text-xl font-bold">
              <span v-if="summary.requirementMet" class="text-green-600">Complete</span>
              <span v-else class="text-blue-600">In Progress</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Hours Records Table -->
    <div>
      <h3 class="text-lg font-medium text-gray-900 mb-4">Hours History</h3>

      <div v-if="hoursLoading" class="flex justify-center items-center py-4">
        <ProgressSpinner style="width: 30px; height: 30px" strokeWidth="4" />
      </div>

      <div v-else-if="hoursError" class="p-4 text-center text-red-600 bg-red-50 rounded-lg">
        <i class="pi pi-exclamation-circle text-xl mb-2"></i>
        <p>{{ hoursError }}</p>
        <Button
          label="Try Again"
          icon="pi pi-refresh"
          class="mt-2"
          severity="secondary"
          size="small"
          @click="fetchHoursData"
        />
      </div>

      <div v-else-if="!hoursRecords.length" class="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
        <i class="pi pi-table text-3xl mb-2 text-gray-400"></i>
        <p>No hours records found</p>
      </div>

      <div v-else>
        <DataTable
          :value="hoursRecords"
          :paginator="true"
          :rows="5"
          paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
          responsiveLayout="scroll"
          class="p-datatable-sm"
          stripedRows
        >
          <Column field="date_recorded" header="Date" sortable>
            <template #body="{ data }">
              {{ formatDate(data.date_recorded) }}
            </template>
          </Column>

          <Column field="hours_completed" header="Hours" sortable>
            <template #body="{ data }">
              <span class="font-medium">{{ data.hours_completed }}</span>
            </template>
          </Column>

          <Column field="created_at" header="Recorded On" sortable>
            <template #body="{ data }">
              {{ formatDateTime(data.created_at) }}
            </template>
          </Column>

          <Column header="Actions" :exportable="false" style="width: 8rem">
            <template #body="{ data }">
              <div class="flex gap-2">
                <Button
                  icon="pi pi-pencil"
                  rounded
                  text
                  severity="success"
                  @click="openEditHoursForm(data)"
                  aria-label="Edit"
                />
                <Button
                  icon="pi pi-trash"
                  rounded
                  text
                  severity="danger"
                  @click="confirmDeleteHours(data)"
                  aria-label="Delete"
                />
              </div>
            </template>
          </Column>
        </DataTable>
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
      :style="{ width: '450px' }"
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
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';
import HoursForm from '~/components/hours/HoursForm.vue';
import { useHours, type HoursRecord, type HoursSummary } from '~/composables/useHours';

const props = defineProps({
  studentId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['refresh']);

const toast = useToast();

// State for hours summary
const summary = ref<HoursSummary | null>(null);
const summaryLoading = ref(true);
const summaryError = ref('');
const certificateLoading = ref(false);

// State for hours records
const hoursRecords = ref<HoursRecord[]>([]);
const hoursLoading = ref(true);
const hoursError = ref('');

// Form state
const hoursFormVisible = ref(false);
const formSubmitting = ref(false);
const selectedHoursRecord = ref<Partial<HoursRecord>>({});

// Delete confirmation state
const deleteConfirmVisible = ref(false);
const deleteLoading = ref(false);
const hoursToDelete = ref<string | null>(null);

// Use hours composable
const {
  fetchHoursSummary,
  fetchHoursRecords,
  createHoursRecord,
  updateHoursRecord,
  deleteHoursRecord: deleteHoursFromService,
  generateCertificate: generateCertificateRequest
} = useHours();

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
watch(
  () => props.studentId,
  () => {
    if (props.studentId) {
      fetchAllData();
    }
  }
);

// Load data on component mount
onMounted(() => {
  if (props.studentId) {
    fetchAllData();
  }
});

// Fetch all data for the component
async function fetchAllData() {
  await Promise.all([fetchSummaryData(), fetchHoursData()]);
}

// Fetch hours summary data
async function fetchSummaryData() {
  if (!props.studentId) return;

  summaryLoading.value = true;
  summaryError.value = '';

  try {
    const data = await fetchHoursSummary(props.studentId);
    summary.value = data;
  } catch (err: any) {
    console.error('Error loading hours summary:', err);
    summaryError.value = err.message || 'Failed to load hours summary';
  } finally {
    summaryLoading.value = false;
  }
}

// Fetch hours records
async function fetchHoursData() {
  if (!props.studentId) return;
  
  hoursLoading.value = true;
  hoursError.value = '';
  
  try {
    const response = await fetchHoursRecords({
      studentId: props.studentId,
      limit: 100 // Get all records for this student
    });
    
    // Check if response exists before trying to access data
    if (response && 'data' in response) {
      hoursRecords.value = response.data;
    } else {
      // Handle case where response doesn't have expected structure
      hoursRecords.value = [];
      console.error('Unexpected response format from fetchHoursRecords');
    }
  } catch (err: any) {
    console.error('Error loading hours records:', err);
    hoursError.value = err.message || 'Failed to load hours records';
  } finally {
    hoursLoading.value = false;
  }
}

// Open form for adding new hours
function openAddHoursForm() {
  selectedHoursRecord.value = {
    student_id: props.studentId,
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
    fetchAllData();
    emit('refresh');
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
    fetchAllData();
    emit('refresh');
  } catch (error) {
    console.error('Error deleting hours record:', error);
  } finally {
    deleteLoading.value = false;
  }
}

// Generate hours completion certificate
async function generateCertificate() {
  if (!props.studentId) return;

  certificateLoading.value = true;

  try {
    const data = await generateCertificateRequest(props.studentId);

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Certificate generated successfully',
      life: 3000
    });

    // Open the certificate in a new tab
    if (data?.certificateUrl) {
      window.open(data.certificateUrl, '_blank');
    }
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

// Format date and time for display
function formatDateTime(dateTimeString: string | null): string {
  if (!dateTimeString) return 'N/A';

  return new Date(dateTimeString).toLocaleString();
}
</script>
