<template>
  <div class="py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Reporting System Header -->
      <div class="mb-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-semibold text-gray-900">Reporting System</h1>
            <p class="mt-1 text-sm text-gray-500">
              Generate customized reports for your business needs
            </p>
          </div>
          <div>
            <Button
              label="Create New Report"
              icon="pi pi-plus"
              @click="showNewReportDialog"
            />
          </div>
        </div>
      </div>
      
      <!-- Report Templates Section -->
      <div class="mb-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Report Templates</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            v-for="template in reportTemplates" 
            :key="template.id"
            class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex items-start">
              <div class="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <i :class="template.icon" class="text-primary-600"></i>
              </div>
              <div class="ml-3 flex-1">
                <h3 class="text-base font-medium text-gray-900">{{ template.name }}</h3>
                <p class="mt-1 text-sm text-gray-500">{{ template.description }}</p>
                <div class="mt-3 flex items-center">
                  <Button
                    icon="pi pi-file"
                    label="Generate"
                    severity="secondary"
                    text
                    size="small"
                    @click="generateReport(template)"
                  />
                  <Button
                    icon="pi pi-clock"
                    label="Schedule"
                    severity="secondary"
                    text
                    size="small"
                    class="ml-2"
                    @click="scheduleReport(template)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Recent Reports Section -->
      <div class="mb-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-medium text-gray-900">Recent Reports</h2>
          <NuxtLink to="/reports/history" class="text-sm text-primary-600 hover:text-primary-800 flex items-center">
            View All Reports
            <i class="pi pi-arrow-right ml-1"></i>
          </NuxtLink>
        </div>
        
        <div class="bg-white shadow-sm rounded-lg overflow-hidden">
          <div v-if="loading" class="p-6 flex justify-center items-center">
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
              @click="loadRecentReports"
            />
          </div>
          
          <div v-else-if="!recentReports.length" class="p-6 text-center text-gray-500">
            <i class="pi pi-file text-3xl mb-2 text-gray-400"></i>
            <p>No reports generated yet</p>
          </div>
          
          <div v-else>
            <DataTable 
              :value="recentReports" 
              :rowHover="true"
              stripedRows
              class="p-datatable-sm"
            >
              <Column field="name" header="Report Name">
                <template #body="{ data }">
                  <div class="flex items-center">
                    <i :class="data.icon" class="mr-2 text-primary-600"></i>
                    <span>{{ data.name }}</span>
                  </div>
                </template>
              </Column>
              <Column field="type" header="Type">
                <template #body="{ data }">
                  <Tag :value="data.type" :severity="getReportTypeSeverity(data.type)" />
                </template>
              </Column>
              <Column field="generated" header="Generated On">
                <template #body="{ data }">
                  {{ formatDate(data.generated) }}
                </template>
              </Column>
              <Column field="status" header="Status">
                <template #body="{ data }">
                  <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
                </template>
              </Column>
              <Column header="Actions" style="width: 12rem">
                <template #body="{ data }">
                  <div class="flex gap-2">
                    <Button
                      icon="pi pi-download"
                      rounded
                      text
                      severity="primary"
                      @click="downloadReport(data)"
                      aria-label="Download"
                    />
                    <Button
                      icon="pi pi-file-pdf"
                      rounded
                      text
                      severity="danger"
                      @click="exportToPdf(data)"
                      aria-label="Export to PDF"
                    />
                    <Button
                      icon="pi pi-file-excel"
                      rounded
                      text
                      severity="success"
                      @click="exportToExcel(data)"
                      aria-label="Export to Excel"
                    />
                    <Button
                      icon="pi pi-share-alt"
                      rounded
                      text
                      severity="secondary"
                      @click="showShareDialog(data)"
                      aria-label="Share"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
      </div>
      
      <!-- Scheduled Reports Section -->
      <div>
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-medium text-gray-900">Scheduled Reports</h2>
          <Button
            icon="pi pi-plus"
            label="Schedule New"
            severity="secondary"
            size="small"
            @click="showScheduleDialog"
          />
        </div>
        
        <div class="bg-white shadow-sm rounded-lg overflow-hidden">
          <div v-if="scheduledReports.length === 0" class="p-6 text-center text-gray-500">
            <i class="pi pi-clock text-3xl mb-2 text-gray-400"></i>
            <p>No scheduled reports</p>
            <Button 
              label="Schedule Your First Report" 
              icon="pi pi-plus" 
              class="mt-3" 
              severity="secondary"
              @click="showScheduleDialog"
            />
          </div>
          
          <div v-else>
            <DataTable 
              :value="scheduledReports" 
              :rowHover="true"
              stripedRows
              class="p-datatable-sm"
            >
              <Column field="name" header="Report Name">
                <template #body="{ data }">
                  <div class="flex items-center">
                    <i :class="data.icon" class="mr-2 text-primary-600"></i>
                    <span>{{ data.name }}</span>
                  </div>
                </template>
              </Column>
              <Column field="frequency" header="Frequency">
                <template #body="{ data }">
                  {{ data.frequency }}
                </template>
              </Column>
              <Column field="recipients" header="Recipients">
                <template #body="{ data }">
                  {{ data.recipients.join(", ") }}
                </template>
              </Column>
              <Column field="nextRun" header="Next Run">
                <template #body="{ data }">
                  {{ formatDate(data.nextRun) }}
                </template>
              </Column>
              <Column header="Actions" style="width: 10rem">
                <template #body="{ data }">
                  <div class="flex gap-2">
                    <Button
                      icon="pi pi-pencil"
                      rounded
                      text
                      severity="primary"
                      @click="editSchedule(data)"
                      aria-label="Edit"
                    />
                    <Button
                      icon="pi pi-play"
                      rounded
                      text
                      severity="success"
                      @click="runNow(data)"
                      aria-label="Run Now"
                    />
                    <Button
                      icon="pi pi-trash"
                      rounded
                      text
                      severity="danger"
                      @click="deleteSchedule(data)"
                      aria-label="Delete"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
      </div>
    </div>
    
    <!-- New Report Dialog -->
    <Dialog 
      v-model:visible="newReportDialogVisible" 
      header="Create New Report" 
      :modal="true"
      :style="{ width: '650px' }"
    >
      <ReportingReportGenerator @report-created="onReportCreated" />
    </Dialog>
    
    <!-- Schedule Report Dialog -->
    <Dialog 
      v-model:visible="scheduleDialogVisible" 
      header="Schedule Report" 
      :modal="true"
      :style="{ width: '550px' }"
    >
      <ReportingReportScheduler 
        :report-template="selectedTemplate" 
        @schedule-created="onScheduleCreated" 
      />
    </Dialog>
    
    <!-- Share Report Dialog -->
    <Dialog 
      v-model:visible="shareDialogVisible" 
      header="Share Report" 
      :modal="true"
      :style="{ width: '500px' }"
    >
      <ReportingReportSharing 
        :report="selectedReport" 
        @report-shared="onReportShared" 
      />
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';
// import ReportGenerator from '~/components/reporting/ReportGenerator.vue';
// import ReportScheduler from '~/components/reporting/ReportScheduler.vue';
// import ReportSharing from '~/components/reporting/ReportSharing.vue';

const toast = useToast();

// Loading states
const loading = ref(false);
const error = ref('');

// Dialog visibility states
const newReportDialogVisible = ref(false);
const scheduleDialogVisible = ref(false);
const shareDialogVisible = ref(false);

// Selected items for dialogs
const selectedTemplate = ref(null);
const selectedReport = ref(null);

// Sample data for report templates
const reportTemplates = ref([
  {
    id: 'student-progress',
    name: 'Student Progress Report',
    description: 'View detailed progress metrics for all students or filter by specific criteria.',
    icon: 'pi pi-chart-line'
  },
  {
    id: 'enrollment-trends',
    name: 'Enrollment Trends',
    description: 'Analyze enrollment patterns over time with key growth indicators.',
    icon: 'pi pi-users'
  },
  {
    id: 'financial-summary',
    name: 'Financial Summary',
    description: 'Comprehensive overview of revenue, expenses, and profitability metrics.',
    icon: 'pi pi-dollar'
  },
  {
    id: 'attendance-compliance',
    name: 'Attendance Compliance',
    description: 'Track attendance patterns and identify compliance issues.',
    icon: 'pi pi-check-circle'
  },
  {
    id: 'lead-conversion',
    name: 'Lead Conversion Analysis',
    description: 'Measure lead generation and conversion effectiveness across channels.',
    icon: 'pi pi-percentage'
  },
  {
    id: 'certification-status',
    name: 'Certification Status',
    description: 'Monitor student certification progress and completion rates.',
    icon: 'pi pi-verified'
  }
]);

// Sample data for recent reports
const recentReports = ref([]);

// Sample data for scheduled reports
const scheduledReports = ref([]);

onMounted(() => {
  loadRecentReports();
  loadScheduledReports();
});

// Load recent reports data
async function loadRecentReports() {
  loading.value = true;
  error.value = '';
  
  try {
    // Simulate API call with a delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Sample data - replace with actual API call
    recentReports.value = [
      {
        id: 'rep-001',
        name: 'Student Progress Summary',
        type: 'Student',
        icon: 'pi pi-chart-line',
        generated: '2025-03-15T14:30:00',
        status: 'Completed',
        format: 'PDF'
      },
      {
        id: 'rep-002',
        name: 'Monthly Financial Report',
        type: 'Financial',
        icon: 'pi pi-dollar',
        generated: '2025-03-10T09:15:00',
        status: 'Completed',
        format: 'Excel'
      },
      {
        id: 'rep-003',
        name: 'Lead Conversion Analysis',
        type: 'Marketing',
        icon: 'pi pi-percentage',
        generated: '2025-03-08T16:45:00',
        status: 'Completed',
        format: 'PDF'
      },
      {
        id: 'rep-004',
        name: 'Attendance Compliance Check',
        type: 'Compliance',
        icon: 'pi pi-check-circle',
        generated: '2025-03-05T11:20:00',
        status: 'Completed',
        format: 'CSV'
      },
      {
        id: 'rep-005',
        name: 'Certification Status Overview',
        type: 'Certification',
        icon: 'pi pi-verified',
        generated: '2025-03-01T15:10:00',
        status: 'Completed',
        format: 'PDF'
      }
    ];
  } catch (err: any) {
    console.error('Failed to load recent reports:', err);
    error.value = err.message || 'Failed to load reports';
  } finally {
    loading.value = false;
  }
}

// Load scheduled reports data
async function loadScheduledReports() {
  try {
    // Simulate API call with a delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Sample data - replace with actual API call
    scheduledReports.value = [
      {
        id: 'sch-001',
        name: 'Weekly Student Progress',
        icon: 'pi pi-chart-line',
        frequency: 'Weekly (Monday)',
        recipients: ['admin@example.com', 'instructors@example.com'],
        nextRun: '2025-03-23T08:00:00'
      },
      {
        id: 'sch-002',
        name: 'Monthly Financial Summary',
        icon: 'pi pi-dollar',
        frequency: 'Monthly (1st day)',
        recipients: ['finance@example.com', 'director@example.com'],
        nextRun: '2025-04-01T09:00:00'
      },
      {
        id: 'sch-003',
        name: 'Attendance Compliance',
        icon: 'pi pi-check-circle',
        frequency: 'Daily',
        recipients: ['compliance@example.com'],
        nextRun: '2025-03-17T07:00:00'
      }
    ];
  } catch (err: any) {
    console.error('Failed to load scheduled reports:', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load scheduled reports',
      life: 3000
    });
  }
}

// Show the new report dialog
function showNewReportDialog() {
  newReportDialogVisible.value = true;
}

// Generate a report from a template
function generateReport(template) {
  selectedTemplate.value = template;
  newReportDialogVisible.value = true;
}

// Show the schedule report dialog
function scheduleReport(template) {
  selectedTemplate.value = template;
  scheduleDialogVisible.value = true;
}

// Show the general schedule dialog
function showScheduleDialog() {
  selectedTemplate.value = null;
  scheduleDialogVisible.value = true;
}

// Report creation handler
function onReportCreated(report) {
  newReportDialogVisible.value = false;
  
  // Add the new report to the recent reports list
  loadRecentReports();
  
  toast.add({
    severity: 'success',
    summary: 'Report Created',
    detail: `${report.name} has been generated successfully`,
    life: 3000
  });
}

// Schedule creation handler
function onScheduleCreated(schedule) {
  scheduleDialogVisible.value = false;
  
  // Refresh the scheduled reports list
  loadScheduledReports();
  
  toast.add({
    severity: 'success',
    summary: 'Schedule Created',
    detail: `Report has been scheduled for ${schedule.frequency}`,
    life: 3000
  });
}

// Edit a scheduled report
function editSchedule(schedule) {
  selectedTemplate.value = {
    name: schedule.name,
    id: schedule.id
  };
  scheduleDialogVisible.value = true;
}

// Run a scheduled report immediately
function runNow(schedule) {
  toast.add({
    severity: 'info',
    summary: 'Processing',
    detail: `Running ${schedule.name} report now...`,
    life: 3000
  });
  
  // Simulate API call
  setTimeout(() => {
    toast.add({
      severity: 'success',
      summary: 'Report Generated',
      detail: `${schedule.name} has been generated and sent to recipients`,
      life: 3000
    });
    
    loadRecentReports();
  }, 2000);
}

// Delete a scheduled report
function deleteSchedule(schedule) {
  // Simulate API call
  setTimeout(() => {
    scheduledReports.value = scheduledReports.value.filter(s => s.id !== schedule.id);
    
    toast.add({
      severity: 'success',
      summary: 'Schedule Deleted',
      detail: `${schedule.name} has been removed from scheduled reports`,
      life: 3000
    });
  }, 500);
}

// Download a report
function downloadReport(report) {
  toast.add({
    severity: 'info',
    summary: 'Downloading',
    detail: `Downloading ${report.name}...`,
    life: 3000
  });
}

// Export a report to PDF
function exportToPdf(report) {
  toast.add({
    severity: 'info',
    summary: 'Exporting',
    detail: `Exporting ${report.name} to PDF...`,
    life: 3000
  });
}

// Export a report to Excel
function exportToExcel(report) {
  toast.add({
    severity: 'info',
    summary: 'Exporting',
    detail: `Exporting ${report.name} to Excel...`,
    life: 3000
  });
}

// Show the share report dialog
function showShareDialog(report) {
  selectedReport.value = report;
  shareDialogVisible.value = true;
}

// Report sharing handler
function onReportShared(details) {
  shareDialogVisible.value = false;
  
  toast.add({
    severity: 'success',
    summary: 'Report Shared',
    detail: `Report has been shared with ${details.recipients.length} recipients`,
    life: 3000
  });
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

// Get severity class for report status
function getStatusSeverity(status) {
  switch (status) {
    case 'Completed':
      return 'success';
    case 'Processing':
      return 'info';
    case 'Failed':
      return 'danger';
    case 'Pending':
      return 'warning';
    default:
      return 'secondary';
  }
}

</script>