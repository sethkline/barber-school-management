<template>
  <div class="container mx-auto py-6">
    <div v-if="loading" class="flex justify-center my-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>
    
    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <strong>Error:</strong> {{ error }}
    </div>
    
    <template v-else>
      <h1 class="text-2xl font-bold mb-6">Edit Email Template</h1>
      <BarberButton label="Back to Templates" variant="secondary" @click="$router.push('/admin/templates')" />
      
      <div class="bg-white shadow rounded-lg p-6">
        <TemplatesTemplateForm :template="template" @saved="onSaved" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

interface Template {
  id: string
  name: string
  subject: string
  body: string
  created_at: string
}

const router = useRouter()
const route = useRoute()

const template = ref<Template | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  await fetchTemplate()
})

async function fetchTemplate() {
  const templateId = route.params.id as string
  
  try {
    loading.value = true
    error.value = null
    template.value = await $fetch(`/api/templates/${templateId}`)
  } catch (err: any) {
    error.value = err.message || 'Failed to load template'
  } finally {
    loading.value = false
  }
}

function onSaved() {
  router.push('/admin/templates')
}
</script>