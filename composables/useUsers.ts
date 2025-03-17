import { ref, reactive, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import type { User, UserRole } from '~/server/services/userService'

export default function useUsers() {
  const users = ref<User[]>([])
  const selectedUser = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref('')
  const totalCount = ref(0)
  const isModalOpen = ref(false)
  const isDeleteModalOpen = ref(false)
  const formMode = ref<'create' | 'edit'>('create')
  
  const toast = useToast()
  
  const filters = reactive({
    page: 1,
    limit: 10,
    search: '',
    role: ''
  })
  
  // Pagination computed props
  const totalPages = computed(() => Math.ceil(totalCount.value / filters.limit))
  const currentPage = computed(() => filters.page)
  
  // Available roles
  const roleOptions = [
    { label: 'All Roles', value: '' },
    { label: 'Administrator', value: 'admin' },
    { label: 'Instructor', value: 'instructor' },
    { label: 'Staff', value: 'staff' },
    { label: 'Receptionist', value: 'receptionist' }
  ]
  
  // Fetch users with filters and pagination
  async function fetchUsers() {
    isLoading.value = true
    error.value = ''
    
    try {
      const queryParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString())
      })
      
      const response = await $fetch(`/api/admin/users?${queryParams.toString()}`)
      
      users.value = response.data
      totalCount.value = response.count
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch users'
      console.error('Error fetching users:', err)
    } finally {
      isLoading.value = false
    }
  }
  
  // Get a user by ID
  async function fetchUserById(id: string) {
    isLoading.value = true
    error.value = ''
    
    try {
      selectedUser.value = await $fetch(`/api/admin/users/${id}`)
      return selectedUser.value
    } catch (err: any) {
      error.value = err.message || `Failed to fetch user with ID ${id}`
      console.error('Error fetching user:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }
  
  // Create a new user
  async function createUser(userData: any) {
    isLoading.value = true
    error.value = ''
    
    try {
      const newUser = await $fetch('/api/admin/users', {
        method: 'POST',
        body: userData
      })
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'User created successfully',
        life: 3000
      })
      
      // Refresh the user list
      await fetchUsers()
      
      return newUser
    } catch (err: any) {
      error.value = err.message || 'Failed to create user'
      console.error('Error creating user:', err)
      
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.value,
        life: 3000
      })
      
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  // Update an existing user
  async function updateUser(id: string, userData: any) {
    isLoading.value = true
    error.value = ''
    
    try {
      const updatedUser = await $fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        body: userData
      })
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'User updated successfully',
        life: 3000
      })
      
      // Update the selected user if it's the same one
      if (selectedUser.value?.id === id) {
        selectedUser.value = updatedUser
      }
      
      // Refresh the user list
      await fetchUsers()
      
      return updatedUser
    } catch (err: any) {
      error.value = err.message || `Failed to update user with ID ${id}`
      console.error('Error updating user:', err)
      
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.value,
        life: 3000
      })
      
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  // Delete a user
  async function deleteUser(id: string) {
    isLoading.value = true
    error.value = ''
    
    try {
      await $fetch(`/api/admin/users/${id}`, {
        method: 'DELETE'
      })
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'User deleted successfully',
        life: 3000
      })
      
      // Clear the selected user if it's the same one
      if (selectedUser.value?.id === id) {
        selectedUser.value = null
      }
      
      // Refresh the user list
      await fetchUsers()
      
      return true
    } catch (err: any) {
      error.value = err.message || `Failed to delete user with ID ${id}`
      console.error('Error deleting user:', err)
      
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.value,
        life: 3000
      })
      
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  // Reset a user's password
  async function resetPassword(id: string, newPassword: string) {
    isLoading.value = true
    error.value = ''
    
    try {
      await $fetch('/api/admin/users/reset-password', {
        method: 'POST',
        body: { id, password: newPassword }
      })
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Password reset successfully',
        life: 3000
      })
      
      return true
    } catch (err: any) {
      error.value = err.message || 'Failed to reset password'
      console.error('Error resetting password:', err)
      
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.value,
        life: 3000
      })
      
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  // Open the modal for creating a new user
  function openCreateModal() {
    selectedUser.value = null
    formMode.value = 'create'
    isModalOpen.value = true
  }
  
  // Open the modal for editing an existing user
  async function openEditModal(id: string) {
    await fetchUserById(id)
    formMode.value = 'edit'
    isModalOpen.value = true
  }
  
  // Open the delete confirmation modal
  function openDeleteModal(user: User) {
    selectedUser.value = user
    isDeleteModalOpen.value = true
  }
  
  // Handle pagination
  function onPageChange(page: number) {
    filters.page = page
    fetchUsers()
  }
  
  // Set a filter and reload data
  function setFilter(filterName: string, value: any) {
    filters[filterName] = value
    
    // Reset to page 1 when filters change
    filters.page = 1
    
    fetchUsers()
  }
  
  // Format role for display
  function formatRole(role: UserRole | string | null): string {
    if (!role) return 'Unknown'
    
    switch (role) {
      case 'admin':
        return 'Administrator'
      case 'instructor':
        return 'Instructor'
      case 'staff':
        return 'Staff'
      case 'receptionist':
        return 'Receptionist'
      default:
        return role.charAt(0).toUpperCase() + role.slice(1)
    }
  }
  
  return {
    users,
    selectedUser,
    isLoading,
    error,
    totalCount,
    filters,
    totalPages,
    currentPage,
    roleOptions,
    isModalOpen,
    isDeleteModalOpen,
    formMode,
    fetchUsers,
    fetchUserById,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    openCreateModal,
    openEditModal,
    openDeleteModal,
    onPageChange,
    setFilter,
    formatRole
  }
}