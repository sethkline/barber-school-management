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
            <!-- Top-level menu items without dropdowns -->
            <NuxtLink
              v-for="item in topLevelItems"
              :key="item.path"
              :to="item.path"
              class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              :class="{ 'border-primary-500 text-primary-600': route.path.startsWith(item.path) }"
            >
              {{ item.label }}
            </NuxtLink>
            
            <!-- Dropdown menu items -->
            <div 
              v-for="dropdown in dropdownItems" 
              :key="dropdown.label"
              class="relative inline-flex items-center dropdown-menu"
            >
              <button
                @click="toggleDropdownMenu(dropdown.label)"
                type="button"
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                :class="{ 'border-primary-500 text-primary-600': isActiveDropdown(dropdown) }"
              >
                {{ dropdown.label }}
                <i class="pi pi-chevron-down ml-1 text-xs"></i>
              </button>
              
              <div 
                v-show="activeDropdowns[dropdown.label]" 
                class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                style="top: 100%"
              >
                <div class="py-1">
                  <template v-for="(group, groupIndex) in dropdown.items" :key="groupIndex">
                    <template v-for="section in group" :key="section.label">
                      <div v-if="section.label" class="px-4 py-2 text-xs font-semibold text-gray-500">
                        {{ section.label }}
                      </div>
                      <NuxtLink 
                        v-for="item in section.items" 
                        :key="item.path"
                        :to="item.path"
                        class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        @click="closeAllDropdowns"
                      >
                        {{ item.label }}
                      </NuxtLink>
                    </template>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right side items -->
        <div class="flex items-center">
          <!-- User Menu -->
          <!-- <NavigationAvatar /> -->
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
        <!-- Top level items -->
        <NuxtLink
          v-for="item in topLevelItems"
          :key="item.path"
          :to="item.path"
          class="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
          :class="{ 'bg-primary-50 text-primary-600': route.path.startsWith(item.path) }"
          @click="mobileMenuOpen = false"
        >
          {{ item.label }}
        </NuxtLink>
        
        <!-- Mobile Dropdown Menus -->
        <div 
          v-for="dropdown in dropdownItems" 
          :key="dropdown.label" 
          class="block px-4 py-2"
        >
          <div 
            class="flex items-center justify-between text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100" 
            @click="toggleMobileSubmenu(dropdown.label)"
          >
            <span>{{ dropdown.label }}</span>
            <i :class="['pi', mobileExpandedMenus[dropdown.label] ? 'pi-chevron-up' : 'pi-chevron-down']"></i>
          </div>
          
          <div v-show="mobileExpandedMenus[dropdown.label]" class="pl-4 mt-2 space-y-1">
            <template v-for="(group, groupIndex) in dropdown.items" :key="groupIndex">
              <template v-for="section in group" :key="section.label">
                <div v-if="section.label" class="text-xs font-semibold text-gray-500 mt-2 mb-1">
                  {{ section.label }}
                </div>
                <NuxtLink 
                  v-for="item in section.items" 
                  :key="item.path"
                  :to="item.path"
                  class="block py-2 text-sm font-medium text-gray-500 hover:text-gray-800"
                  @click="mobileMenuOpen = false"
                >
                  {{ item.label }}
                </NuxtLink>
              </template>
            </template>
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
import { ref, onMounted, onUnmounted, computed, watchEffect } from '#imports'
import { useUserStore } from '~/stores/user'
import { useNavigation } from '~/composables/useNavigation'
import TieredMenu from 'primevue/tieredmenu'
import Button from 'primevue/button'
import Sidebar from 'primevue/sidebar'
import { useToast } from 'primevue/usetoast'

const route = useRoute()
const toast = useToast()
const userStore = useUserStore()
const navigation = useNavigation()
const mobileMenuOpen = ref(false)
const userMenu = ref()
const activeDropdowns = ref<Record<string, boolean>>({})
const mobileExpandedMenus = ref<Record<string, boolean>>({})

// Set navigation role based on user role
watchEffect(() => {
  if (userStore.role) {
    navigation.setRole(userStore.role)
  }
})

// Separate navigation items into top-level and dropdown menus
const topLevelItems = computed(() => {
  return navigation.navigationItems.value.filter(item => !item.items)
})

const dropdownItems = computed(() => {
  return navigation.navigationItems.value.filter(item => item.items)
})

// Check if a dropdown should be highlighted based on current route
const isActiveDropdown = (dropdown: any) => {
  if (!dropdown.items) return false
  
  // Check if any child item path matches the current route
  for (const group of dropdown.items) {
    for (const section of group) {
      for (const item of section.items) {
        if (route.path.startsWith(item.path)) {
          return true
        }
      }
    }
  }
  
  return false
}

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
    navigateTo('/login')
    
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

const toggleDropdownMenu = (name: string) => {
  // Close all other dropdowns
  Object.keys(activeDropdowns.value).forEach(key => {
    if (key !== name) {
      activeDropdowns.value[key] = false
    }
  })
  
  // Toggle this dropdown
  activeDropdowns.value[name] = !activeDropdowns.value[name]
}

const toggleMobileSubmenu = (name: string) => {
  mobileExpandedMenus.value[name] = !mobileExpandedMenus.value[name]
}

const closeAllDropdowns = () => {
  Object.keys(activeDropdowns.value).forEach(key => {
    activeDropdowns.value[key] = false
  })
}

const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  const dropdowns = document.querySelectorAll('.dropdown-menu')
  
  let insideDropdown = false
  dropdowns.forEach(dropdown => {
    if (dropdown.contains(target)) {
      insideDropdown = true
    }
  })
  
  if (!insideDropdown) {
    closeAllDropdowns()
  }
}

const menuItems = [
  {
    label: 'Profile',
    icon: 'pi pi-user',
    command: () => navigateTo('/profile')
  },
  {
    label: `Role: ${userStore.role || 'User'}`,
    disabled: true
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

<style scoped>
</style>