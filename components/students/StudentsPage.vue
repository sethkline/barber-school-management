<!-- pages/students/index.vue -->
<template>
  <div class="p-4 md:p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Student Management</h1>
      <p class="text-gray-600 mt-1">View, add, and manage student records</p>
    </div>

    <!-- Student List Component -->
    <StudentList
      :students="students"
      :totalRecords="totalRecords"
      :loading="loading"
      :error="error"
      :limit="limit"
      @page-change="onPageChange"
      @reload="loadStudents"
      @add-student="showAddStudentDialog"
      @edit-student="showEditStudentDialog"
      @view-student="showStudentDetails"
      @delete-student="showDeleteConfirmation"
    />

    <!-- Student Form Dialog (Add/Edit) -->
    <StudentForm
      v-model:visible="studentFormVisible"
      :studentData="selectedStudent"
      :loading="formSubmitting"
      @save="saveStudent"
    />

    <!-- Student Detail Dialog -->
    <StudentDetail
      v-model:visible="studentDetailVisible"
      :student="selectedStudent"
      :loading="detailsLoading"
      @edit-student="showEditStudentDialog"
      @add-assessment="showAddAssessmentDialog"
      @upload-document="showDocumentUploadDialog"
      @delete-document="confirmDeleteDocument"
      @add-certification="showAddCertificationDialog"
      @edit-certification="showEditCertificationDialog"
      @delete-certification="confirmDeleteCertification"
    />

    <!-- Delete Confirmation Dialog -->
    <StudentDeleteConfirmation
      v-model:visible="deleteConfirmationVisible"
      :student="selectedStudent"
      :loading="deleteLoading"
      :archiveOption="true"
      @confirm-delete="deleteStudent"
    />

    <!-- Document Upload Dialog -->
    <DocumentUpload
      v-model:visible="documentUploadVisible"
      :studentId="selectedStudent?.id || ''"
      :loading="documentUploading"
      @upload-document="uploadDocument"
    />

    <!-- Additional dialogs can be added for assessments and certifications as needed -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import StudentList from '~/components/students/StudentList.vue';
import StudentForm from '~/components/students/StudentForm.vue';
import StudentDetail from '~/components/students/StudentDetail.vue';
import StudentDeleteConfirmation from '~/components/students/StudentDeleteConfirmation.vue';
import DocumentUpload from '~/components/students/DocumentUpload.vue';
import type { Tables, TablesInsert, TablesUpdate } from '~/types/supabase';

type Student = Tables<'students'>;

// Toast notifications
const toast = useToast();

// State for student listing
const students = ref<Student[]>([]);
const totalRecords = ref(0);
const loading = ref(false);
const error = ref('');
const page = ref(1);
const limit = ref(10);

// State for dialogs
const studentFormVisible = ref(false);
const studentDetailVisible = ref(false);
const deleteConfirmationVisible = ref(false);
const documentUploadVisible = ref(false);
const formSubmitting = ref(false);
const detailsLoading = ref(false);
const deleteLoading = ref(false);
const documentUploading = ref(false);

// Currently selected student
const selectedStudent = ref<Student | null>(null);
const isEditMode = ref(false);

// Load students when component mounts
onMounted(() => {
  loadStudents();
});

// Functions to fetch and manage students
async function loadStudents() {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await $fetch(`/api/students`, {
      params: {
        page: page.value,
        limit: limit.value
      }
    });
    
    students.value = response.data || [];
    totalRecords.value = response.count || 0;
  } catch (err: any) {
    error.value = err.message || 'Failed to load students';
    console.error('Error loading students:', err);
  } finally {
    loading.value = false;
  }
}

// Pagination handler
function onPageChange(event: { page: number; rows: number }) {
  page.value = event.page;
  limit.value = event.rows;
  loadStudents();
}

// Dialog control functions
function showAddStudentDialog() {
  selectedStudent.value = null;
  isEditMode.value = false;
  studentFormVisible.value = true;
}

function showEditStudentDialog(student: Student) {
  selectedStudent.value = { ...student };
  isEditMode.value = true;
  studentFormVisible.value = true;
}

function showStudentDetails(student: Student) {
  selectedStudent.value = { ...student };
  detailsLoading.value = true;
  studentDetailVisible.value = true;
  
  // Fetch complete student details
  loadStudentDetails(student.id);
}

function showDeleteConfirmation(student: Student) {
  selectedStudent.value = { ...student };
  deleteConfirmationVisible.value = true;
}

function showDocumentUploadDialog() {
  if (!selectedStudent.value?.id) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No student selected',
      life: 3000
    });
    return;
  }
  
  documentUploadVisible.value = true;
}

function showAddAssessmentDialog() {
  // Implement assessment dialog functionality
  toast.add({
    severity: 'info',
    summary: 'Info',
    detail: 'Assessment dialog not implemented yet',
    life: 3000
  });
}

function showAddCertificationDialog() {
  // Implement certification dialog functionality
  toast.add({
    severity: 'info',
    summary: 'Info',
    detail: 'Certification dialog not implemented yet',
    life: 3000
  });
}

function showEditCertificationDialog(certification: any) {
  // Implement certification edit functionality
  toast.add({
    severity: 'info',
    summary: 'Info',
    detail: 'Certification edit not implemented yet',
    life: 3000
  });
}

// API interaction functions
async function loadStudentDetails(studentId: string) {
  try {
    const studentData = await $fetch(`/api/students/${studentId}`);
    selectedStudent.value = studentData;
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load student details',
      life: 3000
    });
    console.error('Error loading student details:', err);
  } finally {
    detailsLoading.value = false;
  }
}

async function saveStudent(studentData: TablesInsert<'students'> | TablesUpdate<'students'>) {
  formSubmitting.value = true;
  
  try {
    let response;
    
    if (isEditMode.value && studentData.id) {
      // Update existing student
      response = await $fetch(`/api/students/${studentData.id}`, {
        method: 'PUT',
        body: studentData
      });
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Student updated successfully',
        life: 3000
      });
    } else {
      // Create new student
      response = await $fetch('/api/students', {
        method: 'POST',
        body: studentData
      });
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Student added successfully',
        life: 3000
      });
    }
    
    // Close the form and refresh the list
    studentFormVisible.value = false;
    loadStudents();
    
    // If we're in detail view, update the selected student
    if (studentDetailVisible.value && selectedStudent.value?.id === response.id) {
      selectedStudent.value = response;
    }
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to save student',
      life: 3000
    });
    console.error('Error saving student:', err);
  } finally {
    formSubmitting.value = false;
  }
}

async function deleteStudent(params: { studentId: string; archive: boolean }) {
  deleteLoading.value = true;
  
  try {
    await $fetch(`/api/students/${params.studentId}`, {
      method: 'DELETE',
      params: {
        archive: params.archive
      }
    });
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: params.archive 
        ? 'Student archived successfully' 
        : 'Student deleted successfully',
      life: 3000
    });
    
    // Close the dialog and refresh the list
    deleteConfirmationVisible.value = false;
    
    // If we're in detail view and deleted the current student, close it
    if (studentDetailVisible.value && selectedStudent.value?.id === params.studentId) {
      studentDetailVisible.value = false;
    }
    
    loadStudents();
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to delete student',
      life: 3000
    });
    console.error('Error deleting student:', err);
  } finally {
    deleteLoading.value = false;
  }
}

async function uploadDocument(params: { studentId: string; formData: FormData }) {
  documentUploading.value = true;
  
  try {
    await $fetch(`/api/students/${params.studentId}/documents`, {
      method: 'POST',
      body: params.formData
    });
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Document uploaded successfully',
      life: 3000
    });
    
    // Close the dialog
    documentUploadVisible.value = false;
    
    // If we're in detail view, refresh the documents tab
    if (studentDetailVisible.value && selectedStudent.value?.id === params.studentId) {
      // This would trigger a reload in the StudentDetail component
      const event = new CustomEvent('document-uploaded');
      window.dispatchEvent(event);
    }
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to upload document',
      life: 3000
    });
    console.error('Error uploading document:', err);
  } finally {
    documentUploading.value = false;
  }
}

function confirmDeleteDocument(document: any) {
  // Implement document deletion confirmation
  toast.add({
    severity: 'info',
    summary: 'Info',
    detail: 'Document deletion not implemented yet',
    life: 3000
  });
}

function confirmDeleteCertification(certification: any) {
  // Implement certification deletion confirmation
  toast.add({
    severity: 'info',
    summary: 'Info',
    detail: 'Certification deletion not implemented yet',
    life: 3000
  });
}
</script>