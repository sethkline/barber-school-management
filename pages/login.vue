<template>
  <div class="min-h-screen flex items-center justify-center relative overflow-hidden bg-surface-50 dark:bg-surface-900">
    <div class="absolute inset-0 bg-repeat opacity-5 dark:opacity-10 pattern-grid"></div>
    
    <div class="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8 relative z-10">
      <div class="hidden lg:flex flex-col flex-1 justify-center">
        <div>
          <img
            src="~/assets/barber-styling-institute-logo.png"
            alt="Barber School Management System Logo"
            class="mb-4 w-64 h-auto"
          />
          <h1 class="text-4xl font-bold mb-4 text-surface-900 dark:text-surface-50">
            Barber School Management System
          </h1>
          <p class="text-surface-600 dark:text-surface-400 text-xl leading-relaxed">
            From Student Enrollment to Lead Tracking, All in One Place.
          </p>
        </div>
      </div>
      
      <div class="w-full lg:w-[420px]">
        <div class="backdrop-blur-sm bg-white/90 dark:bg-surface-800/90 shadow-xl rounded-lg p-8">
          <LoginForm
            :loading="loading"
            @submit="handleLogin"
          />
        </div>
      </div>
    </div>
  </div>
</template> 


<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import type { LoginCredentials } from '@/types'

definePageMeta({
  layout: 'blank'
})

const router = useRouter()
const toast = useToast()
const loading = ref(false)

const handleLogin = async (credentials: LoginCredentials) => {
  loading.value = true
  try {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: credentials
    })
    console.log('Login successful:', response)
    router.push('/dashboard')
  } catch (err: any) {
    console.warn(err)
    toast.add({
      severity: 'error',
      summary: 'Login Error',
      detail: err.data?.message || 'Invalid email or password',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}
</script>

<style>
.pattern-grid {
  background-image:
    linear-gradient(var(--p-surface-300) 1px, transparent 1px),
    linear-gradient(90deg, var(--p-surface-300) 1px, transparent 1px);
  background-size: 20px 20px;
  width: 100vw;
  height: 100vh;
}

/* Dark mode adjustments */
.dark .pattern-grid {
  background-image:
    linear-gradient(var(--p-surface-700) 1px, transparent 1px),
    linear-gradient(90deg, var(--p-surface-700) 1px, transparent 1px);
}
</style>