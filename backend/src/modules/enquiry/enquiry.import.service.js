import { enquiryRepository } from './enquiry.repository.js';
import { enquiryService } from './enquiry.service.js';
import { logEnquiryAudit } from './enquiry.audit.js';

const parseCsvRows = (text) => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line, index) => {
    const values = line.split(',').map((v) => v.trim());
    const row = { _row: index + 2 };
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
};

const validateImportRow = (row) => {
  const errors = [];
  if (!row.firstname && !row['first name']) errors.push('First name required');
  if (!row.email) errors.push('Email required');
  if (!row.mobile) errors.push('Mobile required');
  return errors;
};

export const enquiryImportService = {
  parseFile: async (buffer, fileName) => {
    const text = buffer.toString('utf-8');
    const rows = parseCsvRows(text);
    return rows.map((row) => ({
      ...row,
      firstName: row.firstname || row['first name'] || '',
      lastName: row.lastname || row['last name'] || '',
      email: row.email || '',
      mobile: row.mobile || '',
      interestedCourse: row.course || row.interestedcourse || '',
      interestedCountry: row.country || '',
      source: row.source || 'IMPORT',
      errors: validateImportRow(row),
    }));
  },

  confirmImport: async (rows, userId, branchId, fileName, req) => {
    let uploaded = 0;
    let duplicates = 0;
    let failed = 0;
    const errors = [];
    const duplicateRows = [];

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
          interestedCourse: row.interestedCourse || null,
          interestedCountry: row.interestedCountry || null,
          source: row.source || 'IMPORT',
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

    return { batchId: batch.id, total: rows.length, uploaded, duplicates, failed, errors };
  },

  getImportHistory: (userId) => enquiryRepository.listImportBatches(userId),
  getDuplicates: (batchId) => enquiryRepository.getImportDuplicates(batchId),

  getSampleCsv: () => [
    'First Name,Last Name,Email,Mobile,Country,Course,Source',
    'John,Doe,john@example.com,9876543210,Canada,MBA,Website',
  ].join('\n'),
};
