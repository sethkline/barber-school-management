<template>
  <div class="bg-white rounded-lg shadow">
    <div class="flex items-center justify-between p-4 border-b border-gray-200">
      <h2 class="text-lg font-medium text-gray-900">Theme Settings</h2>
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
        @click="fetchThemeSettings"
      />
    </div>
    
    <div v-else class="p-4">
      <form @submit.prevent="handleSubmit">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div class="col-span-full mb-2 pb-2 border-b border-gray-200">
            <h3 class="text-base font-medium text-gray-800">Colors</h3>
          </div>
          
          <!-- Primary Color -->
          <div class="field">
            <label for="primaryColor" class="block text-sm font-medium text-gray-700 mb-1">
              Primary Color
            </label>
            <div class="flex items-center">
              <ColorPicker
                v-model="form.primaryColor"
                format="hex"
                class="mr-2"
              />
              <InputText
                id="primaryColor"
                v-model="form.primaryColor"
                class="flex-1"
                placeholder="#000000"
              />
            </div>
            <small class="text-gray-500">
              Used for buttons, links, and other primary elements
            </small>
          </div>
          
          <!-- Secondary Color -->
          <div class="field">
            <label for="secondaryColor" class="block text-sm font-medium text-gray-700 mb-1">
              Secondary Color
            </label>
            <div class="flex items-center">
              <ColorPicker
                v-model="form.secondaryColor"
                format="hex"
                class="mr-2"
              />
              <InputText
                id="secondaryColor"
                v-model="form.secondaryColor"
                class="flex-1"
                placeholder="#000000"
              />
            </div>
            <small class="text-gray-500">
              Used for secondary buttons and accents
            </small>
          </div>
          
          <div class="col-span-full mt-4 mb-2 pb-2 border-b border-gray-200">
            <h3 class="text-base font-medium text-gray-800">Display Options</h3>
          </div>
          
          <!-- Dark Mode -->
          <div class="field">
            <div class="flex items-center justify-between p-3 border rounded-md">
              <div>
                <h4 class="text-sm font-medium text-gray-700">Dark Mode</h4>
                <p class="text-xs text-gray-500">Enable system-wide dark mode</p>
              </div>
              <InputSwitch v-model="form.darkMode" />
            </div>
          </div>
          
          <!-- Custom Logo -->
          <div class="field">
            <div class="flex items-center justify-between p-3 border rounded-md">
              <div>
                <h4 class="text-sm font-medium text-gray-700">Use Custom Logo</h4>
                <p class="text-xs text-gray-500">Replace default logo with custom one</p>
              </div>
              <InputSwitch v-model="form.customLogo" />
            </div>
          </div>
          
          <!-- Logo URL -->
          <div v-if="form.customLogo" class="field col-span-full mt-2">
            <label for="logoUrl" class="block text-sm font-medium text-gray-700 mb-1">
              Logo URL
            </label>
            <InputText
              id="logoUrl"
              v-model="form.logoUrl"
              class="w-full"
              placeholder="Enter logo URL"
            />
            <small class="text-gray-500">
              For best results, use a PNG or SVG image with transparent background
            </small>
          </div>
          
          <div class="col-span-full mt-4 mb-2 pb-2 border-b border-gray-200">
            <h3 class="text-base font-medium text-gray-800">Preview</h3>
          </div>
          
          <!-- Theme Preview -->
          <div class="col-span-full">
            <div class="border rounded-md overflow-hidden">
              <div class="p-4" :style="{ backgroundColor: form.darkMode ? '#1c1917' : '#ffffff' }">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center">
                    <div v-if="form.customLogo && form.logoUrl" class="w-10 h-10 mr-2">
                      <img :src="form.logoUrl" alt="Logo" class="w-full h-full object-contain" />
                    </div>
                    <div v-else class="w-10 h-10 rounded-full mr-2" :style="{ backgroundColor: form.primaryColor }">
                      <span class="flex items-center justify-center h-full text-white font-bold">S</span>
                    </div>
                    <h3 :style="{ color: form.darkMode ? '#f5f5f4' : '#292524' }" class="text-lg font-bold">
                      School Portal
                    </h3>
                  </div>
                </div>
                
                <div class="flex flex-wrap gap-2 mb-4">
                  <button 
                    class="px-3 py-1.5 rounded-md text-white"
                    :style="{ backgroundColor: form.primaryColor }"
                  >
                    Primary Button
                  </button>
                  <button 
                    class="px-3 py-1.5 rounded-md text-white"
                    :style="{ backgroundColor: form.secondaryColor }"
                  >
                    Secondary Button
                  </button>
                </div>
                
                <div class="mb-4">
                  <div :style="{ color: form.darkMode ? '#f5f5f4' : '#292524' }" class="mb-1 text-sm font-medium">
                    Sample Text Input
                  </div>
                  <div 
                    class="p-2 border rounded-md w-full"
                    :style="{ 
                      backgroundColor: form.darkMode ? '#292524' : '#ffffff',
                      borderColor: form.darkMode ? '#44403c' : '#d6d3d1',
                      color: form.darkMode ? '#f5f5f4' : '#292524'
                    }"
                  >
                    Input text
                  </div>
                </div>
                
                <div>
                  <div :style="{ color: form.darkMode ? '#f5f5f4' : '#292524' }" class="mb-1 text-sm">
                    Sample content with <a :style="{ color: form.primaryColor }">primary links</a> and 
                    <a :style="{ color: form.secondaryColor }">secondary links</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, watch, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import ColorPicker from 'primevue/colorpicker'
import InputSwitch from 'primevue/inputswitch'
import ProgressSpinner from 'primevue/progressspinner'
import useSettings from '~/composables/useSettings'

const {
  themeSettings,
  isLoading,
  error,
  fetchThemeSettings,
  updateThemeSettings
} = useSettings()

const toast = useToast()

// Initial form state
const initialForm = ref({
  primaryColor: '#ef4444',
  secondaryColor: '#0ea5e9',
  darkMode: false,
  customLogo: false,
  logoUrl: ''
})

// Form state
const form = reactive({
  primaryColor: '#ef4444',
  secondaryColor: '#0ea5e9',
  darkMode: false,
  customLogo: false,
  logoUrl: ''
})

// Check if form has changes
const hasChanges = computed(() => {
  return JSON.stringify(form) !== JSON.stringify(initialForm.value)
})

// Load theme settings when component mounts
onMounted(async () => {
  await fetchThemeSettings()
})

// When theme settings change, update form
watch(() => themeSettings.value, (newThemeSettings) => {
  // Update initial form
  initialForm.value = { ...newThemeSettings }
  
  // Update reactive form
  Object.assign(form, newThemeSettings)
}, { immediate: true })

// Form submission
async function handleSubmit() {
  try {
    await updateThemeSettings(form)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Theme settings updated successfully',
      life: 3000
    })
    
    // Update initial form after successful save
    initialForm.value = { ...form }
  } catch (err) {
    // Error is already handled in the composable
  }
}
</script>