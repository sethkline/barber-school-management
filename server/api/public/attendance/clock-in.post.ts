import { getSupabaseClient } from '~/server/utils/supabaseClient'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { studentId } = body

    if (!studentId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Student ID is required',
      })
    }

    const supabase = getSupabaseClient()

    // Check if student is already clocked in
    const { data: existingRecord } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .is('clock_out', null)
      .single()

    if (existingRecord) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Student is already clocked in',
      })
    }

    // Create new attendance record
    const { data, error } = await supabase
      .from('attendance')
      .insert({
        student_id: studentId,
        clock_in: new Date().toISOString(),
        status: 'present',
      })
      .select()
      .single()

    if (error) throw error

    // Get student name for confirmation
    const { data: student } = await supabase
      .from('students')
      .select('first_name, last_name')
      .eq('id', studentId)
      .single()

    return {
      success: true,
      message: 'Clocked in successfully',
      studentName: student ? `${student.first_name} ${student.last_name}` : 'Student',
      clockIn: data.clock_in,
    }
  } catch (error: any) {
    console.error('Clock in error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to clock in',
    })
  }
})
