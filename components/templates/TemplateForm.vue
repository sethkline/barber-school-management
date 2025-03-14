<template>
  <form @submit.prevent="submit" class="space-y-6">
    <div class="bg-secondary-50 border-l-4 border-secondary-400 p-4 mb-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-secondary-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-secondary-700">
            You can use variable placeholders in your template. Available variables include:
          </p>
          <ul class="mt-2 text-sm text-secondary-700 list-disc list-inside">
            <li>{{firstName}} - The recipient's first name</li>
            <li>{{lastName}} - The recipient's last name</li>
            <li>{{fullName}} - The recipient's full name</li>
            <li>{{email}} - The recipient's email address</li>
            <li>{{phone}} - The recipient's phone number</li>
            <li>{{enrollmentDate}} - For students: their enrollment date</li>
            <li>{{status}} - Student or lead status</li>
          </ul>
        </div>
      </div>
    </div>
    
    <div>
      <label for="name" class="block text-sm font-medium text-gray-700">Template Name</label>
      <input 
        type="text" 
        id="name" 
        v-model="formData.name" 
        required
        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
      />
    </div>
    
    <div>
      <label for="subject" class="block text-sm font-medium text-gray-700">Email Subject</label>
      <input 
        type="text" 
        id="subject" 
        v-model="formData.subject" 
        required
        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-primary-500"
      />
    </div>
    
    <div>
      <label for="body" class="block text-sm font-medium text-gray-700">Email Body</label>
      <textarea 
        id="body" 
        v-model="formData.body" 
        rows="10" 
        required
        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
      ></textarea>
    </div>
    
    <div class="flex justify-between">
      <NuxtLink to="/admin/templates" class="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
        Cancel
      </NuxtLink>
      <button 
        type="submit" 
        class="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        :disabled="loading"
      >
        <span v-if="loading">Saving...</span>
        <span v-else>{{ isEditMode ? 'Update Template' : 'Create Template' }}</span>
      </button>
    </div>
    
    <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      <strong>Error:</strong> {{ error }}
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, defineProps, defineEmits, computed, watch } from 'vue'

const props = defineProps({
  template: {
    type: Object,
    default: () => ({
      id: '',
      name: '',
      subject: '',
      body: ''
    })
  }
})

const emit = defineEmits(['saved'])

const formData = reactive({
  name: '',
  subject: '',
  body: ''
})

const loading = ref(false)
const error = ref<string | null>(null)

// Populate form with template data if in edit mode
watch(() => props.template, (newTemplate) => {
  if (newTemplate) {
    formData.name = newTemplate.name || ''
    formData.subject = newTemplate.subject || ''
    formData.body = newTemplate.body || ''
  }
}, { immediate: true })

const isEditMode = computed(() => Boolean(props.template?.id))

async function submit() {
  try {
    loading.value = true
    error.value = null
    
    if (isEditMode.value) {
      // Update existing template
      await $fetch(`/api/templates/${props.template.id}`, {
        method: 'PUT',
        body: formData
      })
    } else {
      // Create new template
      await $fetch('/api/templates', {
        method: 'POST',
        body: formData
      })
    }
    
    emit('saved')
  } catch (err: any) {
    error.value = err.message || 'Failed to save template'
  } finally {
    loading.value = false
  }
}
</script>