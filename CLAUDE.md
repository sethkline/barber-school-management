# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Background

This is a comprehensive management system created for a small barber school, handling the entire project lifecycle from requirements gathering to deployment. The system completely replaced previous paper-based workflows with a modern digital solution.

**Development Process**:
- **Requirements**: Gathered through stakeholder interviews, creating user flows for student enrollment, attendance tracking, certification management, and administrative operations
- **Architecture**: Selected and implemented a modern tech stack including Supabase (PostgreSQL-based backend), Nuxt 3 (Vue framework), and PrimeVue (UI component library)
- **Database Design**: Designed a robust relational database with tables for students, attendance, assessments, certifications, documents, tasks, communications, and leads
- **Backend Development**: Created secure API endpoints with complex business logic for student tracking, certification expiration alerts, and attendance management
- **Frontend Development**: Built an intuitive UI with custom components and a cohesive design system
- **Authentication**: Implemented secure cookie-based authentication with role-based access control
- **Testing**: Developed component stories for thorough UI testing and validation

The system enables the school to efficiently track student progress, manage leads, handle communications, and monitor attendance—transforming their operational workflow.

## Common Commands

### Development
```bash
npm run dev          # Start development server on http://localhost:3000
npm install          # Install dependencies
npm run postinstall  # Run after dependency changes (runs nuxt prepare)
```

### Testing
```bash
npm test             # Run tests with Vitest in watch mode
npm run test:coverage # Run tests with coverage report
```

### Storybook
```bash
npm run storybook    # Start Storybook dev server on http://localhost:6006
npm run build-storybook # Build Storybook for production
```

### Production
```bash
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run generate     # Generate static site
```

## Key Features

### Dashboard
- Interactive charts and metrics for at-a-glance insights
- Real-time student status tracking
- Upcoming tasks and events overview
- Attendance summaries

### Student Management
- Detailed student profiles with comprehensive information
- AWS S3 document upload and management system with presigned URLs
- Student enrollment and onboarding workflows
- Progress tracking across multiple dimensions

### Attendance Tracking
- Clock in/out functionality (authenticated and public kiosk)
- Public mobile-friendly kiosk for student self-check-in (`/kiosk`)
- Daily attendance views and reports
- Student attendance history
- Attendance statistics and analytics

### Assessment & Certification Management
- Student assessment tracking and progress monitoring
- Certification issuance and management
- Automated certification expiration alerts
- Performance analytics

### Communications
- Email template management with TipTap rich text editor
- Single and bulk email functionality
- Communication history tracking
- Mailgun integration for reliable delivery

### Lead Management
- Lead tracking and conversion workflows
- Lead-to-student conversion process
- Communication and follow-up management

### Administrative Tools
- User management with role-based access control
- School settings and program requirements configuration
- Theme customization (light/dark mode support)
- System-wide settings management

## Architecture Overview

### Frontend Structure

**Pages**: Located in `/pages/`. File-based routing with nested routes for student details (`students/[id]`), certifications (`certifications/[id]`), and admin sections.

**Components**: Organized by feature area:
- `/components/dashboard/` - Dashboard widgets and cards
- `/components/students/` - Student management components
- `/components/communications/` - Email and bulk communication
- `/components/attendance/` - Attendance tracking and reports
- `/components/assessments/` - Student assessment and progress tracking
- `/components/certifications/` - Certification management
- `/components/hours/` - Student hours tracking
- `/components/calendar/` - Calendar and event management
- `/components/admin/` - User management and system settings
- `/components/analytics/` - Analytics and reporting
- `/components/templates/` - Email template management
- `/components/tiptap/` - TipTap rich text editor integration

**Composables**: Feature-specific composables in `/composables/`:
- `useAuth.ts` - Authentication logic with Supabase
- `useAttendance.ts` - Attendance operations
- `useAssessments.ts` - Assessment operations
- `useCertifications.ts` - Certification management
- `useHours.ts` - Hours tracking
- `useCalendar.ts` - Calendar events
- `useUsers.ts` - User management
- `useSettings.ts` - System settings
- `useNavigation.ts` - Navigation helpers

**State Management**: Pinia store in `/stores/user.ts` manages user state.

### Backend Structure

**Database Schema**: PostgreSQL database via Supabase with core tables:
- `students` - Student records and enrollment information
- `attendance` - Clock in/out records and daily attendance
- `assessments` - Student assessments and performance tracking
- `certifications` - Certification records with expiration tracking
- `documents` - File uploads and document management
- `tasks` - Task assignments and tracking
- `communications` - Email history and templates
- `leads` - Prospective student lead management
- `users` - System users with role-based access control

**API Routes**: RESTful API endpoints in `/server/api/`:
- `/students/*` - Student CRUD operations and documents
- `/leads/*` - Lead management and conversion
- `/tasks/*` - Task management
- `/templates/*` - Email template management
- `/communications/*` - Email sending (single and bulk)
- `/attendance/*` - Clock in/out, daily stats, student history
- `/assessments/*` - Assessment CRUD, student progress, analytics
- `/certifications/*` - Certification management, expiration tracking
- `/hours/*` - Hours tracking, summaries, certificate generation
- `/calendar/*` - Event management, categories
- `/documents/*` - Document download URLs (S3 presigned URLs)
- `/admin/users/*` - User management
- `/admin/settings/*` - School settings, program requirements, theming
- `/auth/*` - Authentication endpoints (logout, me)
- `/user/*` - Profile and profile image updates
- `/public/*` - Public endpoints (no authentication required)
  - `/public/students` - List active students for kiosk
  - `/public/attendance/clock-in` - Public clock in endpoint
  - `/public/attendance/clock-out` - Public clock out endpoint
  - `/public/attendance/status` - Check student clock status

**Services**: Business logic layer in `/server/services/`:
- `studentService.ts` - Student operations
- `leadService.ts` - Lead management
- `taskService.ts` - Task operations
- `communicationsService.ts` - Email service using Mailgun
- `attendanceService.ts` - Attendance calculations
- `assessmentService.ts` - Assessment operations
- `certificationService.ts` - Certification tracking
- `hoursService.ts` - Hours calculations
- `calendarService.ts` - Calendar operations
- `settingsService.ts` - System settings
- `documentService.ts` - S3 document operations (upload, download URLs, delete)

**Middleware**: `/server/middleware/auth.ts` handles authentication by extracting user from access_token cookie. Public routes (`/api/public/*`) are excluded from authentication.

**Utils**:
- `/server/utils/supabaseClient.ts` - Supabase client initialization
- `/server/utils/s3Client.ts` - AWS S3 client and file operations (upload, delete, presigned URLs)
- `/server/utils/certificateGenerator.ts` - Certificate generation logic
- `/server/utils/authUtils.ts` - Authentication utilities

### Authentication Flow

Authentication uses Supabase Auth with secure cookie-based sessions and role-based access control:
1. Client-side: `useAuth` composable handles sign-in/sign-out
2. Server-side: Auth middleware extracts user from `access_token` cookie and sets `event.context.user`
3. Role-based access control restricts features based on user permissions
4. Supabase configuration in `nuxt.config.ts` uses environment variables (SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY)

### Styling System

- **TailwindCSS**: Primary styling framework with custom configuration in `tailwind.config.ts`
- **PrimeVue**: UI component library configured with unstyled mode (`theme: 'none'`)
- **Custom Theme**: Defined in `/assets/styles/base.css` with CSS variables for primary and secondary colors
- **Light/Dark Mode**: Full theme support with configurable color schemes
- **Custom Components**: Specialized UI components including `BarberButton` with animated barber pole effect
- **PrimeVue Styles**: Component-specific styles in `/assets/styles/primevue/`

### Type Safety

TypeScript types located in `/types/`:
- `supabase.ts` - Database types
- `auth.ts` - Authentication types
- `index.ts` - Shared types

## Key Implementation Patterns

### API Route Pattern
Server routes follow a consistent pattern:
1. Extract parameters from event
2. Call service layer for business logic
3. Return standardized responses with error handling

### Component Pattern
Components use Composition API with:
- Props for data input
- Emits for events
- Composables for shared logic
- PrimeVue components for UI

### Service Layer
Services encapsulate database operations and business logic, using the Supabase client from `getSupabaseClient()`.

## Testing

Tests use Vitest with the Nuxt test utils:
- Environment: `nuxt` with `happy-dom`
- Config in `vitest.config.ts`
- Run individual tests: `npm test -- <test-file-pattern>`

## Environment Variables

Required variables (configured in `.env`):
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Service role key for server-side operations
- `SUPABASE_ANON_KEY` - Anonymous key for client-side operations
- `AWS_ACCESS_KEY_ID` - AWS access key for S3 operations
- `AWS_SECRET_ACCESS_KEY` - AWS secret key for S3 operations
- `AWS_REGION` - AWS region (e.g., us-east-1)
- `AWS_S3_BUCKET` - S3 bucket name for document storage

## Storybook Integration

Component stories are co-located with components using `.stories.ts` files. Storybook is configured via `@nuxtjs/storybook` module.
