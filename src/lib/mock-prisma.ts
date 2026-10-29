import { getMockStore, MockStore } from "./mock-data";

// Mapping from Prisma model names (lowercase / camelCase) to store collections
const modelCollectionMap: Record<string, keyof MockStore> = {
  institution: "institutions",
  user: "users",
  userMembership: "userMemberships",
  department: "departments",
  academicYear: "academicYears",
  semester: "semesters",
  class: "classes",
  subject: "subjects",
  teacherProfile: "teacherProfiles",
  studentProfile: "studentProfiles",
  teacherAssignment: "teacherAssignments",
  studentEnrollment: "studentEnrollments",
  attendanceSession: "attendanceSessions",
  attendanceRecord: "attendanceRecords",
  attendanceCorrection: "attendanceCorrections",
  examination: "examinations",
  examinationSubject: "examinationSubjects",
  examMark: "examMarks",
  markSubmission: "markSubmissions",
  markApproval: "markApprovals",
  recordedClass: "recordedClasses",
  videoProgress: "videoProgresses",
  studyMaterial: "studyMaterials",
  assignment: "assignments",
  announcement: "announcements",
  auditLog: "auditLogs",
  invitation: "invitations",
  systemConfiguration: "systemConfigurations",
  supportTicket: "supportTickets",
};

function resolveRelation(item: any, rel: string, store: MockStore): any {
  if (!item) return null;
  switch (rel) {
    case "user":
      return store.users.find((u) => u.id === item.userId || u.id === item.id) ?? null;
    case "institution":
      return store.institutions.find((i) => i.id === item.institutionId || i.id === item.id) ?? null;
    case "department":
      return store.departments.find((d) => d.id === item.departmentId) ?? null;
    case "academicYear":
      return store.academicYears.find((y) => y.id === item.academicYearId) ?? null;
    case "semester":
      return store.semesters.find((s) => s.id === item.semesterId) ?? null;
    case "class":
      return store.classes.find((c) => c.id === item.classId) ?? null;
    case "subject":
      return store.subjects.find((s) => s.id === item.subjectId) ?? null;
    case "teacher":
    case "teacherProfile":
      return store.teacherProfiles.find((t) => t.id === item.teacherProfileId || t.userId === item.userId || t.id === item.id) ?? null;
    case "student":
    case "studentProfile":
      return store.studentProfiles.find((s) => s.id === item.studentProfileId || s.userId === item.userId || s.id === item.id) ?? null;
    case "conductedBy":
      return store.teacherProfiles.find((t) => t.id === item.conductedById) ?? null;
    case "submittedBy":
      return store.teacherProfiles.find((t) => t.id === item.submittedById) ?? null;
    case "actionByUser":
    case "reviewedBy":
      return store.users.find((u) => u.id === item.actionByUserId || u.id === item.reviewedById) ?? null;
    case "examination":
      return store.examinations.find((e) => e.id === item.examinationId) ?? null;
    case "examinationSubject":
      return store.examinationSubjects.find((es) => es.id === item.examinationSubjectId) ?? null;
    case "recordedClass":
      return store.recordedClasses.find((v) => v.id === item.recordedClassId) ?? null;
    case "settings":
      return item.settings || store.institutions.find((i) => i.id === item.id || i.id === item.institutionId)?.settings || null;
    case "memberships":
      return store.userMemberships.filter((m) => m.userId === item.id || m.institutionId === item.id);
    case "enrollments":
      return store.studentEnrollments.filter((e) => e.studentProfileId === item.id || e.classId === item.id);
    case "departments":
      return store.departments.filter((d) => d.institutionId === item.id);
    case "classes":
      return store.classes.filter((c) => c.departmentId === item.id || c.semesterId === item.id);
    case "subjects":
      return store.subjects.filter((s) => s.departmentId === item.id || s.classId === item.id);
    case "attendanceRecords":
    case "records":
      return store.attendanceRecords.filter((r) => r.sessionId === item.id || r.studentProfileId === item.id);
    case "examMarks":
    case "marks":
      return store.examMarks.filter((m) => m.examinationSubjectId === item.id || m.studentProfileId === item.id);
    case "markSubmissions":
    case "submissions":
      return store.markSubmissions.filter((ms) => ms.examinationSubjectId === item.id || ms.submittedById === item.id);
    case "teacherAssignments":
    case "assignments":
      return store.teacherAssignments.filter((ta) => ta.teacherProfileId === item.id || ta.subjectId === item.id);
    case "videoProgresses":
      return store.videoProgresses.filter((vp) => vp.recordedClassId === item.id || vp.studentProfileId === item.id);
    default:
      return item[rel] ?? null;
  }
}

function matchWhere(item: any, where?: Record<string, any>, store?: MockStore): boolean {
  if (!where || Object.keys(where).length === 0) return true;

  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue;

    if (key === "AND" && Array.isArray(value)) {
      if (!value.every((sub) => matchWhere(item, sub, store))) return false;
      continue;
    }
    if (key === "OR" && Array.isArray(value)) {
      if (!value.some((sub) => matchWhere(item, sub, store))) return false;
      continue;
    }
    if (key === "NOT") {
      if (Array.isArray(value)) {
        if (value.some((sub) => matchWhere(item, sub, store))) return false;
      } else if (matchWhere(item, value, store)) {
        return false;
      }
      continue;
    }

    const itemVal = item[key];

    if (value === null) {
      if (itemVal !== null && itemVal !== undefined) return false;
      continue;
    }

    if (typeof value === "object" && !(value instanceof Date)) {
      if ("in" in value && Array.isArray(value.in)) {
        if (!value.in.includes(itemVal)) return false;
        continue;
      }
      if ("not" in value) {
        if (itemVal === value.not) return false;
        continue;
      }
      if ("contains" in value && typeof itemVal === "string") {
        const needle = String(value.contains).toLowerCase();
        if (!itemVal.toLowerCase().includes(needle)) return false;
        continue;
      }
      if ("gte" in value) {
        if (itemVal < value.gte) return false;
        continue;
      }
      if ("lte" in value) {
        if (itemVal > value.lte) return false;
        continue;
      }
      if ("gt" in value) {
        if (itemVal <= value.gt) return false;
        continue;
      }
      if ("lt" in value) {
        if (itemVal >= value.lt) return false;
        continue;
      }

      // Check relation query
      if (store) {
        const related = resolveRelation(item, key, store);
        if ("some" in value) {
          if (!Array.isArray(related) || !related.some((sub) => matchWhere(sub, value.some, store))) {
            return false;
          }
          continue;
        }
        if ("none" in value) {
          if (Array.isArray(related) && related.some((sub) => matchWhere(sub, value.none, store))) {
            return false;
          }
          continue;
        }
        if ("every" in value) {
          if (!Array.isArray(related) || !related.every((sub) => matchWhere(sub, value.every, store))) {
            return false;
          }
          continue;
        }
        if (related && typeof related === "object") {
          if (!matchWhere(related, value, store)) return false;
          continue;
        }
        if (!related) {
          return false;
        }
      }
    } else {
      if (itemVal !== value) return false;
    }
  }

  return true;
}

function applyIncludes(item: any, include: any, store: MockStore): any {
  if (!item || !include) return item;
  const clone = { ...item };
  for (const [key, incVal] of Object.entries(include)) {
    if (!incVal) continue;
    if (key === "_count" && typeof incVal === "object" && incVal !== null) {
      clone._count = {};
      const selectCount = (incVal as any).select || {};
      for (const countKey of Object.keys(selectCount)) {
        const related = resolveRelation(item, countKey, store);
        clone._count[countKey] = Array.isArray(related) ? related.length : 0;
      }
      continue;
    }

    let related = resolveRelation(item, key, store);
    if (related && typeof incVal === "object") {
      if (Array.isArray(related)) {
        related = related.map((r) => applyIncludes(r, (incVal as any).include, store));
      } else {
        related = applyIncludes(related, (incVal as any).include, store);
      }
    }
    clone[key] = related;
  }
  return clone;
}

function applyOrderBy(items: any[], orderBy?: any): any[] {
  if (!orderBy) return items;
  return [...items].sort((a, b) => {
    for (const [key, dir] of Object.entries(orderBy)) {
      const aVal = a[key];
      const bVal = b[key];
      if (aVal === bVal) continue;
      if (dir === "desc") {
        return aVal > bVal ? -1 : 1;
      } else {
        return aVal < bVal ? -1 : 1;
      }
    }
    return 0;
  });
}

function createModelHandler(modelName: string) {
  const collectionName = modelCollectionMap[modelName];

  return {
    async findMany(args?: any) {
      const store = getMockStore();
      const collection = (store as any)[collectionName] || [];
      let results = collection.filter((item: any) => matchWhere(item, args?.where, store));
      results = applyOrderBy(results, args?.orderBy);
      if (args?.skip) {
        results = results.slice(args.skip);
      }
      if (args?.take !== undefined) {
        results = results.slice(0, args.take);
      }
      return results.map((item: any) => applyIncludes(item, args?.include, store));
    },

    async findFirst(args?: any) {
      const store = getMockStore();
      const collection = (store as any)[collectionName] || [];
      const item = collection.find((it: any) => matchWhere(it, args?.where, store));
      if (!item) return null;
      return applyIncludes(item, args?.include, store);
    },

    async findUnique(args?: any) {
      const store = getMockStore();
      const collection = (store as any)[collectionName] || [];
      const item = collection.find((it: any) => matchWhere(it, args?.where, store));
      if (!item) return null;
      return applyIncludes(item, args?.include, store);
    },

    async count(args?: any) {
      const store = getMockStore();
      const collection = (store as any)[collectionName] || [];
      if (!args?.where) return collection.length;
      return collection.filter((item: any) => matchWhere(item, args.where, store)).length;
    },

    async create(args: any) {
      const store = getMockStore();
      const collection = (store as any)[collectionName] || [];
      const newId = args.data?.id || `mock-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newItem = {
        id: newId,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...args.data,
      };
      collection.unshift(newItem);
      (store as any)[collectionName] = collection;
      return applyIncludes(newItem, args?.include, store);
    },

    async createMany(args: any) {
      const store = getMockStore();
      const collection = (store as any)[collectionName] || [];
      const items = Array.isArray(args.data) ? args.data : [args.data];
      let count = 0;
      for (const d of items) {
        const newId = d?.id || `mock-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        collection.unshift({
          id: newId,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...d,
        });
        count++;
      }
      (store as any)[collectionName] = collection;
      return { count };
    },

    async update(args: any) {
      const store = getMockStore();
      const collection = (store as any)[collectionName] || [];
      const index = collection.findIndex((it: any) => matchWhere(it, args.where, store));
      if (index === -1) {
        // Fallback: create if missing
        const newItem = {
          id: args.where?.id || `mock-${Date.now()}`,
          ...args.data,
          updatedAt: new Date(),
        };
        collection.push(newItem);
        return applyIncludes(newItem, args?.include, store);
      }
      collection[index] = {
        ...collection[index],
        ...args.data,
        updatedAt: new Date(),
      };
      return applyIncludes(collection[index], args?.include, store);
    },

    async updateMany(args: any) {
      const store = getMockStore();
      const collection = (store as any)[collectionName] || [];
      let count = 0;
      for (let i = 0; i < collection.length; i++) {
        if (matchWhere(collection[i], args.where, store)) {
          collection[i] = { ...collection[i], ...args.data, updatedAt: new Date() };
          count++;
        }
      }
      return { count };
    },

    async upsert(args: any) {
      const store = getMockStore();
      const collection = (store as any)[collectionName] || [];
      const index = collection.findIndex((it: any) => matchWhere(it, args.where, store));
      if (index !== -1) {
        collection[index] = { ...collection[index], ...args.update, updatedAt: new Date() };
        return applyIncludes(collection[index], args?.include, store);
      } else {
        const newItem = {
          id: args.where?.id || `mock-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.create,
        };
        collection.push(newItem);
        return applyIncludes(newItem, args?.include, store);
      }
    },

    async delete(args: any) {
      const store = getMockStore();
      const collection = (store as any)[collectionName] || [];
      const index = collection.findIndex((it: any) => matchWhere(it, args.where, store));
      if (index !== -1) {
        const [deleted] = collection.splice(index, 1);
        return deleted;
      }
      return { id: args.where?.id };
    },

    async deleteMany(args?: any) {
      const store = getMockStore();
      const collection = (store as any)[collectionName] || [];
      if (!args?.where) {
        const count = collection.length;
        (store as any)[collectionName] = [];
        return { count };
      }
      const kept = collection.filter((it: any) => !matchWhere(it, args.where, store));
      const count = collection.length - kept.length;
      (store as any)[collectionName] = kept;
      return { count };
    },
  };
}

export const mockPrisma = new Proxy(
  {
    $transaction: async (arg: any) => {
      if (typeof arg === "function") {
        return arg(mockPrisma);
      }
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return arg;
    },
    $executeRawUnsafe: async () => 1,
    $queryRaw: async () => [],
    $connect: async () => {},
    $disconnect: async () => {},
  } as any,
  {
    get(target, prop: string) {
      if (prop in target) {
        return target[prop];
      }
      // Return a model handler for any requested model
      return createModelHandler(prop);
    },
  }
);
