<template>
  <div class="container px-4 py-6">
    <h1 class="text-2xl font-bold mb-6">Communication History</h1>

    <div class="bg-white shadow rounded-lg overflow-hidden">
      <div class="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center">
        <div class="flex-1">
          <span class="p-input-icon-left w-full flex space-x-2 items-center">
            <IconField class="w-full">
              <InputIcon>
                <i class="pi pi-search" />
              </InputIcon>
              <InputText v-model="searchQuery" placeholder="Search in subject or content..." class="w-full" />
            </IconField>
          </span>
        </div>

        <div class="flex gap-2">
          <Dropdown
            v-model="selectedType"
            :options="typeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="All types"
            class="w-48"
          />

          <Button
            icon="pi pi-filter"
            @click="toggleFilters"
            :class="{ 'p-button-outlined': !showFilters }"
            label="Filters"
          />
        </div>
      </div>

      <div v-if="showFilters" class="p-4 border-b border-gray-200 bg-gray-50">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div class="flex gap-2 items-center">
              <Calendar v-model="dateRange[0]" placeholder="From date" class="w-full" />
              <span class="text-gray-500">to</span>
              <Calendar v-model="dateRange[1]" placeholder="To date" class="w-full" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Recipient Type</label>
            <div class="flex gap-2">
              <div class="field-checkbox">
                <Checkbox id="student" v-model="recipientTypes" name="recipientType" value="student" />
                <label for="student">Students</label>
              </div>
              <div class="field-checkbox">
                <Checkbox id="lead" v-model="recipientTypes" name="recipientType" value="lead" />
                <label for="lead">Leads</label>
              </div>
            </div>
          </div>

          <div class="flex items-end">
            <Button label="Apply Filters" class="mr-2" @click="fetchCommunications(1)" />
            <Button label="Reset" severity="secondary" text @click="resetFilters" />
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex justify-center items-center p-6">
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="p-6 text-center text-red-600">
        <i class="pi pi-exclamation-circle text-3xl mb-2"></i>
        <p>{{ error }}</p>
        <Button
          label="Try Again"
          icon="pi pi-refresh"
          class="mt-2"
          severity="secondary"
          @click="fetchCommunications(1)"
        />
      </div>

      <!-- Empty state -->
      <div v-else-if="communications.length === 0" class="p-8 text-center">
        <i class="pi pi-inbox text-4xl text-gray-400 mb-3"></i>
        <h3 class="text-xl font-medium text-gray-800 mb-2">No communications found</h3>
        <p class="text-gray-500">No communication records match your current filters.</p>
      </div>

      <!-- Communications list -->
      <div v-else>
        <DataTable
          :value="communications"
          :paginator="true"
          :rows="limit"
          :totalRecords="totalRecords"
          :rowsPerPageOptions="[10, 20, 50]"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} communications"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          responsiveLayout="stack"
          breakpoint="960px"
          stripedRows
          class="p-datatable-sm"
          @page="onPageChange"
        >
          <Column field="sent_at" header="Date" :sortable="true">
            <template #body="{ data }">
              <div>
                <div class="font-medium">{{ formatDate(data.sent_at) }}</div>
                <div class="text-xs text-gray-500">{{ formatTime(data.sent_at) }}</div>
              </div>
            </template>
          </Column>

          <Column field="to_email" header="Recipient">
            <template #body="{ data }">
              <div>
                <div class="font-medium">{{ data.to_email }}</div>
                <div class="text-xs">
                  <Tag v-if="data.student_id" severity="success" value="Student" class="mr-1" />
                  <Tag v-if="data.lead_id" severity="info" value="Lead" />
                </div>
              </div>
            </template>
          </Column>

          <Column field="subject" header="Subject">
            <template #body="{ data }">
              <div class="font-medium truncate" style="max-width: 300px">
                {{ data.subject || '(No subject)' }}
              </div>
            </template>
          </Column>

          <Column field="type" header="Type">
            <template #body="{ data }">
              <Tag :value="formatType(data.type)" />
            </template>
          </Column>

          <Column header="Actions">
            <template #body="{ data }">
              <Button icon="pi pi-eye" text rounded @click="viewCommunication(data)" aria-label="View" />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- View Communication Dialog -->
    <Dialog
      v-model:visible="showViewDialog"
      :header="selectedCommunication?.subject || 'Communication Details'"
      :modal="true"
      :closable="true"
      :style="{ width: '600px' }"
    >
      <div v-if="selectedCommunication" class="space-y-4">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm text-gray-600">To: {{ selectedCommunication.to_email }}</p>
            <p class="text-sm text-gray-600">Sent: {{ formatDateTime(selectedCommunication.sent_at) }}</p>
          </div>
          <div>
            <Tag v-if="selectedCommunication.student_id" severity="success" value="Student" class="mr-1" />
            <Tag v-if="selectedCommunication.lead_id" severity="info" value="Lead" />
          </div>
        </div>

        <div class="border-t border-b py-4">
          <div v-html="selectedCommunication.body" class="prose max-w-none"></div>
        </div>

        <div class="flex justify-end">
          <Button icon="pi pi-envelope" label="Reply" @click="replyToCommunication" class="mr-2" />
          <Button
            icon="pi pi-user"
            :label="selectedCommunication.student_id ? 'View Student' : 'View Lead'"
            severity="secondary"
            @click="viewRecipient"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import Checkbox from 'primevue/checkbox';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import { debounce } from 'lodash';

const router = useRouter();
const toast = useToast();

// State
const communications = ref([]);
const loading = ref(false);
const error = ref(null);
const currentPage = ref(1);
const limit = ref(10);
const totalRecords = ref(0);
const showFilters = ref(false);
const searchQuery = ref('');
const selectedType = ref('');
const dateRange = ref([null, null]);
const recipientTypes = ref([]);
const selectedCommunication = ref(null);
const showViewDialog = ref(false);

// Options for dropdown
const typeOptions = [
  { label: 'All Types', value: '' },
  { label: 'Email', value: 'email' },
  { label: 'SMS', value: 'sms' },
  { label: 'System', value: 'system' }
];

// Debounced search
const debouncedSearch = debounce(() => {
  fetchCommunications(1);
}, 300);

// Watch for search changes
watch(searchQuery, () => {
  debouncedSearch();
});

watch(selectedType, () => {
  fetchCommunications(1);
});

// Lifecycle
onMounted(() => {
  fetchCommunications(1);
});

// Methods
async function fetchCommunications(page) {
  try {
    loading.value = true;
    error.value = null;

    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.value.toString());

    if (searchQuery.value) {
      params.append('search', searchQuery.value);
    }

    if (selectedType.value) {
      params.append('type', selectedType.value);
    }

    if (dateRange.value[0] && dateRange.value[1]) {
      params.append('fromDate', dateRange.value[0].toISOString().split('T')[0]);
      params.append('toDate', dateRange.value[1].toISOString().split('T')[0]);
    }

    if (recipientTypes.value.length > 0 && recipientTypes.value.length < 2) {
      params.append('recipientType', recipientTypes.value[0]);
    }

    // Use the new endpoint
    const response = await $fetch(`/api/communications/history/all?${params.toString()}`);

    communications.value = response.data;
    totalRecords.value = response.count;
    currentPage.value = page;
  } catch (err) {
    console.error('Error fetching communications:', err);
    error.value = err.message || 'Failed to load communications';
  } finally {
    loading.value = false;
  }
}

function onPageChange(event) {
  fetchCommunications(event.page + 1);
}

function toggleFilters() {
  showFilters.value = !showFilters.value;
}

function resetFilters() {
  searchQuery.value = '';
  selectedType.value = '';
  dateRange.value = [null, null];
  recipientTypes.value = [];
  fetchCommunications(1);
}

function formatDate(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

function formatTime(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
}

function formatDateTime(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
}

function formatType(type) {
  if (!type) return 'Unknown';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function viewCommunication(communication) {
  selectedCommunication.value = communication;
  showViewDialog.value = true;
}

function replyToCommunication() {
  if (!selectedCommunication.value) return;

  const recipient = selectedCommunication.value.student_id
    ? { type: 'student', id: selectedCommunication.value.student_id }
    : { type: 'lead', id: selectedCommunication.value.lead_id };

  if (recipient.id) {
    if (recipient.type === 'student') {
      router.push(`/students/${recipient.id}?tab=communications`);
    } else {
      router.push(`/leads/${recipient.id}?tab=communications`);
    }
    showViewDialog.value = false;
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Cannot identify the recipient to reply to',
      life: 3000
    });
  }
}

function viewRecipient() {
  if (!selectedCommunication.value) return;

  if (selectedCommunication.value.student_id) {
    router.push(`/students/${selectedCommunication.value.student_id}`);
  } else if (selectedCommunication.value.lead_id) {
    router.push(`/leads/${selectedCommunication.value.lead_id}`);
  }

  showViewDialog.value = false;
}
</script>

<style scoped>
:deep(.p-checkbox .p-checkbox-box.p-highlight) {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

:deep(.field-checkbox) {
  display: flex;
  align-items: center;
  margin-right: 1rem;
}

:deep(.field-checkbox label) {
  margin-left: 0.5rem;
}
</style>
