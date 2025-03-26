<template>
  <div class="container mx-auto px-4 py-8">
    <Toast />
    <ConfirmDialog />

    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Lead Management</h1>
      <Button label="Add New Lead" icon="pi pi-plus" @click="showNewLeadModal = true" severity="primary" />
    </div>

    <!-- Search and Filter Section -->
    <Card class="mb-6">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Search -->
          <div class="field">
            <label for="search" class="font-medium">Search</label>
            <InputText
              id="search"
              v-model="searchQuery"
              placeholder="Search name or email"
              class="w-full"
              @input="debounceSearch"
            />
          </div>

          <!-- Status Filter -->
          <div class="field">
            <label for="status" class="font-medium">Status</label>
            <Dropdown
              id="status"
              v-model="statusFilter"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="All Statuses"
              class="w-full"
              @change="fetchLeads(1)"
            />
          </div>

          <!-- Date Range -->
          <div class="field">
            <label for="fromDate" class="font-medium">From Date</label>
            <Calendar
              id="fromDate"
              v-model="fromDate"
              dateFormat="yy-mm-dd"
              class="w-full"
              @date-select="fetchLeads(1)"
            />
          </div>

          <div class="field">
            <label for="toDate" class="font-medium">To Date</label>
            <Calendar id="toDate" v-model="toDate" dateFormat="yy-mm-dd" class="w-full" @date-select="fetchLeads(1)" />
          </div>
        </div>
      </template>
    </Card>

    <!-- Leads Table -->
    <DataTable
      :value="leads"
      :loading="loading"
      stripedRows
      paginator
      :rows="pageSize"
      :totalRecords="totalLeads"
      :rowsPerPageOptions="[5, 10, 20, 50]"
      v-model:first="first"
      @page="onPageChange($event)"
      tableStyle="min-width: 50rem"
      class="p-datatable-sm"
      removableSort
    >
      <template #empty>
        <div class="text-center py-4">No leads found</div>
      </template>
      <template #loading>
        <div class="text-center py-4">Loading leads data...</div>
      </template>

      <Column field="name" header="Name" sortable>
        <template #body="{ data }"> {{ data.first_name }} {{ data.last_name }} </template>
      </Column>

      <Column field="contact" header="Contact">
        <template #body="{ data }">
          <div class="text-sm text-gray-900">{{ data.email }}</div>
          <div class="text-sm text-gray-500">{{ data.phone || 'No phone' }}</div>
        </template>
      </Column>

      <Column field="status" header="Status" sortable>
        <template #body="{ data }">
          <Tag :value="data.status || 'New'" :severity="getTagSeverity(data.status)" />
        </template>
      </Column>

      <Column field="created_at" header="Created" sortable>
        <template #body="{ data }">
          {{ formatDate(data.created_at) }}
        </template>
      </Column>

      <Column field="follow_up_date" header="Follow-up" sortable>
        <template #body="{ data }">
          {{ data.follow_up_date ? formatDate(data.follow_up_date) : 'Not scheduled' }}
        </template>
      </Column>

      <Column header="Actions">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button icon="pi pi-pencil" @click="editLead(data)" text severity="primary" size="small" />
            <Button
              v-if="data.status !== 'converted'"
              icon="pi pi-user-plus"
              @click="convertToStudent(data)"
              text
              severity="success"
              size="small"
            />
            <Button icon="pi pi-trash" @click="confirmDeleteLead(data)" text severity="danger" size="small" />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Lead Dialog -->
    <Dialog
      v-model:visible="showNewLeadModal"
      :header="editingLead ? 'Edit Lead' : 'Add New Lead'"
      :modal="true"
      :style="{ width: '50rem' }"
      :closeOnEscape="false"
      class="lead-form-dialog"
    >
      <form @submit.prevent="saveLead" class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Personal Information Section -->
          <div class="md:col-span-2">
            <h3 class="text-lg font-semibold mb-2 text-gray-700 border-b pb-2">Personal Information</h3>
          </div>

          <div class="field">
            <label for="first_name" class="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <InputText id="first_name" v-model="leadForm.first_name" required autocomplete="off" class="w-full" />
          </div>
          <div class="field">
            <label for="last_name" class="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <InputText id="last_name" v-model="leadForm.last_name" required autocomplete="off" class="w-full" />
          </div>
          <div class="field">
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <InputText id="email" v-model="leadForm.email" required type="email" autocomplete="off" class="w-full" />
          </div>
          <div class="field">
            <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <InputText id="phone" v-model="leadForm.phone" type="tel" autocomplete="off" class="w-full" />
          </div>

          <!-- Address Information Section -->
          <div class="md:col-span-2 mt-4">
            <h3 class="text-lg font-semibold mb-2 text-gray-700 border-b pb-2">Address</h3>
          </div>

          <div class="field">
            <label for="address" class="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <InputText id="address" v-model="leadForm.address" autocomplete="off" class="w-full" />
          </div>
          <div class="field">
            <label for="city" class="block text-sm font-medium text-gray-700 mb-1">City</label>
            <InputText id="city" v-model="leadForm.city" autocomplete="off" class="w-full" />
          </div>
          <div class="field">
            <label for="zip_code" class="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
            <InputText id="zip_code" v-model="leadForm.zip_code" autocomplete="off" class="w-full" />
          </div>

          <!-- Lead Details Section -->
          <div class="md:col-span-2 mt-4">
            <h3 class="text-lg font-semibold mb-2 text-gray-700 border-b pb-2">Lead Details</h3>
          </div>

          <div class="field">
            <label for="status" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Dropdown
              id="status"
              v-model="leadForm.status"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>
          <div class="field">
            <label for="schedule_interview" class="block text-sm font-medium text-gray-700 mb-1">Interview</label>
            <div class="flex items-center bg-gray-50 p-2 rounded">
              <Checkbox id="schedule_interview" v-model="leadForm.schedule_interview" :binary="true" />
              <label for="schedule_interview" class="ml-2 text-sm text-gray-700"> Schedule Interview </label>
            </div>
          </div>
          <div class="field">
            <label for="contacted_date" class="block text-sm font-medium text-gray-700 mb-1">Contacted Date</label>
            <Calendar
              id="contacted_date"
              v-model="leadForm.contacted_date"
              dateFormat="yy-mm-dd"
              class="w-full"
              showIcon
            />
          </div>
          <div class="field">
            <label for="follow_up_date" class="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
            <Calendar
              id="follow_up_date"
              v-model="leadForm.follow_up_date"
              dateFormat="yy-mm-dd"
              class="w-full"
              showIcon
            />
          </div>

          <!-- Message/Notes Section -->
          <div class="field md:col-span-2 mt-2">
            <label for="message" class="block text-sm font-medium text-gray-700 mb-1">Message/Notes</label>
            <Textarea
              id="message"
              v-model="leadForm.message"
              rows="5"
              autoResize
              class="w-full rounded border-gray-300 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter any additional information about this lead..."
            />
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-6 border-t pt-4">
          <Button
            label="Cancel"
            @click="showNewLeadModal = false"
            text
            class="px-4 py-2 text-gray-700 hover:text-gray-900"
          />
          <Button
            :label="editingLead ? 'Update Lead' : 'Add Lead'"
            type="submit"
            severity="primary"
            class="px-4 py-2"
          />
        </div>
      </form>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:visible="showDeleteModal" header="Confirm Delete" :modal="true" :style="{ width: '30rem' }">
      <p class="text-gray-700">Are you sure you want to delete this lead? This action cannot be undone.</p>
      <template #footer>
        <Button label="Cancel" @click="showDeleteModal = false" text />
        <Button label="Delete" @click="confirmDelete" severity="danger" />
      </template>
    </Dialog>

    <!-- Convert to Student Confirmation Dialog -->
    <Dialog v-model:visible="showConvertModal" header="Convert to Student" :modal="true" :style="{ width: '30rem' }">
      <p class="text-gray-700">
        Are you sure you want to convert this lead to a student? This will create a new student record with the lead's
        information.
      </p>
      <template #footer>
        <Button label="Cancel" @click="showConvertModal = false" text />
        <Button label="Convert" @click="confirmConvert" severity="success" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { Tables, TablesInsert, TablesUpdate } from '~/types/supabase';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

// Type for leads
type Lead = Tables<'leads'>;

// Router
const router = useRouter();

// Services
const toast = useToast();
const confirm = useConfirm();

// State variables
const leads = ref<Lead[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const totalLeads = ref(0);
const totalPages = ref(1);
const loading = ref(false);
const searchQuery = ref('');
const statusFilter = ref('');
const fromDate = ref<Date | null>(null);
const toDate = ref<Date | null>(null);
const searchTimeout = ref<NodeJS.Timeout | null>(null);
const first = ref(0); // For DataTable pagination

// Status options for dropdown
const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Converted', value: 'converted' },
  { label: 'Closed', value: 'closed' }
];

// Modal control
const showNewLeadModal = ref(false);
const showDeleteModal = ref(false);
const showConvertModal = ref(false);
const editingLead = ref<Lead | null>(null);
const leadToDelete = ref<Lead | null>(null);
const leadToConvert = ref<Lead | null>(null);

// Form state
const leadForm = ref<Partial<TablesInsert<'leads'>>>({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  zip_code: '',
  status: 'new',
  message: '',
  schedule_interview: false,
  contacted_date: null,
  follow_up_date: null
});

// Computed properties
const isFormValid = computed(() => {
  return !!leadForm.value.first_name && !!leadForm.value.last_name && !!leadForm.value.email;
});

// Fetch leads on component mount
onMounted(() => {
  fetchLeads(1);
});

// Get tag severity based on lead status
function getTagSeverity(status: string | null) {
  switch (status) {
    case 'qualified':
      return 'success';
    case 'contacted':
      return 'info';
    case 'new':
      return 'warning';
    case 'converted':
      return 'primary';
    case 'closed':
      return 'secondary';
    default:
      return 'warning';
  }
}

// Format date helper function
function formatDate(dateString: string | null) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

// Handle DataTable pagination
function onPageChange(event: any) {
  const page = Math.floor(event.first / event.rows) + 1;
  fetchLeads(page);
}

// Debounce search input to prevent too many API calls
function debounceSearch() {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  searchTimeout.value = setTimeout(() => {
    fetchLeads(1);
  }, 300);
}

// Fetch leads from the API
async function fetchLeads(page: number) {
  if (page < 1 || (totalPages.value > 0 && page > totalPages.value)) {
    return;
  }

  loading.value = true;
  currentPage.value = page;
  first.value = (page - 1) * pageSize.value;

  try {
    // Format dates for API call
    const fromDateStr = fromDate.value ? fromDate.value.toISOString().split('T')[0] : '';
    const toDateStr = toDate.value ? toDate.value.toISOString().split('T')[0] : '';

    const response = await fetch(
      `/api/leads?page=${page}&limit=${pageSize.value}&search=${searchQuery.value}&status=${statusFilter.value}&fromDate=${fromDateStr}&toDate=${toDateStr}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch leads');
    }

    const data = await response.json();
    leads.value = data.leads;
    totalLeads.value = data.total;
    totalPages.value = data.totalPages;
  } catch (error) {
    console.error('Error fetching leads:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load leads',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
}

// Reset the lead form
function resetLeadForm() {
  leadForm.value = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zip_code: '',
    status: 'new',
    message: '',
    schedule_interview: false,
    contacted_date: '',
    follow_up_date: ''
  };
  editingLead.value = null;
}

// Open the edit lead modal
function editLead(lead: Lead) {
  editingLead.value = lead;
  leadForm.value = { ...lead };
  showNewLeadModal.value = true;
}

// Save a new lead or update an existing one
async function saveLead() {
  if (!isFormValid.value) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please fill in all required fields',
      life: 3000
    });
    return;
  }

  try {
    if (editingLead.value) {
      // Update existing lead
      const response = await fetch(`/api/leads/${editingLead.value.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(leadForm.value)
      });

      if (!response.ok) {
        throw new Error('Failed to update lead');
      }

      // Update the lead in the local list
      const updatedLead = await response.json();
      const index = leads.value.findIndex((l) => l.id === editingLead.value?.id);
      if (index !== -1) {
        leads.value[index] = updatedLead.lead;
      }

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Lead updated successfully',
        life: 3000
      });
    } else {
      // Create new lead
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(leadForm.value)
      });

      if (!response.ok) {
        throw new Error('Failed to create lead');
      }

      // Refresh the lead list
      fetchLeads(1);

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Lead created successfully',
        life: 3000
      });
    }

    // Close the modal and reset the form
    showNewLeadModal.value = false;
    resetLeadForm();
  } catch (error) {
    console.error('Error saving lead:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to save lead',
      life: 3000
    });
  }
}

// Show delete confirmation modal
function confirmDeleteLead(lead: Lead) {
  leadToDelete.value = lead;
  showDeleteModal.value = true;
}

// Delete the lead
async function confirmDelete() {
  if (!leadToDelete.value) return;

  try {
    const response = await fetch(`/api/leads/${leadToDelete.value.id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete lead');
    }

    // Remove the lead from the local list
    leads.value = leads.value.filter((l) => l.id !== leadToDelete.value?.id);
    totalLeads.value--;

    // If we deleted the last item on the page, go to the previous page
    if (leads.value.length === 0 && currentPage.value > 1) {
      fetchLeads(currentPage.value - 1);
    }

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Lead deleted successfully',
      life: 3000
    });

    showDeleteModal.value = false;
    leadToDelete.value = null;
  } catch (error) {
    console.error('Error deleting lead:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete lead',
      life: 3000
    });
  }
}

// Show convert to student confirmation modal
function convertToStudent(lead: Lead) {
  leadToConvert.value = lead;
  showConvertModal.value = true;
}

// Convert lead to student
async function confirmConvert() {
  if (!leadToConvert.value) return;

  try {
    const response = await fetch(`/api/leads/${leadToConvert.value.id}/convert`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to convert lead');
    }

    const data = await response.json();

    // Update the lead in the local list
    const index = leads.value.findIndex((l) => l.id === leadToConvert.value?.id);
    if (index !== -1) {
      leads.value[index] = data.lead;
    }

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Lead successfully converted to student',
      life: 3000
    });

    showConvertModal.value = false;
    leadToConvert.value = null;

    // Redirect to the new student's page
    router.push(`/students/${data.student.id}`);
  } catch (error) {
    console.error('Error converting lead:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to convert lead to student',
      life: 3000
    });
  }
}
</script>
