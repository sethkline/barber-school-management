import { getSupabaseClient } from '~/server/utils/supabaseClient'
import type {
  Tables,
  TablesInsert,
  TablesUpdate
} from '~/types/supabase'

// Define type aliases for convenience
type Attendance = Tables<'attendance'>
type AttendanceInsert = TablesInsert<'attendance'>
type AttendanceUpdate = TablesUpdate<'attendance'>
type Student = Tables<'students'>

export interface ListAttendanceParams {
  date?: string // YYYY-MM-DD format
  studentId?: string
  page?: number
  limit?: number
  status?: string
  startDate?: string // YYYY-MM-DD format
  endDate?: string // YYYY-MM-DD format
}

export const attendanceService = {
  /**
   * Retrieve attendance records with optional filtering.
   */
  async getAttendance({
    date,
    studentId,
    page = 1,
    limit = 10,
    status,
    startDate,
    endDate
  }: ListAttendanceParams): Promise<{ data: Attendance[]; count: number }> {
    const supabase = getSupabaseClient()

    // Begin building the query for the "attendance" table.
    let query = supabase
      .from<Attendance>('attendance')
      .select('*', { count: 'exact' })

    // Apply filters if provided
    if (date) {
      query = query.eq('attendance_date', date)
    }

    if (studentId) {
      query = query.eq('student_id', studentId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    // Date range filtering
    if (startDate && endDate) {
      query = query
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate)
    } else if (startDate) {
      query = query.gte('attendance_date', startDate)
    } else if (endDate) {
      query = query.lte('attendance_date', endDate)
    }

    // Calculate pagination offsets.
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)
    
    // Order by date (most recent first) and then by clock_in time
    query = query.order('attendance_date', { ascending: false })
             .order('clock_in', { ascending: true, nullsLast: true })

    // Execute the query.
    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch attendance records: ${error.message}`)
    }

    return { data: data ?? [], count: count ?? 0 }
  },

  /**
   * Retrieve a single attendance record by ID.
   */
  async getAttendanceById(id: string): Promise<Attendance> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from<Attendance>('attendance')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to get attendance record with ID ${id}: ${error.message}`)
    }
    return data!
  },

  /**
   * Create a new attendance record.
   */
  async createAttendance(attendanceData: AttendanceInsert): Promise<Attendance> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from<Attendance>('attendance')
      .insert(attendanceData)
      .single()

    if (error) {
      throw new Error(`Failed to create attendance record: ${error.message}`)
    }
    return data!
  },

  /**
   * Update an existing attendance record.
   */
  async updateAttendance(id: string, attendanceData: AttendanceUpdate): Promise<Attendance> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from<Attendance>('attendance')
      .update(attendanceData)
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to update attendance record with ID ${id}: ${error.message}`)
    }
    return data!
  },

  /**
   * Delete an attendance record.
   */
  async deleteAttendance(id: string): Promise<Attendance> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from<Attendance>('attendance')
      .delete()
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to delete attendance record with ID ${id}: ${error.message}`)
    }
    return data!
  },

  /**
   * Clock in a student.
   */
  async clockIn(studentId: string, attendanceDate: string): Promise<Attendance> {
    const supabase = getSupabaseClient()
    
    // Check if there's already an attendance record for this student and date
    const { data: existingRecord, error: checkError } = await supabase
      .from<Attendance>('attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('attendance_date', attendanceDate)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is the "no rows returned" error code
      throw new Error(`Failed to check existing attendance: ${checkError.message}`)
    }
    
    // If record exists, update it with clock_in time
    if (existingRecord) {
      const { data, error } = await supabase
        .from<Attendance>('attendance')
        .update({
          clock_in: new Date().toISOString(),
          status: 'present'
        })
        .eq('id', existingRecord.id)
        .single()
      
      if (error) {
        throw new Error(`Failed to clock in student: ${error.message}`)
      }
      return data!
    }
    
    // Otherwise, create a new record
    const { data, error } = await supabase
      .from<Attendance>('attendance')
      .insert({
        student_id: studentId,
        attendance_date: attendanceDate,
        clock_in: new Date().toISOString(),
        status: 'present'
      })
      .single()
    
    if (error) {
      throw new Error(`Failed to clock in student: ${error.message}`)
    }
    return data!
  },

  /**
   * Clock out a student.
   */
  async clockOut(studentId: string, attendanceDate: string): Promise<Attendance> {
    const supabase = getSupabaseClient()
    
    // Find the attendance record for this student and date
    const { data: existingRecord, error: checkError } = await supabase
      .from<Attendance>('attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('attendance_date', attendanceDate)
      .single()
    
    if (checkError) {
      throw new Error(`No attendance record found for clocking out: ${checkError.message}`)
    }
    
    // Update the record with clock_out time
    const { data, error } = await supabase
      .from<Attendance>('attendance')
      .update({
        clock_out: new Date().toISOString()
      })
      .eq('id', existingRecord.id)
      .single()
    
    if (error) {
      throw new Error(`Failed to clock out student: ${error.message}`)
    }
    return data!
  },

  /**
   * Mark a student as absent.
   */
  async markAbsent(studentId: string, attendanceDate: string, comment?: string): Promise<Attendance> {
    const supabase = getSupabaseClient()
    
    // Check if there's already an attendance record for this student and date
    const { data: existingRecord, error: checkError } = await supabase
      .from<Attendance>('attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('attendance_date', attendanceDate)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error(`Failed to check existing attendance: ${checkError.message}`)
    }
    
    // If record exists, update its status
    if (existingRecord) {
      const { data, error } = await supabase
        .from<Attendance>('attendance')
        .update({
          status: 'absent',
          // Add comment field if needed in your schema
        })
        .eq('id', existingRecord.id)
        .single()
      
      if (error) {
        throw new Error(`Failed to mark student as absent: ${error.message}`)
      }
      return data!
    }
    
    // Otherwise, create a new record
    const { data, error } = await supabase
      .from<Attendance>('attendance')
      .insert({
        student_id: studentId,
        attendance_date: attendanceDate,
        status: 'absent',
        // Add comment field if needed
      })
      .single()
    
    if (error) {
      throw new Error(`Failed to mark student as absent: ${error.message}`)
    }
    return data!
  },

  /**
   * Mark a student as excused from attendance.
   */
  async markExcused(studentId: string, attendanceDate: string, reason?: string): Promise<Attendance> {
    const supabase = getSupabaseClient()
    
    // Check if there's already an attendance record for this student and date
    const { data: existingRecord, error: checkError } = await supabase
      .from<Attendance>('attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('attendance_date', attendanceDate)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error(`Failed to check existing attendance: ${checkError.message}`)
    }
    
    // If record exists, update its status
    if (existingRecord) {
      const { data, error } = await supabase
        .from<Attendance>('attendance')
        .update({
          status: 'excused',
          // Add reason field if needed in your schema
        })
        .eq('id', existingRecord.id)
        .single()
      
      if (error) {
        throw new Error(`Failed to mark student as excused: ${error.message}`)
      }
      return data!
    }
    
    // Otherwise, create a new record
    const { data, error } = await supabase
      .from<Attendance>('attendance')
      .insert({
        student_id: studentId,
        attendance_date: attendanceDate,
        status: 'excused',
        // Add reason field if needed
      })
      .single()
    
    if (error) {
      throw new Error(`Failed to mark student as excused: ${error.message}`)
    }
    return data!
  },

  /**
   * Get attendance statistics for a date range.
   */
  async getAttendanceStats(startDate: string, endDate: string): Promise<any> {
    const supabase = getSupabaseClient()
    
    // Get all attendance records for the date range
    const { data, error } = await supabase
      .from<Attendance>('attendance')
      .select('*')
      .gte('attendance_date', startDate)
      .lte('attendance_date', endDate)
    
    if (error) {
      throw new Error(`Failed to fetch attendance statistics: ${error.message}`)
    }
    
    // Calculate statistics
    const totalDays = new Set(data?.map(record => record.attendance_date)).size
    const totalRecords = data?.length || 0
    
    const presentCount = data?.filter(record => record.status === 'present').length || 0
    const absentCount = data?.filter(record => record.status === 'absent').length || 0
    const excusedCount = data?.filter(record => record.status === 'excused').length || 0
    
    // Get unique student count
    const uniqueStudents = new Set(data?.map(record => record.student_id)).size
    
    return {
      totalDays,
      totalRecords,
      presentCount,
      absentCount,
      excusedCount,
      uniqueStudents,
      presentRate: totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0
    }
  },

  /**
   * Get attendance records for a specific day with student details.
   */
  async getDailyAttendance(date: string): Promise<any[]> {
    const supabase = getSupabaseClient()
    
    // Get all students
    const { data: students, error: studentsError } = await supabase
      .from<Student>('students')
      .select('*')
      .eq('status', 'current') // Only get active students
    
    if (studentsError) {
      throw new Error(`Failed to fetch students: ${studentsError.message}`)
    }
    
    // Get attendance records for the specified date
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from<Attendance>('attendance')
      .select('*')
      .eq('attendance_date', date)
    
    if (attendanceError) {
      throw new Error(`Failed to fetch attendance records: ${attendanceError.message}`)
    }
    
    // Create a map for quick lookup of attendance records
    const attendanceMap = new Map()
    attendanceRecords?.forEach(record => {
      if (record.student_id) {
        attendanceMap.set(record.student_id, record)
      }
    })
    
    // Combine student data with attendance data
    return students?.map(student => {
      const attendance = attendanceMap.get(student.id)
      return {
        student_id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        attendance_id: attendance?.id || null,
        status: attendance?.status || 'unmarked',
        clock_in: attendance?.clock_in || null,
        clock_out: attendance?.clock_out || null
      }
    }) || []
  },

  /**
   * Get attendance summary for a student.
   */
  async getStudentAttendanceSummary(studentId: string, startDate: string, endDate: string): Promise<any> {
    const supabase = getSupabaseClient()
    
    // Get attendance records for this student in the date range
    const { data, error } = await supabase
      .from<Attendance>('attendance')
      .select('*')
      .eq('student_id', studentId)
      .gte('attendance_date', startDate)
      .lte('attendance_date', endDate)
    
    if (error) {
      throw new Error(`Failed to fetch student attendance summary: ${error.message}`)
    }
    
    // Calculate attendance statistics
    const totalDays = new Set(data?.map(record => record.attendance_date)).size
    const presentCount = data?.filter(record => record.status === 'present').length || 0
    const absentCount = data?.filter(record => record.status === 'absent').length || 0
    const excusedCount = data?.filter(record => record.status === 'excused').length || 0
    
    // Calculate average hours if clock in/out data is available
    let totalHours = 0
    let daysWithHours = 0
    
    data?.forEach(record => {
      if (record.clock_in && record.clock_out) {
        const clockIn = new Date(record.clock_in)
        const clockOut = new Date(record.clock_out)
        const hoursPresent = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)
        
        if (hoursPresent > 0) {
          totalHours += hoursPresent
          daysWithHours++
        }
      }
    })
    
    const averageHours = daysWithHours > 0 ? totalHours / daysWithHours : 0
    
    return {
      totalDays,
      presentCount,
      absentCount,
      excusedCount,
      presentRate: totalDays > 0 ? (presentCount / totalDays) * 100 : 0,
      totalHours,
      averageHours
    }
  }
}