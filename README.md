# EDUPROS: Multi-Tenant Educational Management System

**EduPros** is an enterprise-grade, multi-tenant educational management SaaS platform engineered with Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, PostgreSQL, Prisma ORM, and Supabase (Auth, RLS, Storage).

---

## 🚀 Key Architectural Capabilities

1. **Four Distinct Role Portals**:
   - **Platform Super Admin** (`/platform/dashboard`): Global control plane, tenant provisioning, cross-tenant user governance, integration telemetry, and immutable audit logs.
   - **Institution Admin** (`/institution/dashboard`): Academic hierarchy (departments, semesters, classes, subjects), teacher course assignments, student registry, bulk CSV/Excel student admissions, attendance oversight, examination mark review & publishing, recorded lecture archives, and Recharts analytics.
   - **Teacher Portal** (`/teacher/dashboard`): Filtered to assigned classes & courses; live attendance roll call, examination mark entry (draft, submit, versioning), study material uploads, assignment issuance, and YouTube lecture linkage.
   - **Student Portal** (`/student/dashboard`): Attendance percentage tracker with real-time **attendance shortage warning & calculator** (< 75%), published examination transcripts with grade cards, YouTube lecture player with watch progress tracking, downloadable notes, and attendance dispute requests.

2. **Multi-Tenant Isolation**:
   - Every tenant entity is explicitly scoped by `institutionId`.
   - PostgreSQL Row Level Security (RLS) policies in `prisma/rls_policies.sql` enforce that students only view their own marks and teachers only query assigned cohorts.
   - Server Actions and edge middleware enforce tenant boundaries before database mutations.

3. **Unified Attendance Integration Engine**:
   - Manual session recording with fast status selection (Present, Absent, Excused).
   - Bulk CSV & Excel (`.xlsx`) parsing via `papaparse` and `xlsx` with automatic column detection, live preview, and duplicate prevention.
   - Student discrepancy dispute workflow allowing authorized attendance corrections.

4. **Multi-Tier Examination Approval Workflow**:
   - Teacher marks entry $\rightarrow$ Draft $\rightarrow$ Submission to Administration $\rightarrow$ Review & Approval/Rejection with feedback reason $\rightarrow$ Result Publishing to students.

5. **Recorded Lecture Archive**:
   - YouTube IFrame API integration with automatic 11-character video ID validation.
   - Course and syllabus unit categorization with student watch progress tracking.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript 5.6
- **Styling**: Tailwind CSS with custom palette (Primary Navy `#172B4D`, Secondary Blue `#3478D4`, Background `#F5F7FA`)
- **UI System**: shadcn-style component primitives (Radix UI, Lucide React icons)
- **Database**: PostgreSQL with Prisma ORM (37 normalized models)
- **Authentication**: Supabase Auth SSR Client + Edge Route Middleware + Mock local dev adapter
- **Authorization**: Role-Based Access Control (RBAC) + PostgreSQL Row Level Security (RLS)
- **Spreadsheet Parsers**: `xlsx` (Excel) & `papaparse` (CSV)
- **Visualizations**: `recharts`
- **Validation**: `zod`
- **Testing**: `vitest`

---

## 🏃 Getting Started

### 1. Prerequisites
- Node.js 18.x or 20.x (tested on Node v24)
- PostgreSQL database (local or hosted Supabase database)

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update your database connection string and Supabase credentials. For rapid local testing without a live Supabase remote project, `ENABLE_MOCK_AUTH="true"` is enabled by default.

### 3. Generate Prisma Client & Push Database Schema
```bash
npm run db:generate
npm run db:push
```

### 4. Seed Development Data
```bash
npm run db:seed
```
This seeds:
- Super Admin: `superadmin@edupros.io`
- Institution: `Apex Institute of Technology` (`code: AIT`)
- Institution Admin: `admin@apex.edu`
- Departments: `CSE` and `ECE`
- Academic Year, Fall Semester, Classes (`CSE-3A`, `ECE-2B`), and Subjects (`CS301`, `CS302`, `EC201`)
- Teachers: `prof.sharma@apex.edu`, `prof.adams@apex.edu`
- Students: `student.aarav@apex.edu`, `student.diya@apex.edu`, `student.rohan@apex.edu`, `student.ananya@apex.edu`
- Attendance sessions with realistic shortage distribution
- Examination with full approved marks pipeline
- YouTube recorded lectures

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Role Accounts & Instant Switcher

Navigate to [http://localhost:3000/login](http://localhost:3000/login) to use the **1-Click Instant Role Switcher** or enter standard credentials:

| Role | Email | Target Dashboard | Description |
|---|---|---|---|
| **Platform Super Admin** | `superadmin@edupros.io` | `/platform/dashboard` | Cross-tenant governance & provisioning |
| **Institution Admin** | `admin@apex.edu` | `/institution/dashboard` | Apex Institute governance & exam approval |
| **Teacher** | `prof.sharma@apex.edu` | `/teacher/dashboard` | CS301 instructor (attendance, marks, videos) |
| **Student** | `student.aarav@apex.edu` | `/student/dashboard` | CSE-3A enrolled candidate |

---

## 🧪 Automated Testing Suite

Run the Vitest test suite covering all 10 core security, tenant isolation, and calculation scenarios:
```bash
npm test
```
**Test Coverage**:
1. `tests/integration/security-isolation.test.ts`:
   - Student cannot view another student's marks.
   - Teacher cannot access an unassigned class.
   - Cross-tenant data isolation between institutions.
   - Unapproved marks remain hidden from students.
   - Deactivated users are blocked.
2. `tests/integration/attendance-engine.test.ts`:
   - Duplicate attendance session rejection.
   - Unmatched student emails reported.
   - Clean retry after corrections.
3. `tests/unit/exam-workflow.test.ts`:
   - Finite state machine transitions (Draft $\rightarrow$ Submit $\rightarrow$ Approve/Reject with feedback $\rightarrow$ Publish).
4. `tests/unit/attendance-calculator.test.ts`:
   - Attendance percentage and shortage calculator ($< 75\%$).
5. `tests/unit/rbac-guards.test.ts`:
   - Role dashboard URL resolvers and session guards.

---

## ☁️ Deployment (Vercel)

The repository includes a ready-to-deploy `vercel.json` configuration.
1. Push your repository to GitHub / GitLab.
2. Import the project into Vercel.
3. Set environment variables: `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
4. Deploy! Next.js will automatically run `prisma generate` and build all 35 static and dynamic pages.

---

## License
MIT
