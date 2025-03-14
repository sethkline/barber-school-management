<template>
  <div>
    <form @submit.prevent="submitForm" class="space-y-6">
      <div>
        <label for="template" class="block text-sm font-medium text-gray-700">Email Template</label>
        <select 
          id="template" 
          v-model="selectedTemplateId"
          required
          class="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          @change="onTemplateChange"
        >
          <option value="" disabled>Select a template</option>
          <option v-for="template in templates" :key="template.id" :value="template.id">
            {{ template.name }}
          </option>
        </select>
      </div>
      
      <div>
        <label for="to" class="block text-sm font-medium text-gray-700">To</label>
        <input 
          type="email" 
          id="to" 
          v-model="formData.to"
          required
          class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      
      <div>
        <label for="subject" class="block text-sm font-medium text-gray-700">Subject</label>
        <input 
          type="text" 
          id="subject" 
          v-model="formData.subject"
          required
          class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      
      <div>
        <label for="body" class="block text-sm font-medium text-gray-700">Message</label>
        <textarea 
          id="body" 
          v-model="formData.body"
          rows="8"
          required
          class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        ></textarea>
      </div>
      
      <div class="pt-2 flex justify-end">
        <button 
          type="submit" 
          class="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          :disabled="loading"
        >
          <span v-if="loading">Sending...</span>
          <span v-else>Send Email</span>
        </button>
      </div>
    </form>
    
    <div v-if="error" class="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      <strong>Error:</strong> {{ error }}
    </div>
    
    <div v-if="success" class="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
      <strong>Success:</strong> {{ success }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, defineProps, defineEmits } from 'vue'

const props = defineProps({
  recipientEmail: {
    type: String,
    default: ''
  },
  recipientType: {
    type: String,
    default: ''
  },
  recipientId: {
    type: String,
    default: ''
  },
  variables: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['sent'])

interface Template {
  id: string
  name: string
  subject: string
  body: string
}

const templates = ref<Template[]>([])
const selectedTemplateId = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const formData = reactive({
  to: '',
  subject: '',
  body: '',
  templateId: '',
  recipientType: '',
  recipientId: ''
})

onMounted(async () => {
  await fetchTemplates()
  
  // Initialize recipient email if provided
  if (props.recipientEmail) {
    formData.to = props.recipientEmail
  }
  
  // Initialize recipient type and ID if provided
  if (props.recipientType && props.recipientId) {
    formData.recipientType = props.recipientType
    formData.recipientId = props.recipientId
  }
})

async function fetchTemplates() {
  try {
    templates.value = await $fetch('/api/templates')
  } catch (err: any) {
    error.value = 'Failed to load templates'
  }
}

function onTemplateChange() {
  if (!selectedTemplateId.value) return
  
  const template = templates.value.find(t => t.id === selectedTemplateId.value)
  if (!template) return
  
  formData.templateId = template.id
  
  // Apply template with variable substitution
  formData.subject = processTemplate(template.subject, props.variables)
  formData.body = processTemplate(template.body, props.variables)
}

function processTemplate(content: string, variables: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
    return variables[variable] || match
  })
}

async function submitForm() {
  try {
    loading.value = true
    error.value = null
    success.value = null
    
    await $fetch('/api/communications/send-email', {
      method: 'POST',
      body: {
        to: formData.to,
        subject: formData.subject,
        body: formData.body,
        templateId: formData.templateId,
        recipientType: formData.recipientType,
        recipientId: formData.recipientId
      }
    })
    
    success.value = 'Email sent successfully!'
    emit('sent')
    
    // Reset form
    formData.subject = ''
    formData.body = ''
    selectedTemplateId.value = ''
    
  } catch (err: any) {
    error.value = err.message || 'Failed to send email'
  } finally {
    loading.value = false
  }
}
</script>