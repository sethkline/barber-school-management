<template>
  <div>
    <form @submit.prevent="scheduleReport" class="space-y-6">
      <!-- Report Template Selection -->
      <div v-if="!reportTemplate">
        <label for="report-template" class="block text-sm font-medium text-gray-700 mb-1">
          Report Template*
        </label>
        <Dropdown
          id="report-template"
          v-model="selectedTemplate"
          :options="reportTemplates"
          optionLabel="name"
          optionValue="id"
          placeholder="Select a report template"
          class="w-full"
          :class="{'p-invalid': submitted && !selectedTemplate}"
        />
        <small v-if="submitted && !selectedTemplate" class="p-error">
          Report template is required
        </small>
      </div>
      
      <!-- Schedule Name -->
      <div>
        <label for="schedule-name" class="block text-sm font-medium text-gray-700 mb-1">
          Schedule Name*
        </label>
        <InputText
          id="schedule-name"
          v-model="scheduleName"
          placeholder="Enter schedule name"
          class="w-full"
          :class="{'p-invalid': submitted && !scheduleName}"
        />
        <small v-if="submitted && !scheduleName" class="p-error">
          Schedule name is required
        </small>
      </div>
      
      <!-- Frequency -->
      <div>
        <label for="frequency" class="block text-sm font-medium text-gray-700 mb-1">
          Frequency*
        </label>
        <Dropdown
          id="frequency"
          v-model="frequency"
          :options="frequencyOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select frequency"
          class="w-full"
          :class="{'p-invalid': submitted && !frequency}"
        />
        <small v-if="submitted && !frequency" class="p-error">
          Frequency is required
        </small>
      </div>
      
      <!-- Day Selection for Weekly -->
      <div v-if="frequency === 'weekly'">
        <label for="day-of-week" class="block text-sm font-medium text-gray-700 mb-1">
          Day of Week*
        </label>
        <Dropdown
          id="day-of-week"
          v-model="dayOfWeek"
          :options="daysOfWeek"
          optionLabel="label"
          optionValue="value"
          placeholder="Select day"
          class="w-full"
          :class="{'p-invalid': submitted && frequency === 'weekly' && !dayOfWeek}"
        />
        <small v-if="submitted && frequency === 'weekly' && !dayOfWeek" class="p-error">
          Day of week is required
        </small>
      </div>
      
      <!-- Day Selection for Monthly -->
      <div v-if="frequency === 'monthly'">
        <label for="day-of-month" class="block text-sm font-medium text-gray-700 mb-1">
          Day of Month*
        </label>
        <Dropdown
          id="day-of-month"
          v-model="dayOfMonth"
          :options="daysOfMonth"
          optionLabel="label"
          optionValue="value"
          placeholder="Select day"
          class="w-full"
          :class="{'p-invalid': submitted && frequency === 'monthly' && !dayOfMonth}"
        />
        <small v-if="submitted && frequency === 'monthly' && !dayOfMonth" class="p-error">
          Day of month is required
        </small>
      </div>
      
      <!-- Time -->
      <div>
        <label for="time" class="block text-sm font-medium text-gray-700 mb-1">
          Time*
        </label>
        <Calendar
          id="time"
          v-model="scheduleTime"
          timeOnly
          placeholder="Select time"
          class="w-full"
          :class="{'p-invalid': submitted && !scheduleTime}"
        />
        <small v-if="submitted && !scheduleTime" class="p-error">
          Time is required
        </small>
      </div>
      
      <!-- Date Range (Optional) -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Date Range (Optional)
        </label>
        <div class="flex space-x-2">
          <Calendar
            v-model="startDate"
            placeholder="Start date"
            class="w-full"
            dateFormat="mm/dd/yy"
            :showIcon="true"
          />
          <Calendar
            v-model="endDate"
            placeholder="End date"
            class="w-full"
            dateFormat="mm/dd/yy"
            :showIcon="true"
          />
        </div>
      </div>
      
      <!-- Report Format -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Report Format*
        </label>
        <div class="flex space-x-4">
          <div class="flex items-center">
            <RadioButton
              id="format-pdf"
              v-model="reportFormat"
              value="pdf"
              :binary="false"
            />
            <label for="format-pdf" class="ml-2 text-sm text-gray-600">
              PDF
            </label>
          </div>
          <div class="flex items-center">
            <RadioButton
              id="format-excel"
              v-model="reportFormat"
              value="excel"
              :binary="false"
            />
            <label for="format-excel" class="ml-2 text-sm text-gray-600">
              Excel
            </label>
          </div>
          <div class="flex items-center">
            <RadioButton
              id="format-csv"
              v-model="reportFormat"
              value="csv"
              :binary="false"
            />
            <label for="format-csv" class="ml-2 text-sm text-gray-600">
              CSV
            </label>
          </div>
        </div>
      </div>
      
      <!-- Recipients -->
      <div>
        <div class="flex justify-between items-center mb-1">
          <label class="block text-sm font-medium text-gray-700">
            Recipients*
          </label>
          <Button
            type="button"
            icon="pi pi-plus"
            label="Add Recipient"
            severity="secondary"
            text
            size="small"
            @click="addRecipient"
          />
        </div>
        
        <div v-for="(recipient, index) in recipients" :key="index" class="mb-2">
          <div class="flex items-center space-x-2">
            <InputText
              v-model="recipient.email"
              placeholder="Email address"
              class="w-full"
              :class="{'p-invalid': submitted && !isValidEmail(recipient.email)}"
            />
            <Button
              type="button"
              icon="pi pi-times"
              severity="danger"
              text
              rounded
              aria-label="Remove"
              @click="removeRecipient(index)"
            />
          </div>
          <small v-if="submitted && !isValidEmail(recipient.email)" class="p-error">
            Please enter a valid email address
          </small>
        </div>
        
        <small v-if="submitted && recipients.length === 0" class="p-error">
          At least one recipient is required
        </small>
      </div>
      
      <!-- Notes -->
      <div>
        <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">
          Notes (Optional)
        </label>
        <Textarea
          id="notes"
          v-model="notes"
          rows="3"
          placeholder="Add any additional notes"
          class="w-full"
        />
      </div>
      
      <!-- Action Buttons -->
      <div class="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          label="Cancel"
          severity="secondary"
          text
          @click="$emit('cancel')"
          :disabled="scheduling"
        />
        <Button
          type="submit"
          label="Schedule Report"
          icon="pi pi-clock"
          :loading="scheduling"
        />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import Button from 'primevue/button';
import RadioButton from 'primevue/radiobutton';
import Textarea from 'primevue/textarea';

const props = defineProps({
  reportTemplate: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['schedule-created', 'cancel']);

// Form state
const selectedTemplate = ref(props.reportTemplate ? props.reportTemplate.id : '');
const scheduleName = ref(props.reportTemplate ? `${props.reportTemplate.name} Schedule` : '');
const frequency = ref('weekly');
const dayOfWeek = ref('monday');
const dayOfMonth = ref('1');
const scheduleTime = ref(new Date(new Date().setHours(8, 0, 0)));
const startDate = ref(null);
const endDate = ref(null);
const reportFormat = ref('pdf');
const recipients = ref([{ email: '' }]);
const notes = ref('');
const submitted = ref(false);
const scheduling = ref(false);

// Frequency options
const frequencyOptions = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' }
];

// Days of week options
const daysOfWeek = [
  { label: 'Monday', value: 'monday' },
  { label: 'Tuesday', value: 'tuesday' },
  { label: 'Wednesday', value: 'wednesday' },
  { label: 'Thursday', value: 'thursday' },
  { label: 'Friday', value: 'friday' },
  { label: 'Saturday', value: 'saturday' },
  { label: 'Sunday', value: 'sunday' }
];

// Days of month options
const daysOfMonth = Array.from({ length: 31 }, (_, i) => {
  const day = i + 1;
  return { label: day.toString(), value: day.toString() };
});

// Report templates
const reportTemplates = ref([
  { name: 'Student Progress Report', id: 'student-progress', icon: 'pi pi-chart-line' },
  { name: 'Enrollment Trends', id: 'enrollment-trends', icon: 'pi pi-users' },
  { name: 'Financial Summary', id: 'financial-summary', icon: 'pi pi-dollar' },
  { name: 'Attendance Compliance', id: 'attendance-compliance', icon: 'pi pi-check-circle' },
  { name: 'Lead Conversion Analysis', id: 'lead-conversion', icon: 'pi pi-percentage' },
  { name: 'Certification Status', id: 'certification-status', icon: 'pi pi-verified' }
]);

// Initialize with template if provided
onMounted(() => {
  if (props.reportTemplate) {
    selectedTemplate.value = props.reportTemplate.id;
  }
});

// Add a new recipient
function addRecipient() {
  recipients.value.push({ email: '' });
}

// Remove a recipient
function removeRecipient(index) {
  recipients.value.splice(index, 1);
}

// Validate email format
function isValidEmail(email) {
  const regex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
  return email && regex.test(email);
}

// Check if all emails are valid
const areEmailsValid = computed(() => {
  return recipients.value.length > 0 && recipients.value.every(r => isValidEmail(r.email));
});

// Format the frequency display
function formatFrequency() {
  if (frequency.value === 'daily') {
    return 'Daily';
  } else if (frequency.value === 'weekly') {
    const day = daysOfWeek.find(d => d.value === dayOfWeek.value)?.label || '';
    return `Weekly (${day})`;
  } else if (frequency.value === 'monthly') {
    return `Monthly (Day ${dayOfMonth.value})`;
  } else if (frequency.value === 'quarterly') {
    return 'Quarterly';
  }
  return frequency.value;
}

// Schedule the report
function scheduleReport() {
  submitted.value = true;
  
  // Form validation
  const templateValid = props.reportTemplate || selectedTemplate.value;
  const frequencyDetailsValid = 
    (frequency.value !== 'weekly' || dayOfWeek.value) && 
    (frequency.value !== 'monthly' || dayOfMonth.value);
  
  if (!templateValid || !scheduleName.value || !frequency.value || !frequencyDetailsValid || 
      !scheduleTime.value || !areEmailsValid.value) {
    return;
  }
  
  // Start scheduling process
  scheduling.value = true;
  
  // Calculate next run date
  const nextRun = calculateNextRunDate();
  
  // Simulate API call delay
  setTimeout(() => {
    // Create schedule object
    const schedule = {
      id: 'sch-' + Math.random().toString(36).substr(2, 5),
      name: scheduleName.value,
      reportTemplateId: props.reportTemplate ? props.reportTemplate.id : selectedTemplate.value,
      frequency: formatFrequency(),
      rawFrequency: {
        type: frequency.value,
        dayOfWeek: dayOfWeek.value,
        dayOfMonth: dayOfMonth.value
      },
      time: scheduleTime.value,
      startDate: startDate.value,
      endDate: endDate.value,
      format: reportFormat.value,
      recipients: recipients.value.map(r => r.email),
      notes: notes.value,
      nextRun: nextRun.toISOString(),
      createdAt: new Date().toISOString()
    };
    
    // End scheduling process
    scheduling.value = false;
    
    // Emit the schedule created event
    emit('schedule-created', schedule);
  }, 1500);
}

// Calculate the next run date based on frequency settings
function calculateNextRunDate() {
  const now = new Date();
  const targetTime = new Date(scheduleTime.value);
  const hours = targetTime.getHours();
  const minutes = targetTime.getMinutes();
  
  let nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);
  
  // If the time is already past for today, start from tomorrow
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }
  
  if (frequency.value === 'weekly') {
    // Map day strings to numbers (0 = Sunday, 1 = Monday, etc.)
    const dayMap = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 
      'thursday': 4, 'friday': 5, 'saturday': 6
    };
    
    const targetDay = dayMap[dayOfWeek.value];
    const currentDay = nextRun.getDay();
    
    // Calculate days to add to get to the target day
    let daysToAdd = (targetDay - currentDay + 7) % 7;
    if (daysToAdd === 0 && nextRun <= now) {
      daysToAdd = 7; // If today is the target day but time has passed, go to next week
    }
    
    nextRun.setDate(nextRun.getDate() + daysToAdd);
  } else if (frequency.value === 'monthly') {
    const targetDay = parseInt(dayOfMonth.value);
    
    // Set to the target day of the current month
    nextRun.setDate(targetDay);
    
    // If this date is in the past, move to next month
    if (nextRun <= now) {
      nextRun.setMonth(nextRun.getMonth() + 1);
    }
    
    // Handle edge cases like Feb 30 by rolling over to the next month
    while (nextRun.getDate() !== targetDay) {
      // The date rolled over, set to the 1st of the next month
      nextRun = new Date(nextRun.getFullYear(), nextRun.getMonth() + 1, 1);
      nextRun.setHours(hours, minutes, 0, 0);
    }
  } else if (frequency.value === 'quarterly') {
    // Set to the 1st day of the next quarter
    const currentMonth = now.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3);
    const nextQuarterMonth = (currentQuarter + 1) * 3 % 12;
    
    nextRun = new Date(now.getFullYear(), nextQuarterMonth, 1);
    if (nextRun <= now) {
      // If the next quarter start is in the past, add a year
      nextRun.setFullYear(nextRun.getFullYear() + 1);
    }
    nextRun.setHours(hours, minutes, 0, 0);
  }
  
  return nextRun;
}
</script>