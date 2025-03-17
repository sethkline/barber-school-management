<template>
  <Dialog
    :visible="visible"
    :style="{ width: '450px' }"
    :header="isEditing ? 'Edit Hours Record' : 'Add New Hours'"
    :modal="true"
    :closable="!loading"
    @update:visible="$emit('update:visible', $event)"
  >
    <div v-if="loading" class="flex justify-center items-center p-4">
      <ProgressSpinner style="width:50px;height:50px" strokeWidth="4" />
    </div>
    <div v-else class="p-4">
      <form @submit.prevent="submitForm" class="space-y-4">
        <!-- Date -->
        <div class="field">
          <label for="date_recorded" class="block text-sm font-medium text-gray-700 mb-1">
            Date*
          </label>
          <Calendar
            v-model="form.date_recorded"
            dateFormat="mm/dd/yy"
            :maxDate="maxDate"
            :showIcon="true"
            inputId="date_recorded"
            class="w-full"
            :class="{ 'p-invalid': submitted && !form.date_recorded }"
          />
          <small class="p-error" v-if="submitted && !form.date_recorded">
            Date is required
          </small>
        </div>

        <!-- Hours Completed -->
        <div class="field">
          <label for="hours_completed" class="block text-sm font-medium text-gray-700 mb-1">
            Hours Completed*
          </label>
          <div class="p-inputgroup">
            <InputNumber
              v-model="form.hours_completed"
              inputId="hours_completed"
              :min="0.5"
              :max="24"
              :step="0.5"
              placeholder="Enter hours"
              :class="{ 'p-invalid': submitted && (!form.hours_completed || form.hours_completed <= 0) }"
              class="w-full"
            />
            <span class="p-inputgroup-addon">hours</span>
          </div>
          <small class="p-error" v-if="submitted && (!form.hours_completed || form.hours_completed <= 0)">
            Hours must be greater than 0
          </small>
        </div>

        <!-- Student Selection (only show if no studentId is provided) -->
        <div v-if="!studentId" class="field">
          <label for="student_id" class="block text-sm font-medium text-gray-700 mb-1">
            Student*
          </label>
          <Dropdown
            v-model="form.student_id"
            :options="students"
            optionLabel="label"
            optionValue="value"
            placeholder="Select a student"
            class="w-full"
            :class="{ 'p-invalid': submitted && !form.student_id }"
            inputId="student_id"
            :loading="studentsLoading"
            :filter="true"
          />
          <small class="p-error" v-if="submitted && !form.student_id">
            Student selection is required
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
          label="Save"
          icon="pi pi-check"
          @click="submitForm"
          :loading="loading"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import InputNumber from 'primevue/inputnumber';
import Dropdown from 'primevue/dropdown';
import ProgressSpinner from 'primevue/progressspinner';
import type { HoursRecord } from '~/composables/useHours';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  hoursData: {
    type: Object as () => Partial<HoursRecord>,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  },
  studentId: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:visible', 'save']);

// Form state
const submitted = ref(false);
const form = reactive({
  student_id: props.studentId || props.hoursData?.student_id || '',
  date_recorded: props.hoursData?.date_recorded ? new Date(props.hoursData.date_recorded) : new Date(),
  hours_completed: props.hoursData?.hours_completed || 1
});

// Student selection - will load students if needed
const students = ref<{ label: string; value: string }[]>([]);
const studentsLoading = ref(false);

// Determine if we're editing or creating
const isEditing = computed(() => !!props.hoursData?.id);

// Max date (can't record hours in the future)
const maxDate = computed(() => new Date());

// Load students for dropdown if needed
onMounted(async () => {
  if (!props.studentId) {
    await loadStudents();
  }
});

// Function to load students for dropdown
async function loadStudents() {
  studentsLoading.value = true;
  try {
    // Fetch students for dropdown
    const response = await fetch('/api/students?limit=1000&active=true');
    
    if (!response.ok) {
      throw new Error('Failed to load students');
    }
    
    const data = await response.json();
    
    // Transform to dropdown format
    students.value = data.data.map((student: any) => ({
      label: `${student.first_name} ${student.last_name}`,
      value: student.id
    }));
  } catch (error) {
    console.error('Error loading students:', error);
  } finally {
    studentsLoading.value = false;
  }
}

// Form submission handler
function submitForm() {
  submitted.value = true;
  
  // Validate form
  if (!form.date_recorded) {
    return;
  }
  
  if (!form.hours_completed || form.hours_completed <= 0) {
    return;
  }
  
  if (!props.studentId && !form.student_id) {
    return;
  }
  
  // Format data for API submission
  const formattedData = {
    ...(isEditing.value ? { id: props.hoursData.id } : {}),
    student_id: props.studentId || form.student_id,
    date_recorded: form.date_recorded instanceof Date 
      ? form.date_recorded.toISOString().split('T')[0] 
      : form.date_recorded,
    hours_completed: form.hours_completed
  };
  
  // Emit save event with formatted data
  emit('save', formattedData);
}
</script>