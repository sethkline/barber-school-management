<template>
  <form @submit.prevent="submitForm" class="p-fluid">
    <div class="field mb-4">
      <label for="event-title" class="block text-sm font-medium text-gray-700 mb-1">Title*</label>
      <InputText 
        id="event-title" 
        v-model="form.title" 
        :class="{ 'p-invalid': errors.title }"
        placeholder="Event title"
        class="w-full"
        :disabled="loading"
        required
      />
      <small v-if="errors.title" class="text-primary-600 dark:text-primary-400">
        {{ errors.title }}
      </small>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div class="field">
        <label for="event-start" class="block text-sm font-medium text-gray-700 mb-1">Start Date & Time*</label>
        <Calendar 
          id="event-start" 
          v-model="form.start" 
          :showTime="true" 
          :showIcon="true"
          :class="{ 'p-invalid': errors.start }"
          dateFormat="mm/dd/yy"
          class="w-full"
          :disabled="loading"
          required
        />
        <small v-if="errors.start" class="text-primary-600 dark:text-primary-400">
          {{ errors.start }}
        </small>
      </div>

      <div class="field">
        <label for="event-end" class="block text-sm font-medium text-gray-700 mb-1">End Date & Time*</label>
        <Calendar 
          id="event-end" 
          v-model="form.end" 
          :showTime="true" 
          :showIcon="true"
          :class="{ 'p-invalid': errors.end }"
          dateFormat="mm/dd/yy"
          class="w-full"
          :disabled="loading"
          required
        />
        <small v-if="errors.end" class="text-primary-600 dark:text-primary-400">
          {{ errors.end }}
        </small>
      </div>
    </div>

    <div class="field mb-4">
      <div class="flex items-center">
        <Checkbox 
          id="event-all-day" 
          v-model="form.allDay" 
          :binary="true"
          :disabled="loading"
        />
        <label for="event-all-day" class="ml-2 text-sm text-gray-700">All day event</label>
      </div>
    </div>

    <div class="field mb-4">
      <label for="event-category" class="block text-sm font-medium text-gray-700 mb-1">Category*</label>
      <Dropdown 
        id="event-category" 
        v-model="form.categoryId" 
        :options="categories" 
        optionLabel="name" 
        optionValue="id"
        :class="{ 'p-invalid': errors.categoryId }"
        placeholder="Select a category"
        class="w-full"
        :disabled="loading"
        required
      >
        <template #value="slotProps">
          <div v-if="slotProps.value" class="flex items-center">
            <span 
              class="inline-block w-3 h-3 rounded-full mr-2" 
              :style="{ backgroundColor: getCategoryColor(slotProps.value) }"
            ></span>
            {{ getCategoryName(slotProps.value) }}
          </div>
          <span v-else>Select a category</span>
        </template>
        <template #option="slotProps">
          <div class="flex items-center">
            <span 
              class="inline-block w-3 h-3 rounded-full mr-2" 
              :style="{ backgroundColor: slotProps.option.color }"
            ></span>
            {{ slotProps.option.name }}
          </div>
        </template>
      </Dropdown>
      <small v-if="errors.categoryId" class="text-primary-600 dark:text-primary-400">
        {{ errors.categoryId }}
      </small>
    </div>

    <div class="field mb-4">
      <label for="event-location" class="block text-sm font-medium text-gray-700 mb-1">Location</label>
      <InputText 
        id="event-location" 
        v-model="form.location" 
        placeholder="Event location (optional)"
        class="w-full"
        :disabled="loading"
      />
    </div>

    <div class="field mb-4">
      <label for="event-description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
      <Textarea 
        id="event-description" 
        v-model="form.description" 
        rows="3" 
        placeholder="Event description (optional)"
        autoResize
        class="w-full"
        :disabled="loading"
      />
    </div>

    <div v-if="showRelatedFields && relatedOptions && relatedOptions.length > 0" class="field mb-4">
      <label for="event-related" class="block text-sm font-medium text-gray-700 mb-1">Related To</label>
      <Dropdown 
        id="event-related" 
        v-model="form.relatedId" 
        :options="relatedOptions" 
        optionLabel="name" 
        optionValue="id"
        placeholder="Select related entity (optional)"
        class="w-full"
        :disabled="loading"
      />
    </div>

    <div class="field mb-4">
      <div class="flex items-center">
        <Checkbox 
          id="event-recurring" 
          v-model="form.isRecurring" 
          :binary="true"
          :disabled="loading"
        />
        <label for="event-recurring" class="ml-2 text-sm text-gray-700">Make this a recurring event</label>
      </div>
    </div>

    <div v-if="form.isRecurring" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div class="field">
        <label for="event-frequency" class="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
        <Dropdown 
          id="event-frequency" 
          v-model="form.recurrenceFrequency" 
          :options="recurrenceOptions" 
          optionLabel="label" 
          optionValue="value"
          placeholder="Select frequency"
          class="w-full"
          :disabled="loading"
        />
      </div>

      <div class="field">
        <label for="event-until" class="block text-sm font-medium text-gray-700 mb-1">Until</label>
        <Calendar 
          id="event-until" 
          v-model="form.recurrenceUntil" 
          :showIcon="true"
          dateFormat="mm/dd/yy"
          :minDate="form.start"
          placeholder="End date (optional)"
          class="w-full"
          :disabled="loading"
        />
      </div>
    </div>

    <div class="flex justify-end gap-2 mt-6">
      <Button 
        type="button" 
        label="Cancel" 
        icon="pi pi-times" 
        text 
        @click="$emit('cancel')"
        :disabled="loading"
      />
      <Button 
        type="submit" 
        label="Save" 
        icon="pi pi-check" 
        :loading="loading"
        class="custom-button"
      />
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Checkbox from 'primevue/checkbox';
import Dropdown from 'primevue/dropdown';
import useCalendar from '~/composables/useCalendar';

interface EventFormProps {
  event?: any;
  loading?: boolean;
  showRelatedFields?: boolean;
  relatedType?: string;
  relatedOptions?: Array<{ id: string; name: string }>;
  defaultStart?: Date;
  defaultEnd?: Date;
}

const props = withDefaults(defineProps<EventFormProps>(), {
  event: null,
  loading: false,
  showRelatedFields: true,
  relatedType: undefined,
  relatedOptions: () => [],
  defaultStart: undefined,
  defaultEnd: undefined
});

const emit = defineEmits(['save', 'cancel']);
const toast = useToast();

const { categories } = useCalendar();

// Initial form state
const initialForm = {
  id: null,
  title: '',
  start: props.defaultStart || new Date(),
  end: props.defaultEnd || new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hour later
  allDay: false,
  categoryId: '',
  location: '',
  description: '',
  relatedId: null,
  relatedType: props.relatedType || null,
  isRecurring: false,
  recurrenceFrequency: 'weekly',
  recurrenceUntil: null
};

// Form state
const form = reactive({ ...initialForm });

// Error state
const errors = reactive({
  title: '',
  start: '',
  end: '',
  categoryId: ''
});

// Fill form with event data if provided
if (props.event) {
  form.id = props.event.id;
  form.title = props.event.title;
  form.start = props.event.start ? new Date(props.event.start) : new Date();
  form.end = props.event.end ? new Date(props.event.end) : new Date(new Date().getTime() + 60 * 60 * 1000);
  form.allDay = props.event.allDay || false;
  form.categoryId = props.event.extendedProps?.categoryId || '';
  form.location = props.event.extendedProps?.location || '';
  form.description = props.event.extendedProps?.description || '';
  form.relatedId = props.event.extendedProps?.relatedId || null;
  form.relatedType = props.event.extendedProps?.relatedType || props.relatedType || null;
  form.isRecurring = props.event.extendedProps?.isRecurring || false;
  form.recurrenceFrequency = props.event.extendedProps?.recurrenceFrequency || 'weekly';
  form.recurrenceUntil = props.event.extendedProps?.recurrenceUntil ? new Date(props.event.extendedProps.recurrenceUntil) : null;
}

// Recurrence options
const recurrenceOptions = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Bi-weekly', value: 'biweekly' },
  { label: 'Monthly', value: 'monthly' }
];

// Methods
const validateForm = () => {
  let isValid = true;
  
  // Reset errors
  errors.title = '';
  errors.start = '';
  errors.end = '';
  errors.categoryId = '';

  // Validate title
  if (!form.title) {
    errors.title = 'Title is required';
    isValid = false;
  }

  // Validate start date
  if (!form.start) {
    errors.start = 'Start date is required';
    isValid = false;
  }

  // Validate end date
  if (!form.end) {
    errors.end = 'End date is required';
    isValid = false;
  } else if (form.end <= form.start) {
    errors.end = 'End date must be after start date';
    isValid = false;
  }

  // Validate category
  if (!form.categoryId) {
    errors.categoryId = 'Category is required';
    isValid = false;
  }

  return isValid;
};

const submitForm = () => {
  if (!validateForm()) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Please check the form for errors',
      life: 3000
    });
    return;
  }
  
  // Emit save event with form data
  emit('save', { ...form });
};

const getCategoryColor = (categoryId: string) => {
  const category = categories.value.find(cat => cat.id === categoryId);
  return category ? category.color : '#94a3b8';
};

const getCategoryName = (categoryId: string) => {
  const category = categories.value.find(cat => cat.id === categoryId);
  return category ? category.name : 'Select a category';
};

// Watch for all-day event changes to adjust time
watch(() => form.allDay, (isAllDay) => {
  if (isAllDay) {
    // Set start time to beginning of day
    const startDate = new Date(form.start);
    startDate.setHours(0, 0, 0, 0);
    form.start = startDate;
    
    // Set end time to end of day
    const endDate = new Date(form.end);
    endDate.setHours(23, 59, 59, 999);
    form.end = endDate;
  }
});

// Reset form method to be exposed
const resetForm = () => {
  // Reset form values
  Object.assign(form, initialForm);
  
  // Reset errors
  errors.title = '';
  errors.start = '';
  errors.end = '';
  errors.categoryId = '';
};

// Expose form reset method
defineExpose({
  resetForm
});
</script>

<style scoped>
.custom-button {
  background: var(--p-primary-color) !important;
  border-color: var(--p-primary-color) !important;
  color: var(--p-primary-contrast-color) !important;
}

.custom-button:hover {
  background: var(--p-primary-hover-color) !important;
  border-color: var(--p-primary-hover-color) !important;
}

.custom-button:active {
  background: var(--p-primary-active-color) !important;
  border-color: var(--p-primary-active-color) !important;
}

/* Override PrimeVue component styles */
:deep(.p-dropdown) {
  width: 100%;
}

:deep(.p-calendar) {
  width: 100%;
}

:deep(.p-inputtext) {
  background: var(--p-surface-0);
  border-color: var(--p-content-border-color);
  color: var(--p-text-color);
}

:deep(.p-inputtext:hover) {
  border-color: var(--p-primary-color);
}

:deep(.p-inputtext:focus) {
  border-color: var(--p-primary-color);
  box-shadow: 0 0 0 1px var(--p-primary-color);
}

:deep(.p-inputtext.p-invalid) {
  border-color: var(--p-primary-600);
}

@media (prefers-color-scheme: dark) {
  :deep(.p-inputtext) {
    background: var(--p-surface-800);
    border-color: var(--p-surface-700);
    color: var(--p-surface-200);
  }

  :deep(.p-inputtext:hover) {
    border-color: var(--p-primary-500);
  }

  :deep(.p-inputtext:focus) {
    border-color: var(--p-primary-500);
    box-shadow: 0 0 0 1px var(--p-primary-500);
  }

  :deep(.p-inputtext.p-invalid) {
    border-color: var(--p-primary-500);
  }
}
</style>