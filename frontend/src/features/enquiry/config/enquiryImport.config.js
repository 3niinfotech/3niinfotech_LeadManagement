/** Mirrors backend IMPORT_COLUMNS for preview table */
export const IMPORT_PREVIEW_COLUMNS = [
  { key: 'firstName', header: 'First Name', required: true, minW: 110 },
  { key: 'lastName', header: 'Last Name', minW: 100 },
  { key: 'email', header: 'Email', required: true, minW: 180 },
  { key: 'mobile', header: 'Mobile', required: true, minW: 110 },
  { key: 'mobileCountry', header: 'Code', minW: 72 },
  { key: 'alternateNo', header: 'Alt No', minW: 100 },
  { key: 'gender', header: 'Gender', minW: 80 },
  { key: 'nationality', header: 'Nationality', minW: 100 },
  { key: 'interestedCountry', header: 'Country', minW: 100 },
  { key: 'interestedCourse', header: 'Course', minW: 120 },
  { key: 'intake', header: 'Intake', minW: 100 },
  { key: 'applyLevel', header: 'Apply Level', minW: 110 },
  { key: 'highestQual', header: 'Qual', minW: 110 },
  { key: 'source', header: 'Source', minW: 100 },
  { key: 'priority', header: 'Priority', minW: 90 },
  { key: 'status', header: 'Status', minW: 90 },
  { key: 'passportNo', header: 'Passport', minW: 110 },
  { key: 'dateOfBirth', header: 'DOB', minW: 100 },
  { key: 'address', header: 'Address', minW: 160 },
  { key: 'remark', header: 'Remark', minW: 140 },
];

export function calcImportSummary(rows = []) {
  const total = rows.length;
  const invalid = rows.filter((r) => r.errors?.length).length;
  const valid = total - invalid;
  return { total, valid, invalid, ready: valid };
}

/** Auto width from header + sample cell text (px) */
export function calcColumnWidths(columns, rows, { min = 72, max = 240 } = {}) {
  return columns.map((col) => {
    const samples = rows.slice(0, 40).map((r) => String(r[col.key] ?? ''));
    const longest = Math.max(
      String(col.header).length,
      ...samples.map((s) => s.length),
      4,
    );
    const px = Math.min(Math.max(longest * 8 + 28, col.minW || min), max);
    return { ...col, width: px };
  });
}
