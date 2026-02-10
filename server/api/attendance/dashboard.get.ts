// server/api/attendance/dashboard.ts
import { gte, lte, and } from 'drizzle-orm'
import { getDb } from '~/server/utils/db'
import { attendance } from '~/server/db/schema'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const period = query.period as string || 'week'

    const db = getDb()
    const now = new Date()

    let startDate: Date
    let interval: string
    let labels: string[] = []

    switch (period) {
      case 'week':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 6)
        interval = 'day'
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now)
          date.setDate(now.getDate() - i)
          labels.push(dayNames[date.getDay()])
        }
        break

      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        interval = 'week'
        const weeksInMonth = Math.ceil((new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()) / 7)
        for (let i = 1; i <= weeksInMonth; i++) {
          labels.push(`Week ${i}`)
        }
        break

      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1)
        interval = 'month'
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        for (let i = 0; i < 3; i++) {
          labels.push(monthNames[currentQuarter * 3 + i])
        }
        break

      case 'year':
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
    const data = await db
      .select({ attendanceDate: attendance.attendanceDate, status: attendance.status })
      .from(attendance)
      .where(and(
        gte(attendance.attendanceDate, startDate.toISOString().split('T')[0]),
        lte(attendance.attendanceDate, now.toISOString().split('T')[0])
      ))

    // Process data by interval
    const presentByInterval: number[] = []
    const absentByInterval: number[] = []
    const lateByInterval: number[] = []

    switch (interval) {
      case 'day':
        for (let i = 0; i < labels.length; i++) {
          const date = new Date(now)
          date.setDate(now.getDate() - (6 - i))
          const dateStr = date.toISOString().split('T')[0]

          const dayRecords = data.filter(record => record.attendanceDate === dateStr)
          presentByInterval.push(dayRecords.filter(record => record.status === 'present').length)
          absentByInterval.push(dayRecords.filter(record => record.status === 'absent').length)
          lateByInterval.push(dayRecords.filter(record => record.status === 'late').length)
        }
        break

      case 'week':
        for (let week = 0; week < labels.length; week++) {
          const weekStart = new Date(startDate)
          weekStart.setDate(startDate.getDate() + week * 7)
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekStart.getDate() + 6)

          const weekRecords = data.filter(record => {
            const recordDate = new Date(record.attendanceDate)
            return recordDate >= weekStart && recordDate <= weekEnd
          })

          presentByInterval.push(weekRecords.filter(record => record.status === 'present').length)
          absentByInterval.push(weekRecords.filter(record => record.status === 'absent').length)
          lateByInterval.push(weekRecords.filter(record => record.status === 'late').length)
        }
        break

      case 'month':
        for (let month = 0; month < 3; month++) {
          const monthStart = new Date(startDate.getFullYear(), startDate.getMonth() + month, 1)
          const monthEnd = new Date(startDate.getFullYear(), startDate.getMonth() + month + 1, 0)

          const monthRecords = data.filter(record => {
            const recordDate = new Date(record.attendanceDate)
            return recordDate >= monthStart && recordDate <= monthEnd
          })

          presentByInterval.push(monthRecords.filter(record => record.status === 'present').length)
          absentByInterval.push(monthRecords.filter(record => record.status === 'absent').length)
          lateByInterval.push(monthRecords.filter(record => record.status === 'late').length)
        }
        break

      case 'quarter':
        for (let quarter = 0; quarter < 4; quarter++) {
          const quarterStart = new Date(now.getFullYear(), quarter * 3, 1)
          const quarterEnd = new Date(now.getFullYear(), (quarter + 1) * 3, 0)

          const quarterRecords = data.filter(record => {
            const recordDate = new Date(record.attendanceDate)
            return recordDate >= quarterStart && recordDate <= quarterEnd
          })

          presentByInterval.push(quarterRecords.filter(record => record.status === 'present').length)
          absentByInterval.push(quarterRecords.filter(record => record.status === 'absent').length)
          lateByInterval.push(quarterRecords.filter(record => record.status === 'late').length)
        }
        break
    }

    // Calculate overall stats
    const totalRecords = data.length
    const totalPresent = data.filter(record => record.status === 'present').length
    const totalAbsent = data.filter(record => record.status === 'absent').length
    const totalLate = data.filter(record => record.status === 'late').length

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
