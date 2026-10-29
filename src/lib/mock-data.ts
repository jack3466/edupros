export interface MockStore {
  institutions: any[];
  users: any[];
  userMemberships: any[];
  departments: any[];
  academicYears: any[];
  semesters: any[];
  classes: any[];
  subjects: any[];
  teacherProfiles: any[];
  studentProfiles: any[];
  teacherAssignments: any[];
  studentEnrollments: any[];
  attendanceSessions: any[];
  attendanceRecords: any[];
  attendanceCorrections: any[];
  examinations: any[];
  examinationSubjects: any[];
  examMarks: any[];
  markSubmissions: any[];
  markApprovals: any[];
  recordedClasses: any[];
  videoProgresses: any[];
  studyMaterials: any[];
  assignments: any[];
  announcements: any[];
  auditLogs: any[];
  invitations: any[];
  systemConfigurations: any[];
  supportTickets: any[];
}

const instId = "inst-apex-001";
const deptCseId = "dept-cse-001";
const deptEceId = "dept-ece-001";
const yearId = "year-2025-001";
const semId = "sem-fall-001";
const classCseId = "class-cse-3a";
const classEceId = "class-ece-2b";
const subDsaId = "sub-cs301";
const subDbmsId = "sub-cs302";
const subSignalsId = "sub-ec201";

const userSuperAdminId = "user-superadmin-001";
const userAdminId = "user-admin-001";
const userTeacher1Id = "user-teacher-001";
const userTeacher2Id = "user-teacher-002";
const userStudent1Id = "user-student-001";
const userStudent2Id = "user-student-002";
const userStudent3Id = "user-student-003";
const userStudent4Id = "user-student-004";

const teacherProf1Id = "tprof-001";
const teacherProf2Id = "tprof-002";

const studentProf1Id = "sprof-001";
const studentProf2Id = "sprof-002";
const studentProf3Id = "sprof-003";
const studentProf4Id = "sprof-004";

const examId = "exam-midterm-001";
const examSubId = "esub-dsa-001";
const submissionId = "subm-dsa-001";

export function initializeMockStore(): MockStore {
  return {
    institutions: [
      {
        id: instId,
        name: "Apex Institute of Technology",
        code: "AIT",
        slug: "apex-institute",
        domain: "apex.edu",
        status: "ACTIVE",
        isDeleted: false,
        createdAt: new Date("2025-01-01"),
        settings: {
          id: "settings-001",
          institutionId: instId,
          primaryColor: "#172B4D",
          secondaryColor: "#3478D4",
          minAttendancePercent: 75.0,
          passPercentage: 40.0,
        },
      },
    ],
    users: [
      {
        id: userSuperAdminId,
        email: "superadmin@edupros.io",
        name: "Alexander Vance",
        isSuperAdmin: true,
        isActive: true,
        createdAt: new Date("2025-01-01"),
      },
      {
        id: userAdminId,
        email: "admin@apex.edu",
        name: "Dr. Eleanor Vance",
        isSuperAdmin: false,
        isActive: true,
        createdAt: new Date("2025-01-01"),
      },
      {
        id: userTeacher1Id,
        email: "prof.sharma@apex.edu",
        name: "Prof. Rajesh Sharma",
        isSuperAdmin: false,
        isActive: true,
        createdAt: new Date("2025-01-05"),
      },
      {
        id: userTeacher2Id,
        email: "prof.adams@apex.edu",
        name: "Prof. Sarah Adams",
        isSuperAdmin: false,
        isActive: true,
        createdAt: new Date("2025-01-05"),
      },
      {
        id: userStudent1Id,
        email: "student.aarav@apex.edu",
        name: "Aarav Mehta",
        isSuperAdmin: false,
        isActive: true,
        createdAt: new Date("2025-01-10"),
      },
      {
        id: userStudent2Id,
        email: "student.diya@apex.edu",
        name: "Diya Sengupta",
        isSuperAdmin: false,
        isActive: true,
        createdAt: new Date("2025-01-10"),
      },
      {
        id: userStudent3Id,
        email: "student.rohan@apex.edu",
        name: "Rohan Verma",
        isSuperAdmin: false,
        isActive: true,
        createdAt: new Date("2025-01-10"),
      },
      {
        id: userStudent4Id,
        email: "student.ananya@apex.edu",
        name: "Ananya Iyer",
        isSuperAdmin: false,
        isActive: true,
        createdAt: new Date("2025-01-10"),
      },
    ],
    userMemberships: [
      {
        id: "mem-001",
        userId: userSuperAdminId,
        institutionId: instId,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
      },
      {
        id: "mem-002",
        userId: userAdminId,
        institutionId: instId,
        role: "INSTITUTION_ADMIN",
        status: "ACTIVE",
      },
      {
        id: "mem-003",
        userId: userTeacher1Id,
        institutionId: instId,
        role: "TEACHER",
        status: "ACTIVE",
      },
      {
        id: "mem-004",
        userId: userTeacher2Id,
        institutionId: instId,
        role: "TEACHER",
        status: "ACTIVE",
      },
      {
        id: "mem-005",
        userId: userStudent1Id,
        institutionId: instId,
        role: "STUDENT",
        status: "ACTIVE",
      },
      {
        id: "mem-006",
        userId: userStudent2Id,
        institutionId: instId,
        role: "STUDENT",
        status: "ACTIVE",
      },
      {
        id: "mem-007",
        userId: userStudent3Id,
        institutionId: instId,
        role: "STUDENT",
        status: "ACTIVE",
      },
      {
        id: "mem-008",
        userId: userStudent4Id,
        institutionId: instId,
        role: "STUDENT",
        status: "ACTIVE",
      },
    ],
    departments: [
      {
        id: deptCseId,
        institutionId: instId,
        name: "Computer Science & Engineering",
        code: "CSE",
        description: "Department of Computer Science and Engineering",
      },
      {
        id: deptEceId,
        institutionId: instId,
        name: "Electronics & Communication Engineering",
        code: "ECE",
        description: "Department of Electronics and Communication",
      },
    ],
    academicYears: [
      {
        id: yearId,
        institutionId: instId,
        name: "2025-2026",
        startDate: new Date("2025-08-01"),
        endDate: new Date("2026-05-31"),
        isCurrent: true,
      },
    ],
    semesters: [
      {
        id: semId,
        academicYearId: yearId,
        name: "Fall 2025 (Semester 1)",
        number: 1,
        startDate: new Date("2025-08-01"),
        endDate: new Date("2025-12-20"),
        isCurrent: true,
      },
    ],
    classes: [
      {
        id: classCseId,
        departmentId: deptCseId,
        semesterId: semId,
        name: "CSE-3A",
        section: "A",
        capacity: 60,
      },
      {
        id: classEceId,
        departmentId: deptEceId,
        semesterId: semId,
        name: "ECE-2B",
        section: "B",
        capacity: 60,
      },
    ],
    subjects: [
      {
        id: subDsaId,
        departmentId: deptCseId,
        classId: classCseId,
        name: "Data Structures & Algorithms",
        code: "CS301",
        creditHours: 4,
      },
      {
        id: subDbmsId,
        departmentId: deptCseId,
        classId: classCseId,
        name: "Database Management Systems",
        code: "CS302",
        creditHours: 3,
      },
      {
        id: subSignalsId,
        departmentId: deptEceId,
        classId: classEceId,
        name: "Signals and Systems",
        code: "EC201",
        creditHours: 3,
      },
    ],
    teacherProfiles: [
      {
        id: teacherProf1Id,
        userId: userTeacher1Id,
        employeeId: "EMP-CSE-01",
        qualification: "Ph.D. in Computer Science",
        specialization: "Algorithms and Complex Networks",
        departmentId: deptCseId,
      },
      {
        id: teacherProf2Id,
        userId: userTeacher2Id,
        employeeId: "EMP-CSE-02",
        qualification: "M.Tech in Software Engineering",
        specialization: "Database Systems",
        departmentId: deptCseId,
      },
    ],
    studentProfiles: [
      {
        id: studentProf1Id,
        userId: userStudent1Id,
        rollNumber: "CSE-2025-001",
        guardianName: "Ramesh Mehta",
        guardianPhone: "+1-555-0101",
      },
      {
        id: studentProf2Id,
        userId: userStudent2Id,
        rollNumber: "CSE-2025-002",
        guardianName: "Amit Sengupta",
        guardianPhone: "+1-555-0102",
      },
      {
        id: studentProf3Id,
        userId: userStudent3Id,
        rollNumber: "CSE-2025-003",
        guardianName: "Sanjay Verma",
        guardianPhone: "+1-555-0103",
      },
      {
        id: studentProf4Id,
        userId: userStudent4Id,
        rollNumber: "CSE-2025-004",
        guardianName: "Krishna Iyer",
        guardianPhone: "+1-555-0104",
      },
    ],
    teacherAssignments: [
      {
        id: "ta-001",
        teacherProfileId: teacherProf1Id,
        subjectId: subDsaId,
        isPrimary: true,
      },
      {
        id: "ta-002",
        teacherProfileId: teacherProf2Id,
        subjectId: subDbmsId,
        isPrimary: true,
      },
    ],
    studentEnrollments: [
      { id: "enr-001", studentProfileId: studentProf1Id, classId: classCseId, isActive: true },
      { id: "enr-002", studentProfileId: studentProf2Id, classId: classCseId, isActive: true },
      { id: "enr-003", studentProfileId: studentProf3Id, classId: classCseId, isActive: true },
      { id: "enr-004", studentProfileId: studentProf4Id, classId: classCseId, isActive: true },
    ],
    attendanceSessions: [
      {
        id: "asess-001",
        institutionId: instId,
        classId: classCseId,
        subjectId: subDsaId,
        conductedById: teacherProf1Id,
        sessionDate: new Date("2025-09-01T10:00:00Z"),
        topicCovered: "Introduction to Algorithm Analysis & Big-O",
        totalStudents: 4,
        presentCount: 4,
        absentCount: 0,
      },
      {
        id: "asess-002",
        institutionId: instId,
        classId: classCseId,
        subjectId: subDsaId,
        conductedById: teacherProf1Id,
        sessionDate: new Date("2025-09-03T10:00:00Z"),
        topicCovered: "Asymptotic Notations & Recurrence Relations",
        totalStudents: 4,
        presentCount: 3,
        absentCount: 1,
      },
      {
        id: "asess-003",
        institutionId: instId,
        classId: classCseId,
        subjectId: subDsaId,
        conductedById: teacherProf1Id,
        sessionDate: new Date("2025-09-05T10:00:00Z"),
        topicCovered: "Divide and Conquer: MergeSort Analysis",
        totalStudents: 4,
        presentCount: 3,
        absentCount: 1,
      },
    ],
    attendanceRecords: [
      // Session 1
      { id: "rec-01", sessionId: "asess-001", studentProfileId: studentProf1Id, status: "PRESENT", durationMinutes: 60 },
      { id: "rec-02", sessionId: "asess-001", studentProfileId: studentProf2Id, status: "PRESENT", durationMinutes: 60 },
      { id: "rec-03", sessionId: "asess-001", studentProfileId: studentProf3Id, status: "PRESENT", durationMinutes: 60 },
      { id: "rec-04", sessionId: "asess-001", studentProfileId: studentProf4Id, status: "PRESENT", durationMinutes: 60 },
      // Session 2 - Rohan absent
      { id: "rec-05", sessionId: "asess-002", studentProfileId: studentProf1Id, status: "PRESENT", durationMinutes: 60 },
      { id: "rec-06", sessionId: "asess-002", studentProfileId: studentProf2Id, status: "PRESENT", durationMinutes: 60 },
      { id: "rec-07", sessionId: "asess-002", studentProfileId: studentProf3Id, status: "ABSENT", durationMinutes: 0 },
      { id: "rec-08", sessionId: "asess-002", studentProfileId: studentProf4Id, status: "PRESENT", durationMinutes: 60 },
      // Session 3 - Rohan absent again
      { id: "rec-09", sessionId: "asess-003", studentProfileId: studentProf1Id, status: "PRESENT", durationMinutes: 60 },
      { id: "rec-10", sessionId: "asess-003", studentProfileId: studentProf2Id, status: "PRESENT", durationMinutes: 60 },
      { id: "rec-11", sessionId: "asess-003", studentProfileId: studentProf3Id, status: "ABSENT", durationMinutes: 0 },
      { id: "rec-12", sessionId: "asess-003", studentProfileId: studentProf4Id, status: "PRESENT", durationMinutes: 60 },
    ],
    attendanceCorrections: [
      {
        id: "corr-001",
        institutionId: instId,
        attendanceRecordId: "rec-07",
        requestedById: studentProf3Id,
        previousStatus: "ABSENT",
        requestedStatus: "PRESENT",
        reason: "Joined lecture via recording link due to campus bus delay.",
        status: "PENDING",
        createdAt: new Date("2025-09-04"),
      },
    ],
    examinations: [
      {
        id: examId,
        institutionId: instId,
        semesterId: semId,
        name: "Midterm Examination - Fall 2025",
        type: "MIDTERM",
        startDate: new Date("2025-10-15"),
        endDate: new Date("2025-10-25"),
        isPublished: true,
      },
    ],
    examinationSubjects: [
      {
        id: examSubId,
        examinationId: examId,
        subjectId: subDsaId,
        examDate: new Date("2025-10-16T09:00:00Z"),
        maxMarks: 100.0,
        passMarks: 40.0,
      },
    ],
    markSubmissions: [
      {
        id: submissionId,
        examinationSubjectId: examSubId,
        submittedById: teacherProf1Id,
        version: 1,
        status: "APPROVED",
        submissionNotes: "All answer scripts evaluated and cross-checked.",
        submittedAt: new Date("2025-10-20"),
      },
    ],
    markApprovals: [
      {
        id: "appr-001",
        submissionId: submissionId,
        reviewedById: userAdminId,
        decision: "APPROVED",
        decisionReason: "Marks verified and approved for publication.",
        reviewedAt: new Date("2025-10-21"),
      },
    ],
    examMarks: [
      { id: "em-01", examinationSubjectId: examSubId, studentProfileId: studentProf1Id, marksObtained: 92.5, isAbsent: false, remarks: "Outstanding conceptual clarity", submissionId },
      { id: "em-02", examinationSubjectId: examSubId, studentProfileId: studentProf2Id, marksObtained: 81.0, isAbsent: false, remarks: "Very good performance", submissionId },
      { id: "em-03", examinationSubjectId: examSubId, studentProfileId: studentProf3Id, marksObtained: 58.5, isAbsent: false, remarks: "Needs improvement in graph algorithms", submissionId },
      { id: "em-04", examinationSubjectId: examSubId, studentProfileId: studentProf4Id, marksObtained: 89.0, isAbsent: false, remarks: "Excellent solutions", submissionId },
    ],
    recordedClasses: [
      {
        id: "rec-vid-001",
        institutionId: instId,
        classId: classCseId,
        subjectId: subDsaId,
        uploadedById: teacherProf1Id,
        providerType: "YOUTUBE",
        videoUrl: "https://www.youtube.com/watch?v=RBSGKlAvoiM",
        externalId: "RBSGKlAvoiM",
        title: "Lecture 1: Introduction to Data Structures and Algorithmic Complexity",
        description: "Comprehensive lecture covering Big-O, Omega, and Theta notations with practical code examples.",
        unitNumber: 1,
        durationSeconds: 3600,
        isPublished: true,
        createdAt: new Date("2025-09-02"),
      },
      {
        id: "rec-vid-002",
        institutionId: instId,
        classId: classCseId,
        subjectId: subDsaId,
        uploadedById: teacherProf1Id,
        providerType: "YOUTUBE",
        videoUrl: "https://www.youtube.com/watch?v=zg9ih6SVACc",
        externalId: "zg9ih6SVACc",
        title: "Lecture 2: Binary Search Trees & Balanced AVL Trees",
        description: "Detailed step-by-step breakdown of rotations and tree search performance.",
        unitNumber: 2,
        durationSeconds: 4200,
        isPublished: true,
        createdAt: new Date("2025-09-06"),
      },
    ],
    videoProgresses: [
      {
        id: "vp-001",
        recordedClassId: "rec-vid-001",
        studentProfileId: studentProf1Id,
        watchedSeconds: 3600,
        totalSeconds: 3600,
        isCompleted: true,
        lastWatchedAt: new Date(),
      },
    ],
    studyMaterials: [
      {
        id: "mat-001",
        institutionId: instId,
        classId: classCseId,
        subjectId: subDsaId,
        uploadedById: teacherProf1Id,
        title: "Unit 1: Big-O Cheatsheet and Asymptotic Guide",
        description: "Quick reference formulas and complexities for standard sorting algorithms.",
        fileUrl: "https://example.com/materials/unit1-big-o.pdf",
        unitNumber: 1,
        isPublished: true,
        createdAt: new Date("2025-09-01"),
      },
    ],
    assignments: [
      {
        id: "asgn-001",
        institutionId: instId,
        classId: classCseId,
        subjectId: subDsaId,
        createdById: teacherProf1Id,
        title: "Problem Set 1: Recurrence Relations & MergeSort",
        description: "Solve problems 1 through 8 using the Master Theorem.",
        dueDate: new Date("2025-11-15"),
        maxMarks: 100.0,
        createdAt: new Date("2025-10-01"),
        submissions: [],
      },
    ],
    announcements: [
      {
        id: "ann-001",
        institutionId: instId,
        title: "Welcome to Academic Year 2025-2026",
        content: "We are pleased to welcome all faculty members and students to the new academic year. Please review class timetables and policies.",
        targetAudience: "ALL",
        isPinned: true,
        createdAt: new Date("2025-08-01"),
      },
      {
        id: "ann-002",
        institutionId: instId,
        title: "Minimum 75% Attendance Requirement Warning",
        content: "Students are strictly reminded that a minimum of 75% attendance across all registered courses is mandatory to qualify for final examinations.",
        targetAudience: "STUDENTS",
        isPinned: true,
        createdAt: new Date("2025-08-10"),
      },
    ],
    auditLogs: [
      {
        id: "audit-001",
        institutionId: instId,
        userId: userSuperAdminId,
        action: "INSTITUTION_PROVISIONED",
        entityType: "Institution",
        entityId: instId,
        metadataJson: JSON.stringify({ name: "Apex Institute of Technology", code: "AIT" }),
        createdAt: new Date("2025-01-01"),
      },
      {
        id: "audit-002",
        institutionId: instId,
        userId: userAdminId,
        action: "EXAM_MARKS_APPROVED",
        entityType: "MarkSubmission",
        entityId: examSubId,
        metadataJson: JSON.stringify({ subject: "CS301", count: 4 }),
        createdAt: new Date("2025-10-21"),
      },
    ],
    invitations: [
      {
        id: "inv-001",
        email: "dean.eng@horizon.edu",
        institutionId: instId,
        role: "INSTITUTION_ADMIN",
        token: "tok-horizon-demo-001",
        expiresAt: new Date("2026-12-31"),
        acceptedAt: null,
        createdAt: new Date("2025-08-01"),
      },
    ],
    systemConfigurations: [
      {
        id: "cfg-001",
        key: "MAINTENANCE_MODE",
        value: "false",
        description: "Global system maintenance mode flag",
      },
      {
        id: "cfg-002",
        key: "REGISTRATION_OPEN",
        value: "true",
        description: "Allow prospective institution administrator requests",
      },
      {
        id: "cfg-003",
        key: "MIN_ATTENDANCE_DEFAULT",
        value: "75",
        description: "System-wide default attendance cutoff percentage",
      },
    ],
    supportTickets: [
      {
        id: "tick-001",
        institutionId: instId,
        userId: userAdminId,
        subject: "Custom Grade Sheet Export Inquiry",
        description: "Requesting guidance on university format export for the state accreditation board.",
        status: "OPEN",
        priority: "MEDIUM",
        createdAt: new Date("2025-10-20"),
      },
    ],
  };
}

let globalStore: MockStore | null = null;
export function getMockStore(): MockStore {
  if (!globalStore) {
    globalStore = initializeMockStore();
  }
  return globalStore;
}
