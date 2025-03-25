<template>
  <!-- User Menu -->
  <div class="relative">
    <Button
      class="p-2 flex items-center"
      severity="secondary"
      text
      @click="toggleUserMenu"
      aria-label="User Menu"
    >
      <div class="avatar-circle mr-2">
        <template v-if="userStore.photoUrl">
          <img :src="userStore.photoUrl" alt="User photo" class="h-full w-full object-cover rounded-full" />
        </template>
        <template v-else>
          {{ userInitials }}
        </template>
      </div>
      <!-- Only show name on larger screens, hide on smaller ones -->
      <span class="hidden md:inline truncate max-w-[100px]">{{ userStore.firstName }}</span>
    </Button>
    <TieredMenu 
      ref="userMenu"
      :model="menuItems"
      :popup="true"
    />
  </div>
</template>

<script setup>
import { useUserStore } from '~/stores/user';

const userStore = useUserStore();
const userInitials = computed(() => {
  if (!userStore.firstName && !userStore.lastName && !userStore.email) return '?';
  
  if (userStore.firstName && userStore.lastName) {
    return `${userStore.firstName.charAt(0)}${userStore.lastName.charAt(0)}`;
  }
  
  if (userStore.email) {
    return userStore.email.charAt(0).toUpperCase();
  }
  
  return userStore.firstName?.charAt(0) || '?';
});

// Update menu items to include profile
const menuItems = [
  {
    label: userStore.fullName || userStore.email,
    disabled: true,
    class: 'font-bold'
  },
  {
    separator: true
  },
  {
    label: 'Profile',
    icon: 'pi pi-user',
    command: () => navigateTo('/profile')
  },
  {
    label: 'Account Settings',
    icon: 'pi pi-cog',
    command: () => navigateTo('/settings')
  },
  {
    separator: true
  },
  {
    label: 'Sign out',
    icon: 'pi pi-sign-out',
    command: handleLogout
  }
];

const toggleUserMenu = (event: Event) => {
  userMenu.value?.toggle(event)
}
</script>

<style scoped>
.avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--primary-color, #dc2626);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
}
</style>