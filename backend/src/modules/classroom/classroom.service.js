import prisma from '../../config/database.js';
import { AppError, parsePagination } from '../../utils/response.util.js';
import { STUDENT_ROLE_SLUGS } from '../../config/portal.config.js';
import { notifyUser } from '../notification/notification.dispatcher.js';
import { ensureStudentPortalUser, getStudentDefaultPassword } from '../auth/student-portal-account.util.js';
import {
  assertBatchForClassroom,
  assertStudentInTeacherBatches,
  classroomItemScope,
  companyIdOf,
  resolvePortalStudent,
} from './classroom.scope.js';
import { academicBranchScope } from '../attendance/attendance.scope.js';
import { attendancePercent } from '../attendance/attendance.rules.js';

const assignmentInclude = {
  batch: { select: { id: true, name: true, code: true, courseName: true, instructorId: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  _count: { select: { submissions: true } },
};

const testInclude = {
  batch: { select: { id: true, name: true, code: true, courseName: true, instructorId: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  _count: { select: { results: true } },
};

const materialInclude = {
  batch: { select: { id: true, name: true, code: true, courseName: true, instructorId: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
};

function isStudent(user) {
  return STUDENT_ROLE_SLUGS.includes(user?.role?.slug);
}

function canManageClassroom(user) {
  const slug = user?.role?.slug;
  return slug === 'teacher'
    || ['super_admin', 'company_admin', 'branch_manager', 'operational_head'].includes(slug);
}

async function notifyBatchStudents(batchId, payload) {
  const enrollments = await prisma.batchEnrollment.findMany({
    where: { batchId, isActive: true, student: { deletedAt: null } },
    include: { student: { select: { id: true, userId: true, email: true, firstName: true, lastName: true } } },
  });
  await Promise.all(
    enrollments.map(async (e) => {
      let userId = e.student?.userId;
      if (!userId && e.student?.email) {
        try {
          const user = await ensureStudentPortalUser(e.student, { plainPassword: getStudentDefaultPassword() });
          userId = user?.id;
        } catch {}
      }
      if (userId) {
        await notifyUser(userId, payload);
      }
    }),
  );
}

function gradeFromPercent(pct) {
  if (pct == null || Number.isNaN(pct)) return null;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

export const classroomService = {
  // ── Assignments ──────────────────────────────────────────────────────────

  listAssignments: async (query, user) => {
    const { page, limit, skip } = parsePagination(query);
    const where = { ...classroomItemScope(user) };
    if (query.batchId) where.batchId = query.batchId;
    if (query.status) where.status = query.status;

    if (isStudent(user)) {
      where.status = { in: ['PUBLISHED', 'CLOSED'] };
    }

    const [data, total] = await Promise.all([
      prisma.classAssignment.findMany({
        where,
        include: assignmentInclude,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.classAssignment.count({ where }),
    ]);

    let enriched = data;
    if (isStudent(user)) {
      const student = await resolvePortalStudent(user);
      const ids = data.map((a) => a.id);
      const subs = ids.length
        ? await prisma.classAssignmentSubmission.findMany({
          where: { assignmentId: { in: ids }, studentId: student.id },
        })
        : [];
      const byId = Object.fromEntries(subs.map((s) => [s.assignmentId, s]));
      enriched = data.map((a) => ({ ...a, mySubmission: byId[a.id] || null }));
    }

    return { data: enriched, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } };
  },

  getAssignment: async (id, user) => {
    const baseInclude = {
      ...assignmentInclude,
    };
    const row = await prisma.classAssignment.findFirst({
      where: { id, deletedAt: null },
      include: isStudent(user)
        ? baseInclude
        : {
          ...baseInclude,
          submissions: {
            include: {
              student: {
                select: {
                  id: true, studentCode: true, firstName: true, lastName: true, email: true,
                },
              },
              reviewedBy: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { submittedAt: 'desc' },
          },
        },
    });
    if (!row) throw new AppError('Assignment not found', 404);
    await assertBatchForClassroom(row.batchId, user);

    if (isStudent(user)) {
      if (!['PUBLISHED', 'CLOSED'].includes(row.status)) throw new AppError('Assignment not available', 404);
      const student = await resolvePortalStudent(user);
      const mySubmission = await prisma.classAssignmentSubmission.findUnique({
        where: { assignmentId_studentId: { assignmentId: id, studentId: student.id } },
      });
      return { ...row, mySubmission };
    }
    return row;
  },

  createAssignment: async (body, user) => {
    if (!canManageClassroom(user)) throw new AppError('Forbidden', 403);
    const batch = await assertBatchForClassroom(body.batchId, user);
    const companyId = companyIdOf(user) || batch.companyId;
    const row = await prisma.classAssignment.create({
      data: {
        companyId,
        branchId: batch.branchId,
        batchId: batch.id,
        createdById: user.id,
        title: body.title,
        description: body.description || null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        maxMarks: body.maxMarks ?? 100,
        attachmentUrl: body.attachmentUrl || null,
        status: body.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
        publishedAt: body.status === 'PUBLISHED' ? new Date() : null,
      },
      include: assignmentInclude,
    });
    if (row.status === 'PUBLISHED') {
      await notifyBatchStudents(batch.id, {
        type: 'INFO',
        title: 'New assignment',
        message: `${row.title} — due ${row.dueDate ? new Date(row.dueDate).toLocaleDateString() : 'TBA'}`,
        link: '/student/assignments',
        metadata: { event: 'CLASS_ASSIGNMENT_PUBLISHED', assignmentId: row.id, batchId: batch.id },
      });
    }
    return row;
  },

  updateAssignment: async (id, body, user) => {
    if (!canManageClassroom(user)) throw new AppError('Forbidden', 403);
    const existing = await classroomService.getAssignment(id, user);
    const wasPublished = existing.status === 'PUBLISHED';
    const nextStatus = body.status || existing.status;
    const row = await prisma.classAssignment.update({
      where: { id },
      data: {
        title: body.title ?? undefined,
        description: body.description !== undefined ? body.description : undefined,
        startDate: body.startDate !== undefined ? (body.startDate ? new Date(body.startDate) : null) : undefined,
        dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : undefined,
        maxMarks: body.maxMarks ?? undefined,
        attachmentUrl: body.attachmentUrl !== undefined ? body.attachmentUrl : undefined,
        status: nextStatus,
        publishedAt: nextStatus === 'PUBLISHED' && !wasPublished ? new Date() : undefined,
      },
      include: assignmentInclude,
    });
    if (nextStatus === 'PUBLISHED' && !wasPublished) {
      await notifyBatchStudents(row.batchId, {
        type: 'INFO',
        title: 'New assignment',
        message: row.title,
        link: '/student/assignments',
        metadata: { event: 'CLASS_ASSIGNMENT_PUBLISHED', assignmentId: row.id },
      });
    }
    return row;
  },

  deleteAssignment: async (id, user) => {
    if (!canManageClassroom(user)) throw new AppError('Forbidden', 403);
    await classroomService.getAssignment(id, user);
    await prisma.classAssignment.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'CLOSED' },
    });
    return { id, deleted: true };
  },

  submitAssignment: async (id, body, user) => {
    const student = await resolvePortalStudent(user);
    if (!student) throw new AppError('Only students can submit', 403);
    const assignment = await prisma.classAssignment.findFirst({
      where: { id, deletedAt: null, status: { in: ['PUBLISHED', 'CLOSED'] } },
    });
    if (!assignment) throw new AppError('Assignment not found', 404);
    await assertBatchForClassroom(assignment.batchId, user);
    if (assignment.status === 'CLOSED') throw new AppError('Assignment is closed', 400);

    const now = new Date();
    const late = assignment.dueDate && now > new Date(assignment.dueDate);
    const status = late ? 'LATE' : 'SUBMITTED';

    const row = await prisma.classAssignmentSubmission.upsert({
      where: { assignmentId_studentId: { assignmentId: id, studentId: student.id } },
      create: {
        assignmentId: id,
        studentId: student.id,
        status,
        content: body.content || null,
        fileUrl: body.fileUrl || null,
        submittedAt: now,
      },
      update: {
        status,
        content: body.content !== undefined ? body.content : undefined,
        fileUrl: body.fileUrl !== undefined ? body.fileUrl : undefined,
        submittedAt: now,
        marks: null,
        feedback: null,
        reviewedAt: null,
        reviewedById: null,
      },
    });
    return row;
  },

  reviewSubmission: async (assignmentId, submissionId, body, user) => {
    if (!canManageClassroom(user)) throw new AppError('Forbidden', 403);
    await classroomService.getAssignment(assignmentId, user);
    const submission = await prisma.classAssignmentSubmission.findFirst({
      where: { id: submissionId, assignmentId },
      include: { student: { select: { userId: true, firstName: true } } },
    });
    if (!submission) throw new AppError('Submission not found', 404);

    const updated = await prisma.classAssignmentSubmission.update({
      where: { id: submissionId },
      data: {
        marks: body.marks != null ? Number(body.marks) : undefined,
        feedback: body.feedback !== undefined ? body.feedback : undefined,
        status: 'REVIEWED',
        reviewedAt: new Date(),
        reviewedById: user.id,
      },
    });

    if (submission.student?.userId) {
      await notifyUser(submission.student.userId, {
        type: 'SUCCESS',
        title: 'Assignment reviewed',
        message: body.marks != null
          ? `You scored ${body.marks}${body.feedback ? ` — ${body.feedback}` : ''}`
          : (body.feedback || 'Your submission was reviewed'),
        link: '/student/assignments',
        metadata: { event: 'CLASS_ASSIGNMENT_REVIEWED', assignmentId, submissionId },
      });
    }
    return updated;
  },

  // ── Tests ────────────────────────────────────────────────────────────────

  listTests: async (query, user) => {
    const { page, limit, skip } = parsePagination(query);
    const where = { ...classroomItemScope(user) };
    if (query.batchId) where.batchId = query.batchId;
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (isStudent(user)) {
      where.status = { in: ['PUBLISHED', 'COMPLETED'] };
    }

    const [data, total] = await Promise.all([
      prisma.classTest.findMany({
        where,
        include: testInclude,
        orderBy: [{ testDate: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.classTest.count({ where }),
    ]);

    let enriched = data;
    if (isStudent(user)) {
      const student = await resolvePortalStudent(user);
      const ids = data.map((t) => t.id);
      const results = ids.length
        ? await prisma.classTestResult.findMany({
          where: { testId: { in: ids }, studentId: student.id, published: true },
        })
        : [];
      const byId = Object.fromEntries(results.map((r) => [r.testId, r]));
      enriched = data.map((t) => ({
        ...t,
        myResult: t.resultsPublished ? (byId[t.id] || null) : null,
      }));
    }

    return { data: enriched, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } };
  },

  getTest: async (id, user) => {
    const row = await prisma.classTest.findFirst({
      where: { id, deletedAt: null },
      include: isStudent(user)
        ? testInclude
        : {
          ...testInclude,
          results: {
            include: {
              student: {
                select: { id: true, studentCode: true, firstName: true, lastName: true },
              },
            },
          },
        },
    });
    if (!row) throw new AppError('Test not found', 404);
    await assertBatchForClassroom(row.batchId, user);
    if (isStudent(user)) {
      if (!['PUBLISHED', 'COMPLETED'].includes(row.status)) throw new AppError('Test not available', 404);
      const student = await resolvePortalStudent(user);
      const myResult = row.resultsPublished
        ? await prisma.classTestResult.findUnique({
          where: { testId_studentId: { testId: id, studentId: student.id } },
        })
        : null;
      return { ...row, myResult: myResult?.published ? myResult : null };
    }
    return row;
  },

  createTest: async (body, user) => {
    if (!canManageClassroom(user)) throw new AppError('Forbidden', 403);
    const batch = await assertBatchForClassroom(body.batchId, user);
    const companyId = companyIdOf(user) || batch.companyId;
    const row = await prisma.classTest.create({
      data: {
        companyId,
        branchId: batch.branchId,
        batchId: batch.id,
        createdById: user.id,
        name: body.name,
        type: body.type || 'TEST',
        testDate: body.testDate ? new Date(body.testDate) : null,
        startAt: body.startAt ? new Date(body.startAt) : null,
        endAt: body.endAt ? new Date(body.endAt) : null,
        durationMinutes: body.durationMinutes ?? null,
        totalMarks: body.totalMarks ?? 100,
        passingMarks: body.passingMarks ?? null,
        instructions: body.instructions || null,
        status: body.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
      },
      include: testInclude,
    });
    if (row.status === 'PUBLISHED') {
      await notifyBatchStudents(batch.id, {
        type: 'REMINDER',
        title: 'Upcoming test',
        message: row.name,
        link: '/student/tests',
        metadata: { event: 'CLASS_TEST_PUBLISHED', testId: row.id },
      });
    }
    return row;
  },

  updateTest: async (id, body, user) => {
    if (!canManageClassroom(user)) throw new AppError('Forbidden', 403);
    const existing = await classroomService.getTest(id, user);
    const nextStatus = body.status ?? existing.status;
    const updated = await prisma.classTest.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        type: body.type ?? undefined,
        testDate: body.testDate !== undefined ? (body.testDate ? new Date(body.testDate) : null) : undefined,
        startAt: body.startAt !== undefined ? (body.startAt ? new Date(body.startAt) : null) : undefined,
        endAt: body.endAt !== undefined ? (body.endAt ? new Date(body.endAt) : null) : undefined,
        durationMinutes: body.durationMinutes !== undefined ? body.durationMinutes : undefined,
        totalMarks: body.totalMarks ?? undefined,
        passingMarks: body.passingMarks !== undefined ? body.passingMarks : undefined,
        instructions: body.instructions !== undefined ? body.instructions : undefined,
        status: nextStatus,
        resultsPublished: body.resultsPublished ?? undefined,
      },
      include: testInclude,
    });
    if (nextStatus === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      await notifyBatchStudents(updated.batchId, {
        type: 'REMINDER',
        title: 'Upcoming Examination Scheduled',
        message: `${updated.name} (Max Marks: ${updated.totalMarks ?? 100})`,
        link: '/student/tests',
        metadata: { event: 'CLASS_TEST_PUBLISHED', testId: updated.id },
      });
    }
    return updated;
  },

  deleteTest: async (id, user) => {
    if (!canManageClassroom(user)) throw new AppError('Forbidden', 403);
    await classroomService.getTest(id, user);
    await prisma.classTest.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'CANCELLED' },
    });
    return { id, deleted: true };
  },

  saveTestResults: async (testId, body, user) => {
    if (!canManageClassroom(user)) throw new AppError('Forbidden', 403);
    const test = await classroomService.getTest(testId, user);
    const results = Array.isArray(body.results) ? body.results : [];
    const publish = Boolean(body.publish);

    const saved = [];
    for (const item of results) {
      if (!item.studentId) continue;
      await assertStudentInTeacherBatches(item.studentId, user);
      const marks = item.marks != null ? Number(item.marks) : null;
      const percentage = marks != null && test.totalMarks
        ? Math.round((marks / test.totalMarks) * 1000) / 10
        : null;
      const grade = item.grade || gradeFromPercent(percentage);
      const row = await prisma.classTestResult.upsert({
        where: { testId_studentId: { testId, studentId: item.studentId } },
        create: {
          testId,
          studentId: item.studentId,
          marks,
          percentage,
          grade,
          remarks: item.remarks || null,
          published: publish,
        },
        update: {
          marks,
          percentage,
          grade,
          remarks: item.remarks !== undefined ? item.remarks : undefined,
          published: publish || undefined,
        },
      });
      saved.push(row);
    }

    if (publish) {
      await prisma.classTest.update({
        where: { id: testId },
        data: { resultsPublished: true, status: 'COMPLETED' },
      });
      const withUsers = await prisma.classTestResult.findMany({
        where: { testId, published: true },
        include: { student: { select: { id: true, userId: true, email: true, firstName: true, lastName: true } } },
      });
      await Promise.all(
        withUsers.map(async (r) => {
          let userId = r.student?.userId;
          if (!userId && r.student?.email) {
            try {
              const u = await ensureStudentPortalUser(r.student, { plainPassword: getStudentDefaultPassword() });
              userId = u?.id;
            } catch {}
          }
          if (userId) {
            await notifyUser(userId, {
              type: 'SUCCESS',
              title: 'Examination Result Published',
              message: `${test.name}: Scored ${r.marks ?? '—'} / ${test.totalMarks}${r.grade ? ` (Grade: ${r.grade})` : ''}`,
              link: '/student/tests',
              metadata: { event: 'CLASS_TEST_RESULT', testId, marks: r.marks, grade: r.grade },
            });
          }
        }),
      );
    }

    return { count: saved.length, results: saved, published: publish };
  },

  // ── Study materials ──────────────────────────────────────────────────────

  listMaterials: async (query, user) => {
    const { page, limit, skip } = parsePagination(query);
    const where = { ...classroomItemScope(user) };
    if (query.batchId) where.batchId = query.batchId;
    if (query.category) where.category = query.category;
    if (query.materialType) where.materialType = query.materialType;
    if (isStudent(user)) where.status = 'PUBLISHED';
    else if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      prisma.studyMaterial.findMany({
        where,
        include: materialInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.studyMaterial.count({ where }),
    ]);
    return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } };
  },

  getMaterial: async (id, user) => {
    const row = await prisma.studyMaterial.findFirst({
      where: { id, deletedAt: null },
      include: materialInclude,
    });
    if (!row) throw new AppError('Material not found', 404);
    await assertBatchForClassroom(row.batchId, user);
    if (isStudent(user) && row.status !== 'PUBLISHED') throw new AppError('Material not available', 404);
    return row;
  },

  createMaterial: async (body, user) => {
    if (!canManageClassroom(user)) throw new AppError('Forbidden', 403);
    const batch = await assertBatchForClassroom(body.batchId, user);
    const companyId = companyIdOf(user) || batch.companyId;
    const published = body.status === 'PUBLISHED';
    const row = await prisma.studyMaterial.create({
      data: {
        companyId,
        branchId: batch.branchId,
        batchId: batch.id,
        createdById: user.id,
        title: body.title,
        description: body.description || null,
        category: body.category || null,
        materialType: body.materialType || 'DOCUMENT',
        fileUrl: body.fileUrl || null,
        externalUrl: body.externalUrl || null,
        status: published ? 'PUBLISHED' : 'DRAFT',
        publishedAt: published ? new Date() : null,
      },
      include: materialInclude,
    });
    if (published) {
      await notifyBatchStudents(batch.id, {
        type: 'INFO',
        title: 'New Study Material Uploaded',
        message: `${row.title}${row.category ? ` · ${row.category}` : ''}`,
        link: '/student/materials',
        metadata: { event: 'STUDY_MATERIAL_PUBLISHED', materialId: row.id },
      });
    }
    return row;
  },

  updateMaterial: async (id, body, user) => {
    if (!canManageClassroom(user)) throw new AppError('Forbidden', 403);
    const existing = await classroomService.getMaterial(id, user);
    const nextStatus = body.status || existing.status;
    const updated = await prisma.studyMaterial.update({
      where: { id },
      data: {
        title: body.title ?? undefined,
        description: body.description !== undefined ? body.description : undefined,
        category: body.category !== undefined ? body.category : undefined,
        materialType: body.materialType ?? undefined,
        fileUrl: body.fileUrl !== undefined ? body.fileUrl : undefined,
        externalUrl: body.externalUrl !== undefined ? body.externalUrl : undefined,
        status: nextStatus,
        publishedAt: nextStatus === 'PUBLISHED' && existing.status !== 'PUBLISHED' ? new Date() : undefined,
      },
      include: materialInclude,
    });
    if (nextStatus === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      await notifyBatchStudents(updated.batchId, {
        type: 'INFO',
        title: 'New Study Material Published',
        message: `${updated.title}${updated.category ? ` · ${updated.category}` : ''}`,
        link: '/student/materials',
        metadata: { event: 'STUDY_MATERIAL_PUBLISHED', materialId: updated.id },
      });
    }
    return updated;
  },

  deleteMaterial: async (id, user) => {
    if (!canManageClassroom(user)) throw new AppError('Forbidden', 403);
    await classroomService.getMaterial(id, user);
    await prisma.studyMaterial.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
    return { id, deleted: true };
  },

  // ── Remarks & performance ────────────────────────────────────────────────

  listRemarks: async (studentId, user) => {
    await assertStudentInTeacherBatches(studentId, user);
    if (isStudent(user)) {
      const me = await resolvePortalStudent(user);
      if (me.id !== studentId) throw new AppError('Forbidden', 403);
    }
    return prisma.academicRemark.findMany({
      where: { studentId, deletedAt: null },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        batch: { select: { id: true, name: true, courseName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  addRemark: async (studentId, body, user) => {
    if (!canManageClassroom(user)) throw new AppError('Forbidden', 403);
    await assertStudentInTeacherBatches(studentId, user);
    if (body.batchId) await assertBatchForClassroom(body.batchId, user);
    return prisma.academicRemark.create({
      data: {
        studentId,
        batchId: body.batchId || null,
        teacherId: user.id,
        remark: body.remark,
      },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        batch: { select: { id: true, name: true, courseName: true } },
      },
    });
  },

  performanceSummary: async (query, user) => {
    const batchScope = academicBranchScope(user, 'batch');
    const batches = await prisma.academicBatch.findMany({
      where: { ...batchScope, deletedAt: null, ...(query.batchId ? { id: query.batchId } : {}) },
      select: { id: true, name: true, courseName: true, code: true },
      take: 50,
    });
    const batchIds = batches.map((b) => b.id);

    let studentFilter = {};
    if (isStudent(user)) {
      const me = await resolvePortalStudent(user);
      studentFilter = { studentId: me.id };
    } else if (query.studentId) {
      await assertStudentInTeacherBatches(query.studentId, user);
      studentFilter = { studentId: query.studentId };
    }

    const enrollments = batchIds.length
      ? await prisma.batchEnrollment.findMany({
        where: { batchId: { in: batchIds }, isActive: true, ...studentFilter },
        include: {
          student: {
            select: { id: true, studentCode: true, firstName: true, lastName: true },
          },
          batch: { select: { id: true, name: true, courseName: true } },
        },
      })
      : [];

    const studentIds = [...new Set(enrollments.map((e) => e.studentId))];

    const [assignments, submissions, tests, results, attendances] = await Promise.all([
      batchIds.length
        ? prisma.classAssignment.findMany({
          where: { batchId: { in: batchIds }, deletedAt: null, status: { in: ['PUBLISHED', 'CLOSED'] } },
          select: { id: true, batchId: true, maxMarks: true },
        })
        : [],
      studentIds.length
        ? prisma.classAssignmentSubmission.findMany({
          where: { studentId: { in: studentIds }, status: { in: ['SUBMITTED', 'LATE', 'REVIEWED'] } },
        })
        : [],
      batchIds.length
        ? prisma.classTest.findMany({
          where: { batchId: { in: batchIds }, deletedAt: null, resultsPublished: true },
          select: { id: true, batchId: true, totalMarks: true, name: true },
        })
        : [],
      studentIds.length
        ? prisma.classTestResult.findMany({
          where: { studentId: { in: studentIds }, published: true },
        })
        : [],
      studentIds.length
        ? prisma.classAttendance.findMany({
          where: { studentId: { in: studentIds } },
          select: { studentId: true, status: true },
        })
        : [],
    ]);

    const students = studentIds.map((sid) => {
      const enrollment = enrollments.find((e) => e.studentId === sid);
      const att = attendances.filter((a) => a.studentId === sid);
      const present = att.filter((a) => a.status === 'PRESENT' || a.status === 'HALF_DAY').length;
      const late = att.filter((a) => a.status === 'LATE').length;
      const excused = att.filter((a) => a.status === 'EXCUSED').length;
      const attPct = attendancePercent({ present, late, excused, total: att.length });

      const batchAssignmentIds = assignments
        .filter((a) => enrollment && a.batchId === enrollment.batchId)
        .map((a) => a.id);
      const mySubs = submissions.filter((s) => s.studentId === sid && batchAssignmentIds.includes(s.assignmentId));
      const reviewed = mySubs.filter((s) => s.status === 'REVIEWED' && s.marks != null);
      const avgAssignment = reviewed.length
        ? reviewed.reduce((sum, s) => sum + s.marks, 0) / reviewed.length
        : null;

      const batchTestIds = tests.filter((t) => enrollment && t.batchId === enrollment.batchId).map((t) => t.id);
      const myResults = results.filter((r) => r.studentId === sid && batchTestIds.includes(r.testId));
      const avgTest = myResults.length
        ? myResults.reduce((sum, r) => sum + (r.percentage ?? 0), 0) / myResults.length
        : null;

      const overallParts = [attPct, avgAssignment, avgTest].filter((v) => v != null);
      const overall = overallParts.length
        ? Math.round(overallParts.reduce((a, b) => a + b, 0) / overallParts.length)
        : null;

      return {
        studentId: sid,
        studentCode: enrollment?.student?.studentCode,
        name: `${enrollment?.student?.firstName || ''} ${enrollment?.student?.lastName || ''}`.trim(),
        batch: enrollment?.batch?.name,
        course: enrollment?.batch?.courseName,
        attendancePercent: attPct,
        assignmentCompletion: batchAssignmentIds.length
          ? Math.round((mySubs.length / batchAssignmentIds.length) * 100)
          : null,
        averageAssignmentMarks: avgAssignment != null ? Math.round(avgAssignment * 10) / 10 : null,
        averageTestPercent: avgTest != null ? Math.round(avgTest * 10) / 10 : null,
        overall,
        pendingAssignments: Math.max(0, batchAssignmentIds.length - mySubs.length),
        testCount: myResults.length,
      };
    });

    students.sort((a, b) => (a.overall ?? 0) - (b.overall ?? 0));

    const courseTrend = batches.map((b) => {
      const rows = students.filter((s) => s.batch === b.name);
      const withOverall = rows.filter((r) => r.overall != null);
      return {
        batchId: b.id,
        course: b.courseName,
        batch: b.name,
        students: rows.length,
        averagePerformance: withOverall.length
          ? Math.round(withOverall.reduce((s, r) => s + r.overall, 0) / withOverall.length)
          : null,
      };
    });

    return {
      students,
      courseTrend,
      metrics: {
        students: students.length,
        averagePerformance: (() => {
          const rows = students.filter((s) => s.overall != null);
          if (!rows.length) return null;
          return Math.round(rows.reduce((s, r) => s + r.overall, 0) / rows.length);
        })(),
        lowAttendance: students.filter((s) => s.attendancePercent != null && s.attendancePercent < 75).length,
        pendingAssignments: students.reduce((s, r) => s + (r.pendingAssignments || 0), 0),
      },
    };
  },
};
