import { getSupabaseClient } from '~/server/utils/supabaseClient'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { studentId } = query

    if (!studentId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Student ID is required',
      })
    }

    const supabase = getSupabaseClient()

    // Check if student has active clock-in
    const { data } = await supabase
      .from('attendance')
      .select('id, clock_in')
      .eq('student_id', studentId as string)
      .is('clock_out', null)
      .single()

    return {
      isClockedIn: !!data,
      clockInTime: data?.clock_in || null,
    }
  } catch (error: any) {
    return {
      isClockedIn: false,
      clockInTime: null,
    }
  }
})
