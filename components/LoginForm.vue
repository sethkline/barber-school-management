<template>
  <div>
    <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-50">Login</h2>
    <p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
      Enter your credentials to access your account
    </p>

    <form @submit.prevent="handleSubmit" class="space-y-4 mt-6">
      <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
      
      <div class="space-y-2">
        <label 
          for="email" 
          class="block text-sm font-medium text-surface-700 dark:text-surface-200"
        >
          Email
        </label>
        <InputText
          id="email"
          v-model="form.email"
          type="email"
          :class="{ 'p-invalid': errors.email }"
          placeholder="Enter your email"
          class="w-full"
          :disabled="loading"
          required
        />
        <small v-if="errors.email" class="text-primary-600 dark:text-primary-400">
          {{ errors.email }}
        </small>
      </div>

      <div class="space-y-2">
        <label 
          for="password" 
          class="block text-sm font-medium text-surface-700 dark:text-surface-200"
        >
          Password
        </label>
        <Password
          id="password"
          v-model="form.password"
          :class="{ 'p-invalid': errors.password }"
          :feedback="false"
          :toggle-mask="true"
          placeholder="Enter your password"
          class="w-full"
          :disabled="loading"
          required
        />
        <small v-if="errors.password" class="text-primary-600 dark:text-primary-400">
          {{ errors.password }}
        </small>
      </div>

      <BarberButton
        type="submit"
        :loading="loading"
        class="w-full custom-button"
      >
        {{ loading ? 'Signing in...' : 'Sign in' }}
      </BarberButton>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useToast } from 'primevue/usetoast'

const toast = useToast()

const props = withDefaults(defineProps<{
  title?: string
  submitLabel?: string
  loading?: boolean
  error?: string
}>(), {
  title: 'Login',
  submitLabel: 'Sign in',
  loading: false,
  error: ''
})

const emit = defineEmits<{
  submit: [{ email: string; password: string }]
}>()

const form = reactive({
  email: '',
  password: ''
})

const errors = reactive({
  email: '',
  password: ''
})

const validateForm = () => {
  let isValid = true
  errors.email = ''
  errors.password = ''

  if (!form.email) {
    errors.email = 'Email is required'
    isValid = false
  } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = 'Please enter a valid email'
    isValid = false
  }

  if (!form.password) {
    errors.password = 'Password is required'
    isValid = false
  }

  return isValid
}

const handleSubmit = () => {
  if (!validateForm()) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Please check the form for errors',
      life: 3000
    })
    return
  }

  emit('submit', {
    email: form.email,
    password: form.password
  })
}
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
:deep(.p-password) {
  width: 100%;
}

:deep(.p-password-input) {
  width: 100%;
  background: var(--p-surface-0);
  border-color: var(--p-content-border-color);
  color: var(--p-text-color);
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
  :deep(.p-password-input),
  :deep(.p-inputtext) {
    background: var(--p-surface-800);
    border-color: var(--p-surface-700);
    color: var(--p-surface-200);
  }

  :deep(.p-password-input:hover),
  :deep(.p-inputtext:hover) {
    border-color: var(--p-primary-500);
  }

  :deep(.p-password-input:focus),
  :deep(.p-inputtext:focus) {
    border-color: var(--p-primary-500);
    box-shadow: 0 0 0 1px var(--p-primary-500);
  }

  :deep(.p-inputtext.p-invalid) {
    border-color: var(--p-primary-500);
  }
}
</style>