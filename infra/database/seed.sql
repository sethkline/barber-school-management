-- Barber School Database Seed Data
-- Default settings and categories

-- ============================================
-- DEFAULT EVENT CATEGORIES
-- ============================================
INSERT INTO event_categories (id, name, color, description) VALUES
    ('class', 'Class', '#4ade80', 'Regular class sessions and workshops'),
    ('appointment', 'Appointment', '#a78bfa', 'Individual or group appointments'),
    ('assessment', 'Assessment', '#f87171', 'Tests, quizzes, and other evaluations'),
    ('task', 'Task', '#60a5fa', 'Tasks and deadlines'),
    ('meeting', 'Meeting', '#fbbf24', 'Staff and administrative meetings')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    color = EXCLUDED.color,
    description = EXCLUDED.description;

-- ============================================
-- DEFAULT SYSTEM SETTINGS
-- ============================================

-- Default School Info
INSERT INTO system_settings (setting_type, setting_value) VALUES
    ('school_info', '{
        "name": "",
        "address": "",
        "city": "",
        "state": "",
        "zip_code": "",
        "phone": "",
        "email": "",
        "website": "",
        "logo_url": "",
        "description": "",
        "established_year": null
    }'::jsonb)
ON CONFLICT (setting_type) DO NOTHING;

-- Default Theme Settings
INSERT INTO system_settings (setting_type, setting_value) VALUES
    ('theme_settings', '{
        "primaryColor": "#ef4444",
        "secondaryColor": "#0ea5e9",
        "darkMode": false,
        "customLogo": false,
        "logoUrl": ""
    }'::jsonb)
ON CONFLICT (setting_type) DO NOTHING;

-- Default Program Requirements
INSERT INTO system_settings (setting_type, setting_value) VALUES
    ('program_requirements', '[
        {
            "id": "barber-basic",
            "program_name": "Basic Barbering",
            "required_hours": 1500,
            "certification_name": "Barber License",
            "description": "Standard barbering program covering all fundamental skills",
            "is_active": true
        }
    ]'::jsonb)
ON CONFLICT (setting_type) DO NOTHING;

-- ============================================
-- DEFAULT COMMUNICATION TEMPLATES
-- ============================================
INSERT INTO communication_templates (name, subject, body) VALUES
    ('Welcome Email', 'Welcome to Our Barber School!', '<p>Dear {{first_name}},</p><p>Welcome to our barber school! We are excited to have you join us.</p><p>Please feel free to reach out if you have any questions.</p><p>Best regards,<br>The Barber School Team</p>'),
    ('Enrollment Confirmation', 'Enrollment Confirmation', '<p>Dear {{first_name}},</p><p>This email confirms your enrollment in our barbering program. Your start date is {{enrollment_date}}.</p><p>Please bring the following items on your first day:</p><ul><li>Valid ID</li><li>Proof of enrollment payment</li></ul><p>We look forward to seeing you!</p><p>Best regards,<br>The Barber School Team</p>'),
    ('Attendance Reminder', 'Attendance Reminder', '<p>Dear {{first_name}},</p><p>This is a friendly reminder to clock in for your classes. Regular attendance is important for your progress.</p><p>If you have any scheduling conflicts, please contact us immediately.</p><p>Best regards,<br>The Barber School Team</p>'),
    ('Certificate Expiration Notice', 'Certificate Expiration Notice', '<p>Dear {{first_name}},</p><p>This is to notify you that your {{certification_name}} certificate will expire on {{expiration_date}}.</p><p>Please take the necessary steps to renew your certification before it expires.</p><p>Best regards,<br>The Barber School Team</p>'),
    ('Lead Follow-up', 'Thank You for Your Interest', '<p>Dear {{first_name}},</p><p>Thank you for your interest in our barber school. We would love to tell you more about our programs and answer any questions you may have.</p><p>Would you like to schedule a visit to our facility? Please let us know a convenient time for you.</p><p>Best regards,<br>The Barber School Team</p>')
ON CONFLICT DO NOTHING;

-- ============================================
-- SAMPLE STUDENTS
-- ============================================
INSERT INTO students (first_name, last_name, email, phone, address, city, zip_code, status, enrollment_date, expected_graduation_date) VALUES
    ('Marcus', 'Johnson', 'marcus.johnson@example.com', '(555) 101-2001', '123 Main St', 'Springfield', '62701', 'active', '2025-09-02', '2026-09-02'),
    ('Deshawn', 'Williams', 'deshawn.williams@example.com', '(555) 101-2002', '456 Oak Ave', 'Springfield', '62702', 'active', '2025-09-02', '2026-09-02'),
    ('Anthony', 'Davis', 'anthony.davis@example.com', '(555) 101-2003', '789 Elm St', 'Springfield', '62703', 'active', '2025-10-01', '2026-10-01'),
    ('Carlos', 'Martinez', 'carlos.martinez@example.com', '(555) 101-2004', '321 Pine Rd', 'Springfield', '62704', 'active', '2025-10-15', '2026-10-15'),
    ('Jamal', 'Brown', 'jamal.brown@example.com', '(555) 101-2005', '654 Cedar Ln', 'Springfield', '62705', 'active', '2025-11-01', '2026-11-01'),
    ('Tyler', 'Robinson', 'tyler.robinson@example.com', '(555) 101-2006', '987 Birch Dr', 'Springfield', '62706', 'active', '2026-01-06', '2027-01-06'),
    ('Kevin', 'Thomas', 'kevin.thomas@example.com', '(555) 101-2007', '147 Maple Ct', 'Springfield', '62707', 'inactive', '2024-06-01', '2025-06-01'),
    ('Andre', 'Jackson', 'andre.jackson@example.com', '(555) 101-2008', '258 Walnut St', 'Springfield', '62708', 'graduated', '2024-01-15', '2025-01-15')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- SAMPLE LEADS
-- ============================================
INSERT INTO leads (first_name, last_name, email, phone, status, message) VALUES
    ('Brandon', 'Taylor', 'brandon.taylor@example.com', '(555) 201-3001', 'new', 'Interested in the barbering program. When does the next cohort start?'),
    ('Devon', 'Harris', 'devon.harris@example.com', '(555) 201-3002', 'contacted', 'Looking for a career change into barbering.'),
    ('Isaiah', 'Clark', 'isaiah.clark@example.com', '(555) 201-3003', 'new', 'Can I visit the school for a tour?')
ON CONFLICT DO NOTHING;
