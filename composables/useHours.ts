import { ref, reactive, computed } from 'vue'
import { useToast } from 'primevue/usetoast'

export interface HoursRecord {
  id: string
  student_id: string | null
  date_recorded: string | null
  hours_completed: number | null
  created_at: string | null
}

export interface HoursFilters {
  page: number
  limit: number
  studentId?: string
  startDate?: string
  endDate?: string
}

export interface HoursSummary {
  totalHours: number
  lastRecorded: string | null
  progressPercentage: number | null
  requirementMet: boolean
  requirementHours: number
}

export interface MonthlyHoursData {
  month: string
  total: number
}

export function useHours() {
  const toast = useToast()
  
  const hoursRecords = ref<HoursRecord[]>([])
  const currentRecord = ref<HoursRecord | null>(null)
  const hoursSummary = ref<HoursSummary | null>(null)
  const monthlyHours = ref<MonthlyHoursData[]>([])
  const isLoading = ref(false)
  const error = ref('')
  const totalCount = ref(0)
  
  const filters = reactive<HoursFilters>({
    page: 1,
    limit: 10
  })
  
  // Pagination computed props
  const totalPages = computed(() => Math.ceil(totalCount.value / filters.limit))
  const currentPage = computed(() => filters.page)
  
  // Fetch hours records with pagination and filtering
  async function fetchHoursRecords(options: Partial<HoursFilters> = {}) {
    // Apply any provided options to filters
    if (options.studentId !== undefined) filters.studentId = options.studentId;
    if (options.limit !== undefined) filters.limit = options.limit;
    if (options.page !== undefined) filters.page = options.page;
    if (options.startDate !== undefined) filters.startDate = options.startDate;
    if (options.endDate !== undefined) filters.endDate = options.endDate;
  
    isLoading.value = true;
    error.value = '';
    
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', filters.page.toString());
      queryParams.append('limit', filters.limit.toString());
      
      if (filters.studentId) {
        queryParams.append('studentId', filters.studentId);
      }
      
      if (filters.startDate) {
        queryParams.append('startDate', filters.startDate);
      }
      
      if (filters.endDate) {
        queryParams.append('endDate', filters.endDate);
      }
      
      const response = await fetch(`/api/hours?${queryParams.toString()}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.statusMessage || 'Failed to fetch hours records');
      }
      
      const data = await response.json();
      
      // Transform data to include student_name
      const transformedData = data.data.map(record => {
        // Add a student_name field based on the joined students data
        return {
          ...record,
          student_name: record.students 
            ? `${record.students.first_name} ${record.students.last_name}`
            : 'Unknown Student'
        };
      });
      
      hoursRecords.value = transformedData;
      totalCount.value = data.count;
      
      // Return the transformed data
      return { data: transformedData, count: data.count };
    } catch (err: any) {
      error.value = err.message;
      throw err; // Re-throw to let the caller handle it
    } finally {
      isLoading.value = false;
    }
  }
  
  // Fetch a single hours record by ID
  async function fetchHoursRecordById(id: string) {
    isLoading.value = true
    error.value = ''
    
    try {
      const response = await fetch(`/api/hours/${id}`)
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.statusMessage || `Failed to fetch hours record ${id}`)
      }
      
      const data = await response.json()
      currentRecord.value = data
      return data
    } catch (err: any) {
      error.value = err.message
      return null
    } finally {
      isLoading.value = false
    }
  }
  
  // Create a new hours record
  async function createHoursRecord(record: Partial<HoursRecord>) {
    isLoading.value = true
    error.value = ''
    
    try {
      const response = await fetch('/api/hours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(record)
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.statusMessage || 'Failed to create hours record')
      }
      
      const data = await response.json()
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Hours record created successfully',
        life: 3000
      })
      
      return data
    } catch (err: any) {
      error.value = err.message
      
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: err.message || 'Failed to create hours record',
        life: 3000
      })
      
      return null
    } finally {
      isLoading.value = false
    }
  }
  
  // Update an existing hours record
  async function updateHoursRecord(id: string, record: Partial<HoursRecord>) {
    isLoading.value = true
    error.value = ''
    
    try {
      const response = await fetch(`/api/hours/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(record)
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.statusMessage || `Failed to update hours record ${id}`)
      }
      
      const data = await response.json()
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Hours record updated successfully',
        life: 3000
      })
      
      return data
    } catch (err: any) {
      error.value = err.message
      
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: err.message || 'Failed to update hours record',
        life: 3000
      })
      
      return null
    } finally {
      isLoading.value = false
    }
  }
  
  // Delete an hours record
  async function deleteHoursRecord(id: string) {
    isLoading.value = true
    error.value = ''
    
    try {
      const response = await fetch(`/api/hours/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.statusMessage || `Failed to delete hours record ${id}`)
      }
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Hours record deleted successfully',
        life: 3000
      })
      
      return true
    } catch (err: any) {
      error.value = err.message
      
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: err.message || 'Failed to delete hours record',
        life: 3000
      })
      
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  // Fetch student hours summary
  async function fetchHoursSummary(studentId: string, requirementHours: number = 1000) {
    isLoading.value = true
    error.value = ''
    
    try {
      const response = await fetch(`/api/hours/summary/${studentId}?requirementHours=${requirementHours}`)
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.statusMessage || 'Failed to fetch hours summary')
      }
      
      const data = await response.json()
      hoursSummary.value = data
      return data
    } catch (err: any) {
      error.value = err.message
      return null
    } finally {
      isLoading.value = false
    }
  }
  
  // Fetch monthly hours breakdown
  async function fetchMonthlyHours(studentId: string, startDate?: string, endDate?: string) {
    isLoading.value = true
    error.value = ''
    
    try {
      let url = `/api/hours/monthly/${studentId}`
      const params = new URLSearchParams()
      
      if (startDate) {
        params.append('startDate', startDate)
      }
      
      if (endDate) {
        params.append('endDate', endDate)
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.statusMessage || 'Failed to fetch monthly hours')
      }
      
      const data = await response.json()
      monthlyHours.value = data
      return data
    } catch (err: any) {
      error.value = err.message
      return null
    } finally {
      isLoading.value = false
    }
  }
  
  // Generate completion certificate
  async function generateCertificate(studentId: string) {
    isLoading.value = true
    error.value = ''
    
    try {
      const response = await fetch(`/api/hours/certificate/${studentId}`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.statusMessage || 'Failed to generate certificate')
      }
      
      const data = await response.json()
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Certificate generated successfully',
        life: 3000
      })
      
      return data
    } catch (err: any) {
      error.value = err.message
      
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: err.message || 'Failed to generate certificate',
        life: 3000
      })
      
      return null
    } finally {
      isLoading.value = false
    }
  }
  
  // Format date for display
  function formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A'
    
    return new Date(dateString).toLocaleDateString()
  }
  
  // Format hours for display
  function formatHours(hours: number | null): string {
    if (hours === null) return 'N/A'
    
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
  }
  
  // Change page in pagination
  function setPage(page: number) {
    filters.page = page
    fetchHoursRecords()
  }
  
  // Set filter and reload data
  function setFilter(filterName: keyof HoursFilters, value: any) {
    filters[filterName] = value
    // Reset to page 1 when filters change
    filters.page = 1
    fetchHoursRecords()
  }
  
  return {
    hoursRecords,
    currentRecord,
    hoursSummary,
    monthlyHours,
    isLoading,
    error,
    totalCount,
    filters,
    totalPages,
    currentPage,
    fetchHoursRecords,
    fetchHoursRecordById,
    createHoursRecord,
    updateHoursRecord,
    deleteHoursRecord,
    fetchHoursSummary,
    fetchMonthlyHours,
    generateCertificate,
    formatDate,
    formatHours,
    setPage,
    setFilter
  }
}