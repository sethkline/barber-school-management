<template>
  <div class="py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Report History Header -->
      <div class="mb-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-semibold text-gray-900">Report History</h1>
            <p class="mt-1 text-sm text-gray-500">View, download, and manage all previously generated reports</p>
          </div>
          <div class="flex space-x-2">
            <span class="p-input-icon-left">
              <IconField>
                <InputIcon>
                  <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters.global.value" placeholder="Search reports..." class="p-inputtext-sm" />
              </IconField>
            </span>
            <Button icon="pi pi-sliders-h" @click="filtersVisible = !filtersVisible" outlined aria-label="Filters" />
          </div>
        </div>
      </div>

      <!-- Filters Panel -->
      <div v-if="filtersVisible" class="mb-6 bg-white p-4 rounded-lg shadow-sm">
        <h2 class="text-base font-medium text-gray-900 mb-4">Filters</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <MultiSelect
              v-model="selectedReportTypes"
              :options="reportTypeOptions"
              optionLabel="label"
              placeholder="All types"
              class="w-full"
              display="chip"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <MultiSelect
              v-model="selectedFormats"
              :options="formatOptions"
              optionLabel="label"
              placeholder="All formats"
              class="w-full"
              display="chip"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <Calendar
              v-model="dateRange"
              selectionMode="range"
              dateFormat="mm/dd/yy"
              placeholder="Select date range"
              class="w-full"
              :showIcon="true"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Created By</label>
            <Dropdown
              v-model="selectedCreator"
              :options="creatorOptions"
              optionLabel="label"
              placeholder="All users"
              class="w-full"
            />
          </div>
        </div>
        <div class="flex justify-end mt-4">
          <Button
            label="Clear Filters"
            icon="pi pi-filter-slash"
            severity="secondary"
            text
            @click="clearFilters"
            class="mr-2"
          />
          <Button label="Apply Filters" icon="pi pi-filter" @click="applyFilters" />
        </div>
      </div>

      <!-- Reports Data Table -->
      <div class="bg-white shadow-sm rounded-lg overflow-hidden">
        <div v-if="loading" class="p-6 flex justify-center items-center">
          <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
        </div>

        <div v-else-if="error" class="p-6 text-center text-red-600">
          <i class="pi pi-exclamation-circle text-3xl mb-2"></i>
          <p>{{ error }}</p>
          <Button label="Try Again" icon="pi pi-refresh" class="mt-2" severity="secondary" @click="loadReports" />
        </div>

        <div v-else>
          <DataTable
            :value="reports"
            :filters="filters"
            filterDisplay="menu"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[10, 25, 50]"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} reports"
            :globalFilterFields="['name', 'type', 'format', 'createdBy', 'generated']"
            v-model:selection="selectedReports"
            :rowHover="true"
            dataKey="id"
            class="p-datatable-sm"
            :loading="loading"
          >
            <template #header>
              <div class="flex justify-between items-center">
                <div>
                  <Button
                    label="Delete Selected"
                    icon="pi pi-trash"
                    severity="danger"
                    :disabled="!selectedReports || selectedReports.length === 0"
                    @click="confirmDeleteSelected"
                  />
                </div>
                <div>
                  <Button
                    label="Export to Excel"
                    icon="pi pi-file-excel"
                    severity="success"
                    class="mr-2"
                    @click="exportTable"
                  />
                  <Button
                    icon="pi pi-refresh"
                    severity="secondary"
                    outlined
                    @click="loadReports"
                    aria-label="Refresh"
                  />
                </div>
              </div>
            </template>

            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

            <Column field="name" header="Report Name" sortable style="min-width: 14rem">
              <template #body="{ data }">
                <div class="flex items-center">
                  <i :class="data.icon || 'pi pi-file'" class="mr-2 text-primary-600"></i>
                  <span>{{ data.name }}</span>
                </div>
              </template>
              <template #filter="{ filterModel, filterCallback }">
                <InputText
                  v-model="filterModel.value"
                  @input="filterCallback()"
                  class="p-column-filter"
                  placeholder="Search by name"
                />
              </template>
            </Column>

            <Column field="type" header="Type" sortable style="min-width: 8rem">
              <template #body="{ data }">
                <Tag :value="data.type" :severity="getReportTypeSeverity(data.type)" />
              </template>
              <template #filter="{ filterModel, filterCallback }">
                <Dropdown
                  v-model="filterModel.value"
                  :options="reportTypeOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="All types"
                  class="p-column-filter"
                  @change="filterCallback()"
                />
              </template>
            </Column>

            <Column field="format" header="Format" sortable style="min-width: 6rem">
              <template #body="{ data }">
                <div class="flex items-center">
                  <i :class="getFormatIcon(data.format)" class="mr-1"></i>
                  <span>{{ data.format }}</span>
                </div>
              </template>
            </Column>

            <Column field="generated" header="Generated On" sortable style="min-width: 10rem">
              <template #body="{ data }">
                {{ formatDate(data.generated) }}
              </template>
              <template #filter="{ filterModel, filterCallback }">
                <Calendar
                  v-model="filterModel.value"
                  dateFormat="mm/dd/yy"
                  placeholder="Date"
                  @date-select="filterCallback()"
                />
              </template>
            </Column>

            <Column field="createdBy" header="Created By" sortable style="min-width: 10rem">
              <template #body="{ data }">
                {{ data.createdBy || 'System' }}
              </template>
            </Column>

            <Column field="size" header="Size" sortable style="min-width: 6rem">
              <template #body="{ data }">
                {{ formatFileSize(data.size) }}
              </template>
            </Column>

            <Column header="Actions" style="min-width: 12rem; width: 12rem">
              <template #body="{ data }">
                <div class="flex gap-2 justify-center">
                  <Button icon="pi pi-eye" rounded text severity="info" @click="viewReport(data)" aria-label="View" />
                  <Button
                    icon="pi pi-download"
                    rounded
                    text
                    severity="primary"
                    @click="downloadReport(data)"
                    aria-label="Download"
                  />
                  <Button
                    icon="pi pi-share-alt"
                    rounded
                    text
                    severity="secondary"
                    @click="shareReport(data)"
                    aria-label="Share"
                  />
                  <Button
                    icon="pi pi-trash"
                    rounded
                    text
                    severity="danger"
                    @click="confirmDeleteReport(data)"
                    aria-label="Delete"
                  />
                </div>
              </template>
            </Column>

            <template #empty>
              <div class="p-6 text-center text-gray-500">
                <i class="pi pi-folder-open text-3xl mb-2 text-gray-400"></i>
                <p>No reports found</p>
              </div>
            </template>
          </DataTable>
        </div>
      </div>
    </div>

    <!-- View Report Dialog -->
    <Dialog
      v-model:visible="viewReportVisible"
      :header="selectedReport ? selectedReport.name : 'Report Preview'"
      :modal="true"
      :style="{ width: '80vw', maxWidth: '1200px' }"
      :maximizable="true"
    >
      <div v-if="reportLoading" class="p-6 flex justify-center items-center">
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
      </div>
      <div v-else-if="selectedReport" class="p-4">
        <div class="bg-white p-4 rounded-lg border">
          <!-- This would be replaced with an actual report viewer component -->
          <iframe
            v-if="selectedReport.format === 'PDF'"
            :src="'/api/reports/' + selectedReport.id + '/preview'"
            class="w-full"
            style="height: 60vh"
          ></iframe>
          <div v-else class="text-center text-gray-500 p-8">
            <i class="pi pi-file text-4xl mb-4"></i>
            <p>Preview not available for {{ selectedReport.format }} format</p>
            <Button
              icon="pi pi-download"
              label="Download Instead"
              severity="primary"
              class="mt-4"
              @click="downloadReport(selectedReport)"
            />
          </div>
        </div>
      </div>
    </Dialog>

    <!-- Share Report Dialog -->
    <Dialog v-model:visible="shareReportVisible" header="Share Report" :modal="true" :style="{ width: '500px' }">
      <ReportSharing v-if="selectedReport" :report="selectedReport" @report-shared="onReportShared" />
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import MultiSelect from 'primevue/multiselect';
import Calendar from 'primevue/calendar';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';
import ConfirmDialog from 'primevue/confirmdialog';
import ReportSharing from '~/components/reporting/ReportSharing.vue';

const toast = useToast();
const confirm = useConfirm();

// UI state
const loading = ref(false);
const error = ref('');
const filtersVisible = ref(false);
const reports = ref([]);
const selectedReports = ref([]);
const viewReportVisible = ref(false);
const shareReportVisible = ref(false);
const reportLoading = ref(false);
const selectedReport = ref(null);

// Filter state
const filters = reactive({
  global: { value: null, matchMode: 'contains' }
});
const selectedReportTypes = ref([]);
const selectedFormats = ref([]);
const dateRange = ref(null);
const selectedCreator = ref(null);

// Options for filters
const reportTypeOptions = [
  { label: 'Student', value: 'Student' },
  { label: 'Financial', value: 'Financial' },
  { label: 'Marketing', value: 'Marketing' },
  { label: 'Compliance', value: 'Compliance' },
  { label: 'Certification', value: 'Certification' }
];

const formatOptions = [
  { label: 'PDF', value: 'PDF' },
  { label: 'Excel', value: 'Excel' },
  { label: 'CSV', value: 'CSV' }
];

const creatorOptions = [
  { label: 'All Users', value: null },
  { label: 'System', value: 'System' },
  { label: 'Admin', value: 'Admin' },
  { label: 'Reports Manager', value: 'Reports Manager' }
];

onMounted(() => {
  loadReports();
});

// Load reports data
async function loadReports() {
  loading.value = true;
  error.value = '';

  try {
    // Simulate API call with a delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Sample data - replace with actual API call
    reports.value = [
      {
        id: 'rep-001',
        name: 'Student Progress Summary',
        type: 'Student',
        icon: 'pi pi-chart-line',
        generated: '2025-03-15T14:30:00',
        status: 'Completed',
        format: 'PDF',
        createdBy: 'Admin',
        size: 2456000
      },
      {
        id: 'rep-002',
        name: 'Monthly Financial Report',
        type: 'Financial',
        icon: 'pi pi-dollar',
        generated: '2025-03-10T09:15:00',
        status: 'Completed',
        format: 'Excel',
        createdBy: 'Reports Manager',
        size: 1245000
      },
      {
        id: 'rep-003',
        name: 'Lead Conversion Analysis',
        type: 'Marketing',
        icon: 'pi pi-percentage',
        generated: '2025-03-08T16:45:00',
        status: 'Completed',
        format: 'PDF',
        createdBy: 'Admin',
        size: 3456000
      },
      {
        id: 'rep-004',
        name: 'Attendance Compliance Check',
        type: 'Compliance',
        icon: 'pi pi-check-circle',
        generated: '2025-03-05T11:20:00',
        status: 'Completed',
        format: 'CSV',
        createdBy: 'System',
        size: 850000
      },
      {
        id: 'rep-005',
        name: 'Certification Status Overview',
        type: 'Certification',
        icon: 'pi pi-verified',
        generated: '2025-03-01T15:10:00',
        status: 'Completed',
        format: 'PDF',
        createdBy: 'Admin',
        size: 1650000
      },
      {
        id: 'rep-006',
        name: 'Weekly Revenue Report',
        type: 'Financial',
        icon: 'pi pi-dollar',
        generated: '2025-02-25T09:45:00',
        status: 'Completed',
        format: 'Excel',
        createdBy: 'Reports Manager',
        size: 980000
      },
      {
        id: 'rep-007',
        name: 'Student Enrollment Trends',
        type: 'Student',
        icon: 'pi pi-users',
        generated: '2025-02-20T13:30:00',
        status: 'Completed',
        format: 'PDF',
        createdBy: 'Admin',
        size: 2100000
      },
      {
        id: 'rep-008',
        name: 'Marketing Campaign Results',
        type: 'Marketing',
        icon: 'pi pi-percentage',
        generated: '2025-02-15T16:20:00',
        status: 'Completed',
        format: 'PDF',
        createdBy: 'Reports Manager',
        size: 3250000
      }
    ];
  } catch (err: any) {
    console.error('Failed to load reports:', err);
    error.value = err.message || 'Failed to load reports';
  } finally {
    loading.value = false;
  }
}

// Clear all filters
function clearFilters() {
  selectedReportTypes.value = [];
  selectedFormats.value = [];
  dateRange.value = null;
  selectedCreator.value = null;
  filters.global.value = null;
}

// Apply filters
function applyFilters() {
  loadReports();
  filtersVisible.value = false;
}

// View a report
function viewReport(report) {
  selectedReport.value = report;
  reportLoading.value = true;
  viewReportVisible.value = true;

  // Simulate loading the report content
  setTimeout(() => {
    reportLoading.value = false;
  }, 1000);
}

// Download a report
function downloadReport(report) {
  toast.add({
    severity: 'info',
    summary: 'Downloading',
    detail: `Downloading ${report.name}...`,
    life: 3000
  });

  // Simulate download completion
  setTimeout(() => {
    toast.add({
      severity: 'success',
      summary: 'Download Complete',
      detail: `${report.name} has been downloaded`,
      life: 3000
    });
  }, 1500);
}

// Share a report
function shareReport(report) {
  selectedReport.value = report;
  shareReportVisible.value = true;
}

// On report shared handler
function onReportShared(details) {
  shareReportVisible.value = false;

  toast.add({
    severity: 'success',
    summary: 'Report Shared',
    detail: `Report has been shared with ${details.recipients.length} recipients`,
    life: 3000
  });
}

// Confirm deletion of a single report
function confirmDeleteReport(report) {
  confirm.require({
    message: `Are you sure you want to delete the report "${report.name}"?`,
    header: 'Delete Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => deleteReport(report),
    reject: () => {} // Do nothing on reject
  });
}

// Delete a report
function deleteReport(report) {
  // Here you would call your API to delete the report
  // For now, we'll just simulate it
  const index = reports.value.findIndex((r) => r.id === report.id);
  if (index !== -1) {
    reports.value.splice(index, 1);

    toast.add({
      severity: 'success',
      summary: 'Report Deleted',
      detail: `${report.name} has been deleted successfully`,
      life: 3000
    });
  }
}

// Confirm deletion of multiple reports
function confirmDeleteSelected() {
  confirm.require({
    message: `Are you sure you want to delete ${selectedReports.value.length} selected reports?`,
    header: 'Delete Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => deleteSelectedReports(),
    reject: () => {} // Do nothing on reject
  });
}

// Delete selected reports
function deleteSelectedReports() {
  // Here you would call your API to delete the selected reports
  // For now, we'll just simulate it
  const selectedIds = selectedReports.value.map((r) => r.id);
  reports.value = reports.value.filter((r) => !selectedIds.includes(r.id));

  toast.add({
    severity: 'success',
    summary: 'Reports Deleted',
    detail: `${selectedReports.value.length} reports have been deleted successfully`,
    life: 3000
  });

  selectedReports.value = [];
}

// Export the table to Excel
function exportTable() {
  toast.add({
    severity: 'info',
    summary: 'Exporting',
    detail: 'Exporting reports list to Excel...',
    life: 3000
  });

  // Simulate export completion
  setTimeout(() => {
    toast.add({
      severity: 'success',
      summary: 'Export Complete',
      detail: 'Reports list has been exported to Excel',
      life: 3000
    });
  }, 1500);
}

// Get severity class for report type
function getReportTypeSeverity(type) {
  switch (type) {
    case 'Student':
      return 'info';
    case 'Financial':
      return 'success';
    case 'Marketing':
      return 'warning';
    case 'Compliance':
      return 'danger';
    case 'Certification':
      return 'primary';
    default:
      return 'secondary';
  }
}

// Get icon for file format
function getFormatIcon(format) {
  switch (format) {
    case 'PDF':
      return 'pi pi-file-pdf text-red-500';
    case 'Excel':
      return 'pi pi-file-excel text-green-500';
    case 'CSV':
      return 'pi pi-file text-blue-500';
    default:
      return 'pi pi-file text-gray-500';
  }
}

// Format date values
function formatDate(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date);
}

// Format file size values
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
</script>
