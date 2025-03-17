import { defineNuxtRouteMiddleware, navigateTo } from '#imports'
import { useNavigation } from '~/composables/useNavigation'
import { useUserStore } from '~/stores/user'

export default defineNuxtRouteMiddleware((to) => {
  // Skip role check for public routes
  const publicRoutes = ['/login', '/signup']
  if (publicRoutes.includes(to.path)) {
    return
  }

  // Only run on client-side
  if (process.server) {
    return
  }

  const navigation = useNavigation()
  const userStore = useUserStore()
  
  // Ensure navigation role matches user store
  if (userStore.role) {
    navigation.setRole(userStore.role)
  }
  
  // Check if user has access to this route
  if (!navigation.hasRouteAccess(to.path)) {
    console.warn(`User with role ${userStore.role} doesn't have access to ${to.path}`)
    return navigateTo('/dashboard')
  }
})