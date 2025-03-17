<template>
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="flex items-center justify-between p-4 border-b border-gray-200">
      <h3 class="text-lg font-medium text-gray-900">Hours History</h3>
      <div class="flex items-center space-x-2">
        <Dropdown
          v-if="!studentId"
          v-model="filters.studentId"
          :options="students"
          optionLabel="label"
          optionValue="value"
          placeholder="All Students"
          class="w-56 text-sm"
          :loading="studentsLoading"
          @change="applyFilters"
        />
        <Button icon="pi pi-plus" label="Add Hours" class="p-button-primary" @click="$emit('add-hours')" />
      </div>
    </div>

    <div v-if="loading" class="flex justify-center items-center p-6">
      <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
    </div>

    <div v-else-if="error" class="p-6 text-center text-red-600">
      <i class="pi pi-exclamation-circle text-3xl mb-2"></i>
      <p>{{ error }}</p>
      <Button label="Try Again" icon="pi pi-refresh" class="mt-2" severity="secondary" @click="fetchHoursRecords" />
    </div>

    <div v-else>
      <DataTable
        :value="hoursRecords"
        :paginator="true"
        :rows="limit"
        :totalRecords="totalCount"
        :rowsPerPageOptions="[10, 20, 50]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        responsiveLayout="scroll"
        stripedRows
        class="p-datatable-sm"
        @page="onPageChange"
        v-model:filters="tableFilters"
        filterDisplay="menu"
      >
        <template #header>
          <div class="flex justify-between items-center">
            <div>
              <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="tableFilters.global.value" placeholder="Search records..." class="p-inputtext-sm" />
              </span>
            </div>
            <div class="flex space-x-2">
              <Calendar
                v-model="filters.dateRange"
                selectionMode="range"
                placeholder="Date range"
                dateFormat="mm/dd/yy"
                :maxDate="maxDate"
                :showIcon="true"
                :showButtonBar="true"
                class="p-calendar-sm"
                @date-select="onDateSelect"
                @clear="onDateClear"
              />
            </div>
          </div>
        </template>

        <!-- Student column (only shown when not filtered by student) -->
        <Column v-if="!studentId && !filters.studentId" field="student_name" header="Student" sortable>
          <template #body="{ data }">
            <NuxtLink :to="`/students/${data.student_id}`" class="text-blue-600 hover:text-blue-800">
              {{ data.student_name || 'Unknown Student' }}
            </NuxtLink>
          </template>
        </Column>

        <!-- Date column -->
        <Column field="date_recorded" header="Date" sortable>
          <template #body="{ data }">
            {{ formatDate(data.date_recorded) }}
          </template>
          <template #filter="{ filterModel, filterCallback }">
            <Calendar
              v-model="filterModel.value"
              dateFormat="mm/dd/yy"
              placeholder="Filter by date"
              @date-select="filterCallback()"
            />
          </template>
        </Column>

        <!-- Hours column -->
        <Column field="hours_completed" header="Hours" sortable>
          <template #body="{ data }">
            <span class="font-medium">{{ data.hours_completed }}</span>
          </template>
        </Column>

        <!-- Created At column -->
        <Column field="created_at" header="Recorded On" sortable>
          <template #body="{ data }">
            {{ formatDateTime(data.created_at) }}
          </template>
        </Column>

        <!-- Actions column -->
        <Column header="Actions" :exportable="false" style="width: 8rem">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button
                icon="pi pi-pencil"
                rounded
                text
                severity="success"
                @click="$emit('edit-hours', data)"
                aria-label="Edit"
              />
              <Button
                icon="pi pi-trash"
                rounded
                text
                severity="danger"
                @click="$emit('delete-hours', data)"
                aria-label="Delete"
              />
            </div>
          </template>
        </Column>

        <!-- Empty state template -->
        <template #empty>
          <div class="text-center p-4">
            <i class="pi pi-clock text-gray-400 text-4xl mb-3"></i>
            <p class="text-gray-500">No hours records found</p>
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import InputText from 'primevue/inputtext';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import { useHours } from '~/composables/useHours';

const props = defineProps({
  studentId: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  hoursRecords: {
    type: Array,
    default: () => []
  },
  totalCount: {
    type: Number,
    default: 0
  },
  limit: {
    type: Number,
    default: 10
  }
});

const emit = defineEmits(['page-change', 'filter-change', 'add-hours', 'edit-hours', 'delete-hours']);

// Table filters for DataTable
const tableFilters = reactive({
  global: { value: null, matchMode: 'contains' },
  date_recorded: { value: null, matchMode: 'dateIs' }
});

// Component state
const filters = reactive({
  studentId: props.studentId || '',
  dateRange: null as Date[] | null,
  startDate: '',
  endDate: ''
});

// Get maxDate for date pickers (today)
const maxDate = computed(() => new Date());

// Setup for student dropdown
const students = ref<{ label: string; value: string }[]>([]);
const studentsLoading = ref(false);

// Use hours composable if parent doesn't provide data
const {
  hoursRecords: localHoursRecords,
  totalCount: localTotalCount,
  isLoading: localLoading,
  error: localError,
  fetchHoursRecords: loadHoursRecords,
  setPage,
  setFilter
} = useHours();

// Use props or local state based on what's provided
const actualHoursRecords = computed(() =>
  props.hoursRecords.length > 0 ? props.hoursRecords : localHoursRecords.value
);
const actualTotalCount = computed(() => (props.totalCount > 0 ? props.totalCount : localTotalCount.value));
const actualLoading = computed(() => props.loading || localLoading.value);
const actualError = computed(() => props.error || localError.value);

// Watch for student ID changes
watch(
  () => props.studentId,
  (newVal) => {
    filters.studentId = newVal || '';
    if (filters.studentId) {
      fetchHoursRecords();
    }
  }
);

// Load data on component mount
onMounted(async () => {
  if (!props.studentId && !props.hoursRecords.length) {
    await loadStudents();
  }
  fetchHoursRecords();
});

// Function to load students for dropdown
async function loadStudents() {
  studentsLoading.value = true;
  try {
    // Fetch students for dropdown
    const response = await fetch('/api/students?limit=1000&active=true');

    if (!response.ok) {
      throw new Error('Failed to load students');
    }

    const data = await response.json();

    // Transform to dropdown format
    students.value = [
      { label: 'All Students', value: '' },
      ...data.data.map((student: any) => ({
        label: `${student.first_name} ${student.last_name}`,
        value: student.id
      }))
    ];
  } catch (error) {
    console.error('Error loading students:', error);
  } finally {
    studentsLoading.value = false;
  }
}

// Methods for handling pagination and filtering
function onPageChange(event: any) {
  const pageData = {
    page: event.page + 1, // Convert from 0-indexed to 1-indexed
    rows: event.rows
  };

  emit('page-change', pageData);

  // If using local state, update it
  if (!props.hoursRecords.length) {
    setPage(pageData.page);
  }
}

// Handle date range selection
function onDateSelect() {
  if (filters.dateRange && filters.dateRange.length === 2) {
    const startDate = new Date(filters.dateRange[0]);
    const endDate = new Date(filters.dateRange[1]);

    filters.startDate = startDate.toISOString().split('T')[0];
    filters.endDate = endDate.toISOString().split('T')[0];

    applyFilters();
  }
}

// Clear date range
function onDateClear() {
  filters.dateRange = null;
  filters.startDate = '';
  filters.endDate = '';

  applyFilters();
}

// Apply all filters
function applyFilters() {
  const filterData = {
    studentId: filters.studentId,
    startDate: filters.startDate,
    endDate: filters.endDate
  };

  emit('filter-change', filterData);

  // If using local state, update it
  if (!props.hoursRecords.length) {
    Object.entries(filterData).forEach(([key, value]) => {
      if (value) {
        setFilter(key as any, value);
      }
    });

    fetchHoursRecords();
  }
}

// Fetch hours records
function fetchHoursRecords() {
  // If parent provides data, let them handle it
  if (props.hoursRecords.length > 0) {
    emit('filter-change', {
      studentId: filters.studentId,
      startDate: filters.startDate,
      endDate: filters.endDate
    });
    return;
  }

  // Otherwise use local state
  loadHoursRecords();
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
