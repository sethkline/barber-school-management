<template>
  <div class="attendance-page p-4 max-w-7xl mx-auto">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <h1 class="text-2xl font-bold">Daily Attendance</h1>

      <div class="date-controls flex items-center gap-2">
        <!-- Date Navigation -->
        <Button icon="pi pi-chevron-left" @click="prevDay" size="small" rounded />

        <div class="date-selector">
          <Calendar v-model="selectedDate" dateFormat="yy-mm-dd" :showIcon="true" @date-select="loadAttendance" />
        </div>

        <Button icon="pi pi-chevron-right" @click="nextDay" size="small" rounded :disabled="isToday" />

        <Button label="Today" @click="goToToday" severity="secondary" size="small" :disabled="isToday" />
      </div>
    </div>

    <!-- Loading and Error States -->
    <div v-if="loading" class="py-20 flex flex-col items-center justify-center">
      <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
      <p class="mt-4 text-gray-500">Loading attendance data...</p>
    </div>

    <div v-else-if="error" class="py-20 flex flex-col items-center justify-center">
      <i class="pi pi-exclamation-circle text-4xl text-red-500 mb-4"></i>
      <p class="text-red-500">{{ error }}</p>
      <Button @click="loadAttendance" label="Try Again" severity="primary" class="mt-4" />
    </div>

    <div v-else>
      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <template #title>Total Students</template>
          <template #content>
            <div class="text-3xl font-bold">{{ students.length }}</div>
          </template>
        </Card>

        <Card>
          <template #title>Present</template>
          <template #content>
            <div class="text-3xl font-bold text-green-500">{{ presentCount }}</div>
            <div class="text-sm text-gray-500">{{ presentPercentage }}% Attendance Rate</div>
          </template>
        </Card>

        <Card>
          <template #title>Absent</template>
          <template #content>
            <div class="text-3xl font-bold text-red-500">{{ absentCount }}</div>
          </template>
        </Card>

        <Card>
          <template #title>Excused</template>
          <template #content>
            <div class="text-3xl font-bold text-yellow-500">{{ excusedCount }}</div>
          </template>
        </Card>

        <Card>
          <template #title>Unmarked</template>
          <template #content>
            <div class="text-3xl font-bold text-blue-500">{{ unmarkedCount }}</div>
          </template>
        </Card>
      </div>

      <!-- Filter and Action Controls -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div class="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <span class="p-input-icon-left w-full md:w-64">
            <IconField>
              <InputIcon>
                <i class="pi pi-search" />
              </InputIcon>
              <InputText placeholder="Search students..." class="w-full" />
            </IconField>
          </span>

          <Dropdown
            v-model="statusFilter"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="All Statuses"
            class="w-full md:w-48"
          />
        </div>

        <Button
          @click="openBulkMarkModal"
          :label="`Mark ${selectedStudents.length} Selected`"
          severity="primary"
          :disabled="selectedStudents.length === 0"
        />
      </div>

      <!-- Attendance Table -->
      <DataTable
        :value="filteredStudents"
        stripedRows
        responsiveLayout="scroll"
        class="p-datatable-sm"
        v-model:selection="tableSelection"
        dataKey="student_id"
        :rowClass="getRowClass"
      >
        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

        <Column field="fullName" header="Student">
          <template #body="{ data }">
            <div class="flex items-center gap-3">
              <Avatar :label="data.first_name[0] + data.last_name[0]" size="small" shape="circle" />
              <div>
                <div class="font-medium">{{ data.first_name }} {{ data.last_name }}</div>
                <div class="text-sm text-gray-500">{{ data.email }}</div>
              </div>
            </div>
          </template>
        </Column>

        <Column field="status" header="Status">
          <template #body="{ data }">
            <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
          </template>
        </Column>

        <Column field="clock_in" header="Clock In">
          <template #body="{ data }">
            {{ formatTime(data.clock_in) }}
          </template>
        </Column>

        <Column field="clock_out" header="Clock Out">
          <template #body="{ data }">
            {{ formatTime(data.clock_out) }}
          </template>
        </Column>

        <Column field="duration" header="Duration">
          <template #body="{ data }">
            {{ calculateDuration(data.clock_in, data.clock_out) }}
          </template>
        </Column>

        <Column header="Actions">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button
                v-if="canMarkPresent(data)"
                icon="pi pi-check"
                @click="markPresent(data.student_id)"
                severity="success"
                text
                size="small"
                tooltip="Mark Present"
                tooltipOptions="{ position: 'top' }"
              />

              <Button
                v-if="canMarkAbsent(data)"
                icon="pi pi-times"
                @click="markAbsent(data.student_id)"
                severity="danger"
                text
                size="small"
                tooltip="Mark Absent"
                tooltipOptions="{ position: 'top' }"
              />

              <Button
                v-if="canMarkExcused(data)"
                icon="pi pi-calendar-minus"
                @click="openExcusedModal(data.student_id)"
                severity="warning"
                text
                size="small"
                tooltip="Mark Excused"
                tooltipOptions="{ position: 'top' }"
              />

              <Button
                v-if="canClockIn(data)"
                label="Clock In"
                @click="clockIn(data.student_id)"
                severity="info"
                text
                size="small"
              />

              <Button
                v-if="canClockOut(data)"
                label="Clock Out"
                @click="clockOut(data.student_id)"
                severity="info"
                text
                size="small"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Excused Modal -->
    <Dialog v-model:visible="showExcusedModal" header="Mark Student as Excused" :modal="true" :closable="true">
      <div class="p-fluid">
        <div class="field">
          <label for="excuse-reason" class="font-medium mb-2 block">Reason for Excuse</label>
          <Textarea v-model="excuseReason" rows="5" placeholder="Enter reason..." />
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" @click="closeExcusedModal" text />
        <Button label="Submit" @click="markExcused" severity="primary" />
      </template>
    </Dialog>

    <!-- Bulk Mark Modal -->
    <Dialog v-model:visible="showBulkMarkModal" header="Mark Selected Students" :modal="true" :closable="true">
      <div class="p-fluid">
        <div class="field mb-4">
          <label for="bulk-status" class="font-medium mb-2 block">Select Status</label>
          <Dropdown
            v-model="bulkStatus"
            :options="bulkStatusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select Status"
            class="w-full"
          />
        </div>

        <div class="field" v-if="bulkStatus === 'excused'">
          <label for="bulk-reason" class="font-medium mb-2 block">Reason</label>
          <Textarea v-model="bulkReason" rows="5" placeholder="Enter reason..." />
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" @click="closeBulkMarkModal" text />
        <Button :label="`Apply to ${selectedStudents.length} Students`" @click="applyBulkMark" severity="primary" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAttendance } from '~/composables/useAttendance';

// Import PrimeVue components
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import ProgressSpinner from 'primevue/progressspinner';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Avatar from 'primevue/avatar';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';

const { fetchDailyAttendance, clockInStudent, clockOutStudent, updateAttendanceStatus, formatTime, calculateDuration } =
  useAttendance();

// State
const selectedDate = ref(new Date().toISOString().split('T')[0]);
const loading = ref(true);
const error = ref(null);
const students = ref([]);
const searchQuery = ref('');
const statusFilter = ref('');
const selectedStudents = ref([]);
const tableSelection = ref([]);
const showExcusedModal = ref(false);
const excuseReason = ref('');
const excusedStudentId = ref(null);
const showBulkMarkModal = ref(false);
const bulkStatus = ref('present');
const bulkReason = ref('');

// Dropdown options
const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Present', value: 'present' },
  { label: 'Absent', value: 'absent' },
  { label: 'Excused', value: 'excused' },
  { label: 'Unmarked', value: 'unmarked' }
];

const bulkStatusOptions = [
  { label: 'Present', value: 'present' },
  { label: 'Absent', value: 'absent' },
  { label: 'Excused', value: 'excused' }
];

// Watch for table selection changes
watch(tableSelection, (newSelection) => {
  selectedStudents.value = newSelection.map((student) => student.student_id);
});

// Helper methods for conditionally showing action buttons
function canMarkPresent(student) {
  return student.status === 'unmarked' || student.status === 'absent' || student.status === 'excused';
}

function canMarkAbsent(student) {
  return student.status === 'unmarked' || student.status === 'present' || student.status === 'excused';
}

function canMarkExcused(student) {
  return student.status === 'unmarked' || student.status === 'present' || student.status === 'absent';
}

function canClockIn(student) {
  return student.status === 'present' && !student.clock_in;
}

function canClockOut(student) {
  return student.status === 'present' && student.clock_in && !student.clock_out;
}

// Get the severity for the status tag
function getStatusSeverity(status) {
  switch (status) {
    case 'present':
      return 'success';
    case 'absent':
      return 'danger';
    case 'excused':
      return 'warning';
    default:
      return 'info';
  }
}

// Apply row class
function getRowClass(data) {
  return {
    'bg-blue-50': selectedStudents.value.includes(data.student_id)
  };
}

// Computed properties
const isToday = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  return selectedDate.value === today;
});

const presentCount = computed(() => students.value.filter((s) => s.status === 'present').length);

const absentCount = computed(() => students.value.filter((s) => s.status === 'absent').length);

const excusedCount = computed(() => students.value.filter((s) => s.status === 'excused').length);

const unmarkedCount = computed(() => students.value.filter((s) => s.status === 'unmarked').length);

const presentPercentage = computed(() => {
  if (students.value.length === 0) return 0;
  return Math.round((presentCount.value / students.value.length) * 100);
});

const filteredStudents = computed(() => {
  let result = [...students.value];

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (student) =>
        student.first_name?.toLowerCase().includes(query) ||
        student.last_name?.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query)
    );
  }

  // Apply status filter
  if (statusFilter.value) {
    result = result.filter((student) => student.status === statusFilter.value);
  }

  return result;
});

const allSelected = computed(() => {
  return (
    filteredStudents.value.length > 0 &&
    filteredStudents.value.every((student) => selectedStudents.value.includes(student.student_id))
  );
});

// Methods
const loadAttendance = async () => {
  loading.value = true;
  error.value = null;

  try {
    const result = await fetchDailyAttendance(selectedDate.value);
    students.value = result?.students || [];
    tableSelection.value = []; // Clear selection when loading new data
  } catch (err) {
    error.value = 'Failed to load attendance data: ' + (err.message || 'Unknown error');
    console.error('Error loading attendance:', err);
  } finally {
    loading.value = false;
  }
};

const prevDay = () => {
  const date = new Date(selectedDate.value);
  date.setDate(date.getDate() - 1);
  selectedDate.value = date.toISOString().split('T')[0];
};

const nextDay = () => {
  if (isToday.value) return;

  const date = new Date(selectedDate.value);
  date.setDate(date.getDate() + 1);
  selectedDate.value = date.toISOString().split('T')[0];
};

const goToToday = () => {
  selectedDate.value = new Date().toISOString().split('T')[0];
};

const toggleSelectAll = () => {
  if (allSelected.value) {
    tableSelection.value = [];
  } else {
    tableSelection.value = [...filteredStudents.value];
  }
};

const markPresent = async (studentId) => {
  try {
    await updateAttendanceStatus(studentId, 'present', selectedDate.value);
    await loadAttendance();
  } catch (err) {
    console.error('Error marking student as present:', err);
  }
};

const markAbsent = async (studentId) => {
  try {
    await updateAttendanceStatus(studentId, 'absent', selectedDate.value);
    await loadAttendance();
  } catch (err) {
    console.error('Error marking student as absent:', err);
  }
};

const openExcusedModal = (studentId) => {
  excusedStudentId.value = studentId;
  excuseReason.value = '';
  showExcusedModal.value = true;
};

const closeExcusedModal = () => {
  showExcusedModal.value = false;
  excusedStudentId.value = null;
};

const markExcused = async () => {
  try {
    await updateAttendanceStatus(excusedStudentId.value, 'excused', selectedDate.value, excuseReason.value);
    closeExcusedModal();
    await loadAttendance();
  } catch (err) {
    console.error('Error marking student as excused:', err);
  }
};

const clockIn = async (studentId) => {
  try {
    await clockInStudent(studentId, selectedDate.value);
    await loadAttendance();
  } catch (err) {
    console.error('Error clocking in student:', err);
  }
};

const clockOut = async (studentId) => {
  try {
    await clockOutStudent(studentId, selectedDate.value);
    await loadAttendance();
  } catch (err) {
    console.error('Error clocking out student:', err);
  }
};

const openBulkMarkModal = () => {
  bulkStatus.value = 'present';
  bulkReason.value = '';
  showBulkMarkModal.value = true;
};

const closeBulkMarkModal = () => {
  showBulkMarkModal.value = false;
};

const applyBulkMark = async () => {
  try {
    // Process each selected student
    const promises = selectedStudents.value.map((studentId) => {
      return updateAttendanceStatus(
        studentId,
        bulkStatus.value,
        selectedDate.value,
        bulkStatus.value === 'excused' ? bulkReason.value : undefined
      );
    });

    await Promise.all(promises);
    closeBulkMarkModal();
    await loadAttendance();
  } catch (err) {
    console.error('Error applying bulk attendance update:', err);
  }
};

// Watch for date changes
watch(selectedDate, () => {
  loadAttendance();
});

// Initial load
onMounted(() => {
  loadAttendance();
});
</script>

<style scoped>
.p-datatable .p-datatable-tbody > tr.bg-blue-50 {
  background-color: #eff6ff !important;
}

/* You can add more specific styles for the PrimeVue components if needed */
</style>
