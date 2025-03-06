<!-- components/students/StudentDetail.vue -->
<template>
  <Dialog
    :visible="visible"
    :style="{width: '800px'}"
    header="Student Details"
    :modal="true"
    :closable="!loading"
    @update:visible="$emit('update:visible', $event)"
  >
    <div v-if="loading" class="flex justify-center items-center p-4">
      <ProgressSpinner style="width:50px;height:50px" strokeWidth="4" />
    </div>
    <div v-else-if="!student.id" class="p-4 text-center text-gray-500">
      <i class="pi pi-exclamation-circle text-3xl mb-2"></i>
      <p>Student not found</p>
    </div>
    <div v-else class="p-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Left column with photo and key info -->
        <div class="col-span-1">
          <div class="flex flex-col items-center">
            <div class="w-32 h-32 rounded-full mb-4 bg-gray-200 flex items-center justify-center overflow-hidden">
              <img 
                v-if="student.photo_url" 
                :src="student.photo_url" 
                alt="Student photo"
                class="w-full h-full object-cover"
              />
              <i v-else class="pi pi-user text-5xl text-gray-400"></i>
            </div>
            
            <h2 class="text-xl font-bold text-center mb-1">
              {{ student.first_name }} {{ student.last_name }}
            </h2>
            
            <Tag 
              :value="formatStatus(student.status)" 
              :severity="getStatusSeverity(student.status)"
              class="mb-3"
            />
            
            <div class="w-full space-y-2 mt-2">
              <div class="flex items-center">
                <i class="pi pi-envelope text-gray-500 mr-2"></i>
                <a :href="`mailto:${student.email}`" class="text-primary-600 hover:underline">
                  {{ student.email }}
                </a>
              </div>
              
              <div v-if="student.phone" class="flex items-center">
                <i class="pi pi-phone text-gray-500 mr-2"></i>
                <a :href="`tel:${student.phone}`" class="text-primary-600 hover:underline">
                  {{ student.phone }}
                </a>
              </div>
              
              <div v-if="student.address" class="flex items-start">
                <i class="pi pi-map-marker text-gray-500 mr-2 mt-1"></i>
                <div>
                  <div>{{ student.address }}</div>
                  <div v-if="student.city || student.zip_code">
                    {{ student.city }}{{ student.city && student.zip_code ? ', ' : '' }}{{ student.zip_code }}
                  </div>
                </div>
              </div>
            </div>
            
            <div class="w-full mt-4 pt-4 border-t border-gray-200">
              <div class="mb-2">
                <span class="text-sm text-gray-500">Enrollment Date:</span>
                <div class="font-medium">{{ formatDate(student.enrollment_date) }}</div>
              </div>
              
              <div>
                <span class="text-sm text-gray-500">Expected Graduation:</span>
                <div class="font-medium">{{ formatDate(student.expected_graduation_date) }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Right column with tabs for different types of student data -->
        <div class="col-span-2">
          <TabView>
            <!-- Attendance Tab -->
            <TabPanel header="Attendance">
              <div v-if="attendanceLoading" class="p-4 flex justify-center">
                <ProgressSpinner style="width:30px;height:30px" strokeWidth="4" />
              </div>
              <div v-else>
                <div class="flex justify-between items-center mb-4">
                  <h3 class="text-lg font-medium">Attendance Record</h3>
                  <Dropdown 
                    v-model="attendancePeriod" 
                    :options="attendancePeriodOptions" 
                    optionLabel="label"
                    optionValue="value"
                    class="w-40"
                    @change="loadAttendance"
                  />
                </div>
                
                <div v-if="attendance.length === 0" class="p-4 text-center text-gray-500">
                  <p>No attendance records found</p>
                </div>
                <div v-else>
                  <DataTable :value="attendance" responsiveLayout="scroll" stripedRows class="p-datatable-sm">
                    <Column field="attendance_date" header="Date" sortable>
                      <template #body="{ data }">
                        {{ formatDate(data.attendance_date) }}
                      </template>
                    </Column>
                    <Column field="status" header="Status" sortable>
                      <template #body="{ data }">
                        <Tag 
                          :value="formatAttendanceStatus(data.status)" 
                          :severity="getAttendanceSeverity(data.status)"
                        />
                      </template>
                    </Column>
                    <Column field="clock_in" header="Clock In">
                      <template #body="{ data }">
                        {{ formatTime(data.clock_in) }}
                      </template>
                    </Column>
                    <Column field="clock_out" header="Clock Out">
                      <template #body="{ data }">
                        {{ formatTime(data.clock_out) }}
                      </template>
                    </Column>
                  </DataTable>
                </div>
              </div>
            </TabPanel>
            
            <!-- Assessments Tab -->
            <TabPanel header="Assessments">
              <div v-if="assessmentsLoading" class="p-4 flex justify-center">
                <ProgressSpinner style="width:30px;height:30px" strokeWidth="4" />
              </div>
              <div v-else>
                <div class="flex justify-between items-center mb-4">
                  <h3 class="text-lg font-medium">Assessment Results</h3>
                  <Button
                    icon="pi pi-plus"
                    label="Add"
                    severity="secondary"
                    size="small"
                    @click="$emit('add-assessment')"
                  />
                </div>
                
                <div v-if="assessments.length === 0" class="p-4 text-center text-gray-500">
                  <p>No assessment records found</p>
                </div>
                <div v-else>
                  <DataTable :value="assessments" responsiveLayout="scroll" stripedRows class="p-datatable-sm">
                    <Column field="assessment_date" header="Date" sortable>
                      <template #body="{ data }">
                        {{ formatDate(data.assessment_date) }}
                      </template>
                    </Column>
                    <Column field="assessment_type" header="Type" sortable />
                    <Column field="score" header="Score" sortable>
                      <template #body="{ data }">
                        <div class="flex items-center">
                          <div class="w-12 text-right font-medium">{{ data.score }}%</div>
                          <div class="flex-1 ml-2">
                            <div class="bg-gray-200 rounded-full h-2 w-full">
                              <div 
                                class="h-2 rounded-full" 
                                :class="getScoreColorClass(data.score)"
                                :style="`width: ${data.score}%`"
                              ></div>
                            </div>
                          </div>
                        </div>
                      </template>
                    </Column>
                    <Column field="comment" header="Comments">
                      <template #body="{ data }">
                        <div class="max-w-xs truncate">{{ data.comment || '-' }}</div>
                      </template>
                    </Column>
                  </DataTable>
                </div>
              </div>
            </TabPanel>
            
            <!-- Documents Tab -->
            <TabPanel header="Documents">
              <div v-if="documentsLoading" class="p-4 flex justify-center">
                <ProgressSpinner style="width:30px;height:30px" strokeWidth="4" />
              </div>
              <div v-else>
                <div class="flex justify-between items-center mb-4">
                  <h3 class="text-lg font-medium">Student Documents</h3>
                  <Button
                    icon="pi pi-upload"
                    label="Upload"
                    severity="secondary"
                    size="small"
                    @click="$emit('upload-document')"
                  />
                </div>
                
                <div v-if="documents.length === 0" class="p-4 text-center text-gray-500">
                  <p>No documents found</p>
                </div>
                <div v-else>
                  <DataTable :value="documents" responsiveLayout="scroll" stripedRows class="p-datatable-sm">
                    <Column field="document_name" header="Document" sortable>
                      <template #body="{ data }">
                        <div class="flex items-center">
                          <i class="pi pi-file mr-2 text-gray-500"></i>
                          <span>{{ data.document_name }}</span>
                        </div>
                      </template>
                    </Column>
                    <Column field="uploaded_at" header="Uploaded" sortable>
                      <template #body="{ data }">
                        {{ formatDate(data.uploaded_at) }}
                      </template>
                    </Column>
                    <Column field="expiration_date" header="Expires" sortable>
                      <template #body="{ data }">
                        <span :class="isExpired(data.expiration_date) ? 'text-red-600' : ''">
                          {{ formatDate(data.expiration_date) }}
                        </span>
                      </template>
                    </Column>
                    <Column header="Actions" :exportable="false">
                      <template #body="{ data }">
                        <div class="flex gap-2">
                          <Button
                            icon="pi pi-download"
                            rounded
                            text
                            @click="downloadDocument(data)"
                            aria-label="Download"
                          />
                          <Button
                            icon="pi pi-trash"
                            rounded
                            text
                            severity="danger"
                            @click="$emit('delete-document', data)"
                            aria-label="Delete"
                          />
                        </div>
                      </template>
                    </Column>
                  </DataTable>
                </div>
              </div>
            </TabPanel>
            
            <!-- Certifications Tab -->
            <TabPanel header="Certifications">
              <div v-if="certificationsLoading" class="p-4 flex justify-center">
                <ProgressSpinner style="width:30px;height:30px" strokeWidth="4" />
              </div>
              <div v-else>
                <div class="flex justify-between items-center mb-4">
                  <h3 class="text-lg font-medium">Student Certifications</h3>
                  <Button
                    icon="pi pi-plus"
                    label="Add"
                    severity="secondary"
                    size="small"
                    @click="$emit('add-certification')"
                  />
                </div>
                
                <div v-if="certifications.length === 0" class="p-4 text-center text-gray-500">
                  <p>No certifications found</p>
                </div>
                <div v-else>
                  <DataTable :value="certifications" responsiveLayout="scroll" stripedRows class="p-datatable-sm">
                    <Column field="certification_name" header="Certification" sortable />
                    <Column field="awarded_date" header="Awarded" sortable>
                      <template #body="{ data }">
                        {{ formatDate(data.awarded_date) }}
                      </template>
                    </Column>
                    <Column field="expiration_date" header="Expires" sortable>
                      <template #body="{ data }">
                        <span :class="isExpired(data.expiration_date) ? 'text-red-600' : ''">
                          {{ formatDate(data.expiration_date) }}
                        </span>
                      </template>
                    </Column>
                    <Column header="Actions" :exportable="false">
                      <template #body="{ data }">
                        <div class="flex gap-2">
                          <Button
                            icon="pi pi-pencil"
                            rounded
                            text
                            @click="$emit('edit-certification', data)"
                            aria-label="Edit"
                          />
                          <Button
                            icon="pi pi-trash"
                            rounded
                            text
                            severity="danger"
                            @click="$emit('delete-certification', data)"
                            aria-label="Delete"
                          />
                        </div>
                      </template>
                    </Column>
                  </DataTable>
                </div>
              </div>
            </TabPanel>
          </TabView>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Edit"
          icon="pi pi-pencil"
          @click="$emit('edit-student', student)"
          :disabled="loading || !student.id"
          severity="secondary"
        />
        <Button
          label="Close"
          icon="pi pi-times"
          @click="$emit('update:visible', false)"
          :disabled="loading"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Dropdown from 'primevue/dropdown';
import type { Tables } from '~/types/supabase';

type Student = Tables<'students'>;
type Attendance = Tables<'attendance'>;
type Assessment = Tables<'assessments'>;
type Document = Tables<'student_documents'>;
type Certification = Tables<'student_certifications'>;

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  student: {
    type: Object as () => Student,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits([
  'update:visible',
  'edit-student',
  'add-assessment',
  'edit-assessment',
  'delete-assessment',
  'upload-document',
  'delete-document',
  'add-certification',
  'edit-certification',
  'delete-certification'
]);

const toast = useToast();

// State for attendance tab
const attendance = ref<Attendance[]>([]);
const attendancePeriodOptions = [
  { label: 'Last 30 days', value: '30days' },
  { label: 'This month', value: 'month' },
  { label: 'This semester', value: 'semester' },
  { label: 'All', value: 'all' }
];
const attendancePeriod = ref('30days');
const attendanceLoading = ref(false);

// State for assessments tab
const assessments = ref<Assessment[]>([]);
const assessmentsLoading = ref(false);

// State for documents tab
const documents = ref<Document[]>([]);
const documentsLoading = ref(false);

// State for certifications tab
const certifications = ref<Certification[]>([]);
const certificationsLoading = ref(false);

// Watch for student changes and load related data
watch(() => props.visible, (isVisible) => {
  if (isVisible && props.student?.id) {
    loadAttendance();
    loadAssessments();
    loadDocuments();
    loadCertifications();
  }
});

watch(() => props.student, (newStudent) => {
  if (newStudent?.id && props.visible) {
    loadAttendance();
    loadAssessments();
    loadDocuments();
    loadCertifications();
  }
});

// Methods to load related data
async function loadAttendance() {
  if (!props.student?.id) return;
  
  attendanceLoading.value = true;
  try {
    const response = await $fetch(`/api/students/${props.student.id}/attendance`, {
      params: { period: attendancePeriod.value }
    });
    attendance.value = response.data || [];
  } catch (error) {
    console.error('Failed to load attendance:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load attendance records',
      life: 3000
    });
  } finally {
    attendanceLoading.value = false;
  }
}

async function loadAssessments() {
  if (!props.student?.id) return;
  
  assessmentsLoading.value = true;
  try {
    const response = await $fetch(`/api/students/${props.student.id}/assessments`);
    assessments.value = response.data || [];
  } catch (error) {
    console.error('Failed to load assessments:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load assessment records',
      life: 3000
    });
  } finally {
    assessmentsLoading.value = false;
  }
}

async function loadDocuments() {
  if (!props.student?.id) return;
  
  documentsLoading.value = true;
  try {
    const response = await $fetch(`/api/students/${props.student.id}/documents`);
    documents.value = response.data || [];
  } catch (error) {
    console.error('Failed to load documents:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load student documents',
      life: 3000
    });
  } finally {
    documentsLoading.value = false;
  }
}

async function loadCertifications() {
  if (!props.student?.id) return;
  
  certificationsLoading.value = true;
  try {
    const response = await $fetch(`/api/students/${props.student.id}/certifications`);
    certifications.value = response.data || [];
  } catch (error) {
    console.error('Failed to load certifications:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load student certifications',
      life: 3000
    });
  } finally {
    certificationsLoading.value = false;
  }
}

// Helper functions
function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(dateString));
}

function formatTime(timeString: string | null): string {
  if (!timeString) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(new Date(timeString));
}

function formatStatus(status: string | null): string {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

function formatAttendanceStatus(status: string | null): string {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusSeverity(status: string | null): string {
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
}

function getAttendanceSeverity(status: string | null): string {
  if (!status) return 'secondary';
  
  switch (status.toLowerCase()) {
    case 'present':
      return 'success';
    case 'late':
      return 'warning';
    case 'absent':
      return 'danger';
    case 'excused':
      return 'info';
    default:
      return 'secondary';
  }
}

function getScoreColorClass(score: number): string {
  if (score >= 90) return 'bg-green-500';
  if (score >= 80) return 'bg-green-400';
  if (score >= 70) return 'bg-yellow-400';
  if (score >= 60) return 'bg-orange-400';
  return 'bg-red-500';
}

function isExpired(dateString: string | null): boolean {
  if (!dateString) return false;
  const expirationDate = new Date(dateString);
  return expirationDate < new Date();
}

async function downloadDocument(document: Document) {
  if (!document.file_url) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Document file not available',
      life: 3000
    });
    return;
  }
  
  try {
    window.open(document.file_url, '_blank');
  } catch (error) {
    console.error('Failed to download document:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to download document',
      life: 3000
    });
  }
}
</script>