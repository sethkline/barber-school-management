// server/middleware/auth.global.ts
import { defineNuxtRouteMiddleware, navigateTo, useRequestEvent } from '#imports'
import { getCookie } from 'h3'

export default defineNuxtRouteMiddleware((to, from) => {
  // Allow access to public routes
  const publicRoutes = ['/login', '/signup']
  if (publicRoutes.includes(to.path)) {
    return true
  }

  // If we're on the client, skip the cookie check since HTTP-only cookies aren't accessible
  if (process.client) {
    return true
  }
  
  // Now we're in a server context. Get the current event.
  const event = useRequestEvent()
  if (!event) {
    // If, for some reason, there's no event, redirect to login.
    return navigateTo('/login')
  }
  
  // Retrieve the access token from the cookies.
  const accessToken = getCookie(event, 'access_token')
  
  if (!accessToken) {
    return navigateTo('/login')
  }
  
  // If the access token exists, allow navigation.
  return true
})
