import ExcelJS from 'exceljs';
import { enquiryRepository } from './enquiry.repository.js';
import { enquiryService } from './enquiry.service.js';
import { logEnquiryAudit } from './enquiry.audit.js';

/** Canonical import columns — header labels shown in Excel + preview */
export const IMPORT_COLUMNS = [
  { key: 'firstName', header: 'First Name', required: true, minW: 12 },
  { key: 'lastName', header: 'Last Name', required: false, minW: 12 },
  { key: 'email', header: 'Email', required: true, minW: 22 },
  { key: 'mobile', header: 'Mobile', required: true, minW: 12 },
  { key: 'mobileCountry', header: 'Mobile Country', required: false, minW: 12 },
  { key: 'alternateNo', header: 'Alternate No', required: false, minW: 12 },
  { key: 'gender', header: 'Gender', required: false, minW: 10 },
  { key: 'nationality', header: 'Nationality', required: false, minW: 12 },
  { key: 'interestedCountry', header: 'Country', required: false, minW: 12 },
  { key: 'interestedCourse', header: 'Course', required: false, minW: 14 },
  { key: 'intake', header: 'Intake', required: false, minW: 12 },
  { key: 'applyLevel', header: 'Apply Level', required: false, minW: 12 },
  { key: 'highestQual', header: 'Highest Qual', required: false, minW: 14 },
  { key: 'source', header: 'Source', required: false, minW: 12 },
  { key: 'priority', header: 'Priority', required: false, minW: 10 },
  { key: 'status', header: 'Status', required: false, minW: 12 },
  { key: 'passportNo', header: 'Passport No', required: false, minW: 12 },
  { key: 'dateOfBirth', header: 'Date of Birth', required: false, minW: 12 },
  { key: 'address', header: 'Address', required: false, minW: 20 },
  { key: 'remark', header: 'Remark', required: false, minW: 18 },
];

const HEADER_ALIASES = {
  firstname: 'firstName',
  'first name': 'firstName',
  lastname: 'lastName',
  'last name': 'lastName',
  email: 'email',
  'email id': 'email',
  'e-mail': 'email',
  mobile: 'mobile',
  phone: 'mobile',
  'mobile no': 'mobile',
  'mobile number': 'mobile',
  'phone number': 'mobile',
  mobilecountry: 'mobileCountry',
  'mobile country': 'mobileCountry',
  'country code': 'mobileCountry',
  dialcode: 'mobileCountry',
  'dial code': 'mobileCountry',
  alternateno: 'alternateNo',
  'alternate no': 'alternateNo',
  'alternate number': 'alternateNo',
  gender: 'gender',
  nationality: 'nationality',
  country: 'interestedCountry',
  interestedcountry: 'interestedCountry',
  'interested country': 'interestedCountry',
  course: 'interestedCourse',
  interestedcourse: 'interestedCourse',
  'interested course': 'interestedCourse',
  intake: 'intake',
  applylevel: 'applyLevel',
  'apply level': 'applyLevel',
  highestqual: 'highestQual',
  'highest qual': 'highestQual',
  qualification: 'highestQual',
  source: 'source',
  priority: 'priority',
  status: 'status',
  passportno: 'passportNo',
  'passport no': 'passportNo',
  'passport number': 'passportNo',
  dateofbirth: 'dateOfBirth',
  'date of birth': 'dateOfBirth',
  dob: 'dateOfBirth',
  address: 'address',
  remark: 'remark',
  remarks: 'remark',
  notes: 'remark',
};

const SAMPLE_ROWS = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    mobile: '9876543210',
    mobileCountry: '+91',
    gender: 'Male',
    nationality: 'India',
    interestedCountry: 'Canada',
    interestedCourse: 'MBA',
    intake: 'Sep-2026',
    applyLevel: 'Postgraduate',
    highestQual: 'Bachelor',
    source: 'Website',
    priority: 'MEDIUM',
    status: 'NEW',
    remark: 'Sample row — replace with real data',
  },
  {
    firstName: 'Priya',
    lastName: 'Sharma',
    email: 'priya.sharma@example.com',
    mobile: '9123456780',
    mobileCountry: '+91',
    gender: 'Female',
    nationality: 'India',
    interestedCountry: 'UK',
    interestedCourse: 'BSc Nursing',
    intake: 'Jan-2027',
    applyLevel: 'Undergraduate',
    source: 'Walk-in',
    priority: 'HIGH',
    status: 'NEW',
  },
];

function normalizeHeader(raw) {
  return String(raw || '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function cellToString(value) {
  if (value == null) return '';
  if (typeof value === 'object') {
    if (value.text != null) return String(value.text).trim();
    if (value.result != null) return String(value.result).trim();
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
  }
  return String(value).trim();
}

function mapRawRow(raw, rowNumber) {
  const mapped = { _row: rowNumber };
  Object.entries(raw).forEach(([header, value]) => {
    const key = HEADER_ALIASES[normalizeHeader(header)];
    if (key) mapped[key] = cellToString(value);
  });

  IMPORT_COLUMNS.forEach(({ key }) => {
    if (mapped[key] == null) mapped[key] = '';
  });

  if (mapped.mobileCountry && !String(mapped.mobileCountry).startsWith('+')) {
    mapped.mobileCountry = `+${String(mapped.mobileCountry).replace(/^\+/, '')}`;
  }
  if (mapped.priority) mapped.priority = String(mapped.priority).toUpperCase();
  if (mapped.status) mapped.status = String(mapped.status).toUpperCase().replace(/\s+/g, '_');
  if (!mapped.source) mapped.source = 'IMPORT';

  mapped.errors = validateImportRow(mapped);
  return mapped;
}

function validateImportRow(row) {
  const errors = [];
  if (!row.firstName) errors.push('First name required');
  if (!row.email) errors.push('Email required');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errors.push('Invalid email');
  if (!row.mobile) errors.push('Mobile required');
  else if (String(row.mobile).replace(/\D/g, '').length < 6) errors.push('Invalid mobile');
  if (row.priority && !['URGENT', 'HIGH', 'MEDIUM', 'LOW'].includes(row.priority)) {
    errors.push('Priority must be URGENT/HIGH/MEDIUM/LOW');
  }
  return errors;
}

function parseCsvText(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const splitCsvLine = (line) => {
    const out = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        out.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map((v) => v.trim());
  };

  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line, index) => {
    const values = splitCsvLine(line);
    const raw = {};
    headers.forEach((h, i) => { raw[h] = values[i] || ''; });
    return mapRawRow(raw, index + 2);
  });
}

async function parseExcelBuffer(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 2) return [];

  const FOOTER_MARKERS = new Set(['total', 'notes', 'summary', 'calculations', 'calc']);

  /** Detect header row (supports themed files with title/meta above headers) */
  let headerRowNumber = 1;
  for (let n = 1; n <= Math.min(sheet.rowCount, 10); n += 1) {
    const row = sheet.getRow(n);
    const values = [];
    row.eachCell({ includeEmpty: false }, (cell) => {
      values.push(normalizeHeader(cellToString(cell.value)));
    });
    const hit = values.some((v) => (
      v === 'first name'
      || v === 'email'
      || v === 'mobile'
      || v === 'enquiry code'
      || Boolean(HEADER_ALIASES[v])
    ));
    if (hit) {
      headerRowNumber = n;
      break;
    }
  }

  const headerRow = sheet.getRow(headerRowNumber);
  const headers = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, col) => {
    headers[col] = cellToString(cell.value);
  });

  const rows = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= headerRowNumber) return;
    const firstVal = normalizeHeader(cellToString(row.getCell(1).value));
    if (FOOTER_MARKERS.has(firstVal)) return;

    const raw = {};
    let hasAny = false;
    headers.forEach((header, col) => {
      if (!header) return;
      const val = cellToString(row.getCell(col).value);
      raw[header] = val;
      if (val) hasAny = true;
    });
    if (!hasAny) return;
    rows.push(mapRawRow(raw, rowNumber));
  });
  return rows;
}

function isExcelFile(fileName = '', mime = '') {
  const name = String(fileName).toLowerCase();
  const type = String(mime).toLowerCase();
  return (
    name.endsWith('.xlsx')
    || name.endsWith('.xls')
    || type.includes('spreadsheet')
    || type.includes('excel')
    || type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
}

export const enquiryImportService = {
  parseFile: async (buffer, fileName, mimeType) => {
    if (isExcelFile(fileName, mimeType)) {
      return parseExcelBuffer(buffer);
    }
    return parseCsvText(buffer.toString('utf-8'));
  },

  confirmImport: async (rows, userId, branchId, fileName, req) => {
    let uploaded = 0;
    let duplicates = 0;
    let failed = 0;
    const errors = [];

    const batch = await enquiryRepository.createImportBatch({
      userId,
      branchId,
      fileName,
      totalRows: rows.length,
    });

    for (const row of rows) {
      if (row.errors?.length) {
        failed += 1;
        errors.push({ row: row._row, messages: row.errors });
        continue;
      }
      try {
        const existing = await enquiryRepository.findMany({
          page: 1,
          limit: 1,
          keyword: row.email,
        });
        if (existing.data.some((e) => e.email === row.email || e.mobile === row.mobile)) {
          duplicates += 1;
          await enquiryRepository.addImportDuplicate({
            batchId: batch.id,
            rowData: row,
            reason: 'Duplicate email or mobile',
          });
          continue;
        }

        const created = await enquiryService.create({
          branchId,
          firstName: row.firstName,
          lastName: row.lastName || null,
          email: row.email,
          mobile: row.mobile,
          mobileCountry: row.mobileCountry || '+91',
          alternateNo: row.alternateNo || null,
          gender: row.gender || null,
          nationality: row.nationality || null,
          interestedCourse: row.interestedCourse || null,
          interestedCountry: row.interestedCountry || null,
          intake: row.intake || null,
          applyLevel: row.applyLevel || null,
          highestQual: row.highestQual || null,
          source: row.source || 'IMPORT',
          priority: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'].includes(row.priority) ? row.priority : 'MEDIUM',
          status: (row.status && [
            'NEW', 'CONTACTED', 'INTERESTED', 'HIGHLY_INTERESTED', 'FOLLOW_UP', 'APPOINTMENT',
            'DEMO_SCHEDULED', 'DEMO_ATTENDED', 'COUNSELLING', 'DOCUMENTS_PENDING',
            'APPLICATION_STARTED', 'CONVERTED', 'HOLD', 'LOST', 'NOT_INTERESTED', 'SPAM', 'DUPLICATE',
          ].includes(row.status)) ? row.status : undefined,
          passportNo: row.passportNo || null,
          dateOfBirth: row.dateOfBirth || null,
          address: row.address || null,
          remark: row.remark || null,
        }, userId, req);

        await logEnquiryAudit({
          enquiryId: created.id,
          userId,
          action: 'IMPORTED',
          description: `Imported from ${fileName}`,
          newValue: batch.id,
          req,
        });
        uploaded += 1;
      } catch (err) {
        failed += 1;
        errors.push({ row: row._row, messages: [err.message] });
      }
    }

    await enquiryRepository.updateImportBatch(batch.id, {
      uploaded,
      duplicates,
      failed,
      errors,
    });

    return {
      batchId: batch.id,
      total: rows.length,
      uploaded,
      duplicates,
      failed,
      errors,
      valid: uploaded,
    };
  },

  getImportHistory: (userId) => enquiryRepository.listImportBatches(userId),
  getDuplicates: (batchId) => enquiryRepository.getImportDuplicates(batchId),

  /** Styled Excel sample — global CRM Excel theme */
  getSampleExcelBuffer: async () => {
    const {
      createCrmWorkbook,
      writeThemedSheet,
      workbookToBuffer,
      styleSimpleHeaderRow,
      thinBorder,
      EXCEL_THEME,
      argb,
    } = await import('../../utils/excel.theme.js');

    const workbook = createCrmWorkbook();
    const sampleRows = SAMPLE_ROWS.map((r) => ({ ...r }));

    writeThemedSheet(workbook, {
      sheetName: 'Enquiries',
      title: 'Lead Management CRM — Enquiry Import Sample',
      meta: `Sample template  ·  ${sampleRows.length} example rows  ·  Replace with your data above TOTAL`,
      columns: IMPORT_COLUMNS,
      rows: sampleRows,
      totals: {
        label: 'TOTAL',
        value: sampleRows.length,
        note: 'Delete sample rows, keep header, paste your data above TOTAL',
      },
    });

    const guide = workbook.addWorksheet('Field Guide');
    guide.getColumn(1).width = 18;
    guide.getColumn(2).width = 12;
    guide.getColumn(3).width = 48;

    const gh = guide.getRow(1);
    gh.getCell(1).value = 'Column';
    gh.getCell(2).value = 'Required';
    gh.getCell(3).value = 'Notes / autofill';
    styleSimpleHeaderRow(gh, 3);

    IMPORT_COLUMNS.forEach((col, idx) => {
      const row = guide.getRow(idx + 2);
      row.getCell(1).value = col.header;
      row.getCell(2).value = col.required ? 'Yes' : 'Optional';
      row.getCell(3).value = col.required
        ? 'Must be filled for every row'
        : col.key === 'source'
          ? 'Defaults to IMPORT if empty'
          : col.key === 'mobileCountry'
            ? 'e.g. +91 — defaults to company mobile code when empty on import'
            : col.key === 'priority'
              ? 'URGENT / HIGH / MEDIUM / LOW — defaults to MEDIUM'
              : 'Optional — leave blank if unknown';
      for (let c = 1; c <= 3; c += 1) {
        const cell = row.getCell(c);
        cell.alignment = { vertical: 'middle', horizontal: c === 3 ? 'left' : 'center' };
        cell.border = thinBorder(EXCEL_THEME.gridBorder);
        cell.font = { size: 10, name: EXCEL_THEME.fontName, color: { argb: argb(EXCEL_THEME.text) } };
      }
    });

    return workbookToBuffer(workbook);
  },

  getSampleCsv: () => {
    const headers = IMPORT_COLUMNS.map((c) => c.header).join(',');
    const lines = SAMPLE_ROWS.map((row) => IMPORT_COLUMNS.map((c) => {
      const val = String(row[c.key] || '');
      return val.includes(',') ? `"${val}"` : val;
    }).join(','));
    return [headers, ...lines].join('\n');
  },
};
