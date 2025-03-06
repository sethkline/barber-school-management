<!-- components/students/DocumentUpload.vue -->
<template>
  <Dialog
    :visible="visible"
    :style="{width: '500px'}"
    header="Upload Document"
    :modal="true"
    :closable="!loading"
    @update:visible="$emit('update:visible', $event)"
  >
    <div v-if="loading" class="flex justify-center items-center p-6">
      <ProgressSpinner style="width:50px;height:50px" strokeWidth="4" />
    </div>
    <div v-else class="p-4">
      <form @submit.prevent="handleUpload">
        <div class="mb-4">
          <label for="document_name" class="block text-sm font-medium text-gray-700 mb-1">
            Document Name*
          </label>
          <InputText
            id="document_name"
            v-model.trim="form.document_name"
            class="w-full"
            :class="{'p-invalid': submitted && !form.document_name}"
            placeholder="Enter document name"
          />
          <small class="p-error" v-if="submitted && !form.document_name">
            Document name is required
          </small>
        </div>
        
        <div class="mb-4">
          <label for="expiration_date" class="block text-sm font-medium text-gray-700 mb-1">
            Expiration Date (if applicable)
          </label>
          <Calendar
            id="expiration_date"
            v-model="form.expiration_date"
            dateFormat="mm/dd/yy"
            :showIcon="true"
            class="w-full"
            placeholder="Select expiration date"
          />
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            File*
          </label>
          <div 
            class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50"
            :class="{'border-primary-500 bg-primary-50': isDragging, 'border-red-500': submitted && !form.file}"
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
            
            <div v-if="form.file">
              <i class="pi pi-file text-3xl text-primary-500 mb-2"></i>
              <div class="text-gray-800 font-medium">{{ form.file.name }}</div>
              <div class="text-sm text-gray-500">{{ formatFileSize(form.file.size) }}</div>
              <Button
                type="button"
                icon="pi pi-times"
                text
                size="small"
                class="mt-2"
                @click.stop="clearFile"
                aria-label="Remove file"
              />
            </div>
            <div v-else>
              <i class="pi pi-cloud-upload text-3xl text-gray-400 mb-2"></i>
              <div class="text-gray-600">
                Drag and drop a file here, or click to browse
              </div>
              <div class="text-xs text-gray-500 mt-1">
                Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG
              </div>
              <div class="text-xs text-gray-500">
                Maximum file size: 10MB
              </div>
            </div>
          </div>
          <small class="p-error" v-if="submitted && !form.file">
            A file is required
          </small>
          <small class="p-error" v-if="fileError">
            {{ fileError }}
          </small>
        </div>
      </form>
    </div>
    
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancel"
          icon="pi pi-times"
          @click="$emit('update:visible', false)"
          class="p-button-text"
          :disabled="loading"
        />
        <Button
          label="Upload"
          icon="pi pi-upload"
          @click="handleUpload"
          :loading="loading"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Calendar from 'primevue/calendar';
import ProgressSpinner from 'primevue/progressspinner';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  studentId: {
    type: String,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:visible', 'upload-document']);

const toast = useToast();
const fileInput = ref<HTMLInputElement | null>(null);
const submitted = ref(false);
const isDragging = ref(false);
const fileError = ref('');

const form = reactive({
  document_name: '',
  expiration_date: null as Date | null,
  file: null as File | null
});

// File handling methods
function triggerFileInput() {
  fileInput.value?.click();
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    validateAndSetFile(target.files[0]);
  }
}

function handleFileDrop(event: DragEvent) {
  isDragging.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    validateAndSetFile(event.dataTransfer.files[0]);
  }
}

function validateAndSetFile(file: File) {
  fileError.value = '';
  
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    fileError.value = 'File size exceeds the 10MB limit';
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
    fileError.value = 'Invalid file type. Please use PDF, DOC, DOCX, JPG, or PNG';
    return;
  }
  
  form.file = file;
}

function clearFile(event: Event) {
  event.stopPropagation();
  form.file = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
  fileError.value = '';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Form submission
async function handleUpload() {
  submitted.value = true;
  
  // Validate form
  if (!form.document_name || !form.file) {
    return;
  }
  
  // Format the data for API submission
  const formData = new FormData();
  formData.append('document_name', form.document_name);
  formData.append('file', form.file);
  
  if (form.expiration_date) {
    formData.append('expiration_date', form.expiration_date.toISOString().split('T')[0]);
  }
  
  emit('upload-document', {
    studentId: props.studentId,
    formData
  });
}
</script>