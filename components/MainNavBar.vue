<template>
  <nav class="bg-white border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <!-- Left side navigation -->
        <div class="flex">
          <div class="flex-shrink-0 flex items-center">
            <h1 class="text-xl font-bold text-gray-800">Student Portal</h1>
          </div>
          <!-- Desktop Navigation -->
          <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
            <NuxtLink
              v-for="item in navigationItems"
              :key="item.path"
              :to="item.path"
              class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              :class="{ 'border-primary-500 text-primary-600': route.path.startsWith(item.path) }"
            >
              {{ item.label }}
            </NuxtLink>
            
            <div class="relative inline-flex items-center communications-dropdown">
              <button
                @click="toggleCommunicationsMenu"
                type="button"
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                :class="{ 'border-primary-500 text-primary-600': route.path.startsWith('/communications') || route.path.startsWith('/admin/templates') }"
              >
                Communications
                <i class="pi pi-chevron-down ml-1 text-xs"></i>
              </button>
              
              <div 
                v-show="showCommunicationsMenu" 
                class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                style="top: 100%"
              >
                <div class="py-1">
                  <NuxtLink 
                    to="/admin/templates" 
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    @click="showCommunicationsMenu = false"
                  >
                    Email Templates
                  </NuxtLink>
                  <NuxtLink 
                    to="/communications/history" 
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    @click="showCommunicationsMenu = false"
                  >
                    Communication History
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right side items -->
        <div class="flex items-center">
          <!-- User Menu -->
          <div class="relative">
            <Button
              icon="pi pi-user"
              aria-label="User Menu"
              :label="userStore.fullName"
              @click="toggleUserMenu"
              severity="secondary"
              text
              class="p-2"
            />
            <TieredMenu 
              ref="userMenu"
              :model="menuItems"
              :popup="true"
            />
          </div>

          <!-- Mobile menu button -->
          <Button
            @click="mobileMenuOpen = !mobileMenuOpen"
            icon="pi pi-bars"
            class="sm:hidden ml-2"
            severity="secondary"
            text
          />
        </div>
      </div>
    </div>

    <!-- Mobile menu -->
    <Sidebar v-model:visible="mobileMenuOpen" position="right">
      <div class="pt-2 pb-3 space-y-1">
        <NuxtLink
          v-for="item in navigationItems"
          :key="item.path"
          :to="item.path"
          class="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
          :class="{ 'bg-primary-50 text-primary-600': route.path.startsWith(item.path) }"
          @click="mobileMenuOpen = false"
        >
          {{ item.label }}
        </NuxtLink>
        
        <!-- Mobile Communications Menu -->
        <div class="block px-4 py-2">
          <div class="flex items-center justify-between text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100" @click="mobileCommunicationsExpanded = !mobileCommunicationsExpanded">
            <span>Communications</span>
            <i :class="['pi', mobileCommunicationsExpanded ? 'pi-chevron-up' : 'pi-chevron-down']"></i>
          </div>
          
          <div v-show="mobileCommunicationsExpanded" class="pl-4 mt-2 space-y-1">
            <NuxtLink 
              to="/admin/templates" 
              class="block py-2 text-sm font-medium text-gray-500 hover:text-gray-800"
              @click="mobileMenuOpen = false"
            >
              Email Templates
            </NuxtLink>
            <NuxtLink 
              to="/communications/history" 
              class="block py-2 text-sm font-medium text-gray-500 hover:text-gray-800"
              @click="mobileMenuOpen = false"
            >
              Communication History
            </NuxtLink>
          </div>
        </div>
        
        <a 
          href="#" 
          class="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
          @click.prevent="handleLogout"
        >
          Sign out
        </a>
      </div>
    </Sidebar>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useUserStore } from '~/stores/user'
import TieredMenu from 'primevue/tieredmenu'
import Button from 'primevue/button'
import Sidebar from 'primevue/sidebar'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const userStore = useUserStore()
const mobileMenuOpen = ref(false)
const userMenu = ref()
const showCommunicationsMenu = ref(false)
const mobileCommunicationsExpanded = ref(false)

const navigationItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Students', path: '/students' },
  { label: 'Leads', path: '/leads' }
]

onMounted(async () => {
  // Fetch user data if not already loaded
  if (!userStore.isAuthenticated) {
    await userStore.fetchCurrentUser()
  }
  
  // Close dropdown when clicking outside
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleLogout = async () => {
  try {
    await $fetch('/api/auth/logout', {
      method: 'POST'
    })
    
    userStore.clearUser()
    router.push('/login')
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'You have been logged out successfully',
      life: 3000
    })
  } catch (err: any) {
    console.error('Logout error:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to logout. Please try again.',
      life: 3000
    })
  }
}

const toggleUserMenu = (event: Event) => {
  userMenu.value?.toggle(event)
}

const toggleCommunicationsMenu = (event: Event) => {
  event.stopPropagation()
  showCommunicationsMenu.value = !showCommunicationsMenu.value
}

const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  const dropdown = document.querySelector('.communications-dropdown')
  
  if (dropdown && !dropdown.contains(target)) {
    showCommunicationsMenu.value = false
  }
}

const menuItems = [
  {
    label: 'Profile',
    icon: 'pi pi-user',
    command: () => router.push('/profile')
  },
  {
    separator: true
  },
  {
    label: 'Sign out',
    icon: 'pi pi-sign-out',
    command: handleLogout
  }
]
</script>