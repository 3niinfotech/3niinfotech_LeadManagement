# Enterprise ERP + CRM Architecture Blueprint

## 1. Executive Architecture Summary

This platform should be designed as a multi-tenant SaaS operating system for education and visa consulting organizations. It must support:

- Lead and enquiry intake from walk-in, web, phone, referral, and partner channels
- counsellor-driven conversion workflows
- demo management and attendance
- admission lifecycle with staged document and fee collection
- faculty and attendance operations
- visa and university application tracking
- billing, receipts, ledgers, and refund workflows
- notifications, approvals, audit trails, reporting, and RBAC

The core architectural decision is to treat the system as a workflow-driven platform rather than a collection of isolated modules. Enquiry, demo, admission, fee, document, visa, and student management should share common services for ownership, status changes, notifications, attachments, comments, tasks, timelines, and audit history.

## 2. Architectural Principles

### Enterprise design principles
- Multi-tenant first with strict data isolation
- Branch-aware operations within each tenant
- RBAC and data scope at every action boundary
- Workflow-driven state transitions instead of ad-hoc status updates
- Shared services for notifications, attachments, audit, and approval
- Clean architecture with controller → service → repository → domain model separation
- Soft delete and immutable audit history
- Versioning for critical records such as documents, fees, and agreements

### Strategic product decisions
- Use Enquiry as the canonical intake record; Student is a converted downstream entity
- Keep Admission as a distinct lifecycle stage rather than a one-step form submission
- Use a reusable Process/Case engine for admission, visa, and university operations
- Separate operational transactions from reporting views to preserve performance

## 3. Core Business Domain Model

### Tenant model
- Company: top-level tenant
- Branch: operational unit within a company
- User: human actor in the system
- Role: grouped permission set
- Permission: atomic action grant
- Team: logical grouping for assignments and approvals

### Shared domain entities
- Enquiry
- DemoBatch
- DemoAttendance
- AdmissionApplication
- Student
- DocumentRecord
- FeeLedger
- Receipt
- FacultyProfile
- AttendanceRecord
- CommunicationLog
- Task
- Notification
- ApprovalRequest
- TimelineEntry
- AuditLog
- Attachment

## 4. Module-by-Module Architecture

### A. Enquiry and Lead Management

#### 1. Business Objective
Capture and qualify every inbound interest efficiently and convert it into a structured student journey.

#### 2. Business Flow
- Walk-in, online, phone, referral, partner, or campaign intake
- Lead qualification and assignment
- Counselling session
- Interest confirmation
- Demo booking
- Demo attendance evaluation
- Admission readiness decision
- Conversion or loss handling

#### 3. User Journey
Reception → capture initial enquiry → assign counsellor → counsel → mark interest → schedule demo → track follow-up → convert or drop.

#### 4. Database Design
- Enquiry: tenantId, branchId, assignedCounsellorId, status, priority, source, conversionScore
- EnquiryFollowUp: nextActionAt, owner, outcome
- EnquiryAssignment: assignedTo, assignmentType, status, expiry
- EnquiryTag: tag mapping
- EnquiryHistory: timeline of status changes

#### 5. API Design
- POST /enquiries
- GET /enquiries
- GET /enquiries/:id
- PATCH /enquiries/:id/status
- POST /enquiries/:id/assign
- POST /enquiries/:id/follow-up
- POST /enquiries/:id/convert

#### 6. UI Design
- Advanced search and filters
- KPI cards for new enquiries, follow-up due, conversion rate, no-show rate
- Timeline, comments, attachments, assignment panel
- Bulk action bar and quick actions

#### 7. Validation Rules
- Unique duplicate detection based on phone/email/name
- Required source and channel
- Mandatory course interest when converted
- Follow-up deadlines enforced by priority

#### 8. Business Rules
- High priority enquiries cannot remain unassigned beyond SLA threshold
- Duplicate enquiries should be merged or linked, not duplicated
- Converted enquiries become Student + AdmissionApplication records

#### 9. Automation
- Auto-assign by branch and counsellor capacity
- Auto-create follow-up tasks
- Auto-send reminder emails and SMS templates
- Auto-detect duplicate records

#### 10. Notifications
- Assignment notification
- Follow-up reminder
- Demo reminder
- Conversion confirmation

#### 11. Reports
- New enquiries by source/channel
- Conversion rate by counsellor/branch/course
- Follow-up pending report

#### 12. Audit Logs
- create/update/status change/assignment/merge events

#### 13. Permissions
- Reception: create and update basic enquiry
- Counsellor: own and team enquiries
- Manager: branch-wide visibility
- Admin: full access

#### 14. Edge Cases
- Duplicate enquiry
- Walk-in with no contact details
- Student requests another demo
- Enquiry marked spam or lost

#### 15. Future Scalability
- CRM campaign integration
- AI lead scoring
- WhatsApp and voice workflow integration

---

### B. Demo Management

#### 1. Business Objective
Ensure the demo process is structured, measurable, and conversion-oriented.

#### 2. Business Flow
- Demo program creation
- Batch scheduling
- Capacity management
- Attendance marking
- Evaluation and feedback
- Conversion or reschedule/cancellation

#### 3. User Journey
Counsellor schedules demo → student attends or no-shows → faculty evaluates → counsellor follows up → student converted or rescheduled.

#### 4. Database Design
- DemoProgram
- DemoBatch
- DemoBatchFaculty
- DemoAttendance
- DemoEvaluation
- DemoReminderLog

#### 5. API Design
- POST /demo-programs
- POST /demo-batches
- POST /demo-batches/:id/attendance
- PATCH /demo-batches/:id/status
- POST /demo-batches/:id/remind

#### 6. UI Design
- Calendar view plus list view
- Capacity indicator
- Attendance checklist
- Faculty and classroom information
- Quick conversion action

#### 7. Validation Rules
- Batch capacity cannot exceed configured maximum
- Attendance status must be valid
- Reschedule requires reason and approval if overdue

#### 8. Business Rules
- No-show should trigger automatic follow-up
- A student who attends one demo may be eligible for a second demo if requested
- Demo result influences admission readiness

#### 9. Automation
- Auto reminder 24h and 2h before demo
- Automatic batch occupancy update
- Auto-mark no-show after cutoff

#### 10. Notifications
- Demo booked
- Demo reminder
- Demo completed
- Demo cancelled/rescheduled

#### 11. Reports
- Attendance rate
- Conversion from demo
- Faculty performance by batch

#### 12. Audit Logs
- schedule, reschedule, attendance, evaluation, cancellation events

#### 13. Permissions
- Counsellor: create and manage own demos
- Faculty: mark attendance and submit evaluation
- Manager: branch-level oversight

#### 14. Edge Cases
- Faculty absent
- Demo cancelled
- Student arrives late
- Batch full
- Student wants another demo

#### 15. Future Scalability
- Virtual demo integration
- AI attendance recognition
- Multi-location scheduling engine

---

### C. Admission Lifecycle

#### 1. Business Objective
Move a qualified student from interest to formal admission only after readiness criteria are met.

#### 2. Business Flow
- Enquiry interest confirmed
- Counsellor recommendation
- Student confirmation
- Document collection
- Verification
- Fee planning
- Fee collection
- Admission approval
- Student ID and QR generation
- Batch assignment and portal activation

#### 3. User Journey
Counsellor recommends → student confirms → admission team collects documents → verifies → fees planned → payment collected → admission approved → student profile activated.

#### 4. Database Design
- AdmissionApplication: tenantId, branchId, studentId, courseId, intakeId, status, recommendedBy
- AdmissionChecklistItem
- AdmissionApproval
- AdmissionDocumentRequirement
- AdmissionFeePlan
- AdmissionConfirmation

#### 5. API Design
- POST /admissions
- GET /admissions/:id
- PATCH /admissions/:id/status
- POST /admissions/:id/documents/verify
- POST /admissions/:id/fees/plan
- POST /admissions/:id/approve

#### 6. UI Design
- Multi-step wizard with strict gating
- Progress tracker for document, fee, and approval stages
- Document checklist and missing document view

#### 7. Validation Rules
- Admission cannot begin before demo completion and counsellor recommendation
- Mandatory documents must be present before approval
- Fee plan must be accepted before final confirmation

#### 8. Business Rules
- Admission is not a replacement for enquiry; it is a separate lifecycle stage
- Partial completion must remain recoverable and resumable
- Overdue documents trigger reminders and escalation

#### 9. Automation
- Auto-generate admission number and student ID
- Auto-create portal credentials
- Auto-create batch and timetable tasks
- Auto-create welcome kit checklist

#### 10. Notifications
- Admission initiated
- Missing documents reminder
- Fee due reminder
- Admission approved/rejected

#### 11. Reports
- Admission funnel
- Approval turnaround time
- Pending admissions by branch

#### 12. Audit Logs
- stage changes, approvals, fee plan updates, document verification events

#### 13. Permissions
- Admission team: create and manage admission records
- Counsellor: recommend and track
- Manager: approval and escalation
- Admin: configure admission workflow

#### 14. Edge Cases
- Student wants to change course
- Documents rejected
- Admission cancelled
- Student deferred
- Re-admission after withdrawal

#### 15. Future Scalability
- Configurable admission workflow per course type
- AI-driven document completeness scoring

---

### D. Fee Management

#### 1. Business Objective
Manage billing accurately and ensure financial accountability from registration to completion.

#### 2. Business Flow
- Fee plan creation
- Installment structure
- Payment collection
- Receipt generation
- Partial payment handling
- Refund and adjustment
- Due reminders and collection follow-up

#### 3. User Journey
Admission team creates plan → student pays → system updates ledger → receipt generated → reminders sent for dues.

#### 4. Database Design
- FeeHead
- FeePlan
- FeeInstallment
- PaymentTransaction
- Receipt
- FeeLedgerEntry
- RefundRequest
- DiscountRule
- ScholarshipRule

#### 5. API Design
- POST /fees/plans
- POST /fees/payments
- GET /fees/ledgers/:studentId
- POST /fees/refunds
- POST /fees/reminders

#### 6. UI Design
- Ledger view with running balance
- Receipt viewer
- Installment schedule
- Payment mode selection and quick receipt actions

#### 7. Validation Rules
- Receipt number must be unique
- Payment amount cannot exceed outstanding balance without override
- Discount and scholarship must be validated against policy

#### 8. Business Rules
- Installments must follow configured calendar rules
- Advance payments should map to future installments
- Refunds require approval and audit trail

#### 9. Automation
- Auto-generate receipt
- Auto-send due reminders
- Auto-post late fee or installment due events

#### 10. Notifications
- Payment due
- Payment success
- Partial payment notice
- Overdue notice

#### 11. Reports
- Revenue by course/branch/date
- Collection performance
- Outstanding dues

#### 12. Audit Logs
- plan creation, payment posting, receipt generation, refund approval, adjustment entries

#### 13. Permissions
- Accounts: create payment, manage receipts, approve refunds
- Admission: view fee plan
- Manager: view branch reports

#### 14. Edge Cases
- Partial payment
- Multiple payment modes
- Refund requested
- Student transferred to another branch

#### 15. Future Scalability
- Payment gateway integrations
- Auto-reconciliation
- GST-compliant invoice engine

---

### E. Document Management

#### 1. Business Objective
Ensure document readiness without over-collecting data too early and provide a reliable verification workflow.

#### 2. Business Flow
- Required and optional documents defined by course
- Documents uploaded by student or staff
- Verification and rejection
- Reminder for missing documents
- Expiry tracking and renewal

#### 3. User Journey
Student uploads documents → admission team verifies → missing docs flagged → reminders sent → documents approved or rejected.

#### 4. Database Design
- DocumentCategory
- DocumentRequirement
- DocumentRecord
- DocumentVersion
- DocumentVerification
- DocumentExpiryAlert

#### 5. API Design
- POST /documents/upload
- GET /documents/:studentId
- PATCH /documents/:id/verify
- POST /documents/:id/approve
- POST /documents/:id/reject

#### 6. UI Design
- Category-based document checklist
- Upload status, pending review, and expiry badges
- Version history and comments

#### 7. Validation Rules
- File type and size policies enforced
- Expiry date required for time-bound documents
- Rejected documents cannot be marked approved

#### 8. Business Rules
- Admission should not depend on collecting every possible document in the enquiry stage
- Documents can be updated version-by-version
- Verification owner is always recorded

#### 9. Automation
- Missing docs reminder
- Expiry alert
- OCR and classification in future

#### 10. Notifications
- Document requested
- Document accepted
- Document rejected
- Expiry approaching

#### 11. Reports
- Missing documents by student/course/branch
- Verification turnaround

#### 12. Audit Logs
- upload, replace, verify, approve, reject, expire

#### 13. Permissions
- Student: upload own documents
- Admission team: verify and manage
- Manager: review exceptions

#### 14. Edge Cases
- Document rejected
- Expired document
- Duplicate file version
- Missing mandatory document

#### 15. Future Scalability
- OCR and document AI classification
- Digital signature support

---

### F. Faculty Management

#### 1. Business Objective
Optimize teaching operations and ensure the right faculty is assigned to the right class at the right time.

#### 2. Business Flow
- Faculty profile and qualifications stored
- Subject and availability configured
- Demo and regular classes scheduled
- Attendance and leave tracked
- Performance and payroll readiness recorded

#### 3. User Journey
HR/admin creates faculty profile → faculty sets availability → classes scheduled → attendance tracked → leave managed → performance reviewed.

#### 4. Database Design
- FacultyProfile
- FacultyQualification
- FacultySubjectMapping
- FacultyAvailability
- FacultyLeave
- FacultyAttendance
- FacultyPerformance

#### 5. API Design
- POST /faculty
- GET /faculty/:id
- PATCH /faculty/:id/availability
- POST /faculty/:id/leave
- POST /faculty/attendance

#### 6. UI Design
- Calendar-based timetable view
- Availability matrix
- Attendance and leave dashboard
- Conflict detection indicators

#### 7. Validation Rules
- Faculty cannot be double-booked in overlapping slots
- Leave requests must not conflict with scheduled classes

#### 8. Business Rules
- Demo and regular classes must have faculty assignment
- Faculty absence triggers reschedule or backup assignment

#### 9. Automation
- Conflict detection
- Attendance reminders
- Payroll-ready reporting

#### 10. Notifications
- Class assignment
- Leave approval
- Attendance exception

#### 11. Reports
- Faculty utilization
- Attendance and leave trends
- Demo performance

#### 12. Audit Logs
- profile changes, leave approvals, class assignments, performance comments

#### 13. Permissions
- Faculty: own profile and attendance
- Admin: full faculty admin
- Manager: view performance and utilization

#### 14. Edge Cases
- Faculty absent
- Last-minute substitution
- Unavailability due to leave

#### 15. Future Scalability
- Skill-based auto-assignment
- Payroll integration

---

### G. Attendance Management

#### 1. Business Objective
Create a dependable attendance system for reception visits, demo batches, regular classes, and staff attendance.

#### 2. Business Flow
- Mark attendance by source and mode
- Capture date/time/location/device/source
- Record status and remarks
- Trigger exceptions and follow-up actions

#### 3. User Journey
Reception or faculty marks attendance → system stores record → exceptions handled → reports generated.

#### 4. Database Design
- AttendanceRecord
- AttendanceSourceConfig
- AttendanceException
- AttendanceDeviceMapping

#### 5. API Design
- POST /attendance
- PATCH /attendance/:id
- GET /attendance/reports

#### 6. UI Design
- QR-based quick check-in support
- Manual override and remarks
- Date-wise attendance grid

#### 7. Validation Rules
- Time and location must be captured where required
- Status must be one of present/absent/late/partial/not marked

#### 8. Business Rules
- Demo attendance affects conversion evaluation
- Regular attendance feeds performance and reporting

#### 9. Automation
- QR-based check-in
- Auto-mark no-show after cutoff
- Daily attendance summary generation

#### 10. Notifications
- Attendance shortage alert
- Absence alert
- Attendance exception notice

#### 11. Reports
- Attendance rate by course/faculty/branch
- Demo attendance trends

#### 12. Audit Logs
- check-in/out changes, override actions, remarks edits

#### 13. Permissions
- Faculty: own class attendance
- Reception/admin: visitor and staff attendance
- Manager: branch reports

#### 14. Edge Cases
- Student attends only one day
- Faculty absent
- Manual correction required

#### 15. Future Scalability
- Biometric and RFID integration

---

### H. Communication and Templates

#### 1. Business Objective
Provide professional, automated communication across the student lifecycle.

#### 2. Business Flow
- Template creation and versioning
- Message generation from record data
- Delivery via email/SMS/WhatsApp/push
- Delivery status tracking

#### 3. User Journey
System creates letter or reminder automatically from student record and sends it to the relevant contact.

#### 4. Database Design
- CommunicationTemplate
- CommunicationBatch
- CommunicationLog
- CommunicationRecipient

#### 5. API Design
- POST /communications/templates
- POST /communications/send
- GET /communications/logs

#### 6. UI Design
- Template preview and merge field support
- Scheduling and delivery status view

#### 7. Validation Rules
- Templates must be approved before use in automation
- Merge fields must resolve successfully

#### 8. Business Rules
- Sensitive communications require audit signature and logging
- Communication should be tied to workflow events

#### 9. Automation
- Admission letters
- Welcome kits
- Fee reminders
- Batch and timetable notifications

#### 10. Notifications
- Email, in-app, SMS, push, voice, and WhatsApp-ready channels

#### 11. Reports
- Delivery success rate
- Template usage
- Failed deliveries

#### 12. Audit Logs
- send attempts, failures, template edits

#### 13. Permissions
- Admin/configurator: template management
- Operational staff: send approved messages

#### 14. Edge Cases
- Invalid email/mobile
- Delivery failure
- Message suppression

#### 15. Future Scalability
- AI-assisted content generation
- Multi-channel orchestration

---

### I. Dashboard and Analytics

#### 1. Business Objective
Give each role instant visibility into performance, pending work, and urgent actions.

#### 2. Business Flow
- KPI computation from transactional data
- Dashboard widgets and drill-downs
- Notification and task feed
- Role-based quick actions

#### 3. User Journey
Role-based dashboard loads with KPIs, pending approvals, upcoming tasks, alerts, and charts.

#### 4. Database Design
- DashboardWidgetConfig
- SavedReport
- KPIDefinition
- DashboardPreference

#### 5. API Design
- GET /dashboard/summary
- GET /dashboard/role/:roleId
- GET /dashboard/reports/:reportId

#### 6. UI Design
- Role-based cards, charts, tables, alerts, task feed
- Responsive and keyboard-friendly layout

#### 7. Validation Rules
- Only permitted data should appear in role dashboards

#### 8. Business Rules
- Dashboards must reflect current operational state, not static snapshots

#### 9. Automation
- Daily/weekly/monthly digest generation
- KPI refresh jobs

#### 10. Notifications
- Daily summary
- Escalation alerts
- Due task reminders

#### 11. Reports
- Reception, counsellor, faculty, admission, accounts, visa, management, director dashboards

#### 12. Audit Logs
- dashboard access and report export actions

#### 13. Permissions
- Each role sees only the data scope allowed by its permissions

#### 14. Edge Cases
- No data yet
- Data permission mismatch
- Large data volumes on dashboard load

#### 15. Future Scalability
- Embedded analytics and BI integration

---

## 5. Cross-Cutting Enterprise Services

### Access and security
- JWT + refresh token strategy
- RBAC with data scope separation
- Tenant-scoped encryption standards for sensitive data
- Rate limiting and audit logging on all sensitive actions

### Workflow and governance
- Configurable status engine with transition rules
- Approval engine for fee refunds, admissions, document rejection overrides, and branch transfer

### Notification engine
- Event-driven notifications across in-app, email, SMS, and future WhatsApp/push channels
- Reminder escalations based on SLA and due dates

### Reporting layer
- Transactional API layer for operational views
- Reporting warehouse or materialized summaries for executive dashboards

## 6. Recommended Data Architecture Pattern

Each core table should support:
- tenantId
- branchId
- status
- createdAt/updatedAt
- createdBy/updatedBy
- deletedAt
- version
- auditTrailId
- soft delete

A shared base schema or base service pattern should enforce these fields across modules.

## 7. Recommended Implementation Sequence

### Phase 1: Foundation
- Company/branch/user/role/permission
- Shared audit/notification/attachment/timeline modules
- Enquiry and demo core

### Phase 2: Student Lifecycle
- Admission workflow
- Document workflow
- Fee plan and payment

### Phase 3: Operational Modules
- Faculty, attendance, communication, approvals

### Phase 4: Intelligence and Scale
- Advanced dashboards, exports, analytics, AI features, integrations

## 8. Final Architectural Recommendation

The best enterprise design for this project is a modular workflow platform where enquiry, demo, admission, fee, document, faculty, attendance, visa, and communication all share a common backbone of:

- tenant-aware data access
- role-based permissions
- stateful workflow engine
- notifications
- audit logging
- shared attachments and timeline
- reusable reports and dashboards

This approach will keep the system scalable, maintainable, and enterprise-ready while aligning with the current repository structure.
