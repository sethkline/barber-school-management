<template>
  <div>
    <form @submit.prevent="generateReport" class="space-y-6">
      <!-- Report Type Selection -->
      <div>
        <label for="report-type" class="block text-sm font-medium text-gray-700 mb-1">
          Report Type*
        </label>
        <Dropdown
          id="report-type"
          v-model="reportType"
          :options="reportTypes"
          optionLabel="name"
          optionValue="id"
          placeholder="Select a report type"
          class="w-full"
          :class="{'p-invalid': submitted && !reportType}"
        />
        <small v-if="submitted && !reportType" class="p-error">
          Report type is required
        </small>
      </div>
      
      <!-- Report Name -->
      <div>
        <label for="report-name" class="block text-sm font-medium text-gray-700 mb-1">
          Report Name*
        </label>
        <InputText
          id="report-name"
          v-model="reportName"
          placeholder="Enter report name"
          class="w-full"
          :class="{'p-invalid': submitted && !reportName}"
        />
        <small v-if="submitted && !reportName" class="p-error">
          Report name is required
        </small>
      </div>
      
      <!-- Date Range -->
      <div>
        <label for="date-range" class="block text-sm font-medium text-gray-700 mb-1">
          Date Range*
        </label>
        <div class="flex space-x-2">
          <Calendar
            v-model="dateRange.start"
            placeholder="Start date"
            class="w-full"
            dateFormat="mm/dd/yy"
            :showIcon="true"
            :class="{'p-invalid': submitted && !dateRange.start}"
          />
          <Calendar
            v-model="dateRange.end"
            placeholder="End date"
            class="w-full"
            dateFormat="mm/dd/yy"
            :showIcon="true"
            :class="{'p-invalid': submitted && !dateRange.end}"
          />
        </div>
        <small v-if="submitted && (!dateRange.start || !dateRange.end)" class="p-error">
          Start and end dates are required
        </small>
      </div>
      
      <!-- Filters -->
      <div>
        <div class="flex justify-between items-center mb-2">
          <label class="block text-sm font-medium text-gray-700">
            Filters
          </label>
          <Button
            type="button"
            icon="pi pi-plus"
            label="Add Filter"
            severity="secondary"
            text
            size="small"
            @click="addFilter"
          />
        </div>
        
        <div v-for="(filter, index) in filters" :key="index" class="mb-2">
          <div class="flex items-center space-x-2">
            <Dropdown
              v-model="filter.field"
              :options="filterFields"
              optionLabel="label"
              optionValue="value"
              placeholder="Select field"
              class="w-full"
            />
            <Dropdown
              v-model="filter.operator"
              :options="filterOperators"
              optionLabel="label"
              optionValue="value"
              placeholder="Operator"
              class="w-full"
            />
            <InputText
              v-model="filter.value"
              placeholder="Value"
              class="w-full"
            />
            <Button
              type="button"
              icon="pi pi-times"
              severity="danger"
              text
              rounded
              aria-label="Remove"
              @click="removeFilter(index)"
            />
          </div>
        </div>
      </div>
      
      <!-- Data Fields to Include -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Data Fields to Include
        </label>
        <div class="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md bg-gray-50">
          <div v-for="field in availableFields" :key="field.value" class="flex items-center">
            <Checkbox
              :id="field.value"
              v-model="selectedFields"
              :value="field.value"
              :binary="false"
            />
            <label :for="field.value" class="ml-2 text-sm text-gray-600">
              {{ field.label }}
            </label>
          </div>
        </div>
        <small v-if="submitted && selectedFields.length === 0" class="p-error">
          Select at least one field to include
        </small>
      </div>
      
      <!-- Grouping and Sorting -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="group-by" class="block text-sm font-medium text-gray-700 mb-1">
            Group By
          </label>
          <Dropdown
            id="group-by"
            v-model="groupBy"
            :options="groupByOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select grouping"
            class="w-full"
          />
        </div>
        <div>
          <label for="sort-by" class="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <Dropdown
            id="sort-by"
            v-model="sortBy"
            :options="sortByOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select sorting"
            class="w-full"
          />
        </div>
      </div>
      
      <!-- Report Format -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Report Format
        </label>
        <div class="flex space-x-4">
          <div class="flex items-center">
            <RadioButton
              id="format-pdf"
              v-model="reportFormat"
              value="pdf"
              :binary="false"
            />
            <label for="format-pdf" class="ml-2 text-sm text-gray-600">
              PDF
            </label>
          </div>
          <div class="flex items-center">
            <RadioButton
              id="format-excel"
              v-model="reportFormat"
              value="excel"
              :binary="false"
            />
            <label for="format-excel" class="ml-2 text-sm text-gray-600">
              Excel
            </label>
          </div>
          <div class="flex items-center">
            <RadioButton
              id="format-csv"
              v-model="reportFormat"
              value="csv"
              :binary="false"
            />
            <label for="format-csv" class="ml-2 text-sm text-gray-600">
              CSV
            </label>
          </div>
        </div>
      </div>
      
      <!-- Include Visualizations -->
      <div>
        <div class="flex items-center">
          <Checkbox
            id="include-charts"
            v-model="includeCharts"
            :binary="true"
          />
          <label for="include-charts" class="ml-2 text-sm text-gray-600">
            Include visualizations in the report
          </label>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          label="Cancel"
          severity="secondary"
          text
          @click="$emit('cancel')"
          :disabled="generating"
        />
        <Button
          type="button"
          label="Preview"
          icon="pi pi-eye"
          severity="info"
          @click="previewReport"
          :disabled="generating"
        />
        <Button
          type="submit"
          label="Generate Report"
          icon="pi pi-file"
          :loading="generating"
        />
      </div>
    </form>
    
    <!-- Report Preview Dialog -->
    <Dialog 
      v-model:visible="previewVisible" 
      header="Report Preview" 
      :modal="true"
      :style="{ width: '90vw', maxWidth: '1200px' }"
    >
      <div class="p-4 border rounded-lg bg-gray-50">
        <h3 class="text-xl font-semibold mb-2">{{ reportName || 'Untitled Report' }}</h3>
        <div class="text-sm text-gray-500 mb-4">
          <span>{{ formatDateRange() }}</span>
          <span v-if="filters.length > 0"> | {{ filters.length }} filter(s) applied</span>
        </div>
        
        <!-- Preview Components based on report type -->
        <div v-if="reportType === 'student-progress'" class="bg-white p-4 rounded-lg shadow">
          <h4 class="text-lg font-medium mb-3">Student Progress Report</h4>
          <DataTable :value="previewData.students" class="p-datatable-sm" responsiveLayout="scroll">
            <Column field="name" header="Student Name"></Column>
            <Column field="status" header="Status"></Column>
            <Column field="progress" header="Progress">
              <template #body="{ data }">
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="h-2 rounded-full bg-primary-500" :style="`width: ${data.progress}%`"></div>
                </div>
                <div class="text-xs mt-1">{{ data.progress }}%</div>
              </template>
            </Column>
            <Column field="attendance" header="Attendance Rate"></Column>
            <Column field="assessments" header="Assessment Avg."></Column>
          </DataTable>
          
          <div v-if="includeCharts" class="mt-6">
            <h5 class="text-base font-medium mb-2">Performance Distribution</h5>
            <Chart type="bar" :data="previewData.chart" :options="chartOptions" style="height: 200px;" />
          </div>
        </div>
        
        <div v-else-if="reportType === 'financial-summary'" class="bg-white p-4 rounded-lg shadow">
          <!-- Financial summary preview would go here -->
          <h4 class="text-lg font-medium mb-3">Financial Summary Report</h4>
          <!-- Financial data tables and charts would go here -->
        </div>
        
        <div v-else class="bg-white p-4 rounded-lg shadow">
          <p class="text-gray-500 italic">Preview not available for this report type.</p>
        </div>
      </div>
      
      <template #footer>
        <Button
          label="Close Preview"
          icon="pi pi-times"
          @click="previewVisible = false"
          severity="secondary"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import RadioButton from 'primevue/radiobutton';
import Dialog from 'primevue/dialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Chart from 'primevue/chart';

const emit = defineEmits(['report-created', 'cancel']);

// Form state
const reportType = ref('');
const reportName = ref('');
const dateRange = ref({
  start: null,
  end: null
});
const reportFormat = ref('pdf');
const includeCharts = ref(true);
const groupBy = ref('');
const sortBy = ref('');
const filters = ref([]);
const selectedFields = ref([]);
const submitted = ref(false);
const generating = ref(false);

// Preview state
const previewVisible = ref(false);
const previewData = ref({
  students: [
    { name: 'Jane Smith', status: 'Current', progress: 85, attendance: '92%', assessments: '88%' },
    { name: 'John Doe', status: 'Current', progress: 78, attendance: '89%', assessments: '81%' },
    { name: 'Sarah Johnson', status: 'Current', progress: 92, attendance: '95%', assessments: '94%' },
    { name: 'Michael Brown', status: 'On Leave', progress: 65, attendance: '72%', assessments: '70%' },
    { name: 'Emily Davis', status: 'Current', progress: 88, attendance: '91%', assessments: '85%' }
  ],
  chart: {
    labels: ['<70%', '70-79%', '80-89%', '90-100%'],
    datasets: [
      {
        label: 'Students',
        backgroundColor: ['#f87171', '#facc15', '#60a5fa', '#4ade80'],
        data: [12, 25, 38, 15]
      }
    ]
  }
});

// Chart options
const chartOptions = {
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0
      }
    }
  },
  responsive: true,
  maintainAspectRatio: false
};

// Available report types
const reportTypes = [
  { name: 'Student Progress Report', id: 'student-progress' },
  { name: 'Enrollment Trends', id: 'enrollment-trends' },
  { name: 'Financial Summary', id: 'financial-summary' },
  { name: 'Attendance Compliance', id: 'attendance-compliance' },
  { name: 'Lead Conversion Analysis', id: 'lead-conversion' },
  { name: 'Certification Status', id: 'certification-status' }
];

// Filter operations
const filterOperators = [
  { label: 'Equals', value: 'equals' },
  { label: 'Contains', value: 'contains' },
  { label: 'Greater Than', value: 'gt' },
  { label: 'Less Than', value: 'lt' },
  { label: 'Between', value: 'between' },
  { label: 'Is Empty', value: 'isEmpty' },
  { label: 'Is Not Empty', value: 'isNotEmpty' }
];

// Filter fields (dynamically changes based on report type)
const filterFields = computed(() => {
  switch (reportType.value) {
    case 'student-progress':
      return [
        { label: 'Student Name', value: 'name' },
        { label: 'Status', value: 'status' },
        { label: 'Progress', value: 'progress' },
        { label: 'Enrollment Date', value: 'enrollment_date' },
        { label: 'Attendance Rate', value: 'attendance_rate' },
        { label: 'Assessment Score', value: 'assessment_score' }
      ];
    case 'financial-summary':
      return [
        { label: 'Date', value: 'date' },
        { label: 'Revenue Category', value: 'revenue_category' },
        { label: 'Expense Category', value: 'expense_category' },
        { label: 'Amount', value: 'amount' },
        { label: 'Payment Method', value: 'payment_method' }
      ];
    case 'lead-conversion':
      return [
        { label: 'Lead Source', value: 'lead_source' },
        { label: 'Status', value: 'status' },
        { label: 'Created Date', value: 'created_at' },
        { label: 'Conversion Date', value: 'conversion_date' },
        { label: 'Campaign', value: 'campaign' }
      ];
    default:
      return [
        { label: 'Name', value: 'name' },
        { label: 'Date', value: 'date' },
        { label: 'Status', value: 'status' }
      ];
  }
});

// Available fields (dynamically changes based on report type)
const availableFields = computed(() => {
  switch (reportType.value) {
    case 'student-progress':
      return [
        { label: 'Student ID', value: 'student_id' },
        { label: 'Student Name', value: 'name' },
        { label: 'Email', value: 'email' },
        { label: 'Phone', value: 'phone' },
        { label: 'Status', value: 'status' },
        { label: 'Enrollment Date', value: 'enrollment_date' },
        { label: 'Expected Graduation', value: 'expected_graduation_date' },
        { label: 'Overall Progress', value: 'progress' },
        { label: 'Attendance Rate', value: 'attendance_rate' },
        { label: 'Assessment Average', value: 'assessment_average' },
        { label: 'Hours Completed', value: 'hours_completed' },
        { label: 'Certifications', value: 'certifications' }
      ];
    case 'financial-summary':
      return [
        { label: 'Date', value: 'date' },
        { label: 'Transaction ID', value: 'transaction_id' },
        { label: 'Category', value: 'category' },
        { label: 'Description', value: 'description' },
        { label: 'Amount', value: 'amount' },
        { label: 'Type (Income/Expense)', value: 'type' },
        { label: 'Payment Method', value: 'payment_method' },
        { label: 'Related Student', value: 'student_name' },
        { label: 'Status', value: 'status' }
      ];
    default:
      return filterFields.value;
  }
});

// Group by options (dynamically changes based on report type)
const groupByOptions = computed(() => {
  switch (reportType.value) {
    case 'student-progress':
      return [
        { label: 'None', value: '' },
        { label: 'Status', value: 'status' },
        { label: 'Progress Level', value: 'progress_level' },
        { label: 'Enrollment Month', value: 'enrollment_month' }
      ];
    case 'financial-summary':
      return [
        { label: 'None', value: '' },
        { label: 'Category', value: 'category' },
        { label: 'Month', value: 'month' },
        { label: 'Type', value: 'type' }
      ];
    default:
      return [
        { label: 'None', value: '' },
        { label: 'Month', value: 'month' },
        { label: 'Status', value: 'status' },
        { label: 'Category', value: 'category' }
      ];
  }
});

// Sort by options (dynamically changes based on report type)
const sortByOptions = computed(() => {
  switch (reportType.value) {
    case 'student-progress':
      return [
        { label: 'Name (A-Z)', value: 'name_asc' },
        { label: 'Name (Z-A)', value: 'name_desc' },
        { label: 'Progress (High-Low)', value: 'progress_desc' },
        { label: 'Progress (Low-High)', value: 'progress_asc' },
        { label: 'Enrollment Date (Newest)', value: 'enrollment_date_desc' },
        { label: 'Enrollment Date (Oldest)', value: 'enrollment_date_asc' }
      ];
    case 'financial-summary':
      return [
        { label: 'Date (Newest)', value: 'date_desc' },
        { label: 'Date (Oldest)', value: 'date_asc' },
        { label: 'Amount (High-Low)', value: 'amount_desc' },
        { label: 'Amount (Low-High)', value: 'amount_asc' },
        { label: 'Category', value: 'category_asc' }
      ];
    default:
      return [
        { label: 'Date (Newest)', value: 'date_desc' },
        { label: 'Date (Oldest)', value: 'date_asc' },
        { label: 'Name (A-Z)', value: 'name_asc' },
        { label: 'Name (Z-A)', value: 'name_desc' }
      ];
  }
});

// Add a new filter
function addFilter() {
  filters.value.push({
    field: '',
    operator: 'equals',
    value: ''
  });
}

// Remove a filter
function removeFilter(index) {
  filters.value.splice(index, 1);
}

// Preview the report
function previewReport() {
  submitted.value = true;
  
  // Validate required fields before showing preview
  if (!isFormValid()) {
    return;
  }
  
  // Show the preview dialog
  previewVisible.value = true;
}

// Generate the report
function generateReport() {
  submitted.value = true;
  
  // Validate the form
  if (!isFormValid()) {
    return;
  }
  
  // Show loading state
  generating.value = true;
  
  // Simulate API call delay
  setTimeout(() => {
    // Create report object to return
    const report = {
      id: Math.random().toString(36).substr(2, 9),
      name: reportName.value,
      type: getReportTypeLabel(),
      format: reportFormat.value.toUpperCase(),
      dateRange: {
        start: dateRange.value.start,
        end: dateRange.value.end
      },
      filters: filters.value,
      fields: selectedFields.value,
      groupBy: groupBy.value,
      sortBy: sortBy.value,
      includeCharts: includeCharts.value,
      generated: new Date().toISOString(),
      status: 'Completed'
    };
    
    // End loading state
    generating.value = false;
    
    // Emit the report created event
    emit('report-created', report);
  }, 2000);
}

// Validate form fields
function isFormValid() {
  return (
    reportType.value &&
    reportName.value &&
    dateRange.value.start &&
    dateRange.value.end &&
    selectedFields.value.length > 0
  );
}

// Get report type label
function getReportTypeLabel() {
  const found = reportTypes.find(rt => rt.id === reportType.value);
  return found ? found.name : '';
}

// Format date range for display
function formatDateRange() {
  if (!dateRange.value.start || !dateRange.value.end) {
    return '';
  }
  
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  return `${formatDate(dateRange.value.start)} - ${formatDate(dateRange.value.end)}`;
}
</script>