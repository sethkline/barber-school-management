<!-- pages/admin/users/index.vue -->
<template>
  <div class="py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-6">
        <h1 class="text-2xl font-semibold text-gray-900">User Management</h1>
        <p class="mt-1 text-sm text-gray-500">
          Manage user accounts, roles, and permissions
        </p>
      </div>
      
      <AdminUserList />
    </div>
  </div>
</template>

<script setup lang="ts">

// Set page metadata
definePageMeta({
  layout: 'default',
  // middleware: ['admin-auth'] 
  // TODO add middleware
})
</script>