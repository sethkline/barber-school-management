export const useAttendance = () => {
  /**
   * Fetch daily attendance for a specific date
   */
  const fetchDailyAttendance = async (date?: string) => {
    try {
      const params = date ? { date } : {}
      const { data } = await useFetch('/api/attendance/daily', { 
        method: 'GET',
        params
      })
      return data.value
    } catch (error: any) {
      console.error('Error fetching daily attendance:', error)
      throw error
    }
  }

  /**
   * Clock in a student
   */
  const clockInStudent = async (studentId: string, date?: string) => {
    try {
      const body = date ? { studentId, date } : { studentId }
      const { data } = await useFetch('/api/attendance/clock-in', {
        method: 'POST',
        body
      })
      return data.value
    } catch (error: any) {
      console.error('Error clocking in student:', error)
      throw error
    }
  }

  /**
   * Clock out a student
   */
  const clockOutStudent = async (studentId: string, date?: string) => {
    try {
      const body = date ? { studentId, date } : { studentId }
      const { data } = await useFetch('/api/attendance/clock-out', {
        method: 'POST',
        body
      })
      return data.value
    } catch (error: any) {
      console.error('Error clocking out student:', error)
      throw error
    }
  }

  /**
   * Update a student's attendance status
   */
  const updateAttendanceStatus = async (
    studentId: string, 
    status: 'present' | 'absent' | 'excused',
    date?: string,
    reason?: string
  ) => {
    try {
      const body = {
        studentId,
        status,
        date,
        reason
      }
      
      const { data } = await useFetch('/api/attendance/status', {
        method: 'POST',
        body
      })
      return data.value
    } catch (error: any) {
      console.error('Error updating attendance status:', error)
      throw error
    }
  }

  /**
   * Fetch attendance history for a student
   */
  const fetchStudentAttendance = async (
    studentId: string,
    startDate?: string,
    endDate?: string
  ) => {
    try {
      const params = {
        studentId,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      }
      
      const { data } = await useFetch('/api/attendance/student', {
        method: 'GET',
        params
      })
      return data.value
    } catch (error: any) {
      console.error('Error fetching student attendance:', error)
      throw error
    }
  }

  /**
   * Fetch attendance statistics
   */
  const fetchAttendanceStats = async (startDate?: string, endDate?: string) => {
    try {
      const params = {
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      }
      
      const { data } = await useFetch('/api/attendance/stats', {
        method: 'GET',
        params
      })
      return data.value
    } catch (error: any) {
      console.error('Error fetching attendance stats:', error)
      throw error
    }
  }

  // Format timestamp to time string (HH:MM AM/PM)
  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '—'
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  // Format date to readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Calculate attendance duration in hours
  const calculateDuration = (clockIn: string | null, clockOut: string | null) => {
    if (!clockIn || !clockOut) return '—'
    
    const start = new Date(clockIn).getTime()
    const end = new Date(clockOut).getTime()
    const durationMs = end - start
    
    // Convert to hours and minutes
    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours === 0) {
      return `${minutes} min`
    }
    
    return `${hours}h ${minutes}m`
  }

  return {
    fetchDailyAttendance,
    clockInStudent,
    clockOutStudent,
    updateAttendanceStatus,
    fetchStudentAttendance,
    fetchAttendanceStats,
    formatTime,
    formatDate,
    calculateDuration
  }
}