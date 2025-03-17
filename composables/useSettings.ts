// composables/useSettings.ts
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import type { SchoolInfo, ProgramRequirement } from '~/server/services/settingsService'

export default function useSettings() {
  const schoolInfo = ref<SchoolInfo>({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: '',
    website: ''
  })
  
  const programRequirements = ref<ProgramRequirement[]>([])
  const selectedRequirement = ref<ProgramRequirement | null>(null)
  
  const themeSettings = ref({
    primaryColor: '#ef4444',
    secondaryColor: '#0ea5e9',
    darkMode: false,
    customLogo: false,
    logoUrl: ''
  })
  
  const isLoading = ref(false)
  const error = ref('')
  
  const requirementFormMode = ref<'create' | 'edit'>('create')
  const isProgramRequirementModalOpen = ref(false)
  const isDeleteProgramModalOpen = ref(false)
  
  const toast = useToast()
  
  // Load all settings
  async function loadAllSettings() {
    isLoading.value = true
    error.value = ''
    
    try {
      await Promise.all([
        fetchSchoolInfo(),
        fetchProgramRequirements(),
        fetchThemeSettings()
      ])
    } catch (err: any) {
      error.value = err.message || 'Failed to load settings'
      console.error('Error loading settings:', err)
    } finally {
      isLoading.value = false
    }
  }
  
  // Fetch school information
  async function fetchSchoolInfo() {
    isLoading.value = true
    error.value = ''
    
    try {
      schoolInfo.value = await $fetch('/api/admin/settings/school-info')
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch school information'
      console.error('Error fetching school info:', err)
    } finally {
      isLoading.value = false
    }
  }
  
  // Update school information
  async function updateSchoolInfo(data: SchoolInfo) {
    isLoading.value = true
    error.value = ''
    
    try {
      const updatedSchoolInfo = await $fetch('/api/admin/settings/school-info', {
        method: 'PUT',
        body: data
      })
      
      schoolInfo.value = updatedSchoolInfo
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'School information updated successfully',
        life: 3000
      })
      
      return updatedSchoolInfo
    } catch (err: any) {
      error.value = err.message || 'Failed to update school information'
      console.error('Error updating school info:', err)
      
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
  
  // Fetch program requirements
  async function fetchProgramRequirements() {
    isLoading.value = true
    error.value = ''
    
    try {
      const response = await $fetch('/api/admin/settings/program-requirements')
      programRequirements.value = response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch program requirements'
      console.error('Error fetching program requirements:', err)
    } finally {
      isLoading.value = false
    }
  }
  
  // Add a new program requirement
  async function addProgramRequirement(data: ProgramRequirement) {
    isLoading.value = true
    error.value = ''
    
    try {
      const response = await $fetch('/api/admin/settings/program-requirements', {
        method: 'POST',
        body: data
      })
      
      programRequirements.value = response.data
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Program requirement added successfully',
        life: 3000
      })
      
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to add program requirement'
      console.error('Error adding program requirement:', err)
      
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
  
  // Update a program requirement
  async function updateProgramRequirement(id: string, data: ProgramRequirement) {
    isLoading.value = true
    error.value = ''
    
    try {
      const response = await $fetch(`/api/admin/settings/program-requirements/${id}`, {
        method: 'PUT',
        body: data
      })
      
      programRequirements.value = response.data
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Program requirement updated successfully',
        life: 3000
      })
      
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to update program requirement'
      console.error('Error updating program requirement:', err)
      
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
  
  // Delete a program requirement
  async function deleteProgramRequirement(id: string) {
    isLoading.value = true
    error.value = ''
    
    try {
      const response = await $fetch(`/api/admin/settings/program-requirements/${id}`, {
        method: 'DELETE'
      })
      
      programRequirements.value = response.data
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Program requirement deleted successfully',
        life: 3000
      })
      
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to delete program requirement'
      console.error('Error deleting program requirement:', err)
      
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
  
  // Fetch theme settings
  async function fetchThemeSettings() {
    isLoading.value = true
    error.value = ''
    
    try {
      themeSettings.value = await $fetch('/api/admin/settings/theme-settings')
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch theme settings'
      console.error('Error fetching theme settings:', err)
    } finally {
      isLoading.value = false
    }
  }
  
  // Update theme settings
  async function updateThemeSettings(data: any) {
    isLoading.value = true
    error.value = ''
    
    try {
      const updatedThemeSettings = await $fetch('/api/admin/settings/theme-settings', {
        method: 'PUT',
        body: data
      })
      
      themeSettings.value = updatedThemeSettings
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Theme settings updated successfully',
        life: 3000
      })
      
      return updatedThemeSettings
    } catch (err: any) {
      error.value = err.message || 'Failed to update theme settings'
      console.error('Error updating theme settings:', err)
      
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
  
  // Open modal for creating a new program requirement
  function openCreateProgramModal() {
    selectedRequirement.value = {
      program_name: '',
      required_hours: 0,
      certification_name: '',
      description: '',
      is_active: true
    }
    requirementFormMode.value = 'create'
    isProgramRequirementModalOpen.value = true
  }
  
  // Open modal for editing an existing program requirement
  function openEditProgramModal(requirement: ProgramRequirement) {
    selectedRequirement.value = { ...requirement }
    requirementFormMode.value = 'edit'
    isProgramRequirementModalOpen.value = true
  }
  
  // Open delete confirmation modal for program requirement
  function openDeleteProgramModal(requirement: ProgramRequirement) {
    selectedRequirement.value = requirement
    isDeleteProgramModalOpen.value = true
  }
  
  return {
    schoolInfo,
    programRequirements,
    selectedRequirement,
    themeSettings,
    isLoading,
    error,
    requirementFormMode,
    isProgramRequirementModalOpen,
    isDeleteProgramModalOpen,
    loadAllSettings,
    fetchSchoolInfo,
    updateSchoolInfo,
    fetchProgramRequirements,
    addProgramRequirement,
    updateProgramRequirement,
    deleteProgramRequirement,
    fetchThemeSettings,
    updateThemeSettings,
    openCreateProgramModal,
    openEditProgramModal,
    openDeleteProgramModal
  }
}