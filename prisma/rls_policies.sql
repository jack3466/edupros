-- ====================================================================
-- EDUPROS: POSTGRESQL ROW LEVEL SECURITY (RLS) POLICIES
-- Multi-Tenant Educational Management System Isolation Engine
-- ====================================================================

-- 1. Enable RLS on Tenant-Scoped Tables
ALTER TABLE "Institution" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InstitutionSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Department" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AcademicYear" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Semester" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Class" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subject" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TeacherAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudentEnrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudentProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TeacherProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AttendanceSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AttendanceRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AttendanceImport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AttendanceCorrection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Examination" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExaminationSubject" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExamMark" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MarkSubmission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecordedClass" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VideoProgress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudyMaterial" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Assignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AssignmentSubmission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Announcement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SupportTicket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 2. HELPER FUNCTIONS FOR SESSION JWT & TENANT RESOLUTION
-- ====================================================================

-- Current authenticated Supabase UID
CREATE OR REPLACE FUNCTION current_auth_user_id()
RETURNS text AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$ LANGUAGE sql STABLE;

-- Current user internal database ID
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS text AS $$
  SELECT id FROM "User" WHERE "supabaseUid" = current_auth_user_id() LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Check if current user is Super Admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
  SELECT COALESCE(
    (SELECT "isSuperAdmin" FROM "User" WHERE "supabaseUid" = current_auth_user_id() LIMIT 1),
    false
  );
$$ LANGUAGE sql STABLE;

-- Check if current user is Institution Admin for a given institution
CREATE OR REPLACE FUNCTION is_institution_admin(inst_id text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM "UserMembership" m
    JOIN "User" u ON m."userId" = u.id
    WHERE u."supabaseUid" = current_auth_user_id()
      AND m."institutionId" = inst_id
      AND m."role" = 'INSTITUTION_ADMIN'
      AND m."status" = 'ACTIVE'
  );
$$ LANGUAGE sql STABLE;

-- Check if current user is Teacher for an institution
CREATE OR REPLACE FUNCTION is_institution_teacher(inst_id text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM "UserMembership" m
    JOIN "User" u ON m."userId" = u.id
    WHERE u."supabaseUid" = current_auth_user_id()
      AND m."institutionId" = inst_id
      AND m."role" = 'TEACHER'
      AND m."status" = 'ACTIVE'
  );
$$ LANGUAGE sql STABLE;

-- ====================================================================
-- 3. INSTITUTION & TENANT CORE POLICIES
-- ====================================================================

-- Institution table:
-- Super admin can read & write all; users can read institutions they belong to.
CREATE POLICY institution_super_admin_all ON "Institution"
  FOR ALL
  USING (is_super_admin());

CREATE POLICY institution_member_select ON "Institution"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "UserMembership" m
      JOIN "User" u ON m."userId" = u.id
      WHERE u."supabaseUid" = current_auth_user_id()
        AND m."institutionId" = "Institution".id
        AND m."status" = 'ACTIVE'
    )
  );

-- ====================================================================
-- 4. ATTENDANCE ISOLATION POLICIES
-- ====================================================================

-- AttendanceSession:
-- Super Admins and Institution Admins have full access within their tenant.
-- Teachers can only view/create sessions for classes and subjects they are assigned to.
-- Students can only view sessions for their enrolled class.

CREATE POLICY attendance_session_admin ON "AttendanceSession"
  FOR ALL
  USING (is_super_admin() OR is_institution_admin("institutionId"));

CREATE POLICY attendance_session_teacher ON "AttendanceSession"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "TeacherProfile" tp
      JOIN "TeacherAssignment" ta ON ta."teacherProfileId" = tp.id
      JOIN "User" u ON tp."userId" = u.id
      WHERE u."supabaseUid" = current_auth_user_id()
        AND ta."subjectId" = "AttendanceSession"."subjectId"
    )
  );

CREATE POLICY attendance_session_student_select ON "AttendanceSession"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "StudentProfile" sp
      JOIN "StudentEnrollment" se ON se."studentProfileId" = sp.id
      JOIN "User" u ON sp."userId" = u.id
      WHERE u."supabaseUid" = current_auth_user_id()
        AND se."classId" = "AttendanceSession"."classId"
        AND se."isActive" = true
    )
  );

-- AttendanceRecord:
-- Student can ONLY view their own records!
CREATE POLICY attendance_record_student_own_select ON "AttendanceRecord"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "StudentProfile" sp
      JOIN "User" u ON sp."userId" = u.id
      WHERE u."supabaseUid" = current_auth_user_id()
        AND sp.id = "AttendanceRecord"."studentProfileId"
    )
  );

CREATE POLICY attendance_record_admin_all ON "AttendanceRecord"
  FOR ALL
  USING (
    is_super_admin() OR EXISTS (
      SELECT 1 FROM "AttendanceSession" s
      WHERE s.id = "AttendanceRecord"."sessionId"
        AND is_institution_admin(s."institutionId")
    )
  );

-- ====================================================================
-- 5. EXAMINATION & MARKS ISOLATION POLICIES
-- ====================================================================

-- ExamMark:
-- 1. Student can ONLY view their OWN marks AND only if the exam is published!
CREATE POLICY exam_mark_student_select ON "ExamMark"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "StudentProfile" sp
      JOIN "User" u ON sp."userId" = u.id
      JOIN "ExaminationSubject" es ON es.id = "ExamMark"."examinationSubjectId"
      JOIN "Examination" e ON e.id = es."examinationId"
      WHERE u."supabaseUid" = current_auth_user_id()
        AND sp.id = "ExamMark"."studentProfileId"
        AND e."isPublished" = true
    )
  );

-- 2. Assigned teacher can view and update marks for their assigned subjects
CREATE POLICY exam_mark_teacher_manage ON "ExamMark"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "TeacherProfile" tp
      JOIN "TeacherAssignment" ta ON ta."teacherProfileId" = tp.id
      JOIN "ExaminationSubject" es ON es."subjectId" = ta."subjectId"
      JOIN "User" u ON tp."userId" = u.id
      WHERE u."supabaseUid" = current_auth_user_id()
        AND es.id = "ExamMark"."examinationSubjectId"
    )
  );

-- 3. Institution admin has full oversight
CREATE POLICY exam_mark_admin_all ON "ExamMark"
  FOR ALL
  USING (
    is_super_admin() OR EXISTS (
      SELECT 1 FROM "ExaminationSubject" es
      JOIN "Examination" e ON es."examinationId" = e.id
      WHERE es.id = "ExamMark"."examinationSubjectId"
        AND is_institution_admin(e."institutionId")
    )
  );

-- ====================================================================
-- 6. RECORDED CLASSES & VIDEO ACCESS POLICIES
-- ====================================================================

-- Students can only access published recorded classes for classes they are enrolled in
CREATE POLICY recorded_class_student_select ON "RecordedClass"
  FOR SELECT
  USING (
    "isPublished" = true AND EXISTS (
      SELECT 1 FROM "StudentProfile" sp
      JOIN "StudentEnrollment" se ON se."studentProfileId" = sp.id
      JOIN "User" u ON sp."userId" = u.id
      WHERE u."supabaseUid" = current_auth_user_id()
        AND se."classId" = "RecordedClass"."classId"
        AND se."isActive" = true
    )
  );

-- Admins and faculty can manage recorded classes
CREATE POLICY recorded_class_admin_all ON "RecordedClass"
  FOR ALL
  USING (is_super_admin() OR is_institution_admin("institutionId"));

-- VideoProgress: Students can read & update their own watch progress
CREATE POLICY video_progress_student_own ON "VideoProgress"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "StudentProfile" sp
      JOIN "User" u ON sp."userId" = u.id
      WHERE u."supabaseUid" = current_auth_user_id()
        AND sp.id = "VideoProgress"."studentProfileId"
    )
  );

-- ====================================================================
-- 7. AUDIT LOGS (IMMUTABLE LOGS)
-- ====================================================================
-- Audit logs can NEVER be updated or deleted by any standard tenant user!
CREATE POLICY audit_log_admin_read ON "AuditLog"
  FOR SELECT
  USING (is_super_admin() OR is_institution_admin("institutionId"));

CREATE POLICY audit_log_insert ON "AuditLog"
  FOR INSERT
  WITH CHECK (true); -- Server actions / service role can insert audit rows
