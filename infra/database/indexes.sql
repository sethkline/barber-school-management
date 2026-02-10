-- Barber School Database Indexes
-- Performance optimization indexes

-- ============================================
-- STUDENTS INDEXES
-- ============================================
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_enrollment_date ON students(enrollment_date);
CREATE INDEX idx_students_name ON students(last_name, first_name);
CREATE INDEX idx_students_created_at ON students(created_at);

-- ============================================
-- ATTENDANCE INDEXES
-- ============================================
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_attendance_student_date ON attendance(student_id, attendance_date);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_attendance_clock_in ON attendance(clock_in);

-- ============================================
-- ASSESSMENTS INDEXES
-- ============================================
CREATE INDEX idx_assessments_student_id ON assessments(student_id);
CREATE INDEX idx_assessments_date ON assessments(assessment_date);
CREATE INDEX idx_assessments_type ON assessments(assessment_type);

-- ============================================
-- STUDENT CERTIFICATIONS INDEXES
-- ============================================
CREATE INDEX idx_student_certifications_student_id ON student_certifications(student_id);
CREATE INDEX idx_student_certifications_expiration ON student_certifications(expiration_date);
CREATE INDEX idx_student_certifications_name ON student_certifications(certification_name);

-- ============================================
-- STUDENT HOURS INDEXES
-- ============================================
CREATE INDEX idx_student_hours_student_id ON student_hours(student_id);
CREATE INDEX idx_student_hours_date ON student_hours(date_recorded);

-- ============================================
-- STUDENT DOCUMENTS INDEXES
-- ============================================
CREATE INDEX idx_student_documents_student_id ON student_documents(student_id);
CREATE INDEX idx_student_documents_expiration ON student_documents(expiration_date);

-- ============================================
-- EMERGENCY CONTACTS INDEXES
-- ============================================
CREATE INDEX idx_emergency_contacts_student_id ON emergency_contacts(student_id);

-- ============================================
-- LEADS INDEXES
-- ============================================
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_follow_up_date ON leads(follow_up_date);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_name ON leads(last_name, first_name);

-- ============================================
-- TASKS INDEXES
-- ============================================
CREATE INDEX idx_tasks_lead_id ON tasks(lead_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);

-- ============================================
-- COMMUNICATIONS INDEXES
-- ============================================
CREATE INDEX idx_communications_student_id ON communications(student_id);
CREATE INDEX idx_communications_lead_id ON communications(lead_id);
CREATE INDEX idx_communications_template_id ON communications(template_id);
CREATE INDEX idx_communications_sent_at ON communications(sent_at);
CREATE INDEX idx_communications_type ON communications(type);

-- ============================================
-- CALENDAR EVENTS INDEXES
-- ============================================
CREATE INDEX idx_calendar_events_start ON calendar_events(start);
CREATE INDEX idx_calendar_events_end ON calendar_events("end");
CREATE INDEX idx_calendar_events_category ON calendar_events(category_id);
CREATE INDEX idx_calendar_events_created_by ON calendar_events(created_by);
CREATE INDEX idx_calendar_events_related ON calendar_events(related_id, related_type);
CREATE INDEX idx_calendar_events_date_range ON calendar_events(start, "end");

-- ============================================
-- SYSTEM SETTINGS INDEXES
-- ============================================
CREATE INDEX idx_system_settings_type ON system_settings(setting_type);

-- ============================================
-- LEGACY STUDENTS INDEXES
-- ============================================
CREATE INDEX idx_legacy_students_original_id ON legacy_students(original_student_id);
CREATE INDEX idx_legacy_students_archived_at ON legacy_students(archived_at);
