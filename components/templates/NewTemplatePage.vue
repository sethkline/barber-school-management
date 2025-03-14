<template>
  <div class="container mx-auto py-6">
    <h1 class="text-2xl font-bold mb-6">Create New Email Template</h1>
    
    <div class="bg-white shadow rounded-lg p-6">
      <TemplatesTemplateForm @saved="onSaved" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function onSaved() {
  router.push('/admin/templates')
}
</script>