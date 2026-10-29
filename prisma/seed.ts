import { PrismaClient, UserRole, MembershipStatus, InstitutionStatus, AttendanceStatus, ExamType, MarkSubmissionStatus, VideoProviderType, TargetAudience } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting EduPros development database seed...");

  // 1. Create Platform Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@edupros.io" },
    update: {},
    create: {
      email: "superadmin@edupros.io",
      name: "Alexander Vance",
      isSuperAdmin: true,
      isActive: true,
    },
  });
  console.log("  Super Admin created:", superAdmin.email);

  // 2. Create Apex Institute of Technology
  const institution = await prisma.institution.upsert({
    where: { code: "AIT" },
    update: {},
    create: {
      name: "Apex Institute of Technology",
      code: "AIT",
      slug: "apex-institute",
      domain: "apex.edu",
      status: InstitutionStatus.ACTIVE,
      settings: {
        create: {
          primaryColor: "#172B4D",
          secondaryColor: "#3478D4",
          minAttendancePercent: 75.0,
          passPercentage: 40.0,
          timezone: "UTC",
        },
      },
    },
  });
  console.log("  Institution created:", institution.name);

  // Super admin membership
  await prisma.userMembership.upsert({
    where: {
      userId_institutionId_role: {
        userId: superAdmin.id,
        institutionId: institution.id,
        role: UserRole.SUPER_ADMIN,
      },
    },
    update: {},
    create: {
      userId: superAdmin.id,
      institutionId: institution.id,
      role: UserRole.SUPER_ADMIN,
      status: MembershipStatus.ACTIVE,
    },
  });

  // 3. Create Institution Admin
  const instAdminUser = await prisma.user.upsert({
    where: { email: "admin@apex.edu" },
    update: {},
    create: {
      email: "admin@apex.edu",
      name: "Dr. Eleanor Vance",
      isActive: true,
    },
  });

  await prisma.userMembership.upsert({
    where: {
      userId_institutionId_role: {
        userId: instAdminUser.id,
        institutionId: institution.id,
        role: UserRole.INSTITUTION_ADMIN,
      },
    },
    update: {},
    create: {
      userId: instAdminUser.id,
      institutionId: institution.id,
      role: UserRole.INSTITUTION_ADMIN,
      status: MembershipStatus.ACTIVE,
    },
  });
  console.log("  Institution Admin created:", instAdminUser.email);

  // 4. Create Academic Departments
  const deptCSE = await prisma.department.upsert({
    where: {
      institutionId_code: {
        institutionId: institution.id,
        code: "CSE",
      },
    },
    update: {},
    create: {
      institutionId: institution.id,
      name: "Computer Science & Engineering",
      code: "CSE",
      description: "Department of Computer Science and Engineering",
    },
  });

  const deptECE = await prisma.department.upsert({
    where: {
      institutionId_code: {
        institutionId: institution.id,
        code: "ECE",
      },
    },
    update: {},
    create: {
      institutionId: institution.id,
      name: "Electronics & Communication Engineering",
      code: "ECE",
      description: "Department of Electronics and Communication",
    },
  });
  console.log("  Departments created: CSE, ECE");

  // 5. Academic Year & Semesters
  const academicYear = await prisma.academicYear.create({
    data: {
      institutionId: institution.id,
      name: "2025-2026",
      startDate: new Date("2025-08-01"),
      endDate: new Date("2026-05-31"),
      isCurrent: true,
      semesters: {
        create: [
          {
            name: "Fall 2025 (Semester 1)",
            number: 1,
            startDate: new Date("2025-08-01"),
            endDate: new Date("2025-12-20"),
            isCurrent: true,
          },
          {
            name: "Spring 2026 (Semester 2)",
            number: 2,
            startDate: new Date("2026-01-10"),
            endDate: new Date("2026-05-31"),
            isCurrent: false,
          },
        ],
      },
    },
    include: { semesters: true },
  });

  const fallSemester = academicYear.semesters[0];

  // 6. Classes
  const classCSE = await prisma.class.create({
    data: {
      departmentId: deptCSE.id,
      semesterId: fallSemester.id,
      name: "CSE-3A",
      section: "A",
      capacity: 60,
    },
  });

  const classECE = await prisma.class.create({
    data: {
      departmentId: deptECE.id,
      semesterId: fallSemester.id,
      name: "ECE-2B",
      section: "B",
      capacity: 60,
    },
  });
  console.log("  Classes created: CSE-3A, ECE-2B");

  // 7. Subjects
  const subjectDSA = await prisma.subject.create({
    data: {
      departmentId: deptCSE.id,
      classId: classCSE.id,
      name: "Data Structures & Algorithms",
      code: "CS301",
      creditHours: 4,
    },
  });

  const subjectDBMS = await prisma.subject.create({
    data: {
      departmentId: deptCSE.id,
      classId: classCSE.id,
      name: "Database Management Systems",
      code: "CS302",
      creditHours: 3,
    },
  });

  const subjectSignals = await prisma.subject.create({
    data: {
      departmentId: deptECE.id,
      classId: classECE.id,
      name: "Signals and Systems",
      code: "EC201",
      creditHours: 3,
    },
  });
  console.log("  Subjects created: CS301, CS302, EC201");

  // 8. Teachers
  const teacherUser1 = await prisma.user.upsert({
    where: { email: "prof.sharma@apex.edu" },
    update: {},
    create: {
      email: "prof.sharma@apex.edu",
      name: "Prof. Rajesh Sharma",
      isActive: true,
      memberships: {
        create: {
          institutionId: institution.id,
          role: UserRole.TEACHER,
          status: MembershipStatus.ACTIVE,
        },
      },
      teacherProfile: {
        create: {
          employeeId: "EMP-CSE-01",
          qualification: "Ph.D. in Computer Science",
          specialization: "Algorithms and Complex Networks",
          departmentId: deptCSE.id,
        },
      },
    },
    include: { teacherProfile: true },
  });

  const teacherUser2 = await prisma.user.upsert({
    where: { email: "prof.adams@apex.edu" },
    update: {},
    create: {
      email: "prof.adams@apex.edu",
      name: "Prof. Sarah Adams",
      isActive: true,
      memberships: {
        create: {
          institutionId: institution.id,
          role: UserRole.TEACHER,
          status: MembershipStatus.ACTIVE,
        },
      },
      teacherProfile: {
        create: {
          employeeId: "EMP-CSE-02",
          qualification: "M.Tech in Software Engineering",
          specialization: "Database Systems",
          departmentId: deptCSE.id,
        },
      },
    },
    include: { teacherProfile: true },
  });

  // Assign teachers to subjects
  if (teacherUser1.teacherProfile) {
    await prisma.teacherAssignment.create({
      data: {
        teacherProfileId: teacherUser1.teacherProfile.id,
        subjectId: subjectDSA.id,
        isPrimary: true,
      },
    });
  }

  if (teacherUser2.teacherProfile) {
    await prisma.teacherAssignment.create({
      data: {
        teacherProfileId: teacherUser2.teacherProfile.id,
        subjectId: subjectDBMS.id,
        isPrimary: true,
      },
    });
  }
  console.log("  Teachers assigned to subjects successfully.");

  // 9. Students
  const studentsData = [
    {
      email: "student.aarav@apex.edu",
      name: "Aarav Mehta",
      roll: "CSE-2025-001",
      guardian: "Ramesh Mehta",
      phone: "+1-555-0101",
    },
    {
      email: "student.diya@apex.edu",
      name: "Diya Sengupta",
      roll: "CSE-2025-002",
      guardian: "Amit Sengupta",
      phone: "+1-555-0102",
    },
    {
      email: "student.rohan@apex.edu",
      name: "Rohan Verma",
      roll: "CSE-2025-003",
      guardian: "Sanjay Verma",
      phone: "+1-555-0103",
    },
    {
      email: "student.ananya@apex.edu",
      name: "Ananya Iyer",
      roll: "CSE-2025-004",
      guardian: "Krishna Iyer",
      phone: "+1-555-0104",
    },
  ];

  const seededStudents = [];
  for (const s of studentsData) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        name: s.name,
        isActive: true,
        phone: s.phone,
        memberships: {
          create: {
            institutionId: institution.id,
            role: UserRole.STUDENT,
            status: MembershipStatus.ACTIVE,
          },
        },
        studentProfile: {
          create: {
            rollNumber: s.roll,
            guardianName: s.guardian,
          },
        },
      },
      include: { studentProfile: true },
    });

    if (user.studentProfile) {
      await prisma.studentEnrollment.upsert({
        where: {
          studentProfileId_classId: {
            studentProfileId: user.studentProfile.id,
            classId: classCSE.id,
          },
        },
        update: {},
        create: {
          studentProfileId: user.studentProfile.id,
          classId: classCSE.id,
        },
      });
      seededStudents.push(user.studentProfile);
    }
  }
  console.log(`  Seeded ${seededStudents.length} students enrolled in CSE-3A.`);

  // 10. Attendance Sessions & Records
  if (teacherUser1.teacherProfile && seededStudents.length >= 4) {
    // Session 1
    const session1 = await prisma.attendanceSession.create({
      data: {
        institutionId: institution.id,
        classId: classCSE.id,
        subjectId: subjectDSA.id,
        conductedById: teacherUser1.teacherProfile.id,
        sessionDate: new Date("2025-09-01T10:00:00Z"),
        topicCovered: "Introduction to Algorithm Analysis & Big-O",
        totalStudents: 4,
        presentCount: 4,
        absentCount: 0,
        records: {
          create: seededStudents.map((s) => ({
            studentProfileId: s.id,
            status: AttendanceStatus.PRESENT,
            durationMinutes: 60,
          })),
        },
      },
    });

    // Session 2 - Rohan was absent
    await prisma.attendanceSession.create({
      data: {
        institutionId: institution.id,
        classId: classCSE.id,
        subjectId: subjectDSA.id,
        conductedById: teacherUser1.teacherProfile.id,
        sessionDate: new Date("2025-09-03T10:00:00Z"),
        topicCovered: "Asymptotic Notations & Recurrence Relations",
        totalStudents: 4,
        presentCount: 3,
        absentCount: 1,
        records: {
          create: seededStudents.map((s, idx) => ({
            studentProfileId: s.id,
            status: idx === 2 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT, // Rohan absent
            durationMinutes: idx === 2 ? 0 : 60,
          })),
        },
      },
    });

    // Session 3 - Rohan absent again (Attendance drops!)
    await prisma.attendanceSession.create({
      data: {
        institutionId: institution.id,
        classId: classCSE.id,
        subjectId: subjectDSA.id,
        conductedById: teacherUser1.teacherProfile.id,
        sessionDate: new Date("2025-09-05T10:00:00Z"),
        topicCovered: "Divide and Conquer: MergeSort Analysis",
        totalStudents: 4,
        presentCount: 3,
        absentCount: 1,
        records: {
          create: seededStudents.map((s, idx) => ({
            studentProfileId: s.id,
            status: idx === 2 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT,
            durationMinutes: idx === 2 ? 0 : 60,
          })),
        },
      },
    });
    console.log("  Seeded 3 Attendance Sessions with realistic presence records.");
  }

  // 11. Examinations & Marks Workflow
  const exam = await prisma.examination.create({
    data: {
      institutionId: institution.id,
      semesterId: fallSemester.id,
      name: "Midterm Examination - Fall 2025",
      type: ExamType.MIDTERM,
      startDate: new Date("2025-10-15"),
      endDate: new Date("2025-10-25"),
      isPublished: true,
      subjects: {
        create: {
          subjectId: subjectDSA.id,
          examDate: new Date("2025-10-16T09:00:00Z"),
          maxMarks: 100.0,
          passMarks: 40.0,
        },
      },
    },
    include: { subjects: true },
  });

  const examSubject = exam.subjects[0];

  if (teacherUser1.teacherProfile && examSubject && seededStudents.length >= 4) {
    const markSubmission = await prisma.markSubmission.create({
      data: {
        examinationSubjectId: examSubject.id,
        submittedById: teacherUser1.teacherProfile.id,
        version: 1,
        status: MarkSubmissionStatus.APPROVED,
        submissionNotes: "All answer scripts evaluated and cross-checked.",
        submittedAt: new Date("2025-10-20"),
        approvals: {
          create: {
            reviewedById: instAdminUser.id,
            decision: MarkSubmissionStatus.APPROVED,
            decisionReason: "Marks verified and approved for publication.",
            reviewedAt: new Date("2025-10-21"),
          },
        },
        marks: {
          create: [
            {
              examinationSubjectId: examSubject.id,
              studentProfileId: seededStudents[0].id, // Aarav
              marksObtained: 92.5,
              remarks: "Outstanding conceptual clarity",
            },
            {
              examinationSubjectId: examSubject.id,
              studentProfileId: seededStudents[1].id, // Diya
              marksObtained: 81.0,
              remarks: "Very good performance",
            },
            {
              examinationSubjectId: examSubject.id,
              studentProfileId: seededStudents[2].id, // Rohan
              marksObtained: 58.5,
              remarks: "Needs improvement in graph algorithms",
            },
            {
              examinationSubjectId: examSubject.id,
              studentProfileId: seededStudents[3].id, // Ananya
              marksObtained: 89.0,
              remarks: "Excellent solutions",
            },
          ],
        },
      },
    });
    console.log("  Seeded approved examination marks workflow for CS301.");
  }

  // 12. Recorded Lectures (YouTube)
  if (teacherUser1.teacherProfile) {
    await prisma.recordedClass.createMany({
      data: [
        {
          institutionId: institution.id,
          classId: classCSE.id,
          subjectId: subjectDSA.id,
          uploadedById: teacherUser1.teacherProfile.id,
          providerType: VideoProviderType.YOUTUBE,
          videoUrl: "https://www.youtube.com/watch?v=RBSGKlAvoiM",
          externalId: "RBSGKlAvoiM",
          title: "Lecture 1: Introduction to Data Structures and Algorithmic Complexity",
          description: "Comprehensive lecture covering Big-O, Omega, and Theta notations with practical code examples.",
          unitNumber: 1,
          durationSeconds: 3600,
          isPublished: true,
        },
        {
          institutionId: institution.id,
          classId: classCSE.id,
          subjectId: subjectDSA.id,
          uploadedById: teacherUser1.teacherProfile.id,
          providerType: VideoProviderType.YOUTUBE,
          videoUrl: "https://www.youtube.com/watch?v=zg9ih6SVACc",
          externalId: "zg9ih6SVACc",
          title: "Lecture 2: Binary Search Trees & Balanced AVL Trees",
          description: "Detailed step-by-step breakdown of rotations and tree search performance.",
          unitNumber: 2,
          durationSeconds: 4200,
          isPublished: true,
        },
      ],
    });
    console.log("  Seeded 2 Recorded Video Lectures with YouTube integration.");
  }

  // 13. Institutional Announcements
  await prisma.announcement.createMany({
    data: [
      {
        institutionId: institution.id,
        title: "Welcome to Academic Year 2025-2026",
        content: "We are pleased to welcome all faculty members and students to the new academic year. Please review your class timetables and attendance policies.",
        targetAudience: TargetAudience.ALL,
        isPinned: true,
        createdById: instAdminUser.id,
      },
      {
        institutionId: institution.id,
        title: "Minimum 75% Attendance Requirement Warning",
        content: "Students are strictly reminded that a minimum of 75% attendance across all registered courses is mandatory to qualify for final semester examinations.",
        targetAudience: TargetAudience.STUDENTS,
        isPinned: true,
        createdById: instAdminUser.id,
      },
    ],
  });
  console.log("  Seeded Institutional Announcements.");

  // 14. Initial Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        institutionId: institution.id,
        userId: superAdmin.id,
        action: "INSTITUTION_PROVISIONED",
        entityType: "Institution",
        entityId: institution.id,
        metadataJson: JSON.stringify({ name: institution.name, code: institution.code }),
      },
      {
        institutionId: institution.id,
        userId: instAdminUser.id,
        action: "EXAM_MARKS_APPROVED",
        entityType: "MarkSubmission",
        entityId: examSubject.id,
        metadataJson: JSON.stringify({ subject: "CS301", count: 4 }),
      },
    ],
  });
  console.log("  Seeded Initial Audit Logs.");

  console.log("✅ EduPros development database seed completed successfully!\n");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
