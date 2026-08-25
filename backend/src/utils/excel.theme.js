import ExcelJS from 'exceljs';

/**
 * Global CRM Excel theme — use for ALL import samples & exports.
 * Light blue header, grid borders, center align (amounts right), TOTAL + calc footer.
 */
export const EXCEL_THEME = {
  fontName: 'Calibri',
  headerFill: 'DBEAFE', // light blue
  headerFont: '1E40AF',
  titleFill: 'EFF6FF',
  titleFont: '1E3A8A',
  metaFill: 'F8FAFC',
  metaFont: '64748B',
  zebraFill: 'F8FAFC',
  border: '93C5FD',
  gridBorder: 'E2E8F0',
  totalFill: 'DBEAFE',
  totalFont: '1E40AF',
  calcFill: 'F1F5F9',
  calcFont: '475569',
  text: '111827',
};

const T = EXCEL_THEME;

const AMOUNT_KEY_RE = /(amount|fee|fees|price|total|paid|balance|due|cost|salary|inr|₹|revenue|discount)/i;

export function createCrmWorkbook({ creator = 'Lead Management CRM' } = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = creator;
  workbook.created = new Date();
  workbook.modified = new Date();
  return workbook;
}

export function argb(hex) {
  return `FF${String(hex).replace(/^#/, '').toUpperCase()}`;
}

export function thinBorder(color = T.border) {
  const edge = { style: 'thin', color: { argb: argb(color) } };
  return { top: edge, bottom: edge, left: edge, right: edge };
}

export function autoColumnWidth(header, samples = [], minW = 12) {
  const longest = Math.max(
    String(header || '').length,
    ...samples.map((s) => String(s ?? '').length),
    4,
  );
  return Math.min(Math.max(longest + 2, minW), 40);
}

/** Default center; amount / money columns → right */
export function resolveColumnAlign(column = {}) {
  if (column.align) return column.align;
  if (column.type === 'amount' || column.type === 'number' || column.type === 'currency') {
    return 'right';
  }
  const key = `${column.key || ''} ${column.header || ''}`;
  if (AMOUNT_KEY_RE.test(key)) return 'right';
  return 'center';
}

function applyFill(cell, hex) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(hex) } };
}

/**
 * Write a standard CRM themed sheet.
 *
 * Layout:
 *  1 Title (merged)
 *  2 Meta (merged)
 *  3 Headers (light blue)
 *  4…N Data (center / amount right, full borders, zebra)
 *  N+1 blank
 *  N+2 TOTAL row
 *  N+3 CALC / notes row
 */
export function writeThemedSheet(workbook, {
  sheetName = 'Sheet1',
  title = 'Lead Management CRM',
  meta = '',
  columns = [],
  rows = [],
  totals = null,
  calculations = null,
  freezeHeader = true,
} = {}) {
  const colCount = Math.max(columns.length, 1);
  const dataStartRow = 4;
  const sheet = workbook.addWorksheet(sheetName, {
    views: freezeHeader ? [{ state: 'frozen', ySplit: 3 }] : [],
    properties: { defaultRowHeight: 18 },
  });

  // Title
  sheet.mergeCells(1, 1, 1, colCount);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 14, color: { argb: argb(T.titleFont) }, name: T.fontName };
  applyFill(titleCell, T.titleFill);
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.border = thinBorder(T.border);
  sheet.getRow(1).height = 28;

  // Meta
  sheet.mergeCells(2, 1, 2, colCount);
  const metaCell = sheet.getCell(2, 1);
  metaCell.value = meta || `${rows.length} record${rows.length === 1 ? '' : 's'}`;
  metaCell.font = { size: 10, color: { argb: argb(T.metaFont) }, name: T.fontName };
  applyFill(metaCell, T.metaFill);
  metaCell.alignment = { vertical: 'middle', horizontal: 'center' };
  metaCell.border = thinBorder(T.gridBorder);
  sheet.getRow(2).height = 20;

  // Header
  const headerRow = sheet.getRow(3);
  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    cell.font = { bold: true, size: 11, color: { argb: argb(T.headerFont) }, name: T.fontName };
    applyFill(cell, T.headerFill);
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = thinBorder(T.border);
  });
  headerRow.height = 22;

  // Data
  rows.forEach((data, rowIdx) => {
    const excelRow = sheet.getRow(dataStartRow + rowIdx);
    columns.forEach((col, colIdx) => {
      const cell = excelRow.getCell(colIdx + 1);
      const raw = data?.[col.key];
      const align = resolveColumnAlign(col);
      const isAmount = align === 'right';

      if (isAmount && raw !== '' && raw != null && !Number.isNaN(Number(raw))) {
        cell.value = Number(raw);
        cell.numFmt = col.numFmt || '#,##0.00';
      } else {
        cell.value = raw ?? '';
      }

      cell.font = { size: 10, name: T.fontName, color: { argb: argb(T.text) } };
      cell.alignment = { vertical: 'middle', horizontal: align, wrapText: false };
      cell.border = thinBorder(T.gridBorder);
      if (rowIdx % 2 === 1) applyFill(cell, T.zebraFill);
    });
    excelRow.height = 18;
  });

  columns.forEach((col, idx) => {
    const samples = rows.map((r) => r?.[col.key]);
    sheet.getColumn(idx + 1).width = autoColumnWidth(col.header, samples, col.minW || 12);
  });

  if (columns.length) {
    sheet.autoFilter = {
      from: { row: 3, column: 1 },
      to: { row: 3, column: colCount },
    };
  }

  const afterData = dataStartRow + rows.length;
  // blank spacer row
  const blankRow = afterData;
  sheet.getRow(blankRow).height = 10;

  // TOTAL line
  const totalRowIndex = blankRow + 1;
  const totalConfig = totals || {
    label: 'TOTAL',
    value: rows.length,
    note: 'Record count',
  };
  const totalRow = sheet.getRow(totalRowIndex);
  for (let c = 1; c <= colCount; c += 1) {
    const cell = totalRow.getCell(c);
    applyFill(cell, T.totalFill);
    cell.border = thinBorder(T.border);
    cell.font = { bold: true, size: 10, color: { argb: argb(T.totalFont) }, name: T.fontName };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  }
  totalRow.getCell(1).value = totalConfig.label || 'TOTAL';
  totalRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
  if (colCount >= 2) {
    const v = totalConfig.value;
    const cell2 = totalRow.getCell(2);
    cell2.value = typeof v === 'number' ? v : (v ?? rows.length);
    cell2.alignment = {
      vertical: 'middle',
      horizontal: typeof v === 'number' ? 'right' : 'center',
    };
  }
  if (colCount >= 3 && totalConfig.note) {
    totalRow.getCell(3).value = totalConfig.note;
    totalRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'left' };
  }
  // Amount column sums if provided
  if (Array.isArray(totalConfig.amountSums)) {
    totalConfig.amountSums.forEach(({ colIndex, value }) => {
      if (colIndex >= 1 && colIndex <= colCount) {
        const cell = totalRow.getCell(colIndex);
        cell.value = value;
        cell.numFmt = '#,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
    });
  }
  totalRow.height = 20;

  // Optional CALC / notes line (off by default — not for client-facing shares)
  let calcRowIndex = null;
  if (calculations) {
    calcRowIndex = totalRowIndex + 1;
    const calcConfig = calculations;
    const calcRow = sheet.getRow(calcRowIndex);
    for (let c = 1; c <= colCount; c += 1) {
      const cell = calcRow.getCell(c);
      applyFill(cell, T.calcFill);
      cell.border = thinBorder(T.gridBorder);
      cell.font = { size: 9, color: { argb: argb(T.calcFont) }, name: T.fontName };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }
    calcRow.getCell(1).value = calcConfig.label || 'NOTES';
    calcRow.getCell(1).font = { bold: true, size: 9, color: { argb: argb(T.calcFont) }, name: T.fontName };
    if (colCount >= 2) {
      sheet.mergeCells(calcRowIndex, 2, calcRowIndex, colCount);
      calcRow.getCell(2).value = calcConfig.value || '';
      calcRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
    }
    calcRow.height = 18;
  }

  return {
    sheet,
    headerRow: 3,
    dataStartRow,
    dataEndRow: afterData - 1,
    totalRowIndex,
    calcRowIndex,
  };
}

export async function workbookToBuffer(workbook) {
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/** Style a simple header row (e.g. Field Guide sheet) with the same light-blue theme */
export function styleSimpleHeaderRow(row, colCount) {
  for (let c = 1; c <= colCount; c += 1) {
    const cell = row.getCell(c);
    cell.font = { bold: true, size: 11, color: { argb: argb(T.headerFont) }, name: T.fontName };
    applyFill(cell, T.headerFill);
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thinBorder(T.border);
  }
  row.height = 22;
}

export default {
  EXCEL_THEME,
  createCrmWorkbook,
  writeThemedSheet,
  workbookToBuffer,
  styleSimpleHeaderRow,
  resolveColumnAlign,
  autoColumnWidth,
  thinBorder,
  argb,
};
