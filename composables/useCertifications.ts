// composables/useCertifications.ts
import { ref, computed } from 'vue'
import type { Tables, TablesInsert, TablesUpdate } from '~/types/supabase'

type Certification = Tables<'student_certifications'> & {
  students?: {
    first_name: string
    last_name: string
    email?: string
  }
}

export default function useCertifications() {
  const certifications = ref<Certification[]>([])
  const certification = ref<Certification | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const totalCount = ref(0)

  // Computed properties
  const expiringCertifications = computed(() => {
    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(now.getDate() + 30)
    
    return certifications.value.filter(cert => {
      if (!cert.expiration_date) return false
      
      const expirationDate = new Date(cert.expiration_date)
      return expirationDate > now && expirationDate <= thirtyDaysFromNow
    })
  })

  // Methods
  const fetchCertifications = async (params: {
    studentId?: string,
    page?: number,
    limit?: number,
    includeExpired?: boolean,
    search?: string
  } = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const { data, count } = await $fetch('/api/certifications', {
        method: 'GET',
        params
      })
      
      certifications.value = data
      totalCount.value = count
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch certifications'
      console.error(error.value)
    } finally {
      loading.value = false
    }
  }
  
  const fetchCertification = async (id: string) => {
    loading.value = true
    error.value = null
    
    try {
      certification.value = await $fetch(`/api/certifications/${id}`, {
        method: 'GET'
      })
    } catch (err: any) {
      error.value = err.message || `Failed to fetch certification with ID ${id}`
      console.error(error.value)
    } finally {
      loading.value = false
    }
  }
  
  const createCertification = async (certificationData: TablesInsert<'student_certifications'>) => {
    loading.value = true
    error.value = null
    
    try {
      const result = await $fetch('/api/certifications', {
        method: 'POST',
        body: certificationData
      })
      
      return result
    } catch (err: any) {
      error.value = err.message || 'Failed to create certification'
      console.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const updateCertification = async (id: string, certificationData: TablesUpdate<'student_certifications'>) => {
    loading.value = true
    error.value = null
    
    try {
      const result = await $fetch(`/api/certifications/${id}`, {
        method: 'PUT',
        body: certificationData
      })
      
      return result
    } catch (err: any) {
      error.value = err.message || `Failed to update certification with ID ${id}`
      console.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const deleteCertification = async (id: string) => {
    loading.value = true
    error.value = null
    
    try {
      await $fetch(`/api/certifications/${id}`, {
        method: 'DELETE'
      })
      
      certifications.value = certifications.value.filter(cert => cert.id !== id)
    } catch (err: any) {
      error.value = err.message || `Failed to delete certification with ID ${id}`
      console.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const fetchExpiringCertifications = async (days: number = 30) => {
    loading.value = true
    error.value = null
    
    try {
      const data = await $fetch('/api/certifications/expiring', {
        method: 'GET',
        params: { days }
      })
      
      return data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch expiring certifications'
      console.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const sendRenewalNotification = async (studentId: string, certificationId: string) => {
    loading.value = true
    error.value = null
    
    try {
      await $fetch(`/api/certifications/notify/${certificationId}`, {
        method: 'POST',
        body: { studentId }
      })
    } catch (err: any) {
      error.value = err.message || 'Failed to send renewal notification'
      console.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Format certification dates for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }
  
  // Check if a certification is expired
  const isExpired = (expirationDate: string | null) => {
    if (!expirationDate) return false
    return new Date(expirationDate) < new Date()
  }
  
  // Calculate days until expiration
  const daysUntilExpiration = (expirationDate: string | null) => {
    if (!expirationDate) return null
    
    const now = new Date()
    const expDate = new Date(expirationDate)
    const diffTime = expDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  return {
    certifications,
    certification,
    loading,
    error,
    totalCount,
    expiringCertifications,
    fetchCertifications,
    fetchCertification,
    createCertification,
    updateCertification,
    deleteCertification,
    fetchExpiringCertifications,
    sendRenewalNotification,
    formatDate,
    isExpired,
    daysUntilExpiration
  }
}