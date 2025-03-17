<template>
  <Dialog
    :visible="visible"
    :style="{width: '550px'}"
    :header="mode === 'create' ? 'Add New User' : 'Edit User'"
    :modal="true"
    class="p-fluid"
    :closable="!loading"
    @update:visible="$emit('update:visible', $event)"
  >
    <div v-if="loading" class="flex justify-center items-center p-4">
      <ProgressSpinner style="width:50px;height:50px" strokeWidth="4" />
    </div>
    <div v-else>
      <form @submit.prevent="handleSubmit" class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- First Name -->
          <div class="field">
            <label for="first_name" class="block text-sm font-medium text-gray-700 mb-1">
              First Name*
            </label>
            <InputText
              id="first_name"
              v-model.trim="form.first_name"
              class="w-full"
              :class="{'p-invalid': errors.first_name}"
              placeholder="Enter first name"
            />
            <small class="p-error" v-if="errors.first_name">
              {{ errors.first_name }}
            </small>
          </div>
          
          <!-- Last Name -->
          <div class="field">
            <label for="last_name" class="block text-sm font-medium text-gray-700 mb-1">
              Last Name*
            </label>
            <InputText
              id="last_name"
              v-model.trim="form.last_name"
              class="w-full"
              :class="{'p-invalid': errors.last_name}"
              placeholder="Enter last name"
            />
            <small class="p-error" v-if="errors.last_name">
              {{ errors.last_name }}
            </small>
          </div>
          
          <!-- Email -->
          <div class="field md:col-span-2">
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Email*
            </label>
            <InputText
              id="email"
              v-model.trim="form.email"
              type="email"
              class="w-full"
              :class="{'p-invalid': errors.email}"
              placeholder="Enter email"
              :disabled="mode === 'edit'"
            />
            <small class="p-error" v-if="errors.email">
              {{ errors.email }}
            </small>
          </div>
          
          <!-- Password (only for create mode) -->
          <div v-if="mode === 'create'" class="field md:col-span-2">
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              Password*
            </label>
            <Password
              id="password"
              v-model="form.password"
              toggleMask
              :feedback="true"
              class="w-full"
              :class="{'p-invalid': errors.password}"
              placeholder="Enter password"
            />
            <small class="p-error" v-if="errors.password">
              {{ errors.password }}
            </small>
          </div>
          
          <!-- Role -->
          <div class="field">
            <label for="role" class="block text-sm font-medium text-gray-700 mb-1">
              Role*
            </label>
            <Dropdown
              id="role"
              v-model="form.role"
              :options="roleOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select role"
              class="w-full"
              :class="{'p-invalid': errors.role}"
            />
            <small class="p-error" v-if="errors.role">
              {{ errors.role }}
            </small>
          </div>
          
          <!-- Phone -->
          <div class="field">
            <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <InputMask
              id="phone"
              v-model="form.phone"
              mask="(999) 999-9999"
              placeholder="(999) 999-9999"
              class="w-full"
            />
          </div>
          
          <!-- Active Status -->
          <div class="field md:col-span-2 mt-2">
            <div class="flex items-center">
              <Checkbox
                id="is_active"
                v-model="form.is_active"
                :binary="true"
              />
              <label for="is_active" class="ml-2 text-sm text-gray-700">
                Active Account
              </label>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end gap-2 mt-4">
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
      </form>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputMask from 'primevue/inputmask'
import Dropdown from 'primevue/dropdown'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Password from 'primevue/password'
import ProgressSpinner from 'primevue/progressspinner'
import type { User, UserRole } from '~/server/services/userService'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  user: {
    type: Object as () => User | null,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String as () => 'create' | 'edit',
    default: 'create'
  }
})

// Emits
const emit = defineEmits(['update:visible', 'save'])

// Form state
const form = reactive({
  id: '',
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  role: '' as UserRole,
  phone: '',
  is_active: true
})

// Validation errors
const errors = reactive({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  role: ''
})

// Available roles
const roleOptions = [
  { label: 'Administrator', value: 'admin' },
  { label: 'Instructor', value: 'instructor' },
  { label: 'Staff', value: 'staff' },
  { label: 'Receptionist', value: 'receptionist' }
]

// When user data changes, update form
watch(() => props.user, (newUser) => {
  if (newUser) {
    form.id = newUser.id
    form.first_name = newUser.first_name
    form.last_name = newUser.last_name
    form.email = newUser.email
    form.role = newUser.role
    form.phone = newUser.phone || ''
    form.is_active = newUser.is_active
  } else {
    // Reset form if no user (creating new)
    form.id = ''
    form.first_name = ''
    form.last_name = ''
    form.email = ''
    form.password = ''
    form.role = '' as UserRole
    form.phone = ''
    form.is_active = true
  }
}, { immediate: true })

// When visible changes to true, reset errors
watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    resetErrors()
  }
})

// Reset validation errors
function resetErrors() {
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
}

// Form validation
function validateForm() {
  let isValid = true
  resetErrors()
  
  if (!form.first_name) {
    errors.first_name = 'First name is required'
    isValid = false
  }
  
  if (!form.last_name) {
    errors.last_name = 'Last name is required'
    isValid = false
  }
  
  if (!form.email) {
    errors.email = 'Email is required'
    isValid = false
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    errors.email = 'Email is invalid'
    isValid = false
  }
  
  if (props.mode === 'create' && !form.password) {
    errors.password = 'Password is required'
    isValid = false
  } else if (props.mode === 'create' && form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
    isValid = false
  }
  
  if (!form.role) {
    errors.role = 'Role is required'
    isValid = false
  }
  
  return isValid
}

// Form submission
function handleSubmit() {
  if (!validateForm()) {
    return
  }
  
  const userData = {
    id: form.id,
    first_name: form.first_name,
    last_name: form.last_name,
    email: form.email,
    role: form.role,
    is_active: form.is_active,
    phone: form.phone || undefined
  }
  
  // Add password only for create mode
  if (props.mode === 'create') {
    userData.password = form.password
  }
  
  emit('save', userData)
}
</script>