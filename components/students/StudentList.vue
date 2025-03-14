<template>
  <div class="bg-white rounded-lg shadow">
    <div class="flex items-center justify-between p-4 border-b border-gray-200">
      <h2 class="text-lg font-medium text-gray-900">Student List</h2>
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-500 mr-2">
          {{ totalRecords }} total students
        </span>
        <Button
          v-if="selectedStudents.length > 0"
          icon="pi pi-envelope"
          label="Email Selected"
          severity="secondary"
          @click="openBulkEmailModal"
        />
        <Button
          icon="pi pi-plus"
          label="Add Student"
          class="p-button-primary"
          @click="$emit('add-student')"
        />
      </div>
    </div>

    <div v-if="loading" class="flex justify-center items-center p-6">
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
        @click="$emit('reload')"
      />
    </div>
    
    <div v-else>
      <DataTable
        :value="students"
        :paginator="true"
        :rows="limit"
        :totalRecords="totalRecords"
        :rowsPerPageOptions="[10, 20, 50]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} students"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        responsiveLayout="scroll"
        stripedRows
        class="p-datatable-sm"
        @page="onPageChange"
        v-model:filters="filters"
        v-model:selection="selectedStudents"
        dataKey="id"
        filterDisplay="menu"
        :globalFilterFields="['first_name', 'last_name', 'email', 'status']"
      >
        <template #header>
          <div class="flex justify-between items-center">
            <div>
              <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="filters.global.value" placeholder="Search students..." class="p-inputtext-sm" />
              </span>
            </div>
            <div>
              <Button
                icon="pi pi-filter"
                label="Filters"
                severity="secondary"
                text
                @click="toggleFilterDisplay"
              />
            </div>
          </div>
        </template>

        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

        <Column field="first_name" header="First Name" sortable>
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              v-model="filterModel.value"
              type="text"
              class="p-column-filter"
              placeholder="Search by first name"
              @input="filterCallback()"
            />
          </template>
        </Column>
        
        <Column field="last_name" header="Last Name" sortable>
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              v-model="filterModel.value"
              type="text"
              class="p-column-filter"
              placeholder="Search by last name"
              @input="filterCallback()"
            />
          </template>
        </Column>
        
        <Column field="email" header="Email">
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              v-model="filterModel.value"
              type="text"
              class="p-column-filter"
              placeholder="Search by email"
              @input="filterCallback()"
            />
          </template>
        </Column>
        
        <Column field="status" header="Status" sortable>
          <template #body="{ data }">
            <Tag 
              :value="formatStatus(data.status)" 
              :severity="getStatusSeverity(data.status)"
            />
          </template>
          <template #filter="{ filterModel, filterCallback }">
            <Dropdown
              v-model="filterModel.value"
              :options="statusOptions"
              placeholder="Select a status"
              class="p-column-filter"
              @change="filterCallback()"
            />
          </template>
        </Column>
        
        <Column field="enrollment_date" header="Enrolled" sortable>
          <template #body="{ data }">
            {{ formatDate(data.enrollment_date) }}
          </template>
          <template #filter="{ filterModel, filterCallback }">
            <Calendar
              v-model="filterModel.value"
              dateFormat="mm/dd/yy"
              placeholder="Enrollment date"
              @date-select="filterCallback()"
            />
          </template>
        </Column>
        
        <Column header="Actions" :exportable="false" style="min-width:12rem">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button
                icon="pi pi-eye"
                rounded
                text
                severity="info"
                @click="$emit('view-student', data)"
                aria-label="View"
              />
              <Button
                icon="pi pi-pencil"
                rounded
                text
                severity="success"
                @click="$emit('edit-student', data)"
                aria-label="Edit"
              />
              <Button
                icon="pi pi-envelope"
                rounded
                text
                severity="secondary"
                @click="openSendEmailModal(data)"
                aria-label="Email"
              />
              <Button
                icon="pi pi-trash"
                rounded
                text
                severity="danger"
                @click="$emit('delete-student', data)"
                aria-label="Delete"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
    
    <!-- Send Email Modal for Single Student -->
    <Dialog 
      v-model:visible="showSendEmailModal" 
      header="Send Email" 
      :modal="true"
      :closable="true"
      :style="{ width: '500px' }"
    >
      <CommunicationsSendEmailForm 
        :recipient-email="selectedStudent?.email || ''"
        recipient-type="student"
        :recipient-id="selectedStudent?.id || ''"
        :variables="selectedStudentVariables"
        @sent="onEmailSent"
      />
    </Dialog>
    
    <!-- Bulk Email Modal -->
    <Dialog 
      v-model:visible="showBulkEmailModal" 
      header="Send Bulk Email" 
      :modal="true"
      :closable="true"
      :style="{ width: '700px' }"
    >
      <CommunicationsBulkEmailForm
        :recipients="formattedSelectedStudents"
        recipient-type="student"
        @sent="onBulkEmailSent"
        @cancel="showBulkEmailModal = false"
      />
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import Dialog from 'primevue/dialog';
import { useToast } from 'primevue/usetoast';

// Props
const props = defineProps({
  students: {
    type: Array,
    required: true
  },
  totalRecords: {
    type: Number,
    default: 0
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  limit: {
    type: Number,
    default: 10
  }
});

// Emits
const emit = defineEmits([
  'page-change',
  'reload',
  'add-student',
  'edit-student',
  'view-student',
  'delete-student',
  'refresh-communications'
]);

// Composables
const toast = useToast();

// State
const filters = ref({
  global: { value: null, matchMode: 'contains' },
  first_name: { value: null, matchMode: 'contains' },
  last_name: { value: null, matchMode: 'contains' },
  email: { value: null, matchMode: 'contains' },
  status: { value: null, matchMode: 'equals' },
  enrollment_date: { value: null, matchMode: 'dateIs' }
});

const statusOptions = [
  { label: 'Current', value: 'current' },
  { label: 'Graduated', value: 'graduated' },
  { label: 'On Leave', value: 'on_leave' },
  { label: 'Withdrawn', value: 'withdrawn' },
  { label: 'Pending', value: 'pending' }
];

const selectedStudents = ref([]);
const selectedStudent = ref(null);
const showSendEmailModal = ref(false);
const showBulkEmailModal = ref(false);

// Computed
const selectedStudentVariables = computed(() => {
  if (!selectedStudent.value) return {};
  
  return {
    firstName: selectedStudent.value.first_name,
    lastName: selectedStudent.value.last_name,
    fullName: `${selectedStudent.value.first_name} ${selectedStudent.value.last_name}`,
    email: selectedStudent.value.email,
    phone: selectedStudent.value.phone || '',
    enrollmentDate: selectedStudent.value.enrollment_date || '',
    status: selectedStudent.value.status || ''
  };
});

const formattedSelectedStudents = computed(() => {
  return selectedStudents.value.map(student => ({
    id: student.id,
    name: `${student.first_name} ${student.last_name}`,
    email: student.email,
    variables: {
      firstName: student.first_name,
      lastName: student.last_name,
      fullName: `${student.first_name} ${student.last_name}`,
      email: student.email,
      phone: student.phone || '',
      enrollmentDate: student.enrollment_date || '',
      status: student.status || ''
    }
  }));
});

// Methods
const onPageChange = (event) => {
  emit('page-change', {
    page: event.page + 1, // Convert from 0-indexed to 1-indexed
    rows: event.rows
  });
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(dateString));
};

const formatStatus = (status) => {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
};

const getStatusSeverity = (status) => {
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
};

const toggleFilterDisplay = () => {
  const datatable = document.querySelector('.p-datatable');
  if (datatable) {
    datatable.classList.toggle('p-datatable-filter-display-row');
  }
};

const openSendEmailModal = (student) => {
  selectedStudent.value = student;
  showSendEmailModal.value = true;
};

const openBulkEmailModal = () => {
  if (selectedStudents.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'No Students Selected',
      detail: 'Please select at least one student to email.',
      life: 3000
    });
    return;
  }
  
  showBulkEmailModal.value = true;
};

const onEmailSent = () => {
  showSendEmailModal.value = false;
  toast.add({
    severity: 'success',
    summary: 'Email Sent',
    detail: 'Email has been sent successfully.',
    life: 3000
  });
  emit('refresh-communications');
};

const onBulkEmailSent = () => {
  showBulkEmailModal.value = false;
  selectedStudents.value = [];
  toast.add({
    severity: 'success',
    summary: 'Bulk Email Sent',
    detail: `Emails have been sent to ${formattedSelectedStudents.value.length} students.`,
    life: 3000
  });
  emit('refresh-communications');
};
</script>