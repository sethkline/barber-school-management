<template>
  <div class="bg-gray-50 min-h-screen pb-10">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Student Documents</h1>
            <p class="text-sm text-gray-500 mt-1">
              Manage documents for {{ student.first_name }} {{ student.last_name }}
            </p>
          </div>
          <Button 
            icon="pi pi-upload" 
            label="Upload Document" 
            @click="showUploadModal = true"
            class="p-button-primary"
          />
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <!-- Filters and Actions -->
      <div class="bg-white shadow rounded-lg p-4 mb-6">
        <div class="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4">
          <!-- Search -->
          <div class="relative w-full md:w-1/3">
            <IconField>
                <InputIcon>
                  <i class="pi pi-search" />
                </InputIcon>
                <InputText 
                v-model="searchTerm" 
                placeholder="Search documents..." 
                class="w-full"
              />
            </IconField>
          </div>
          
          <div class="flex flex-col md:flex-row w-full md:w-auto space-y-2 md:space-y-0 md:space-x-3">
            <!-- Document Type Filter -->
            <Dropdown 
              v-model="filterType" 
              :options="documentTypes" 
              placeholder="All Types" 
              class="w-full md:w-auto"
            />
            
            <!-- Sort Options -->
            <Dropdown 
              v-model="sortOption" 
              :options="sortOptions" 
              optionLabel="label"
              optionValue="value"
              placeholder="Sort by" 
              class="w-full md:w-auto"
            />
            
            <!-- Bulk Actions -->
            <Button 
              v-if="selectedDocuments.length > 0"
              icon="pi pi-trash" 
              :label="`Delete Selected (${selectedDocuments.length})`" 
              severity="danger"
              @click="handleBulkDelete" 
              :disabled="loading"
            />
          </div>
        </div>
      </div>

      <!-- Documents Table -->
      <div class="bg-white shadow rounded-lg overflow-hidden relative">
        <ProgressSpinner v-if="loading" class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10" />
        
        <DataTable 
          :value="sortedDocuments" 
          v-model:selection="selectedDocuments"
          :paginator="true" 
          :rows="10"
          :rowHover="true"
          stripedRows
          responsiveLayout="scroll"
          dataKey="id"
          class="p-datatable-sm"
          :loading="loading"
          emptyMessage="No documents found"
        >
          <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
          
          <Column field="document_name" header="Document">
            <template #body="slotProps">
              <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <i :class="getFileIconClass(slotProps.data.file_type)"></i>
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium text-gray-900">{{ slotProps.data.document_name }}</div>
                  <div class="text-sm text-gray-500">{{ slotProps.data.file_type }} • {{ slotProps.data.file_size }}</div>
                </div>
              </div>
            </template>
          </Column>
          
          <Column field="document_type" header="Type">
            <template #body="slotProps">
              <Tag 
                :value="slotProps.data.document_type" 
                :severity="getTypeSeverity(slotProps.data.document_type)" 
              />
            </template>
          </Column>
          
          <Column field="uploaded_at" header="Uploaded">
            <template #body="slotProps">
              <div class="text-sm text-gray-900">{{ formatDate(slotProps.data.uploaded_at) }}</div>
            </template>
          </Column>
          
          <Column field="expiration_date" header="Expiration">
            <template #body="slotProps">
              <div v-if="slotProps.data.expiration_date">
                <div v-if="isExpired(slotProps.data.expiration_date)">
                  <Tag severity="danger" value="Expired">
                    <template #icon>
                      <i class="pi pi-exclamation-triangle mr-1"></i>
                    </template>
                  </Tag>
                  <div class="text-xs text-gray-500 mt-1">{{ formatDate(slotProps.data.expiration_date) }}</div>
                </div>
                <div v-else-if="willExpireSoon(slotProps.data.expiration_date)">
                  <Tag severity="warning" value="Expiring Soon">
                    <template #icon>
                      <i class="pi pi-exclamation-circle mr-1"></i>
                    </template>
                  </Tag>
                  <div class="text-xs text-gray-500 mt-1">{{ formatDate(slotProps.data.expiration_date) }}</div>
                </div>
                <div v-else class="text-sm text-gray-900">
                  {{ formatDate(slotProps.data.expiration_date) }}
                </div>
              </div>
              <span v-else class="text-sm text-gray-500">No expiration</span>
            </template>
          </Column>
          
          <Column header="Actions" style="width: 8rem">
            <template #body="slotProps">
              <div class="flex justify-end space-x-2">
                <Button 
                  icon="pi pi-eye" 
                  @click="openPreview(slotProps.data)" 
                  text 
                  rounded 
                  severity="info" 
                  aria-label="View" 
                />
                <Button
                  icon="pi pi-download"
                  @click="handleDownload(slotProps.data.id)"
                  text
                  rounded
                  severity="success"
                  aria-label="Download"
                />
                <Button 
                  icon="pi pi-trash" 
                  @click="handleDelete(slotProps.data.id)" 
                  text 
                  rounded 
                  severity="danger" 
                  aria-label="Delete" 
                />
              </div>
            </template>
          </Column>

          <!-- Summary footer -->
          <template #footer>
            <div class="flex justify-between items-center px-2 py-1 text-xs text-gray-500">
              <div>
                Showing <span class="font-medium">{{ sortedDocuments.length }}</span> of <span class="font-medium">{{ documents.length }}</span> documents
              </div>
              <div class="flex items-center space-x-4">
                <span>
                  <i class="pi pi-calendar mr-1"></i> Last upload: {{ documents.length > 0 ? formatDate(documents[0].uploaded_at) : 'Never' }}
                </span>
                <span v-if="expiredDocuments.length > 0" class="text-red-600 flex items-center">
                  <i class="pi pi-exclamation-circle mr-1"></i>
                  {{ expiredDocuments.length }} expired documents
                </span>
              </div>
            </div>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- Upload Document Dialog -->
    <Dialog 
      v-model:visible="showUploadModal" 
      header="Upload New Document" 
      :modal="true" 
      :closable="!uploading"
      :style="{ width: '500px' }"
    >
      <div v-if="uploadError" class="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
        <i class="pi pi-exclamation-circle mr-2"></i>
        {{ uploadError }}
      </div>
      
      <div class="grid formgrid">
        <div class="field col-12">
          <label for="document_name" class="font-medium text-sm mb-1 block">Document Name*</label>
          <InputText 
            id="document_name"
            v-model="uploadFormData.document_name"
            class="w-full"
            :class="{'p-invalid': submitted && !uploadFormData.document_name}"
            placeholder="Enter document name"
          />
          <small class="p-error" v-if="submitted && !uploadFormData.document_name">
            Document name is required
          </small>
        </div>
        
        <div class="field col-12">
          <label for="document_type" class="font-medium text-sm mb-1 block">Document Type</label>
          <Dropdown
            id="document_type"
            v-model="uploadFormData.document_type"
            :options="documentTypes.filter(type => type !== 'All Types')"
            placeholder="Select a type"
            class="w-full"
          />
        </div>
        
        <div class="field col-12">
          <label for="expiration_date" class="font-medium text-sm mb-1 block">Expiration Date (if applicable)</label>
          <Calendar
            id="expiration_date"
            v-model="uploadFormData.expiration_date"
            dateFormat="mm/dd/yy"
            :showIcon="true"
            class="w-full"
            placeholder="Select expiration date"
          />
        </div>
        
        <div class="field col-12">
          <label class="font-medium text-sm mb-1 block">Document File*</label>
          <div 
            class="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-gray-50"
            :class="{'border-green-300 bg-green-50': uploadFormData.file, 'border-gray-300': !uploadFormData.file, 'border-red-300': submitted && !uploadFormData.file}"
            @dragenter.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @dragover.prevent="isDragging = true"
            @drop.prevent="handleFileDrop"
            @click="triggerFileInput"
          >
            <input
              type="file"
              ref="fileInput"
              class="hidden"
              @change="handleFileChange"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            
            <div v-if="uploadFormData.file">
              <i class="pi pi-check-circle text-3xl text-green-500"></i>
              <p class="text-sm text-gray-700 mt-2">
                {{ uploadFormData.file.name }} ({{ formatFileSize(uploadFormData.file.size) }})
              </p>
              <Button
                label="Remove file"
                icon="pi pi-times"
                text
                size="small"
                class="mt-2"
                @click.stop="clearFile"
              />
            </div>
            <div v-else>
              <i class="pi pi-cloud-upload text-3xl text-gray-400"></i>
              <p class="mt-2 text-sm text-gray-600">
                Upload a file or drag and drop
              </p>
              <p class="text-xs text-gray-500 mt-1">
                Supported formats: PDF, DOC, JPG, PNG up to 10MB
              </p>
            </div>
          </div>
          <small class="p-error" v-if="submitted && !uploadFormData.file">
            A file is required
          </small>
        </div>
      </div>
      
      <template #footer>
        <Button 
          label="Cancel" 
          icon="pi pi-times" 
          @click="showUploadModal = false" 
          text 
          :disabled="uploading" 
        />
        <Button 
          label="Upload Document" 
          icon="pi pi-upload" 
          @click="handleUpload" 
          :loading="uploading" 
        />
      </template>
    </Dialog>
    
    <!-- Document Preview Dialog -->
    <Dialog 
      v-model:visible="showPreviewModal" 
      :modal="true"
      :breakpoints="{'960px': '80vw', '640px': '90vw'}" 
      :style="{width: '60vw'}" 
      :maximizable="true"
    >
      <template #header>
        <div class="flex items-center">
          <div class="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-md flex items-center justify-center mr-3">
            <i :class="previewDocument ? getFileIconClass(previewDocument.file_type) : 'pi pi-file'"></i>
          </div>
          <div>
            <h3>{{ previewDocument ? previewDocument.document_name : 'Document Preview' }}</h3>
            <p class="text-sm text-gray-500" v-if="previewDocument">
              {{ previewDocument.file_type }} • {{ previewDocument.file_size }}
            </p>
          </div>
        </div>
      </template>
      
      <div class="flex-1 p-6 bg-gray-100 min-h-[300px] flex items-center justify-center" v-if="previewDocument">
        <!-- Document Preview Content -->
        <div v-if="previewDocument.file_type === 'PDF'" class="w-full h-full bg-white shadow-lg rounded-lg p-4 flex flex-col items-center justify-center">
          <i class="pi pi-file-pdf text-red-600 text-6xl mb-4"></i>
          <p class="text-gray-800 font-medium mb-2">PDF Preview</p>
          <p class="text-gray-500 text-sm mb-4">This is a simulation. In a real application, the PDF would be embedded here.</p>
          <Button icon="pi pi-external-link" label="Open in PDF Viewer" />
        </div>
        <div v-else-if="['JPG', 'JPEG', 'PNG'].includes(previewDocument.file_type)" class="w-full h-full flex items-center justify-center">
          <div class="relative">
            <!-- <img src="/api/placeholder/400/320" alt="Document preview" class="max-w-full max-h-[60vh] rounded-lg shadow-lg" /> -->
            <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm text-center rounded-b-lg">
              Image preview (placeholder)
            </div>
          </div>
        </div>
        <div v-else class="w-full h-full bg-white shadow-lg rounded-lg p-4 flex flex-col items-center justify-center">
          <i class="pi pi-file text-gray-600 text-6xl mb-4"></i>
          <p class="text-gray-800 font-medium mb-2">{{ previewDocument.file_type }} Document</p>
          <p class="text-gray-500 text-sm mb-4">Preview not available for this file type.</p>
          <Button icon="pi pi-download" label="Download File" />
        </div>
      </div>
      
      <template #footer>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p class="text-gray-500">Uploaded</p>
            <p class="font-medium">{{ previewDocument ? formatDate(previewDocument.uploaded_at) : '' }}</p>
          </div>
          <div>
            <p class="text-gray-500">Document Type</p>
            <p class="font-medium">{{ previewDocument ? previewDocument.document_type : '' }}</p>
          </div>
          <div>
            <p class="text-gray-500">Expiration</p>
            <p class="font-medium">
              {{ previewDocument && previewDocument.expiration_date ? 
                formatDate(previewDocument.expiration_date) : 
                'No expiration' }}
            </p>
          </div>
          <div>
            <p class="text-gray-500">File Size</p>
            <p class="font-medium">{{ previewDocument ? previewDocument.file_size : '' }}</p>
          </div>
        </div>
      </template>
    </Dialog>

    <!-- Document Expiration Toast -->
    <Toast />

    <!-- Confirmation Dialog for Delete Actions -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { useRoute } from 'vue-router';

// Props
const props = defineProps<{
  studentId?: string
}>();

const route = useRoute();

// Reactive state
const documents = ref<any[]>([]);

// Student data
const student = ref<any>(null);

// UI State
const loading = ref(false);
const selectedDocuments = ref([]);
const showUploadModal = ref(false);
const showPreviewModal = ref(false);
const previewDocument = ref(null);
const searchTerm = ref('');
const filterType = ref('All Types');
const sortOption = ref('newest');
const isDragging = ref(false);
const fileInput = ref(null);
const uploading = ref(false);
const submitted = ref(false);
const uploadError = ref('');

// Upload form data
const uploadFormData = ref({
  document_name: '',
  document_type: '',
  expiration_date: null,
  file: null
});

// Document types for filter and form
const documentTypes = [
  'All Types',
  'Agreement',
  'Insurance',
  'Medical',
  'Identification',
  'Financial',
  'Academic',
  'Other'
];

// Sort options
const sortOptions = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Name (A-Z)', value: 'name-asc' },
  { label: 'Name (Z-A)', value: 'name-desc' }
];

// SpeedDial items for contextual help
const speedDialItems = [
  {
    label: 'Help',
    icon: 'pi pi-question',
    command: () => {
      // Show help
    }
  },
  {
    label: 'Upload Document',
    icon: 'pi pi-upload',
    command: () => {
      showUploadModal.value = true;
    }
  },
  {
    label: 'Export All',
    icon: 'pi pi-download',
    command: () => {
      // Export functionality
    }
  }
];

// Toast and confirmation services
const toast = useToast();
const confirm = useConfirm();

// Computed properties
const filteredDocuments = computed(() => {
  return documents.value.filter(doc => {
    const matchesSearch = doc.document_name.toLowerCase().includes(searchTerm.value.toLowerCase());
    const matchesType = filterType.value === 'All Types' || doc.document_type === filterType.value;
    return matchesSearch && matchesType;
  });
});

const sortedDocuments = computed(() => {
  return [...filteredDocuments.value].sort((a, b) => {
    if (sortOption.value === 'newest') {
      return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
    } else if (sortOption.value === 'oldest') {
      return new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime();
    } else if (sortOption.value === 'name-asc') {
      return a.document_name.localeCompare(b.document_name);
    } else if (sortOption.value === 'name-desc') {
      return b.document_name.localeCompare(a.document_name);
    }
    return 0;
  });
});

const expiredDocuments = computed(() => {
  return documents.value.filter(doc => isExpired(doc.expiration_date));
});

// Methods
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIconClass(fileType) {
  switch (fileType.toLowerCase()) {
    case 'pdf':
      return 'pi pi-file-pdf text-red-600';
    case 'jpg':
    case 'jpeg':
    case 'png':
      return 'pi pi-image text-blue-600';
    case 'doc':
    case 'docx':
      return 'pi pi-file-word text-blue-800';
    default:
      return 'pi pi-file text-gray-600';
  }
}

function getTypeSeverity(type) {
  switch (type) {
    case 'Agreement':
      return 'info';
    case 'Insurance':
      return 'success';
    case 'Medical':
      return 'warning';
    case 'Identification':
      return 'info';
    case 'Financial':
      return 'danger';
    case 'Academic':
      return 'success';
    default:
      return 'secondary';
  }
}

function isExpired(expirationDate) {
  if (!expirationDate) return false;
  return new Date(expirationDate) < new Date();
}

function willExpireSoon(expirationDate) {
  if (!expirationDate) return false;
  const expDate = new Date(expirationDate);
  const today = new Date();
  const daysDiff = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
  return daysDiff > 0 && daysDiff <= 30;
}

function triggerFileInput() {
  fileInput.value.click();
}

function handleFileChange(event) {
  const target = event.target;
  if (target.files && target.files.length > 0) {
    validateAndSetFile(target.files[0]);
  }
}

function handleFileDrop(event) {
  isDragging.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    validateAndSetFile(event.dataTransfer.files[0]);
  }
}

function validateAndSetFile(file) {
  uploadError.value = '';
  
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    uploadError.value = 'File size exceeds the 10MB limit';
    return;
  }
  
  // Check file type
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    uploadError.value = 'Invalid file type. Please use PDF, DOC, DOCX, JPG, or PNG';
    return;
  }
  
  uploadFormData.value.file = file;
}

function clearFile() {
  uploadFormData.value.file = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
  uploadError.value = '';
}

async function handleUpload() {
  submitted.value = true;

  // Validate form
  if (!uploadFormData.value.document_name || !uploadFormData.value.file) {
    return;
  }

  uploading.value = true;
  uploadError.value = '';

  try {
    const formData = new FormData();
    formData.append('file', uploadFormData.value.file);
    formData.append('document_name', uploadFormData.value.document_name);
    formData.append('document_type', uploadFormData.value.document_type || 'Other');
    if (uploadFormData.value.expiration_date) {
      formData.append('expiration_date', uploadFormData.value.expiration_date.toISOString());
    }

    const studentId = props.studentId || route.params.id;
    await $fetch(`/api/students/${studentId}/documents`, {
      method: 'POST',
      body: formData,
    });

    // Refresh documents list
    await fetchDocuments();

    // Reset form and close modal
    uploadFormData.value = {
      document_name: '',
      document_type: '',
      expiration_date: null,
      file: null
    };
    submitted.value = false;
    showUploadModal.value = false;

    // Show success message
    toast.add({
      severity: 'success',
      summary: 'Document Uploaded',
      detail: 'The document was uploaded successfully to S3',
      life: 3000
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    uploadError.value = error.data?.message || 'Failed to upload document';
    toast.add({
      severity: 'error',
      summary: 'Upload Failed',
      detail: uploadError.value,
      life: 5000
    });
  } finally {
    uploading.value = false;
  }
}

async function handleDelete(docId: string) {
  confirm.require({
    message: 'Are you sure you want to delete this document? This will also delete it from S3.',
    header: 'Confirm Deletion',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      loading.value = true;

      try {
        const studentId = props.studentId || route.params.id;
        await $fetch(`/api/students/${studentId}/${docId}`, {
          method: 'DELETE',
        });

        // Refresh documents list
        await fetchDocuments();

        toast.add({
          severity: 'success',
          summary: 'Document Deleted',
          detail: 'The document has been deleted from S3 successfully',
          life: 3000
        });
      } catch (error: any) {
        console.error('Delete error:', error);
        toast.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: error.data?.message || 'Failed to delete document',
          life: 5000
        });
      } finally {
        loading.value = false;
      }
    }
  });
}

function handleBulkDelete() {
  if (selectedDocuments.value.length === 0) return;
  
  confirm.require({
    message: `Are you sure you want to delete ${selectedDocuments.value.length} selected document(s)?`,
    header: 'Confirm Bulk Deletion',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => {
      loading.value = true;
      
      // Simulate deletion delay
      setTimeout(() => {
        documents.value = documents.value.filter(doc => !selectedDocuments.value.includes(doc.id));
        selectedDocuments.value = [];
        loading.value = false;
        
        toast.add({
          severity: 'success',
          summary: 'Documents Deleted',
          detail: 'The selected documents have been deleted successfully',
          life: 3000
        });
      }, 800);
    }
  });
}

function openPreview(doc) {
  previewDocument.value = doc;
  showPreviewModal.value = true;
}

async function handleDownload(documentId: string) {
  try {
    const response = await $fetch(`/api/documents/${documentId}/download`);
    // Open download URL in new tab
    if (response.url) {
      window.open(response.url, '_blank');
    }
  } catch (error: any) {
    console.error('Download error:', error);
    toast.add({
      severity: 'error',
      summary: 'Download Failed',
      detail: error.data?.message || 'Failed to get download URL',
      life: 5000
    });
  }
}

async function fetchDocuments() {
  try {
    loading.value = true;
    const studentId = props.studentId || route.params.id;
    const data = await $fetch(`/api/students/${studentId}/documents`);
    documents.value = data.map((doc: any) => ({
      ...doc,
      file_size: formatFileSize(doc.file_size || 0),
      file_type: doc.document_type || 'Unknown',
    }));
  } catch (error: any) {
    console.error('Failed to fetch documents:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load documents',
      life: 5000
    });
  } finally {
    loading.value = false;
  }
}

async function fetchStudent() {
  try {
    const studentId = props.studentId || route.params.id;
    const data = await $fetch(`/api/students/${studentId}`);
    student.value = data;
  } catch (error: any) {
    console.error('Failed to fetch student:', error);
  }
}

// Lifecycle hooks
onMounted(async () => {
  await Promise.all([fetchStudent(), fetchDocuments()]);
  // Check for expired documents and show notification
  const expiredCount = documents.value.filter(doc => isExpired(doc.expiration_date)).length;
  const expiringCount = documents.value.filter(doc => !isExpired(doc.expiration_date) && willExpireSoon(doc.expiration_date)).length;
  
  if (expiredCount > 0 || expiringCount > 0) {
    let message = '';
    if (expiredCount > 0) {
      message += `${expiredCount} document${expiredCount > 1 ? 's' : ''} expired. `;
    }
    if (expiringCount > 0) {
      message += `${expiringCount} document${expiringCount > 1 ? 's' : ''} expiring soon.`;
    }
    
    toast.add({
      severity: 'error',
      summary: 'Document Alert',
      detail: message,
      life: 5000,
      closable: true,
    });
  }
});
</script>

<style scoped>
/* Add any component-specific styles here */
:deep(.p-datatable .p-datatable-header) {
  background-color: #f8fafc;
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
}

:deep(.p-dialog-content) {
  padding: 0;
}

:deep(.p-speeddial-button.p-button.p-button-icon-only) {
  width: 3rem;
  height: 3rem;
}

:deep(.p-speeddial-action) {
  width: 2.5rem;
  height: 2.5rem;
}

.p-tag {
  padding: 0.25rem 0.5rem;
}
</style>