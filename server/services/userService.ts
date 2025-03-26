import { getSupabaseClient } from '~/server/utils/supabaseClient'
import type {
  Tables,
  TablesInsert,
  TablesUpdate
} from '~/types/supabase'

// Define user role types
export type UserRole = 'admin' | 'instructor' | 'staff' | 'receptionist'

// Define the User type (extend from auth.users)
export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  is_active: boolean
  created_at: string
  last_login?: string
  phone?: string
  profile_image_url?: string
}

export interface ListUsersParams {
  page?: number
  limit?: number
  search?: string
  role?: string
}

export interface UserCreateParams {
  email: string
  password: string
  first_name: string
  last_name: string
  role: UserRole
  phone?: string
  is_active?: boolean
}

export interface UserUpdateParams {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  role?: UserRole
  phone?: string
  is_active?: boolean
  profile_image_url?: string
}

export const userService = {
  /**
   * Get a paginated list of users
   */
  async getUsers({
    page = 1,
    limit = 10,
    search = '',
    role = ''
  }: ListUsersParams): Promise<{ data: User[]; count: number }> {
    const supabase = getSupabaseClient()
    const adminClient = supabase.auth.admin

    let query = adminClient.listUsers()

    // We'll handle filtering and pagination in memory since Supabase Auth API doesn't support these directly
    let userData = await query
    
    let filteredData = userData.data.users.map(user => {
      // Map auth user data to our User interface
      // Assuming user metadata contains our additional fields
      const metadata = user.user_metadata || {}
      const userdata = user.user_metadata || {}
      
      return {
        id: user.id,
        email: user.email || '',
        first_name: metadata.first_name || '',
        last_name: metadata.last_name || '',
        role: (metadata.role || 'staff') as UserRole,
        is_active: userdata.is_active || false,
        created_at: user.created_at,
        last_login: user.last_sign_in_at,
        phone: metadata.phone,
        profile_image_url: metadata.profile_image_url
      }
    })

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filteredData = filteredData.filter(user =>
        user.email.toLowerCase().includes(searchLower) ||
        user.first_name.toLowerCase().includes(searchLower) ||
        user.last_name.toLowerCase().includes(searchLower)
      )
    }

    // Apply role filter
    if (role) {
      filteredData = filteredData.filter(user => user.role === role)
    }

    // Get total count before pagination
    const count = filteredData.length

    // Apply pagination
    const offset = (page - 1) * limit
    filteredData = filteredData.slice(offset, offset + limit)

    return { data: filteredData, count }
  },

  /**
   * Get a single user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    const supabase = getSupabaseClient()
    const adminClient = supabase.auth.admin

    const { data, error } = await adminClient.getUserById(id)
    
    if (error || !data.user) {
      console.error('Error fetching user:', error)
      return null
    }

    const user = data.user
    const metadata = user.user_metadata || {}

    return {
      id: user.id,
      email: user.email || '',
      first_name: metadata.first_name || '',
      last_name: metadata.last_name || '',
      role: (metadata.role || 'staff') as UserRole,
      is_active: user.banned === false,
      created_at: user.created_at,
      last_login: user.last_sign_in_at,
      phone: metadata.phone,
      profile_image_url: metadata.profile_image_url
    }
  },

  /**
   * Create a new user
   */
  async createUser({
    email,
    password,
    first_name,
    last_name,
    role,
    phone,
    is_active = true
  }: UserCreateParams): Promise<User> {
    const supabase = getSupabaseClient()
    const adminClient = supabase.auth.admin

    // Create the user with the provided details
    const { data, error } = await adminClient.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        role,
        phone
      },
      app_metadata: {
        role // Also store role in app_metadata for RLS policies
      }
    })

    if (error || !data.user) {
      throw new Error(`Failed to create user: ${error?.message}`)
    }

    // If the user should not be active, ban them
    if (!is_active) {
      await adminClient.updateUserById(data.user.id, { banned: true })
    }

    // Return the created user
    return {
      id: data.user.id,
      email: email,
      first_name,
      last_name,
      role,
      is_active,
      created_at: data.user.created_at,
      phone
    }
  },

  /**
   * Update an existing user
   */
  async updateUser({
    id,
    first_name,
    last_name,
    email,
    role,
    phone,
    is_active,
    profile_image_url
  }: UserUpdateParams): Promise<User> {
    const supabase = getSupabaseClient()
    const adminClient = supabase.auth.admin

    // Get current user data for updating
    const currentUser = await this.getUserById(id)
    if (!currentUser) {
      throw new Error(`User with ID ${id} not found`)
    }

    // Prepare update data
    const updates: any = {}
    const metadataUpdates: any = {}

    if (email && email !== currentUser.email) {
      updates.email = email
    }

    if (is_active !== undefined && is_active !== currentUser.is_active) {
      updates.banned = !is_active
    }

    // Prepare user metadata updates
    if (first_name !== undefined) metadataUpdates.first_name = first_name
    if (last_name !== undefined) metadataUpdates.last_name = last_name
    if (role !== undefined) {
      metadataUpdates.role = role
      // Also update app_metadata for RLS policies
      updates.app_metadata = { role }
    }
    if (phone !== undefined) metadataUpdates.phone = phone
    if (profile_image_url !== undefined) metadataUpdates.profile_image_url = profile_image_url

    // Only update if we have changes
    if (Object.keys(metadataUpdates).length > 0) {
      updates.user_metadata = {
        ...currentUser,
        ...metadataUpdates
      }
    }

    // Perform the update if we have updates
    if (Object.keys(updates).length > 0) {
      const { data, error } = await adminClient.updateUserById(id, updates)
      
      if (error || !data.user) {
        throw new Error(`Failed to update user: ${error?.message}`)
      }
    }

    // Return the updated user
    return {
      ...currentUser,
      email: email || currentUser.email,
      first_name: first_name || currentUser.first_name,
      last_name: last_name || currentUser.last_name,
      role: role || currentUser.role,
      is_active: is_active !== undefined ? is_active : currentUser.is_active,
      phone: phone || currentUser.phone,
      profile_image_url: profile_image_url || currentUser.profile_image_url
    }
  },

  /**
   * Reset a user's password
   */
  async resetUserPassword(id: string, newPassword: string): Promise<boolean> {
    const supabase = getSupabaseClient()
    const adminClient = supabase.auth.admin

    const { error } = await adminClient.updateUserById(id, {
      password: newPassword
    })

    if (error) {
      throw new Error(`Failed to reset password: ${error.message}`)
    }

    return true
  },

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<boolean> {
    const supabase = getSupabaseClient()
    const adminClient = supabase.auth.admin

    const { error } = await adminClient.deleteUser(id)

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`)
    }

    return true
  },

  /**
   * Get all available user roles
   */
  getUserRoles(): { label: string; value: UserRole }[] {
    return [
      { label: 'Administrator', value: 'admin' },
      { label: 'Instructor', value: 'instructor' },
      { label: 'Staff', value: 'staff' },
      { label: 'Receptionist', value: 'receptionist' }
    ]
  }
}