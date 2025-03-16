import { ref, reactive, computed } from 'vue'

export interface Assessment {
  id: string
  student_id: string | null
  assessment_date: string | null
  assessment_type: string | null
  score: number | null
  comment: string | null
  created_at: string | null
}

export interface AssessmentFilters {
  page: number
  limit: number
  studentId?: string
  assessmentType?: string
  startDate?: string
  endDate?: string
}

export interface ProgressData {
  labels: string[]
  values: number[]
}

export function useAssessments() {
  const assessments = ref<Assessment[]>([])
  const currentAssessment = ref<Assessment | null>(null)
  const isLoading = ref(false)
  const error = ref('')
  const totalCount = ref(0)
  const assessmentTypes = ref<string[]>([])
  
  const filters = reactive<AssessmentFilters>({
    page: 1,
    limit: 10
  })
  
  // Pagination computed props
  const totalPages = computed(() => Math.ceil(totalCount.value / filters.limit))
  const currentPage = computed(() => filters.page)
  
  // Get all assessments with pagination and filtering
  async function fetchAssessments() {
    isLoading.value = true
    error.value = ''
    
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('page', filters.page.toString())
      queryParams.append('limit', filters.limit.toString())
      
      if (filters.studentId) {
        queryParams.append('studentId', filters.studentId)
      }
      
      if (filters.assessmentType) {
        queryParams.append('assessmentType', filters.assessmentType)
      }
      
      if (filters.startDate) {
        queryParams.append('startDate', filters.startDate)
      }
      
      if (filters.endDate) {
        queryParams.append('endDate', filters.endDate)
      }
      
      const response = await fetch(`/api/assessments?${queryParams.toString()}`)
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.statusMessage || 'Failed to fetch assessments')
      }
      
      const data = await response.json()
      assessments.value = data.data
      totalCount.value = data.count
    } catch (err: any) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }
  
  // Get a single assessment by ID
  async function fetchAssessmentById(id: string) {
    isLoading.value = true
    error.value = ''
    
    try {
      const response = await fetch(`/api/assessments/${id}`)
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.statusMessage || `Failed to fetch assessment ${id}`)
      }
      
      const data = await response.json()
      currentAssessment.value = data
      return data
    } catch (err: any) {
      error.value = err.message
      return null
    } finally {
      isLoading.value = false
    }
  }
  
  // Create a new assessment
  async function createAssessment(assessment: Partial<Assessment>) {
    isLoading.value = true
    error.value = ''
    
    try {
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(assessment)
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.statusMessage || 'Failed to create assessment')
      }
      
      const data = await response.json()
      return data
    } catch (err: any) {
      error.value = err.message
      return null
    } finally {
      isLoading.value = false
    }
  }
  
  // Update an existing assessment
  async function updateAssessment(id: string, assessment: Partial<Assessment>) {
    isLoading.value = true
    error.value = ''
    
    try {
      const response = await fetch(`/api/assessments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(assessment)
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.statusMessage || `Failed to update assessment ${id}`)
      }
      
      const data = await response.json()
      return data
    } catch (err: any) {
      error.value = err.message
      return null
    } finally {
      isLoading.value = false
    }
  }
  
  // Delete an assessment
  async function deleteAssessment(id: string) {
    isLoading.value = true
    error.value = ''
    
    try {
      const response = await fetch(`/api/assessments/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.statusMessage || `Failed to delete assessment ${id}`)
      }
      
      const data = await response.json()
      return data
    } catch (err: any) {
      error.value = err.message
      return null
    } finally {
      isLoading.value = false
    }
  }
  
  // Get student progress data
  async function fetchStudentProgress(studentId: string, assessmentType?: string): Promise<ProgressData> {
    isLoading.value = true
    error.value = ''
    
    try {
      let url = `/api/assessments/student-progress/${studentId}`
      if (assessmentType) {
        url += `?assessmentType=${encodeURIComponent(assessmentType)}`
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.statusMessage || `Failed to fetch progress for student ${studentId}`)
      }
      
      const data = await response.json()
      
      // Format data for charts
      const labels = data.map((item: Assessment) => 
        item.assessment_date ? new Date(item.assessment_date).toLocaleDateString() : 'Unknown'
      )
      
      const values = data.map((item: Assessment) => item.score || 0)
      
      return { labels, values }
    } catch (err: any) {
      error.value = err.message
      return { labels: [], values: [] }
    } finally {
      isLoading.value = false
    }
  }
  
  // Get average scores for an assessment type
  async function fetchAverageScore(assessmentType: string) {
    isLoading.value = true
    error.value = ''
    
    try {
      const response = await fetch(`/api/assessments/average?type=${encodeURIComponent(assessmentType)}`)
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.statusMessage || `Failed to fetch average for ${assessmentType}`)
      }
      
      const data = await response.json()
      return data
    } catch (err: any) {
      error.value = err.message
      return { average: 0, count: 0 }
    } finally {
      isLoading.value = false
    }
  }
  
  // Get all assessment types
  async function fetchAssessmentTypes() {
    isLoading.value = true
    error.value = ''
    
    try {
      const response = await fetch('/api/assessments/types')
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.statusMessage || 'Failed to fetch assessment types')
      }
      
      const data = await response.json()
      assessmentTypes.value = data
      return data
    } catch (err: any) {
      error.value = err.message
      return []
    } finally {
      isLoading.value = false
    }
  }
  
  // Change page in pagination
  function setPage(page: number) {
    filters.page = page
    fetchAssessments()
  }
  
  // Set filter and reload data
  function setFilter(filterName: keyof AssessmentFilters, value: any) {
    filters[filterName] = value
    // Reset to page 1 when filters change
    filters.page = 1
    fetchAssessments()
  }
  
  return {
    assessments,
    currentAssessment,
    isLoading,
    error,
    totalCount,
    filters,
    totalPages,
    currentPage,
    assessmentTypes,
    fetchAssessments,
    fetchAssessmentById,
    createAssessment,
    updateAssessment,
    deleteAssessment,
    fetchStudentProgress,
    fetchAverageScore,
    fetchAssessmentTypes,
    setPage,
    setFilter
  }
}