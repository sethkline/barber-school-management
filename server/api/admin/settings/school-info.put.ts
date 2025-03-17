import { H3Event, defineEventHandler, readBody } from 'h3'
import { settingsService } from '~/server/services/settingsService'
import { checkAdminRole } from '~/server/utils/authUtils'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Check if the user has admin privileges
    await checkAdminRole(event)
    
    // Get school info data from request body
    const schoolInfoData = await readBody(event)
    
    // Validate required fields
    if (!schoolInfoData.name || !schoolInfoData.address || !schoolInfoData.city || 
        !schoolInfoData.state || !schoolInfoData.zip_code || !schoolInfoData.phone || 
        !schoolInfoData.email) {
      return createError({
        statusCode: 400,
        statusMessage: 'Missing required fields'
      })
    }
    
    // Update school information
    const updatedSchoolInfo = await settingsService.updateSchoolInfo(schoolInfoData)
    
    return updatedSchoolInfo
  } catch (error: any) {
    const status = error.status || 500
    return createError({
      statusCode: status,
      statusMessage: error.message
    })
  }
})