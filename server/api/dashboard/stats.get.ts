// server/api/dashboard/stats.ts
import { eq, gte, lt, and, lte, sql } from 'drizzle-orm'
import { getDb } from '~/server/utils/db'
import { students, leads, attendance, studentCertifications } from '~/server/db/schema'

export default defineEventHandler(async (event) => {
  try {
    const db = getDb()

    // Get total students and calculate trend
    const allStudents = await db
      .select({ id: students.id, createdAt: students.createdAt, status: students.status })
      .from(students)
      .where(eq(students.status, 'active'))

    const totalStudents = allStudents.length

    // Calculate students trend (last 30 days vs previous 30 days)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const newStudents = allStudents.filter(student => {
      const createdAt = new Date(student.createdAt!)
      return createdAt >= thirtyDaysAgo
    }).length

    const previousPeriodStudents = allStudents.filter(student => {
      const createdAt = new Date(student.createdAt!)
      return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo
    }).length

    const studentsTrend = previousPeriodStudents === 0
      ? 100
      : Math.round(((newStudents - previousPeriodStudents) / previousPeriodStudents) * 100)

    // Get new leads in the last 30 days
    const recentLeads = await db
      .select({ id: leads.id, createdAt: leads.createdAt })
      .from(leads)
      .where(gte(leads.createdAt, thirtyDaysAgo))
      .orderBy(sql`${leads.createdAt} DESC`)

    const newLeads = recentLeads.length

    // Calculate leads trend (current period vs previous period)
    const previousLeads = await db
      .select({ id: leads.id })
      .from(leads)
      .where(and(
        gte(leads.createdAt, sixtyDaysAgo),
        lt(leads.createdAt, thirtyDaysAgo)
      ))

    const previousPeriodLeads = previousLeads.length
    const leadsTrend = previousPeriodLeads === 0
      ? 100
      : Math.round(((newLeads - previousPeriodLeads) / previousPeriodLeads) * 100)

    // Get today's attendance rate
    const today = new Date().toISOString().split('T')[0]
    const todayAttendance = await db
      .select({ status: attendance.status })
      .from(attendance)
      .where(eq(attendance.attendanceDate, today))

    // Calculate attendance rate
    const totalAttendanceRecords = todayAttendance.length
    const presentCount = todayAttendance.filter(record =>
      record.status === 'present' || record.status === 'late'
    ).length

    const attendanceRate = totalAttendanceRecords === 0
      ? 0
      : Math.round((presentCount / totalAttendanceRecords) * 100 * 10) / 10

    // Calculate attendance trend
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const lastWeekAttendance = await db
      .select({ status: attendance.status })
      .from(attendance)
      .where(eq(attendance.attendanceDate, lastWeek))

    const lastWeekTotal = lastWeekAttendance.length
    const lastWeekPresent = lastWeekAttendance.filter(record =>
      record.status === 'present' || record.status === 'late'
    ).length

    const lastWeekRate = lastWeekTotal === 0 ? 0 : (lastWeekPresent / lastWeekTotal) * 100
    const attendanceTrend = lastWeekRate === 0
      ? 0
      : Math.round((attendanceRate - lastWeekRate) * 10) / 10

    // Get upcoming certifications (next 30 days)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const certifications = await db
      .select({ id: studentCertifications.id })
      .from(studentCertifications)
      .where(and(
        lte(studentCertifications.expirationDate, thirtyDaysFromNow),
        gte(studentCertifications.expirationDate, today)
      ))

    const upcomingCerts = certifications.length

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
