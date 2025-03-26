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
        >
          <option value="" disabled>Select a template</option>
          <option v-for="template in templates" :key="template.id" :value="template.id">
            {{ template.name }}
          </option>
        </select>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Selected Recipients ({{ selectedRecipients.length }})</label>
        
        <div v-if="selectedRecipients.length === 0" class="text-gray-400 italic">
          No recipients selected. Please select at least one recipient below.
        </div>
        
        <div v-else class="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-2 mb-2">
          <div v-for="(recipient, index) in selectedRecipients" :key="index" class="flex justify-between py-1">
            <div>
              <span class="font-medium">{{ recipient.name }}</span>
              <span class="text-gray-500 ml-2">{{ recipient.email }}</span>
            </div>
            <button 
              type="button" 
              @click="removeRecipient(index)" 
              class="text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="previewTemplate" class="bg-gray-50 p-4 rounded-md">
        <h3 class="font-medium mb-2">Template Preview</h3>
        <p><strong>Subject:</strong> {{ previewTemplate.subject }}</p>
        <div class="mt-2">
          <strong>Body:</strong>
          <div class="mt-1 border border-gray-300 rounded-md p-3 bg-white">
            {{ previewTemplate.body }}
          </div>
        </div>
        <p class="text-sm text-gray-500 mt-2">
          Note: This is a preview. Variables will be replaced with actual values for each recipient.
        </p>
      </div>
      
      <div class="pt-4 flex justify-end space-x-3">
        <button 
          type="button" 
          @click="cancel"
          class="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          class="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          :disabled="loading || selectedRecipients.length === 0 || !selectedTemplateId"
        >
          <span v-if="loading">Sending...</span>
          <span v-else>Send to {{ selectedRecipients.length }} Recipients</span>
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
import { ref, computed, onMounted, defineProps, defineEmits, watch } from 'vue'

const props = defineProps({
  recipients: {
    type: Array,
    default: () => []
  },
  recipientType: {
    type: String,
    default: 'student' // or 'lead'
  }
})

const emit = defineEmits(['sent', 'cancel'])

interface Template {
  id: string
  name: string
  subject: string
  body: string
}

interface Recipient {
  id: string
  name: string
  email: string
  variables: Record<string, string>
}

const templates = ref<Template[]>([])
const selectedTemplateId = ref('')
const selectedRecipients = ref<Recipient[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

// Watch for changes in the recipients prop
watch(() => props.recipients, (newRecipients) => {
  selectedRecipients.value = [...newRecipients]
}, { immediate: true })

// Computed property for template preview
const previewTemplate = computed(() => {
  if (!selectedTemplateId.value) return null
  
  const template = templates.value.find(t => t.id === selectedTemplateId.value)
  if (!template) return null
  
  return {
    subject: template.subject,
    body: template.body
  }
})

onMounted(async () => {
  await fetchTemplates()
})

async function fetchTemplates() {
  try {
    templates.value = await $fetch('/api/templates')
  } catch (err: any) {
    error.value = 'Failed to load templates'
  }
}

function removeRecipient(index: number) {
  selectedRecipients.value.splice(index, 1)
}

function cancel() {
  emit('cancel')
}

async function submitForm() {
  if (selectedRecipients.value.length === 0 || !selectedTemplateId.value) {
    error.value = 'Please select a template and at least one recipient'
    return
  }
  
  try {
    loading.value = true
    error.value = null
    success.value = null
    
    // Format recipients for the API
    const recipientsForApi = selectedRecipients.value.map(recipient => ({
      to: recipient.email,
      recipientType: props.recipientType,
      recipientId: recipient.id,
      variables: recipient.variables
    }))
    
    await $fetch('/api/communications/send-bulk', {
      method: 'POST',
      body: {
        recipients: recipientsForApi,
        templateId: selectedTemplateId.value
      }
    })
    
    success.value = `Emails sent successfully to ${selectedRecipients.value.length} recipients!`
    emit('sent')
    
  } catch (err: any) {
    error.value = err.message || 'Failed to send emails'
  } finally {
    loading.value = false
  }
}
</script>