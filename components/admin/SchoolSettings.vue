<template>
  <div class="bg-white rounded-lg shadow">
    <div class="flex items-center justify-between p-4 border-b border-gray-200">
      <h2 class="text-lg font-medium text-gray-900">School Information</h2>
      <div>
        <Button
          type="button"
          label="Save Changes"
          icon="pi pi-save"
          @click="handleSubmit"
          :loading="isLoading"
          :disabled="!hasChanges"
        />
      </div>
    </div>
    
    <div v-if="isLoading" class="flex justify-center items-center p-6">
      <ProgressSpinner style="width:50px;height:50px" strokeWidth="4" />
    </div>
    
    <div v-else-if="error" class="p-6 text-center text-red-600">
      <i class="pi pi-exclamation-circle text-3xl mb-2"></i>
      <p>{{ error }}</p>
      <Button 
        label="Try Again" 
        icon="pi pi-refresh" 
        class="mt-2" 
        severity="secondary"
        @click="fetchSchoolInfo"
      />
    </div>
    
    <div v-else class="p-4">
      <form @submit.prevent="handleSubmit" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- School Name -->
        <div class="field md:col-span-2">
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
            School Name*
          </label>
          <InputText
            id="name"
            v-model.trim="form.name"
            class="w-full"
            :class="{'p-invalid': errors.name}"
            placeholder="Enter school name"
          />
          <small class="p-error" v-if="errors.name">
            {{ errors.name }}
          </small>
        </div>
        
        <!-- Contact Email -->
        <div class="field md:col-span-2">
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            Contact Email*
          </label>
          <InputText
            id="email"
            v-model.trim="form.email"
            type="email"
            class="w-full"
            :class="{'p-invalid': errors.email}"
            placeholder="Enter contact email"
          />
          <small class="p-error" v-if="errors.email">
            {{ errors.email }}
          </small>
        </div>
        
        <!-- Phone Number -->
        <div class="field">
          <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
            Phone Number*
          </label>
          <InputMask
            id="phone"
            v-model="form.phone"
            mask="(999) 999-9999"
            placeholder="(999) 999-9999"
            class="w-full"
            :class="{'p-invalid': errors.phone}"
          />
          <small class="p-error" v-if="errors.phone">
            {{ errors.phone }}
          </small>
        </div>
        
        <!-- Website -->
        <div class="field">
          <label for="website" class="block text-sm font-medium text-gray-700 mb-1">
            Website
          </label>
          <InputText
            id="website"
            v-model.trim="form.website"
            class="w-full"
            placeholder="Enter website URL"
          />
        </div>
        
        <!-- Address -->
        <div class="field md:col-span-2">
          <label for="address" class="block text-sm font-medium text-gray-700 mb-1">
            Street Address*
          </label>
          <InputText
            id="address"
            v-model.trim="form.address"
            class="w-full"
            :class="{'p-invalid': errors.address}"
            placeholder="Enter street address"
          />
          <small class="p-error" v-if="errors.address">
            {{ errors.address }}
          </small>
        </div>
        
        <!-- City -->
        <div class="field">
          <label for="city" class="block text-sm font-medium text-gray-700 mb-1">
            City*
          </label>
          <InputText
            id="city"
            v-model.trim="form.city"
            class="w-full"
            :class="{'p-invalid': errors.city}"
            placeholder="Enter city"
          />
          <small class="p-error" v-if="errors.city">
            {{ errors.city }}
          </small>
        </div>
        
        <!-- State -->
        <div class="field">
          <label for="state" class="block text-sm font-medium text-gray-700 mb-1">
            State*
          </label>
          <Dropdown
            id="state"
            v-model="form.state"
            :options="stateOptions"
            option-label="label"
            option-value="value"
            placeholder="Select state"
            class="w-full"
            :class="{'p-invalid': errors.state}"
          />
          <small class="p-error" v-if="errors.state">
            {{ errors.state }}
          </small>
        </div>
        
        <!-- Zip Code -->
        <div class="field">
          <label for="zip_code" class="block text-sm font-medium text-gray-700 mb-1">
            Zip Code*
          </label>
          <InputText
            id="zip_code"
            v-model.trim="form.zip_code"
            class="w-full"
            :class="{'p-invalid': errors.zip_code}"
            placeholder="Enter zip code"
          />
          <small class="p-error" v-if="errors.zip_code">
            {{ errors.zip_code }}
          </small>
        </div>
        
        <!-- Year Established -->
        <div class="field">
          <label for="established_year" class="block text-sm font-medium text-gray-700 mb-1">
            Year Established
          </label>
          <InputNumber
            id="established_year"
            v-model="form.established_year"
            class="w-full"
            placeholder="Enter year established"
            :min="1900"
            :max="new Date().getFullYear()"
          />
        </div>
        
        <!-- School Description -->
        <div class="field md:col-span-2 mt-4">
          <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
            School Description
          </label>
          <Textarea
            id="description"
            v-model="form.description"
            rows="5"
            class="w-full"
            placeholder="Enter school description"
          />
        </div>
        
        <!-- Logo URL (could be replaced with file upload in a real implementation) -->
        <div class="field md:col-span-2">
          <label for="logo_url" class="block text-sm font-medium text-gray-700 mb-1">
            Logo URL
          </label>
          <InputText
            id="logo_url"
            v-model.trim="form.logo_url"
            class="w-full"
            placeholder="Enter logo URL"
          />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputMask from 'primevue/inputmask'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import ProgressSpinner from 'primevue/progressspinner'
import useSettings from '~/composables/useSettings'
import type { SchoolInfo } from '~/server/services/settingsService'

const {
  schoolInfo,
  isLoading,
  error,
  fetchSchoolInfo,
  updateSchoolInfo
} = useSettings()

const toast = useToast()

// Form state
const initialForm = ref<SchoolInfo>({
  name: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  phone: '',
  email: '',
  website: '',
  logo_url: '',
  description: '',
  established_year: undefined
})

const form = reactive<SchoolInfo>({ ...initialForm.value })

// Validation errors
const errors = reactive({
  name: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  phone: '',
  email: ''
})

// US States for dropdown
const stateOptions = [
  { label: 'Alabama', value: 'AL' },
  { label: 'Alaska', value: 'AK' },
  { label: 'Arizona', value: 'AZ' },
  { label: 'Arkansas', value: 'AR' },
  { label: 'California', value: 'CA' },
  { label: 'Colorado', value: 'CO' },
  { label: 'Connecticut', value: 'CT' },
  { label: 'Delaware', value: 'DE' },
  { label: 'Florida', value: 'FL' },
  { label: 'Georgia', value: 'GA' },
  { label: 'Hawaii', value: 'HI' },
  { label: 'Idaho', value: 'ID' },
  { label: 'Illinois', value: 'IL' },
  { label: 'Indiana', value: 'IN' },
  { label: 'Iowa', value: 'IA' },
  { label: 'Kansas', value: 'KS' },
  { label: 'Kentucky', value: 'KY' },
  { label: 'Louisiana', value: 'LA' },
  { label: 'Maine', value: 'ME' },
  { label: 'Maryland', value: 'MD' },
  { label: 'Massachusetts', value: 'MA' },
  { label: 'Michigan', value: 'MI' },
  { label: 'Minnesota', value: 'MN' },
  { label: 'Mississippi', value: 'MS' },
  { label: 'Missouri', value: 'MO' },
  { label: 'Montana', value: 'MT' },
  { label: 'Nebraska', value: 'NE' },
  { label: 'Nevada', value: 'NV' },
  { label: 'New Hampshire', value: 'NH' },
  { label: 'New Jersey', value: 'NJ' },
  { label: 'New Mexico', value: 'NM' },
  { label: 'New York', value: 'NY' },
  { label: 'North Carolina', value: 'NC' },
  { label: 'North Dakota', value: 'ND' },
  { label: 'Ohio', value: 'OH' },
  { label: 'Oklahoma', value: 'OK' },
  { label: 'Oregon', value: 'OR' },
  { label: 'Pennsylvania', value: 'PA' },
  { label: 'Rhode Island', value: 'RI' },
  { label: 'South Carolina', value: 'SC' },
  { label: 'South Dakota', value: 'SD' },
  { label: 'Tennessee', value: 'TN' },
  { label: 'Texas', value: 'TX' },
  { label: 'Utah', value: 'UT' },
  { label: 'Vermont', value: 'VT' },
  { label: 'Virginia', value: 'VA' },
  { label: 'Washington', value: 'WA' },
  { label: 'West Virginia', value: 'WV' },
  { label: 'Wisconsin', value: 'WI' },
  { label: 'Wyoming', value: 'WY' }
]

// Check if form has changes
const hasChanges = computed(() => {
  return JSON.stringify(form) !== JSON.stringify(initialForm.value)
})

// Load school info when component mounts
onMounted(async () => {
  await fetchSchoolInfo()
})

// When school info changes, update form
watch(() => schoolInfo.value, (newSchoolInfo) => {
  // Update initial form
  initialForm.value = { ...newSchoolInfo }
  
  // Update reactive form
  Object.assign(form, newSchoolInfo)
}, { immediate: true })

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
  
  if (!form.name) {
    errors.name = 'School name is required'
    isValid = false
  }
  
  if (!form.email) {
    errors.email = 'Email is required'
    isValid = false
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    errors.email = 'Email is invalid'
    isValid = false
  }
  
  if (!form.phone) {
    errors.phone = 'Phone number is required'
    isValid = false
  }
  
  if (!form.address) {
    errors.address = 'Address is required'
    isValid = false
  }
  
  if (!form.city) {
    errors.city = 'City is required'
    isValid = false
  }
  
  if (!form.state) {
    errors.state = 'State is required'
    isValid = false
  }
  
  if (!form.zip_code) {
    errors.zip_code = 'Zip code is required'
    isValid = false
  }
  
  return isValid
}

// Form submission
async function handleSubmit() {
  if (!validateForm()) {
    // Scroll to the first error
    const firstError = document.querySelector('.p-invalid')
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return
  }
  
  try {
    await updateSchoolInfo(form)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'School information updated successfully',
      life: 3000
    })
    
    // Update initial form after successful save
    initialForm.value = { ...form }
  } catch (err) {
    // Error is already handled in the composable
  }
}
</script>