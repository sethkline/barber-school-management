<script setup lang="ts">
import { ref, onMounted } from 'vue'

const checking = ref(true)

onMounted(async () => {
  try {
    const user = await $fetch('/api/auth/me')
    if (user && user.isAuthenticated) {
      // Redirect to protected page
      await navigateTo('/')
    }
  } catch {
    // Not authenticated, stay on page
  } finally {
    checking.value = false
  }
})
</script>

<template>
  <div>{{ checking ? 'Checking authentication...' : 'Waiting for login...' }}</div>
</template>