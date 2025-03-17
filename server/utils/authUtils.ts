// server/utils/authUtils.ts
import { H3Event, createError } from 'h3'

/**
 * Middleware to check if the current user has admin role
 */
export async function checkAdminRole(event: H3Event) {
  // The user should already be set in the context by the auth middleware
  const user = event.context.user
  
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }
  
  // Check if user has admin role
  const metadata = user.app_metadata || {}
  
  if (metadata.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Insufficient permissions'
    })
  }
  
  return user
}

/**
 * Check if the current user has at least staff role (staff, instructor, or admin)
 */
export async function checkStaffRole(event: H3Event) {
  // The user should already be set in the context by the auth middleware
  const user = event.context.user
  
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }
  
  // Check if user has at least staff role
  const metadata = user.app_metadata || {}
  const role = metadata.role
  
  if (!role || (role !== 'admin' && role !== 'instructor' && role !== 'staff' && role !== 'receptionist')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Insufficient permissions'
    })
  }
  
  return user
}