// server/services/settingsService.ts
import { eq } from 'drizzle-orm'
import { getDb } from '~/server/utils/db'
import {
  systemSettings,
  type SystemSetting,
  type NewSystemSetting
} from '~/server/db/schema'

export interface SchoolInfo {
  id?: string
  name: string
  address: string
  city: string
  state: string
  zip_code: string
  phone: string
  email: string
  website: string
  logo_url?: string
  description?: string
  established_year?: number
}

export interface ProgramRequirement {
  id?: string
  program_name: string
  required_hours: number
  certification_name: string
  description: string
  is_active: boolean
}

export const SETTINGS_TABLE = 'system_settings'

export const settingsService = {
  /**
   * Get school information
   */
  async getSchoolInfo(): Promise<SchoolInfo> {
    const db = getDb()

    const result = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.settingType, 'school_info'))
      .limit(1)

    if (!result[0]) {
      return {
        name: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        phone: '',
        email: '',
        website: ''
      }
    }

    return result[0].settingValue as unknown as SchoolInfo
  },

  /**
   * Update school information
   */
  async updateSchoolInfo(schoolInfo: SchoolInfo): Promise<SchoolInfo> {
    const db = getDb()

    const existing = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.settingType, 'school_info'))
      .limit(1)

    if (existing[0]) {
      await db
        .update(systemSettings)
        .set({
          settingValue: schoolInfo as unknown as Record<string, unknown>,
          updatedAt: new Date()
        })
        .where(eq(systemSettings.id, existing[0].id))
    } else {
      await db
        .insert(systemSettings)
        .values({
          settingType: 'school_info',
          settingValue: schoolInfo as unknown as Record<string, unknown>,
          createdAt: new Date(),
          updatedAt: new Date()
        })
    }

    return schoolInfo
  },

  /**
   * Get program requirements
   */
  async getProgramRequirements(): Promise<ProgramRequirement[]> {
    const db = getDb()

    const result = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.settingType, 'program_requirements'))
      .limit(1)

    if (!result[0]) {
      return []
    }

    return result[0].settingValue as unknown as ProgramRequirement[]
  },

  /**
   * Update program requirements
   */
  async updateProgramRequirements(requirements: ProgramRequirement[]): Promise<ProgramRequirement[]> {
    const db = getDb()

    const existing = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.settingType, 'program_requirements'))
      .limit(1)

    if (existing[0]) {
      await db
        .update(systemSettings)
        .set({
          settingValue: requirements as unknown as Record<string, unknown>,
          updatedAt: new Date()
        })
        .where(eq(systemSettings.id, existing[0].id))
    } else {
      await db
        .insert(systemSettings)
        .values({
          settingType: 'program_requirements',
          settingValue: requirements as unknown as Record<string, unknown>,
          createdAt: new Date(),
          updatedAt: new Date()
        })
    }

    return requirements
  },

  /**
   * Add a new program requirement
   */
  async addProgramRequirement(requirement: ProgramRequirement): Promise<ProgramRequirement[]> {
    const currentRequirements = await this.getProgramRequirements()

    if (!requirement.id) {
      requirement.id = crypto.randomUUID()
    }

    const updatedRequirements = [...currentRequirements, requirement]
    await this.updateProgramRequirements(updatedRequirements)

    return updatedRequirements
  },

  /**
   * Update a program requirement
   */
  async updateProgramRequirement(requirement: ProgramRequirement): Promise<ProgramRequirement[]> {
    const currentRequirements = await this.getProgramRequirements()

    const updatedRequirements = currentRequirements.map(req =>
      req.id === requirement.id ? requirement : req
    )

    await this.updateProgramRequirements(updatedRequirements)

    return updatedRequirements
  },

  /**
   * Delete a program requirement
   */
  async deleteProgramRequirement(requirementId: string): Promise<ProgramRequirement[]> {
    const currentRequirements = await this.getProgramRequirements()

    const updatedRequirements = currentRequirements.filter(req => req.id !== requirementId)

    await this.updateProgramRequirements(updatedRequirements)

    return updatedRequirements
  },

  /**
   * Get system theme settings
   */
  async getThemeSettings(): Promise<any> {
    const db = getDb()

    const result = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.settingType, 'theme_settings'))
      .limit(1)

    if (!result[0]) {
      return {
        primaryColor: '#ef4444',
        secondaryColor: '#0ea5e9',
        darkMode: false,
        customLogo: false,
        logoUrl: ''
      }
    }

    return result[0].settingValue
  },

  /**
   * Update system theme settings
   */
  async updateThemeSettings(themeSettings: any): Promise<any> {
    const db = getDb()

    const existing = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.settingType, 'theme_settings'))
      .limit(1)

    if (existing[0]) {
      await db
        .update(systemSettings)
        .set({
          settingValue: themeSettings,
          updatedAt: new Date()
        })
        .where(eq(systemSettings.id, existing[0].id))
    } else {
      await db
        .insert(systemSettings)
        .values({
          settingType: 'theme_settings',
          settingValue: themeSettings,
          createdAt: new Date(),
          updatedAt: new Date()
        })
    }

    return themeSettings
  }
}
