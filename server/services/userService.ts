// User service using AWS Cognito Admin SDK
import { cognitoService, type CognitoUser } from '~/server/utils/cognitoClient'

// Define user role types
export type UserRole = 'admin' | 'instructor' | 'staff' | 'receptionist'

// Define the User type
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

// Helper to convert CognitoUser to User
function cognitoUserToUser(cognitoUser: CognitoUser): User {
  return {
    id: cognitoUser.id,
    email: cognitoUser.email,
    first_name: cognitoUser.firstName,
    last_name: cognitoUser.lastName,
    role: (cognitoUser.role || 'staff') as UserRole,
    is_active: cognitoUser.isActive,
    created_at: cognitoUser.createdAt || new Date().toISOString(),
    phone: cognitoUser.phone,
    profile_image_url: cognitoUser.profileImageUrl
  }
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
    // Build filter for Cognito ListUsers
    // Cognito supports filtering by email, phone_number, username, etc.
    let filter: string | undefined
    if (search) {
      // Search by email (Cognito supports email filter)
      filter = `email ^= "${search}"`
    }

    const result = await cognitoService.adminListUsers({
      limit: 60, // Get more users for in-memory filtering
      filter
    })

    let filteredUsers = result.users.map(cognitoUserToUser)

    // Apply additional search filter for name (in memory since Cognito doesn't support custom attribute filtering)
    if (search) {
      const searchLower = search.toLowerCase()
      filteredUsers = filteredUsers.filter(user =>
        user.email.toLowerCase().includes(searchLower) ||
        user.first_name.toLowerCase().includes(searchLower) ||
        user.last_name.toLowerCase().includes(searchLower)
      )
    }

    // Apply role filter
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role)
    }

    // Get total count before pagination
    const count = filteredUsers.length

    // Apply pagination
    const offset = (page - 1) * limit
    filteredUsers = filteredUsers.slice(offset, offset + limit)

    return { data: filteredUsers, count }
  },

  /**
   * Get a single user by ID (Cognito username/email)
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const cognitoUser = await cognitoService.adminGetUser(id)
      return cognitoUserToUser(cognitoUser)
    } catch (error: any) {
      if (error.name === 'UserNotFoundException') {
        return null
      }
      console.error('Error fetching user:', error)
      return null
    }
  },

  /**
   * Get a single user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return this.getUserById(email)
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
    const cognitoUser = await cognitoService.adminCreateUser({
      email,
      password,
      firstName: first_name,
      lastName: last_name,
      role,
      phone
    })

    // If the user should not be active, disable them
    if (!is_active) {
      await cognitoService.adminDisableUser(email)
    }

    return {
      ...cognitoUserToUser(cognitoUser),
      is_active
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
    // Get current user data
    const currentUser = await this.getUserById(id)
    if (!currentUser) {
      throw new Error(`User with ID ${id} not found`)
    }

    // Update user attributes
    const attributes: {
      firstName?: string
      lastName?: string
      role?: string
      phone?: string
      profileImageUrl?: string
    } = {}

    if (first_name !== undefined) attributes.firstName = first_name
    if (last_name !== undefined) attributes.lastName = last_name
    if (role !== undefined) attributes.role = role
    if (phone !== undefined) attributes.phone = phone
    if (profile_image_url !== undefined) attributes.profileImageUrl = profile_image_url

    // Update attributes if any
    if (Object.keys(attributes).length > 0) {
      await cognitoService.adminUpdateUser(id, attributes)
    }

    // Handle enable/disable
    if (is_active !== undefined && is_active !== currentUser.is_active) {
      if (is_active) {
        await cognitoService.adminEnableUser(id)
      } else {
        await cognitoService.adminDisableUser(id)
      }
    }

    // Return the updated user
    return {
      ...currentUser,
      email: email || currentUser.email,
      first_name: first_name ?? currentUser.first_name,
      last_name: last_name ?? currentUser.last_name,
      role: role ?? currentUser.role,
      is_active: is_active ?? currentUser.is_active,
      phone: phone ?? currentUser.phone,
      profile_image_url: profile_image_url ?? currentUser.profile_image_url
    }
  },

  /**
   * Reset a user's password
   */
  async resetUserPassword(id: string, newPassword: string): Promise<boolean> {
    await cognitoService.adminSetPassword(id, newPassword)
    return true
  },

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<boolean> {
    await cognitoService.adminDeleteUser(id)
    return true
  },

  /**
   * Enable a user
   */
  async enableUser(id: string): Promise<boolean> {
    await cognitoService.adminEnableUser(id)
    return true
  },

  /**
   * Disable a user
   */
  async disableUser(id: string): Promise<boolean> {
    await cognitoService.adminDisableUser(id)
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
