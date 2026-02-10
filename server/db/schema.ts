// Drizzle ORM Schema for Barber School
import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  timestamp,
  decimal,
  boolean,
  jsonb,
  unique
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ============================================
// STUDENTS TABLE
// ============================================
export const students = pgTable('students', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  zipCode: varchar('zip_code', { length: 20 }),
  status: varchar('status', { length: 50 }).default('active'),
  photoUrl: text('photo_url'),
  enrollmentDate: date('enrollment_date'),
  expectedGraduationDate: date('expected_graduation_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

export const studentsRelations = relations(students, ({ many }) => ({
  attendance: many(attendance),
  assessments: many(assessments),
  certifications: many(studentCertifications),
  hours: many(studentHours),
  documents: many(studentDocuments),
  emergencyContacts: many(emergencyContacts),
  communications: many(communications)
}))

// ============================================
// ATTENDANCE TABLE
// ============================================
export const attendance = pgTable('attendance', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }),
  attendanceDate: date('attendance_date').notNull(),
  clockIn: timestamp('clock_in', { withTimezone: true }),
  clockOut: timestamp('clock_out', { withTimezone: true }),
  status: varchar('status', { length: 50 }).notNull().default('present'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  uniqueStudentDate: unique().on(table.studentId, table.attendanceDate)
}))

export const attendanceRelations = relations(attendance, ({ one }) => ({
  student: one(students, {
    fields: [attendance.studentId],
    references: [students.id]
  })
}))

// ============================================
// ASSESSMENTS TABLE
// ============================================
export const assessments = pgTable('assessments', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }),
  assessmentType: varchar('assessment_type', { length: 100 }),
  assessmentDate: date('assessment_date'),
  score: decimal('score', { precision: 5, scale: 2 }),
  comment: text('comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

export const assessmentsRelations = relations(assessments, ({ one }) => ({
  student: one(students, {
    fields: [assessments.studentId],
    references: [students.id]
  })
}))

// ============================================
// STUDENT CERTIFICATIONS TABLE
// ============================================
export const studentCertifications = pgTable('student_certifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }),
  certificationName: varchar('certification_name', { length: 255 }),
  awardedDate: date('awarded_date'),
  expirationDate: date('expiration_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

export const studentCertificationsRelations = relations(studentCertifications, ({ one }) => ({
  student: one(students, {
    fields: [studentCertifications.studentId],
    references: [students.id]
  })
}))

// ============================================
// STUDENT HOURS TABLE
// ============================================
export const studentHours = pgTable('student_hours', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }),
  hoursCompleted: decimal('hours_completed', { precision: 10, scale: 2 }),
  dateRecorded: date('date_recorded'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

export const studentHoursRelations = relations(studentHours, ({ one }) => ({
  student: one(students, {
    fields: [studentHours.studentId],
    references: [students.id]
  })
}))

// ============================================
// STUDENT DOCUMENTS TABLE
// ============================================
export const studentDocuments = pgTable('student_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }),
  documentName: varchar('document_name', { length: 255 }),
  fileUrl: text('file_url'),
  expirationDate: date('expiration_date'),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

export const studentDocumentsRelations = relations(studentDocuments, ({ one }) => ({
  student: one(students, {
    fields: [studentDocuments.studentId],
    references: [students.id]
  })
}))

// ============================================
// EMERGENCY CONTACTS TABLE
// ============================================
export const emergencyContacts = pgTable('emergency_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  relationship: varchar('relationship', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

export const emergencyContactsRelations = relations(emergencyContacts, ({ one }) => ({
  student: one(students, {
    fields: [emergencyContacts.studentId],
    references: [students.id]
  })
}))

// ============================================
// LEADS TABLE
// ============================================
export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  zipCode: varchar('zip_code', { length: 20 }),
  status: varchar('status', { length: 50 }).default('new'),
  message: text('message'),
  contactedDate: timestamp('contacted_date', { withTimezone: true }),
  followUpDate: timestamp('follow_up_date', { withTimezone: true }),
  scheduleInterview: boolean('schedule_interview').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

export const leadsRelations = relations(leads, ({ many }) => ({
  tasks: many(tasks),
  communications: many(communications)
}))

// ============================================
// TASKS TABLE
// ============================================
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
  description: text('description'),
  dueDate: timestamp('due_date', { withTimezone: true }),
  status: varchar('status', { length: 50 }).default('pending'),
  assignedTo: varchar('assigned_to', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

export const tasksRelations = relations(tasks, ({ one }) => ({
  lead: one(leads, {
    fields: [tasks.leadId],
    references: [leads.id]
  })
}))

// ============================================
// COMMUNICATION TEMPLATES TABLE
// ============================================
export const communicationTemplates = pgTable('communication_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }).notNull(),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

export const communicationTemplatesRelations = relations(communicationTemplates, ({ many }) => ({
  communications: many(communications)
}))

// ============================================
// COMMUNICATIONS TABLE
// ============================================
export const communications = pgTable('communications', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => students.id, { onDelete: 'set null' }),
  leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
  templateId: uuid('template_id').references(() => communicationTemplates.id, { onDelete: 'set null' }),
  type: varchar('type', { length: 50 }).default('email'),
  toEmail: varchar('to_email', { length: 255 }),
  toPhone: varchar('to_phone', { length: 20 }),
  subject: varchar('subject', { length: 500 }),
  body: text('body'),
  status: varchar('status', { length: 50 }).default('sent'),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

export const communicationsRelations = relations(communications, ({ one }) => ({
  student: one(students, {
    fields: [communications.studentId],
    references: [students.id]
  }),
  lead: one(leads, {
    fields: [communications.leadId],
    references: [leads.id]
  }),
  template: one(communicationTemplates, {
    fields: [communications.templateId],
    references: [communicationTemplates.id]
  })
}))

// ============================================
// EVENT CATEGORIES TABLE
// ============================================
export const eventCategories = pgTable('event_categories', {
  id: varchar('id', { length: 100 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 20 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

export const eventCategoriesRelations = relations(eventCategories, ({ many }) => ({
  events: many(calendarEvents)
}))

// ============================================
// CALENDAR EVENTS TABLE
// ============================================
export const calendarEvents = pgTable('calendar_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  start: timestamp('start', { withTimezone: true }).notNull(),
  end: timestamp('end', { withTimezone: true }).notNull(),
  allDay: boolean('all_day').default(false),
  categoryId: varchar('category_id', { length: 100 }).references(() => eventCategories.id, { onDelete: 'set null' }),
  location: text('location'),
  description: text('description'),
  relatedId: uuid('related_id'),
  relatedType: varchar('related_type', { length: 50 }),
  isRecurring: boolean('is_recurring').default(false),
  recurrenceFrequency: varchar('recurrence_frequency', { length: 20 }),
  recurrenceUntil: timestamp('recurrence_until', { withTimezone: true }),
  createdBy: varchar('created_by', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  category: one(eventCategories, {
    fields: [calendarEvents.categoryId],
    references: [eventCategories.id]
  })
}))

// ============================================
// SYSTEM SETTINGS TABLE
// ============================================
export const systemSettings = pgTable('system_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  settingType: varchar('setting_type', { length: 100 }).notNull().unique(),
  settingValue: jsonb('setting_value').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

// ============================================
// LEGACY STUDENTS TABLE
// ============================================
export const legacyStudents = pgTable('legacy_students', {
  id: uuid('id').primaryKey().defaultRandom(),
  originalStudentId: uuid('original_student_id'),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  zipCode: varchar('zip_code', { length: 20 }),
  enrollmentDate: date('enrollment_date'),
  graduationDate: date('graduation_date'),
  notes: text('notes'),
  archivedAt: timestamp('archived_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

// ============================================
// TYPE EXPORTS
// ============================================
export type Student = typeof students.$inferSelect
export type NewStudent = typeof students.$inferInsert

export type Attendance = typeof attendance.$inferSelect
export type NewAttendance = typeof attendance.$inferInsert

export type Assessment = typeof assessments.$inferSelect
export type NewAssessment = typeof assessments.$inferInsert

export type StudentCertification = typeof studentCertifications.$inferSelect
export type NewStudentCertification = typeof studentCertifications.$inferInsert

export type StudentHour = typeof studentHours.$inferSelect
export type NewStudentHour = typeof studentHours.$inferInsert

export type StudentDocument = typeof studentDocuments.$inferSelect
export type NewStudentDocument = typeof studentDocuments.$inferInsert

export type EmergencyContact = typeof emergencyContacts.$inferSelect
export type NewEmergencyContact = typeof emergencyContacts.$inferInsert

export type Lead = typeof leads.$inferSelect
export type NewLead = typeof leads.$inferInsert

export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert

export type CommunicationTemplate = typeof communicationTemplates.$inferSelect
export type NewCommunicationTemplate = typeof communicationTemplates.$inferInsert

export type Communication = typeof communications.$inferSelect
export type NewCommunication = typeof communications.$inferInsert

export type EventCategory = typeof eventCategories.$inferSelect
export type NewEventCategory = typeof eventCategories.$inferInsert

export type CalendarEvent = typeof calendarEvents.$inferSelect
export type NewCalendarEvent = typeof calendarEvents.$inferInsert

export type SystemSetting = typeof systemSettings.$inferSelect
export type NewSystemSetting = typeof systemSettings.$inferInsert

export type LegacyStudent = typeof legacyStudents.$inferSelect
export type NewLegacyStudent = typeof legacyStudents.$inferInsert
