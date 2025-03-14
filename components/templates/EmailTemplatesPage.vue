<template>
  <div class="container mx-auto py-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Email Templates</h1>
      <NuxtLink to="/admin/templates/new" class="bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded">
        New Template
      </NuxtLink>
    </div>
    
    <!-- Loading and error states -->
    <div v-if="loading" class="flex justify-center my-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
    
    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <strong>Error:</strong> {{ error }}
    </div>
    
    <!-- Template list -->
    <div v-else-if="templates.length === 0" class="text-center my-8 text-gray-500">
      No templates found. Create your first template to get started.
    </div>
    
    <div v-else class="bg-white shadow rounded-lg overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Subject
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="template in templates" :key="template.id">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ template.name }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-500">{{ template.subject }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-500">
                {{ new Date(template.created_at).toLocaleDateString() }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex justify-end space-x-2">
                <NuxtLink :to="`/admin/templates/${template.id}`" class="text-blue-600 hover:text-blue-900">
                  Edit
                </NuxtLink>
                <button @click="confirmDelete(template)" class="text-red-600 hover:text-red-900">
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Delete confirmation modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 flex items-center justify-center z-50">
      <div class="fixed inset-0 bg-black opacity-50"></div>
      <div class="bg-white p-6 rounded-lg shadow-lg z-10 max-w-md w-full">
        <h3 class="text-lg font-semibold mb-4">Confirm Deletion</h3>
        <p class="mb-6">Are you sure you want to delete the template "{{ templateToDelete?.name }}"? This action cannot be undone.</p>
        <div class="flex justify-end space-x-3">
          <button @click="showDeleteModal = false" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">
            Cancel
          </button>
          <button @click="deleteTemplate" class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Template {
  id: string
  name: string
  subject: string
  body: string
  created_at: string
}

const templates = ref<Template[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const showDeleteModal = ref(false)
const templateToDelete = ref<Template | null>(null)

onMounted(async () => {
  await fetchTemplates()
})

async function fetchTemplates() {
  try {
    loading.value = true
    error.value = null
    templates.value = await $fetch('/api/templates')
  } catch (err: any) {
    error.value = err.message || 'Failed to load templates'
  } finally {
    loading.value = false
  }
}

function confirmDelete(template: Template) {
  templateToDelete.value = template
  showDeleteModal.value = true
}

async function deleteTemplate() {
  if (!templateToDelete.value) return
  
  try {
    loading.value = true
    await $fetch(`/api/templates/${templateToDelete.value.id}`, {
      method: 'DELETE'
    })
    templates.value = templates.value.filter(t => t.id !== templateToDelete.value?.id)
    showDeleteModal.value = false
    templateToDelete.value = null
  } catch (err: any) {
    error.value = err.message || 'Failed to delete template'
  } finally {
    loading.value = false
  }
}
</script>