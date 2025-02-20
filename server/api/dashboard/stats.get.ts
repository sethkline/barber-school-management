// server/api/dashboard/stats.ts
import { getSupabaseClient } from '~/server/utils/supabaseClient'

export default defineEventHandler(async (event) => {
  try {
    const supabase = getSupabaseClient()
    
    // Get total students and calculate trend
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, created_at, status')
      .eq('status', 'current')
    
    if (studentsError) throw new Error(`Failed to fetch students: ${studentsError.message}`)
    
    const totalStudents = students?.length || 0
    
    // Calculate students trend (last 30 days vs previous 30 days)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    
    const newStudents = students?.filter(student => {
      const createdAt = new Date(student.created_at!)
      return createdAt >= thirtyDaysAgo
    }).length || 0
    
    const previousPeriodStudents = students?.filter(student => {
      const createdAt = new Date(student.created_at!)
      return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo
    }).length || 0
    
    const studentsTrend = previousPeriodStudents === 0 
      ? 100 
      : Math.round(((newStudents - previousPeriodStudents) / previousPeriodStudents) * 100)
    
    // Get new leads in the last 30 days
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
    
    if (leadsError) throw new Error(`Failed to fetch leads: ${leadsError.message}`)
    
    const newLeads = leads?.length || 0
    
    // Calculate leads trend (current period vs previous period)
    const { data: previousLeads, error: previousLeadsError } = await supabase
      .from('leads')
      .select('id')
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString())
    
    if (previousLeadsError) throw new Error(`Failed to fetch previous leads: ${previousLeadsError.message}`)
    
    const previousPeriodLeads = previousLeads?.length || 0
    const leadsTrend = previousPeriodLeads === 0 
      ? 100 
      : Math.round(((newLeads - previousPeriodLeads) / previousPeriodLeads) * 100)
    
    // Get today's attendance rate
    const today = new Date().toISOString().split('T')[0]
    const { data: todayAttendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('status')
      .eq('attendance_date', today)
    
    if (attendanceError) throw new Error(`Failed to fetch attendance: ${attendanceError.message}`)
    
    // Calculate attendance rate
    const totalAttendanceRecords = todayAttendance?.length || 0
    const presentCount = todayAttendance?.filter(record => 
      record.status === 'present' || record.status === 'late'
    ).length || 0
    
    const attendanceRate = totalAttendanceRecords === 0 
      ? 0 
      : Math.round((presentCount / totalAttendanceRecords) * 100 * 10) / 10
    
    // Calculate attendance trend
    // Get last week's attendance for comparison
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data: lastWeekAttendance, error: lastWeekError } = await supabase
      .from('attendance')
      .select('status')
      .eq('attendance_date', lastWeek)
    
    if (lastWeekError) throw new Error(`Failed to fetch last week's attendance: ${lastWeekError.message}`)
    
    const lastWeekTotal = lastWeekAttendance?.length || 0
    const lastWeekPresent = lastWeekAttendance?.filter(record => 
      record.status === 'present' || record.status === 'late'
    ).length || 0
    
    const lastWeekRate = lastWeekTotal === 0 ? 0 : (lastWeekPresent / lastWeekTotal) * 100
    const attendanceTrend = lastWeekRate === 0 
      ? 0 
      : Math.round((attendanceRate - lastWeekRate) * 10) / 10
    
    // Get upcoming certifications (next 30 days)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data: certifications, error: certError } = await supabase
      .from('student_certifications')
      .select('id')
      .lte('expiration_date', thirtyDaysFromNow)
      .gte('expiration_date', today)
    
    if (certError) throw new Error(`Failed to fetch certifications: ${certError.message}`)
    
    const upcomingCerts = certifications?.length || 0
    
    // Return all stats
    return {
      data: {
        totalStudents: totalStudents.toString(),
        studentsTrend,
        newLeads: newLeads.toString(),
        leadsTrend,
        attendanceRate,
        attendanceTrend,
        upcomingCerts: upcomingCerts.toString()
      }
    }
    
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch dashboard statistics'
    })
  }
})