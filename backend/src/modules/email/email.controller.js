import { asyncHandler, sendSuccess } from '../../utils/response.util.js';
import emailService, { getSmtpStatus } from '../../services/email/email.service.js';
import * as templates from '../../services/email/emailTemplates.js';

export const getStatus = asyncHandler(async (_req, res) => {
  const status = getSmtpStatus();
  sendSuccess(res, status, 'Email service status retrieved');
});

export const sendTest = asyncHandler(async (req, res) => {
  const { to, template = 'welcome' } = req.body;
  const targetEmail = to || req.user?.email || 'test@3ni.io';

  let rendered;
  switch (template) {
    case 'announcement':
      rendered = templates.buildAnnouncementEmail({
        title: 'Important Campus Notice: Orientation Batch 2026',
        body: 'Welcome to the new academic intake at 3NI Infotech. All students and counselors must complete document verification before classes start.',
        audience: 'All Students & Staff',
      });
      break;
    case 'task':
      rendered = templates.buildTaskAssignedEmail({
        taskTitle: 'Verify Passport & Academic Marksheets for Admission',
        description: 'Check student documents uploaded via portal against embassy rules.',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        assigneeName: req.user?.firstName || 'Counselor',
      });
      break;
    case 'student_doc_staff':
      rendered = templates.buildStudentDocUploadStaffEmail({
        counselorName: req.user?.firstName || 'Counselor',
        studentName: 'Kishan Ghodasara',
        studentCode: 'STU-2026-0842',
        documentName: 'Passport_Front_Back.pdf',
        category: 'PASSPORT',
      });
      break;
    case 'student_doc_ack':
      rendered = templates.buildStudentDocUploadAckEmail({
        studentName: 'Kishan Ghodasara',
        documentName: 'Passport_Front_Back.pdf',
        category: 'PASSPORT',
      });
      break;
    case 'demo':
      rendered = templates.buildDemoScheduledEmail({
        studentName: 'Kavya Sharma',
        courseName: 'IELTS Masterclass',
        demoDate: 'Tomorrow, 20 Nov 2026',
        demoTime: '10:00 AM - 11:30 AM',
        facultyName: 'Prof. Ramesh Patel',
        batch: 'Batch Alpha (Morning)',
      });
      break;
    case 'welcome':
    default:
      rendered = templates.buildWelcomeEmail({
        name: `${req.user?.firstName || 'Kishan'} ${req.user?.lastName || 'Ghodasara'}`.trim(),
        email: targetEmail,
        roleName: req.user?.role?.name || 'Student',
      });
      break;
  }

  const result = await emailService.safeSendEmail({
    to: targetEmail,
    subject: `[3NI Portal] ${rendered.subject}`,
    html: rendered.html,
  });

  sendSuccess(res, { ...result, targetEmail, template }, 'Test email dispatched');
});

export const getTemplatePreview = asyncHandler(async (req, res) => {
  const { templateKey } = req.params;
  let rendered;

  switch (templateKey) {
    case 'announcement':
      rendered = templates.buildAnnouncementEmail({
        title: 'Official Visa & Enrollment Schedule',
        body: 'Please review updated intake timeline for Spring 2027 university submissions.',
        audience: 'All Staff & Counselors',
      });
      break;
    case 'task':
      rendered = templates.buildTaskAssignedEmail({
        taskTitle: 'Complete Student Visa SOP Verification',
        description: 'Verify SOP compliance and university offer acceptance letter.',
        priority: 'URGENT',
        dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
        assigneeName: 'Priya Mehta',
      });
      break;
    case 'student_doc_staff':
      rendered = templates.buildStudentDocUploadStaffEmail({
        counselorName: 'Admissions Officer',
        studentName: 'Kishan Ghodasara',
        studentCode: 'STU-2026-0842',
        documentName: 'Academic_Transcripts_12th.pdf',
        category: 'ACADEMIC',
      });
      break;
    case 'student_doc_ack':
      rendered = templates.buildStudentDocUploadAckEmail({
        studentName: 'Kishan Ghodasara',
        documentName: 'Academic_Transcripts_12th.pdf',
        category: 'ACADEMIC',
      });
      break;
    case 'demo':
      rendered = templates.buildDemoScheduledEmail({
        studentName: 'Kavya Sharma',
        courseName: 'IELTS Masterclass Trial',
        demoDate: '21 Nov 2026',
        demoTime: '10:00 AM',
        facultyName: 'Prof. Ramesh Patel',
      });
      break;
    case 'welcome':
    default:
      rendered = templates.buildWelcomeEmail({
        name: 'Kishan Ghodasara',
        email: 'kishan@gmail.com',
        roleName: 'Student',
      });
      break;
  }

  if (req.query.format === 'html') {
    res.setHeader('Content-Type', 'text/html');
    return res.send(rendered.html);
  }

  sendSuccess(res, rendered);
});
