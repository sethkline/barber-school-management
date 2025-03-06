<!-- components/students/StudentForm.vue -->
<template>
  <Dialog
    :visible="visible"
    :style="{width: '550px'}"
    :header="isEditing ? 'Edit Student' : 'Add New Student'"
    :modal="true"
    class="p-fluid"
    :closable="!loading"
    @update:visible="$emit('update:visible', $event)"
  >
    <div v-if="loading" class="flex justify-center items-center p-4">
      <ProgressSpinner style="width:50px;height:50px" strokeWidth="4" />
    </div>
    <div v-else>
      <Form v-slot="$form" :resolver="resolver" :initialValues="initialValues" @submit="submitForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- First Name -->
        <div class="field">
          <label for="first_name" class="block text-sm font-medium text-gray-700">First Name*</label>
          <InputText 
            name="first_name" 
            placeholder="First Name"
            fluid
          />
          <Message v-if="$form.first_name?.invalid" severity="error" size="small">
            {{ $form.first_name.error?.message }}
          </Message>
        </div>
        
        <!-- Last Name -->
        <div class="field">
          <label for="last_name" class="block text-sm font-medium text-gray-700">Last Name*</label>
          <InputText 
            name="last_name" 
            placeholder="Last Name"
            fluid
          />
          <Message v-if="$form.last_name?.invalid" severity="error" size="small">
            {{ $form.last_name.error?.message }}
          </Message>
        </div>
        
        <!-- Email -->
        <div class="field md:col-span-2">
          <label for="email" class="block text-sm font-medium text-gray-700">Email*</label>
          <InputText 
            name="email" 
            type="email"
            placeholder="Email"
            fluid
          />
          <Message v-if="$form.email?.invalid" severity="error" size="small">
            {{ $form.email.error?.message }}
          </Message>
        </div>
        
        <!-- Phone -->
        <div class="field">
          <label for="phone" class="block text-sm font-medium text-gray-700">Phone</label>
          <InputMask
            name="phone"
            mask="(999) 999-9999"
            placeholder="(999) 999-9999"
            fluid
          />
          <Message v-if="$form.phone?.invalid" severity="error" size="small">
            {{ $form.phone.error?.message }}
          </Message>
        </div>
        
        <!-- Status -->
        <div class="field">
          <label for="status" class="block text-sm font-medium text-gray-700">Status*</label>
          <Dropdown
            name="status"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select Status"
            fluid
          />
          <Message v-if="$form.status?.invalid" severity="error" size="small">
            {{ $form.status.error?.message }}
          </Message>
        </div>
        
        <!-- Enrollment Date -->
        <div class="field">
          <label for="enrollment_date" class="block text-sm font-medium text-gray-700">Enrollment Date</label>
          <Calendar
            name="enrollment_date"
            dateFormat="mm/dd/yy"
            :showIcon="true"
            fluid
          />
        </div>
        
        <!-- Expected Graduation Date -->
        <div class="field">
          <label for="expected_graduation_date" class="block text-sm font-medium text-gray-700">Expected Graduation</label>
          <Calendar
            name="expected_graduation_date"
            dateFormat="mm/dd/yy"
            :showIcon="true"
            fluid
          />
        </div>
        
        <!-- Address -->
        <div class="field md:col-span-2">
          <label for="address" class="block text-sm font-medium text-gray-700">Address</label>
          <InputText 
            name="address" 
            placeholder="Address"
            fluid
          />
        </div>
        
        <!-- City -->
        <div class="field">
          <label for="city" class="block text-sm font-medium text-gray-700">City</label>
          <InputText 
            name="city" 
            placeholder="City"
            fluid
          />
        </div>
        
        <!-- Zip Code -->
        <div class="field">
          <label for="zip_code" class="block text-sm font-medium text-gray-700">Zip Code</label>
          <InputText 
            name="zip_code" 
            placeholder="Zip Code"
            fluid
          />
        </div>

        <div class="md:col-span-2 flex justify-end gap-2 mt-4">
          <Button
            type="button"
            label="Cancel"
            icon="pi pi-times"
            @click="$emit('update:visible', false)"
            class="p-button-text"
            :disabled="loading"
          />
          <Button
            type="submit"
            label="Save"
            icon="pi pi-check"
            :loading="loading"
          />
        </div>
      </Form>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { Form } from '@primevue/forms';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputMask from 'primevue/inputmask';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import Button from 'primevue/button';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  studentData: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'save': [data: TablesInsert<'students'> | TablesUpdate<'students'>];
}>();
const toast = useToast();

const statusOptions = [
  { label: 'Current', value: 'current' },
  { label: 'Graduated', value: 'graduated' },
  { label: 'On Leave', value: 'on_leave' },
  { label: 'Withdrawn', value: 'withdrawn' },
  { label: 'Pending', value: 'pending' }
];

// Initial values
const initialValues = computed(() => {
  if (props.studentData && Object.keys(props.studentData).length) {
    return {
      id: props.studentData.id, // Make sure ID is included
      ...props.studentData,
      enrollment_date: props.studentData.enrollment_date ? new Date(props.studentData.enrollment_date) : null,
      expected_graduation_date: props.studentData.expected_graduation_date 
        ? new Date(props.studentData.expected_graduation_date) 
        : null
    };
  }
  
  return {
    id: null, 
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    status: 'pending',
    address: '',
    city: '',
    zip_code: '',
    enrollment_date: null,
    expected_graduation_date: null
  };
});

// Validation resolver
const resolver = async (values) => {
  const errors = {};
  
  if (!values.first_name) {
    errors.first_name = { message: 'First name is required' };
  }
  
  if (!values.last_name) {
    errors.last_name = { message: 'Last name is required' };
  }
  
  if (!values.email) {
    errors.email = { message: 'Email is required' };
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
    errors.email = { message: 'Invalid email address' };
  }
  
  if (!values.status) {
    errors.status = { message: 'Status is required' };
  }
  
  return errors;
};

// Form submission handler
const submitForm = ($form) => {
  // Extract values from form states
  const values = Object.entries($form.states).reduce((acc, [key, state]) => {
    acc[key] = state.value;
    return acc;
  }, {});

  // Format dates for API submission
  const formattedData = {
    ...(isEditing.value ? { id: props.studentData.id } : {}), // Include ID only if editing
    ...values,
    enrollment_date: values.enrollment_date ? new Date(values.enrollment_date).toISOString().split('T')[0] : null,
    expected_graduation_date: values.expected_graduation_date 
      ? new Date(values.expected_graduation_date).toISOString().split('T')[0] 
      : null
  };
  
  // Emit save with the formatted data
  emit('save', formattedData);
};
// Check if editing or adding new student
const isEditing = computed(() => !!props.studentData?.id);
</script>