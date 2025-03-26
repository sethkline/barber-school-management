<template>
  <div class="p-4 md:p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Bulk Email</h1>
      <p class="text-gray-600 mt-1">Create and send emails to multiple recipients</p>
    </div>

    <!-- Main content -->
    <div class="bg-white rounded-lg shadow">
      <!-- Steps indicator -->
      <div class="border-b border-gray-200">
        <div class="p-4">
          <Steps :model="steps" :activeIndex="activeStep" />
        </div>
      </div>

      <!-- Step content -->
      <div class="p-6">
        <!-- Step 1: Select Recipients -->
        <div v-if="activeStep === 0">
          <div class="mb-4 flex justify-between items-center">
            <h2 class="text-lg font-medium text-gray-900">Select Recipients</h2>
            <span class="text-sm text-gray-500">{{ selectedRecipients.length }} recipients selected</span>
          </div>

          <div class="mb-4 flex space-x-4">
            <div class="w-1/3">
              <label class="block text-sm font-medium text-gray-700 mb-1">Recipient Type</label>
              <Dropdown 
                v-model="recipientType"
                :options="recipientTypes"
                optionLabel="label"
                optionValue="value"
                placeholder="Select recipient type"
                class="w-full"
              />
            </div>
            <div class="w-2/3">
              <label class="block text-sm font-medium text-gray-700 mb-1">Filter</label>
              <div class="flex space-x-2">
                <InputText 
                  v-model="searchQuery" 
                  placeholder="Search by name or email" 
                  class="w-full"
                />
                <Button icon="pi pi-search" @click="searchRecipients" />
              </div>
            </div>
          </div>

          <!-- Student specific filters (when student type is selected) -->
          <div v-if="recipientType === 'student'" class="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Dropdown 
                v-model="studentStatus"
                :options="studentStatusOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Any status"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Enrollment Date</label>
              <Calendar 
                v-model="enrollmentDate" 
                dateFormat="mm/dd/yy" 
                placeholder="Select date"
                class="w-full"
              />
            </div>
            <div class="flex items-end">
              <Button label="Apply Filters" icon="pi pi-filter" @click="applyFilters" class="w-full" />
            </div>
          </div>

          <!-- Lead specific filters (when lead type is selected) -->
          <div v-if="recipientType === 'lead'" class="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Dropdown 
                v-model="leadStatus"
                :options="leadStatusOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Any status"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Created After</label>
              <Calendar 
                v-model="leadCreatedAfter" 
                dateFormat="mm/dd/yy" 
                placeholder="Select date"
                class="w-full"
              />
            </div>
            <div class="flex items-end">
              <Button label="Apply Filters" icon="pi pi-filter" @click="applyFilters" class="w-full" />
            </div>
          </div>

          <!-- Recipients table -->
          <DataTable
            :value="availableRecipients"
            v-model:selection="selectedRecipients"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[10, 25, 50]"
            :loading="loadingRecipients"
            stripedRows
            selectionMode="multiple"
            class="mt-4"
          >
            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
            <Column field="name" header="Name"></Column>
            <Column field="email" header="Email"></Column>
            <Column field="status" header="Status">
              <template #body="{ data }">
                <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
              </template>
            </Column>
            <Column v-if="recipientType === 'student'" field="enrollmentDate" header="Enrollment Date">
              <template #body="{ data }">
                {{ formatDate(data.enrollmentDate) }}
              </template>
            </Column>
            <Column v-if="recipientType === 'lead'" field="createdAt" header="Created At">
              <template #body="{ data }">
                {{ formatDate(data.createdAt) }}
              </template>
            </Column>
          </DataTable>

          <div class="mt-4 flex justify-between">
            <span>
              <Button 
                type="button" 
                label="Select All" 
                severity="secondary" 
                text 
                @click="selectAllRecipients" 
                :disabled="availableRecipients.length === 0 || availableRecipients.length === selectedRecipients.length"
              />
              <Button 
                type="button" 
                label="Clear Selection" 
                severity="secondary" 
                text 
                @click="clearSelection" 
                :disabled="selectedRecipients.length === 0"
                class="ml-2"
              />
            </span>
            <Button 
              type="button" 
              label="Next: Choose Template" 
              icon="pi pi-arrow-right" 
              iconPos="right" 
              @click="nextStep" 
              :disabled="selectedRecipients.length === 0"
            />
          </div>
        </div>

        <!-- Step 2: Choose Template -->
        <div v-if="activeStep === 1">
          <div class="mb-4 flex justify-between items-center">
            <h2 class="text-lg font-medium text-gray-900">Choose Email Template</h2>
            <div>
              <Button 
                type="button" 
                label="Create New Template" 
                icon="pi pi-plus" 
                severity="secondary" 
                @click="showCreateTemplateDialog = true"
              />
            </div>
          </div>

          <div class="mb-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                v-for="template in templates" 
                :key="template.id" 
                class="border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                :class="{ 'border-primary-500 ring-2 ring-primary-300': selectedTemplateId === template.id }"
                @click="selectTemplate(template.id)"
              >
                <div class="p-4">
                  <h3 class="font-medium text-gray-900">{{ template.name }}</h3>
                  <p class="text-sm text-gray-500 mt-1 truncate">{{ template.subject }}</p>
                </div>
                <div class="border-t p-3 bg-gray-50 flex justify-between items-center">
                  <Button 
                    type="button" 
                    icon="pi pi-eye" 
                    text 
                    rounded 
                    @click.stop="previewTemplate(template)"
                  />
                  <Badge :value="template.id === selectedTemplateId ? 'Selected' : ''" severity="success" v-if="template.id === selectedTemplateId" />
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4 flex justify-between">
            <Button 
              type="button" 
              label="Back to Recipients" 
              icon="pi pi-arrow-left" 
              iconPos="left" 
              severity="secondary" 
              @click="activeStep = 0" 
            />
            <Button 
              type="button" 
              label="Next: Review and Send" 
              icon="pi pi-arrow-right" 
              iconPos="right" 
              @click="nextStep" 
              :disabled="!selectedTemplateId"
            />
          </div>
        </div>

        <!-- Step 3: Review and Send -->
        <div v-if="activeStep === 2">
          <div class="mb-4">
            <h2 class="text-lg font-medium text-gray-900">Review and Send</h2>
          </div>

          <div class="bg-gray-50 p-4 rounded-lg mb-6">
            <div class="mb-4">
              <h3 class="text-sm font-medium text-gray-700">Selected Recipients</h3>
              <p class="text-gray-900 mt-1">{{ selectedRecipients.length }} recipients selected</p>
            </div>
            <div class="mb-4">
              <h3 class="text-sm font-medium text-gray-700">Template</h3>
              <p class="text-gray-900 mt-1">{{ currentTemplate?.name || 'No template selected' }}</p>
            </div>
            <div>
              <h3 class="text-sm font-medium text-gray-700">Subject</h3>
              <p class="text-gray-900 mt-1">{{ currentTemplate?.subject || 'No subject' }}</p>
            </div>
          </div>

          <div class="border rounded-lg p-4 mb-6">
            <h3 class="text-sm font-medium text-gray-700 mb-2">Email Body Preview</h3>
            <div class="bg-white p-4 border rounded-lg" v-html="currentTemplate?.body || 'No content'"></div>
            <p class="text-xs text-gray-500 mt-2">
              Note: This is a preview. Template variables like {{firstName}} will be replaced with actual values for each recipient.
            </p>
          </div>

          <div class="mt-4 flex justify-between">
            <Button 
              type="button" 
              label="Back to Templates" 
              icon="pi pi-arrow-left" 
              iconPos="left" 
              severity="secondary" 
              @click="activeStep = 1" 
            />
            <Button 
              type="button" 
              label="Send Emails" 
              icon="pi pi-send" 
              iconPos="right" 
              severity="success" 
              :loading="sending" 
              @click="sendEmails"
            />
          </div>
        </div>

        <!-- Success message after sending -->
        <div v-if="activeStep === 3" class="text-center py-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
            <i class="pi pi-check text-2xl"></i>
          </div>
          <h2 class="text-xl font-medium text-gray-900 mb-2">Emails Sent Successfully!</h2>
          <p class="text-gray-600 mb-6">
            Your emails have been sent to {{ selectedRecipients.length }} recipients.
          </p>
          <div class="flex justify-center">
            <Button 
              type="button" 
              label="Send Another Bulk Email" 
              @click="resetForm" 
            />
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Create Template Dialog -->
  <Dialog 
    v-model:visible="showCreateTemplateDialog" 
    header="Create Email Template" 
    :modal="true" 
    class="p-fluid" 
    :style="{ width: '50vw' }"
  >
    <div class="p-field mb-4">
      <label for="templateName" class="font-medium block mb-2">Template Name</label>
      <InputText id="templateName" v-model="newTemplate.name" required />
    </div>
    <div class="p-field mb-4">
      <label for="templateSubject" class="font-medium block mb-2">Subject</label>
      <InputText id="templateSubject" v-model="newTemplate.subject" required />
    </div>
    <div class="p-field">
      <label for="templateBody" class="font-medium block mb-2">Body</label>
      <TipTap v-model="newTemplate.body" height="300px" minHeight="100px" />
      <div class="mt-2 bg-gray-50 p-2 rounded text-sm">
        <p class="font-medium">Available Variables:</p>
        <div class="mt-1 flex flex-wrap gap-2">
          <Tag v-for="variable in availableVariables" :key="variable" :value="variable" />
        </div>
      </div>
    </div>

    <template #footer>
      <Button 
        label="Cancel" 
        icon="pi pi-times" 
        @click="showCreateTemplateDialog = false" 
        class="p-button-text" 
      />
      <Button 
        label="Save Template" 
        icon="pi pi-check" 
        @click="saveTemplate" 
        :loading="savingTemplate" 
      />
    </template>
  </Dialog>

  <!-- Template Preview Dialog -->
  <Dialog 
    v-model:visible="showTemplatePreviewDialog" 
    header="Template Preview" 
    :modal="true" 
    :style="{ width: '50vw' }"
  >
    <div v-if="previewedTemplate">
      <h3 class="text-lg font-medium mb-2">{{ previewedTemplate.name }}</h3>
      <div class="bg-gray-50 p-3 rounded mb-4">
        <p class="font-medium text-sm text-gray-600">Subject:</p>
        <p>{{ previewedTemplate.subject }}</p>
      </div>
      <div>
        <p class="font-medium text-sm text-gray-600 mb-2">Body:</p>
        <div class="border rounded p-3 bg-white" v-html="previewedTemplate.body"></div>
      </div>
    </div>

    <template #footer>
      <Button 
        label="Close" 
        icon="pi pi-times" 
        @click="showTemplatePreviewDialog = false" 
      />
    </template>
  </Dialog>

  <!-- Send Confirmation Dialog -->
  <Dialog
    v-model:visible="showSendConfirmDialog"
    header="Confirm Sending"
    :modal="true"
  >
    <div class="p-4">
      <i class="pi pi-envelope text-2xl text-primary-500 mr-2"></i>
      <p class="text-lg">Are you sure you want to send emails to {{ selectedRecipients.length }} recipients?</p>
      <p class="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
    </div>
    <template #footer>
      <Button 
        label="Cancel" 
        icon="pi pi-times" 
        @click="showSendConfirmDialog = false" 
        class="p-button-text" 
      />
      <Button 
        label="Send Now" 
        icon="pi pi-send" 
        severity="success" 
        @click="confirmSend" 
        :loading="sending" 
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import Steps from 'primevue/steps';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Badge from 'primevue/badge';
import TipTap from '@/components/tiptap/TipTap.vue';
import { generateStudentVariables, generateLeadVariables } from '~/utils/emailUtils';

// Toast notification
const toast = useToast();

// Steps configuration
const steps = [
  { label: 'Select Recipients' },
  { label: 'Choose Template' },
  { label: 'Review and Send' }
];
const activeStep = ref(0);

// Recipients
const recipientType = ref('student'); // 'student' or 'lead'
const recipientTypes = [
  { label: 'Students', value: 'student' },
  { label: 'Leads', value: 'lead' }
];

const availableRecipients = ref([]);
const selectedRecipients = ref([]);
const loadingRecipients = ref(false);

// Search and filters
const searchQuery = ref('');
const studentStatus = ref('');
const enrollmentDate = ref(null);
const leadStatus = ref('');
const leadCreatedAfter = ref(null);

const studentStatusOptions = [
  { label: 'Any Status', value: '' },
  { label: 'Current', value: 'current' },
  { label: 'On Leave', value: 'on_leave' },
  { label: 'Graduated', value: 'graduated' },
  { label: 'Withdrawn', value: 'withdrawn' },
  { label: 'Pending', value: 'pending' }
];

const leadStatusOptions = [
  { label: 'Any Status', value: '' },
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Converted', value: 'converted' },
  { label: 'Lost', value: 'lost' }
];

// Templates
const templates = ref([]);
const selectedTemplateId = ref('');
const currentTemplate = ref(null);
const loadingTemplates = ref(false);

// Template creation
const showCreateTemplateDialog = ref(false);
const newTemplate = ref({
  name: '',
  subject: '',
  body: ''
});
const savingTemplate = ref(false);

// Template preview
const showTemplatePreviewDialog = ref(false);
const previewedTemplate = ref(null);

// Sending process
const sending = ref(false);
const showSendConfirmDialog = ref(false);

// Available variables for templates
const availableVariables = computed(() => {
  if (recipientType.value === 'student') {
    return [
      '{{firstName}}',
      '{{lastName}}',
      '{{fullName}}',
      '{{email}}',
      '{{phone}}',
      '{{enrollmentDate}}',
      '{{expectedGraduationDate}}',
      '{{status}}'
    ];
  } else {
    return [
      '{{firstName}}',
      '{{lastName}}',
      '{{fullName}}',
      '{{email}}',
      '{{phone}}',
      '{{message}}',
      '{{status}}'
    ];
  }
});

// Load data when component mounts
onMounted(async () => {
  await Promise.all([
    loadRecipients(),
    loadTemplates()
  ]);
});

// Methods
async function loadRecipients() {
  loadingRecipients.value = true;
  
  try {
    let endpoint = recipientType.value === 'student' ? '/api/students' : '/api/leads';
    
    const params = {
      page: 1,
      limit: 100,
      search: searchQuery.value
    };
    
    if (recipientType.value === 'student' && studentStatus.value) {
      params.status = studentStatus.value;
    }
    
    if (recipientType.value === 'student' && enrollmentDate.value) {
      params.enrollmentDate = formatDateForApi(enrollmentDate.value);
    }
    
    if (recipientType.value === 'lead' && leadStatus.value) {
      params.status = leadStatus.value;
    }
    
    if (recipientType.value === 'lead' && leadCreatedAfter.value) {
      params.fromDate = formatDateForApi(leadCreatedAfter.value);
    }
    
    const response = await $fetch(endpoint, { params });
    
    // Format recipient data for the table
    availableRecipients.value = response.data.map(item => {
      if (recipientType.value === 'student') {
        return {
          id: item.id,
          name: `${item.first_name} ${item.last_name}`,
          email: item.email,
          status: item.status || 'unknown',
          enrollmentDate: item.enrollment_date,
          variables: generateStudentVariables(item)
        };
      } else {
        return {
          id: item.id,
          name: `${item.first_name} ${item.last_name}`,
          email: item.email,
          status: item.status || 'unknown',
          createdAt: item.created_at,
          variables: generateLeadVariables(item)
        };
      }
    });
    
    // Clear selection when recipient type or filters change
    selectedRecipients.value = [];
  } catch (error) {
    console.error('Failed to load recipients:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load recipients. Please try again.',
      life: 3000
    });
  } finally {
    loadingRecipients.value = false;
  }
}

async function loadTemplates() {
  loadingTemplates.value = true;
  
  try {
    const response = await $fetch('/api/templates');
    templates.value = response;
  } catch (error) {
    console.error('Failed to load templates:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load email templates. Please try again.',
      life: 3000
    });
  } finally {
    loadingTemplates.value = false;
  }
}

function searchRecipients() {
  loadRecipients();
}

function applyFilters() {
  loadRecipients();
}

function selectAllRecipients() {
  selectedRecipients.value = [...availableRecipients.value];
}

function clearSelection() {
  selectedRecipients.value = [];
}

function selectTemplate(templateId) {
  selectedTemplateId.value = templateId;
  currentTemplate.value = templates.value.find(t => t.id === templateId);
}

function previewTemplate(template) {
  previewedTemplate.value = template;
  showTemplatePreviewDialog.value = true;
}

async function saveTemplate() {
  if (!newTemplate.value.name || !newTemplate.value.subject || !newTemplate.value.body) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please fill in all template fields',
      life: 3000
    });
    return;
  }
  
  savingTemplate.value = true;
  
  try {
    const savedTemplate = await $fetch('/api/templates', {
      method: 'POST',
      body: {
        name: newTemplate.value.name,
        subject: newTemplate.value.subject,
        body: newTemplate.value.body
      }
    });
    
    templates.value.push(savedTemplate);
    showCreateTemplateDialog.value = false;
    
    // Reset form
    newTemplate.value = {
      name: '',
      subject: '',
      body: ''
    };
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Template created successfully',
      life: 3000
    });
  } catch (error) {
    console.error('Failed to save template:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to save template. Please try again.',
      life: 3000
    });
  } finally {
    savingTemplate.value = false;
  }
}

function nextStep() {
  if (activeStep.value === 0 && selectedRecipients.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'No Recipients',
      detail: 'Please select at least one recipient',
      life: 3000
    });
    return;
  }
  
  if (activeStep.value === 1 && !selectedTemplateId.value) {
    toast.add({
      severity: 'warn',
      summary: 'No Template',
      detail: 'Please select an email template',
      life: 3000
    });
    return;
  }
  
  activeStep.value++;
}

function sendEmails() {
  showSendConfirmDialog.value = true;
}

async function confirmSend() {
  sending.value = true;
  showSendConfirmDialog.value = false;
  
  try {
    // Format recipients for the API
    const recipients = selectedRecipients.value.map(recipient => ({
      to: recipient.email,
      recipientType: recipientType.value,
      recipientId: recipient.id,
      variables: recipient.variables
    }));
    
    await $fetch('/api/communications/send-bulk', {
      method: 'POST',
      body: {
        recipients,
        templateId: selectedTemplateId.value
      }
    });
    
    // Move to success screen
    activeStep.value = 3;
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Emails sent successfully to ${selectedRecipients.value.length} recipients`,
      life: 3000
    });
  } catch (error) {
    console.error('Failed to send emails:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to send emails. Please try again.',
      life: 3000
    });
  } finally {
    sending.value = false;
  }
}

function resetForm() {
  activeStep.value = 0;
  selectedRecipients.value = [];
  selectedTemplateId.value = '';
  currentTemplate.value = null;
  recipientType.value = 'student';
  searchQuery.value = '';
  studentStatus.value = '';
  enrollmentDate.value = null;
  leadStatus.value = '';
  leadCreatedAfter.value = null;
  
  // Reload data
  loadRecipients();
}

// Helper functions
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
}

function formatDateForApi(date) {
  if (!date) return null;
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

function getStatusSeverity(status) {
  if (!status) return 'secondary';
  
  if (recipientType.value === 'student') {
    switch (status.toLowerCase()) {
      case 'current': return 'success';
      case 'on_leave': return 'warning';
      case 'withdrawn': return 'danger';
      case 'graduated': return 'info';
      case 'pending': return 'help';
      default: return 'secondary';
    }
  } else {
    switch (status.toLowerCase()) {
      case 'new': return 'info';
      case 'contacted': return 'warning';
      case 'qualified': return 'success';
      case 'converted': return 'success';
      case 'lost': return 'danger';
      default: return 'secondary';
    }
  }
}
</script>