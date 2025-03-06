# Student Management Components

This directory contains a set of Vue components for managing student records in an educational management system. The components work together to provide a complete student management experience with features like listing, creating, editing, viewing details, and managing student documents.

## Component Overview

### StudentList.vue

The main list view that displays all students with filtering and pagination.

**Features:**
- Paginated table with student information
- Filtering by name, email, status, etc.
- Action buttons for viewing, editing, and deleting students
- Loading state handling
- Error handling

**Usage:**
```vue
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
```

### StudentForm.vue

A dialog component for adding new students or editing existing ones.

**Features:**
- Form validation
- Date pickers for enrollment and graduation dates
- Status dropdown selection
- Loading state handling

**Usage:**
```vue
<StudentForm
  v-model:visible="studentFormVisible"
  :studentData="selectedStudent"
  :loading="formSubmitting"
  @save="saveStudent"
/>
```

### StudentDetail.vue

A detailed view of a student record with tabs for attendance, assessments, documents, and certifications.

**Features:**
- Student profile information
- Tabbed interface for related data
- Actions for adding assessments,