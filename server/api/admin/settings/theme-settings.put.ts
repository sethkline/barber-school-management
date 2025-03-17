import { H3Event, defineEventHandler, readBody } from 'h3'
import { settingsService } from '~/server/services/settingsService'
import { checkAdminRole } from '~/server/utils/authUtils'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Check if the user has admin privileges
    await checkAdminRole(event)
    
    // Get theme settings data from request body
    const themeSettingsData = await readBody(event)
    
    // Update theme settings
    const updatedThemeSettings = await settingsService.updateThemeSettings(themeSettingsData)
    
    return updatedThemeSettings
  } catch (error: any) {
    const status = error.status || 500
    return createError({
      statusCode: status,
      statusMessage: error.message
    })
  }
})