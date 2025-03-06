// server/services/studentService.ts

import { getSupabaseClient } from '~/server/utils/supabaseClient';
import type { Tables, TablesInsert, TablesUpdate } from '~/types/supabase';

// Define type aliases for convenience
type Student = Tables<'students'>;
type StudentInsert = TablesInsert<'students'>;
type StudentUpdate = TablesUpdate<'students'>;

// For the student documents table:
type StudentDocument = Tables<'student_documents'>;
type StudentDocumentInsert = TablesInsert<'student_documents'>;

export interface ListStudentsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export const studentService = {
  /**
   * Retrieve a paginated list of students.
   */
  async getStudents({
    page = 1,
    limit = 10,
    search = '',
    status = ''
  }: ListStudentsParams): Promise<{ data: Student[]; count: number }> {
    const supabase = getSupabaseClient();

    // Begin building the query for the "students" table.
    let query = supabase.from<Student>('students').select('*', { count: 'exact' });

    // Apply a filter by status if provided.
    if (status) {
      query = query.eq('status', status);
    }

    // Apply a search filter against first_name, last_name, or email.
    if (search) {
      // Using the OR filter with ilike to match patterns
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Calculate pagination offsets.
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Execute the query.
    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch students: ${error.message}`);
    }

    return { data: data ?? [], count: count ?? 0 };
  },

  /**
   * Retrieve a single student by ID.
   */
  async getStudentById(id: string): Promise<Student> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from<Student>('students').select('*').eq('id', id).single();

    if (error) {
      throw new Error(`Failed to get student with ID ${id}: ${error.message}`);
    }
    return data!;
  },

  /**
   * Create a new student record.
   */
  async createStudent(studentData: StudentInsert): Promise<Student> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from<Student>('students').insert(studentData).single();

    if (error) {
      throw new Error(`Failed to create student: ${error.message}`);
    }
    return data!;
  },

  /**
   * Update an existing student record.
   */
  async updateStudent(id: string, studentData: StudentUpdate): Promise<Student> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from<Student>('students').update(studentData).eq('id', id).single();

    if (error) {
      throw new Error(`Failed to update student with ID ${id}: ${error.message}`);
    }
    return data!;
  },

  /**
   * Delete (or archive) a student record.
   * For a soft delete, consider updating a status field instead.
   */
  async deleteStudent(id: string): Promise<Student> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from<Student>('students').delete().eq('id', id).single();

    if (error) {
      throw new Error(`Failed to delete student with ID ${id}: ${error.message}`);
    }
    return data!;
  },

  /**
   * List all documents for a given student.
   */
  async listStudentDocuments(studentId: string): Promise<StudentDocument[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from<StudentDocument>('student_documents')
      .select('*')
      .eq('student_id', studentId);

    if (error) {
      throw new Error(`Failed to fetch documents for student ${studentId}: ${error.message}`);
    }
    return data ?? [];
  },

  /**
   * Upload a new document for a student.
   */
  async uploadStudentDocument(studentId: string, documentData: StudentDocumentInsert): Promise<StudentDocument> {
    const supabase = getSupabaseClient();
    // Ensure the document is associated with the correct student.
    const dataToInsert = { ...documentData, student_id: studentId };
    const { data, error } = await supabase.from<StudentDocument>('student_documents').insert(dataToInsert).single();

    if (error) {
      throw new Error(`Failed to upload document for student ${studentId}: ${error.message}`);
    }
    return data!;
  },

  /**
   * Remove a specific student document.
   */
  async removeStudentDocument(studentId: string, documentId: string): Promise<StudentDocument> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from<StudentDocument>('student_documents')
      .delete()
      .eq('id', documentId)
      .eq('student_id', studentId)
      .single();

    if (error) {
      throw new Error(`Failed to delete document ${documentId} for student ${studentId}: ${error.message}`);
    }
    return data!;
  },

  /**
   * Archive a student by moving them to legacy_students table
   */
  async archiveStudent(id: string, studentData: Student): Promise<void> {
    const supabase = getSupabaseClient();

    try {
      // Start a transaction to archive the student
      const { error: archiveError } = await supabase.from('legacy_students').insert({
        original_student_id: id,
        first_name: studentData.first_name,
        last_name: studentData.last_name,
        email: studentData.email,
        phone: studentData.phone,
        address: studentData.address,
        city: studentData.city,
        zip_code: studentData.zip_code,
        enrollment_date: studentData.enrollment_date,
        graduation_date: studentData.expected_graduation_date,
        notes: `Archived at ${new Date().toISOString()}`,
        archived_at: new Date().toISOString()
      });

      if (archiveError) {
        throw new Error(`Failed to archive student: ${archiveError.message}`);
      }

      // Delete from active students after successful archive
      const { error: deleteError } = await supabase.from('students').delete().eq('id', id);

      if (deleteError) {
        throw new Error(`Failed to remove archived student: ${deleteError.message}`);
      }
    } catch (error: any) {
      throw new Error(`Failed to archive student: ${error.message}`);
    }
  }
};
