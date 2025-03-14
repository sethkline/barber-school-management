<template>
  <div>
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center p-4">
      <ProgressSpinner style="width:50px;height:50px" strokeWidth="4" />
    </div>

    <!-- Student not found -->
    <div v-else-if="!student.id" class="p-4 text-center text-gray-500">
      <pre>{{ student || 'No student found' }}</pre>
      <i class="pi pi-exclamation-circle text-3xl mb-2"></i>
      <p>Student not found</p>
    </div>

    <!-- Student details content -->
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

            <!-- Quick Action Button for Email -->
            <div class="w-full mt-4">
              <Button
                icon="pi pi-envelope"
                label="Send Email"
                class="w-full"
                severity="secondary"
                @click="showSendEmailModal = true"
              />
            </div>
          </div>
        </div>
        
        <!-- Right column with tabs -->
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
            
            <!-- Communications Tab (New) -->
            <TabPanel header="Communications">
              <div v-if="communicationsLoading" class="p-4 flex justify-center">
                <ProgressSpinner style="width:30px;height:30px" strokeWidth="4" />
              </div>
              <div v-else>
                <div class="flex justify-between items-center mb-4">
                  <h3 class="text-lg font-medium">Communication History</h3>
                  <Button
                    icon="pi pi-envelope"
                    label="New Email"
                    severity="secondary"
                    size="small"
                    @click="showSendEmailModal = true"
                  />
                </div>
                <div v-if="communications.length === 0" class="p-4 text-center text-gray-500">
                  <p>No communication records found</p>
                </div>
                <div v-else>
                  <DataTable :value="communications" responsiveLayout="scroll" stripedRows class="p-datatable-sm">
                    <Column field="sent_at" header="Date" sortable>
                      <template #body="{ data }">
                        {{ formatDate(data.sent_at) }}
                      </template>
                    </Column>
                    <Column field="type" header="Type" sortable>
                      <template #body="{ data }">
                        <Tag 
                          :value="formatCommunicationType(data.type)" 
                          :severity="getCommunicationTypeSeverity(data.type)"
                        />
                      </template>
                    </Column>
                    <Column field="subject" header="Subject">
                      <template #body="{ data }">
                        <div class="max-w-xs truncate font-medium">{{ data.subject || '(No subject)' }}</div>
                      </template>
                    </Column>
                    <Column header="Actions" style="width: 100px">
                      <template #body="{ data }">
                        <Button
                          icon="pi pi-eye"
                          text
                          rounded
                          @click="viewCommunication(data)"
                          aria-label="View"
                        />
                      </template>
                    </Column>
                  </DataTable>
                </div>
              </div>
            </TabPanel>
            
            <!-- Additional Tabs (Documents, Certifications, etc.) go here -->
            <!-- … -->
          </TabView>
        </div>
      </div>
    </div>

    <!-- Optional footer actions -->
    <div v-if="showFooter" class="flex justify-end gap-2 mt-4">
      <Button
        label="Edit"
        icon="pi pi-pencil"
        @click="editStudent"
        :disabled="loading || !student.id"
        severity="secondary"
      />
      <Button
        label="Close"
        icon="pi pi-times"
        @click="close"
        :disabled="loading"
      />
    </div>

    <!-- Send Email Modal -->
    <Dialog 
      v-model:visible="showSendEmailModal" 
      header="Send Email to Student" 
      :modal="true"
      :closable="true"
      :style="{ width: '500px' }"
    >
      <SendEmailForm 
        :recipient-email="student.email"
        recipient-type="student"
        :recipient-id="student.id"
        :variables="studentVariables"
        @sent="onEmailSent"
      />
    </Dialog>

    <!-- View Communication Dialog -->
    <Dialog 
      v-model:visible="showViewCommunicationDialog" 
      :header="selectedCommunication?.subject || 'Communication Details'" 
      :modal="true"
      :closable="true"
      :style="{ width: '600px' }"
    >
      <div v-if="selectedCommunication" class="space-y-4">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm text-gray-600">To: {{ selectedCommunication.to_email }}</p>
            <p class="text-sm text-gray-600">
              Sent: {{ formatDateTime(selectedCommunication.sent_at) }}
            </p>
            <p class="text-sm text-gray-600">
              Type: {{ formatCommunicationType(selectedCommunication.type) }}
            </p>
          </div>
        </div>
        
        <div class="border-t border-b py-4">
          <div v-html="selectedCommunication.body" class="prose max-w-none"></div>
        </div>
        
        <div class="flex justify-end">
          <Button 
            icon="pi pi-envelope" 
            label="Reply" 
            @click="replyToCommunication" 
            class="mr-2"
          />
          <Button 
            icon="pi pi-times" 
            label="Close" 
            severity="secondary"
            @click="showViewCommunicationDialog = false"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import ProgressSpinner from 'primevue/progressspinner';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import SendEmailForm from '~/components/communications/SendEmailForm.vue';
import { generateStudentVariables } from '~/utils/emailUtils';

// Props – note we removed modal-related props like "visible"
const props = defineProps({
  student: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  },
  // Use this prop to optionally hide footer actions when used on a full page
  showFooter: {
    type: Boolean,
    default: true
  }
});

// Emit events that the wrapper might use
const emit = defineEmits([
  'edit-student',
  'close',
  'add-assessment',
  'refresh-communications'
  // add other events as needed...
]);

const toast = useToast();

// Local state for tabs (you may want to extract this logic into a composable for reuse)
const attendance = ref([]);
const attendancePeriodOptions = [
  { label: 'Last 30 days', value: '30days' },
  { label: 'This month', value: 'month' },
  { label: 'This semester', value: 'semester' },
  { label: 'All', value: 'all' }
];
const attendancePeriod = ref('30days');
const attendanceLoading = ref(false);

const assessments = ref([]);
const assessmentsLoading = ref(false);

// Communications related state
const communications = ref([]);
const communicationsLoading = ref(false);
const showSendEmailModal = ref(false);
const showViewCommunicationDialog = ref(false);
const selectedCommunication = ref(null);

// Computed values for student variables
const studentVariables = computed(() => {
  if (!props.student || !props.student.id) return {};
  return generateStudentVariables(props.student);
});

// Watchers to load data when the student changes
watch(
  () => props.student,
  (newStudent) => {
    if (newStudent?.id) {
      loadAttendance();
      loadAssessments();
      loadCommunications();
      // load other data as needed...
    }
  },
  { immediate: true }
);

// Methods to load data (simplified example)
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

// Load communications history
async function loadCommunications() {
  if (!props.student?.id) return;
  communicationsLoading.value = true;
  try {
    const response = await $fetch('/api/communications/history', {
      params: { studentId: props.student.id }
    });
    communications.value = response.data || [];
  } catch (error) {
    console.error('Failed to load communications:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load communication history',
      life: 3000
    });
  } finally {
    communicationsLoading.value = false;
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

function formatDateTime(dateString: string | null): string {
  if (!dateString) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(new Date(dateString));
}

function formatStatus(status: string | null): string {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

function formatAttendanceStatus(status: string | null): string {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatCommunicationType(type: string | null): string {
  if (!type) return 'Unknown';
  return type.charAt(0).toUpperCase() + type.slice(1);
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

function getCommunicationTypeSeverity(type: string | null): string {
  if (!type) return 'secondary';
  switch (type.toLowerCase()) {
    case 'email':
      return 'info';
    case 'sms':
      return 'success';
    case 'system':
      return 'warning';
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

// Event handlers for footer actions
function editStudent() {
  emit('edit-student', props.student);
}

function close() {
  emit('close');
}

// Communication-related functions
function viewCommunication(communication) {
  selectedCommunication.value = communication;
  showViewCommunicationDialog.value = true;
}

function replyToCommunication() {
  showViewCommunicationDialog.value = false;
  showSendEmailModal.value = true;
}

function onEmailSent() {
  showSendEmailModal.value = false;
  showViewCommunicationDialog.value = false;
  
  toast.add({
    severity: 'success',
    summary: 'Email Sent',
    detail: 'Email has been sent successfully.',
    life: 3000
  });
  
  // Refresh communications list
  loadCommunications();
  
  // Notify parent component
  emit('refresh-communications');
}
</script>