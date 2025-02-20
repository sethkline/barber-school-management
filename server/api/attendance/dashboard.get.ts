// server/api/attendance/dashboard.ts
import { getSupabaseClient } from '~/server/utils/supabaseClient'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const period = query.period as string || 'week'
    
    const supabase = getSupabaseClient()
    const now = new Date()
    
    let startDate: Date
    let interval: string
    let labels: string[] = []
    
    switch (period) {
      case 'week':
        // Get data for the current week (last 5 working days)
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 6) // Last 7 days, including today
        interval = 'day'
        // Generate weekday labels (Mon, Tue, etc.)
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now)
          date.setDate(now.getDate() - i)
          labels.push(dayNames[date.getDay()])
        }
        break
        
      case 'month':
        // Current month data by week
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        interval = 'week'
        // Generate week labels (Week 1, Week 2, etc.)
        const weeksInMonth = Math.ceil((new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()) / 7)
        for (let i = 1; i <= weeksInMonth; i++) {
          labels.push(`Week ${i}`)
        }
        break
        
      case 'quarter':
        // Current quarter data by month
        const currentQuarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1)
        interval = 'month'
        // Generate month labels for the quarter
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        for (let i = 0; i < 3; i++) {
          labels.push(monthNames[currentQuarter * 3 + i])
        }
        break
        
      case 'year':
        // Current year data by quarter
        startDate = new Date(now.getFullYear(), 0, 1)
        interval = 'quarter'
        labels = ['Q1', 'Q2', 'Q3', 'Q4']
        break
        
      default:
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 6)
        interval = 'day'
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    }
    
    // Fetch attendance data for the selected period
    const { data, error } = await supabase
      .from('attendance')
      .select('attendance_date, status')
      .gte('attendance_date', startDate.toISOString().split('T')[0])
      .lte('attendance_date', now.toISOString().split('T')[0])
    
    if (error) throw new Error(`Failed to fetch attendance data: ${error.message}`)
    
    // Process data by interval
    const presentByInterval: number[] = []
    const absentByInterval: number[] = []
    const lateByInterval: number[] = []
    
    // Calculate statistics based on interval
    switch (interval) {
      case 'day':
        // Group by day
        for (let i = 0; i < labels.length; i++) {
          const date = new Date(now)
          date.setDate(now.getDate() - (6 - i))
          const dateStr = date.toISOString().split('T')[0]
          
          const dayRecords = data?.filter(record => record.attendance_date === dateStr) || []
          const presentCount = dayRecords.filter(record => record.status === 'present').length
          const absentCount = dayRecords.filter(record => record.status === 'absent').length
          const lateCount = dayRecords.filter(record => record.status === 'late').length
          
          presentByInterval.push(presentCount)
          absentByInterval.push(absentCount)
          lateByInterval.push(lateCount)
        }
        break
        
      case 'week':
        // Group by week
        for (let week = 0; week < labels.length; week++) {
          const weekStart = new Date(startDate)
          weekStart.setDate(startDate.getDate() + week * 7)
          
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekStart.getDate() + 6)
          
          const weekRecords = data?.filter(record => {
            const recordDate = new Date(record.attendance_date)
            return recordDate >= weekStart && recordDate <= weekEnd
          }) || []
          
          const presentCount = weekRecords.filter(record => record.status === 'present').length
          const absentCount = weekRecords.filter(record => record.status === 'absent').length
          const lateCount = weekRecords.filter(record => record.status === 'late').length
          
          presentByInterval.push(presentCount)
          absentByInterval.push(absentCount)
          lateByInterval.push(lateCount)
        }
        break
        
      case 'month':
        // Group by month
        for (let month = 0; month < 3; month++) {
          const monthStart = new Date(startDate.getFullYear(), startDate.getMonth() + month, 1)
          const monthEnd = new Date(startDate.getFullYear(), startDate.getMonth() + month + 1, 0)
          
          const monthRecords = data?.filter(record => {
            const recordDate = new Date(record.attendance_date)
            return recordDate >= monthStart && recordDate <= monthEnd
          }) || []
          
          const presentCount = monthRecords.filter(record => record.status === 'present').length
          const absentCount = monthRecords.filter(record => record.status === 'absent').length
          const lateCount = monthRecords.filter(record => record.status === 'late').length
          
          presentByInterval.push(presentCount)
          absentByInterval.push(absentCount)
          lateByInterval.push(lateCount)
        }
        break
        
      case 'quarter':
        // Group by quarter
        for (let quarter = 0; quarter < 4; quarter++) {
          const quarterStart = new Date(now.getFullYear(), quarter * 3, 1)
          const quarterEnd = new Date(now.getFullYear(), (quarter + 1) * 3, 0)
          
          const quarterRecords = data?.filter(record => {
            const recordDate = new Date(record.attendance_date)
            return recordDate >= quarterStart && recordDate <= quarterEnd
          }) || []
          
          const presentCount = quarterRecords.filter(record => record.status === 'present').length
          const absentCount = quarterRecords.filter(record => record.status === 'absent').length
          const lateCount = quarterRecords.filter(record => record.status === 'late').length
          
          presentByInterval.push(presentCount)
          absentByInterval.push(absentCount)
          lateByInterval.push(lateCount)
        }
        break
    }
    
    // Calculate overall stats
    const totalRecords = data?.length || 0
    const totalPresent = data?.filter(record => record.status === 'present').length || 0
    const totalAbsent = data?.filter(record => record.status === 'absent').length || 0
    const totalLate = data?.filter(record => record.status === 'late').length || 0
    
    const attendanceRate = totalRecords === 0 ? 0 : Math.round((totalPresent / totalRecords) * 100)
    const absenceRate = totalRecords === 0 ? 0 : Math.round((totalAbsent / totalRecords) * 100 * 10) / 10
    const tardinessRate = totalRecords === 0 ? 0 : Math.round((totalLate / totalRecords) * 100 * 10) / 10
    
    return {
      data: {
        labels,
        present: presentByInterval,
        absent: absentByInterval,
        late: lateByInterval,
        stats: [
          { type: 'present', label: 'Attendance Rate', value: attendanceRate, unit: '%' },
          { type: 'absent', label: 'Absence Rate', value: absenceRate, unit: '%' },
          { type: 'late', label: 'Tardiness Rate', value: tardinessRate, unit: '%' }
        ]
      }
    }
    
  } catch (error: any) {
    console.error('Error fetching attendance dashboard data:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch attendance dashboard data'
    })
  }
})