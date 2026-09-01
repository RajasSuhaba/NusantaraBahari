import * as XLSX from 'xlsx';
import { CustomUploadedRow } from '../types';

export function parseCSVString(csvText: string): CustomUploadedRow[] {
  const lines = csvText.trim().split(/\r\n|\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows: CustomUploadedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    // Simple CSV parser handling comma within quotes
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let char of lines[i]) {
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^["']|["']$/g, ''));

    const rowObj: any = { id: `upload-${Date.now()}-${i}` };
    headers.forEach((header, index) => {
      rowObj[header] = values[index] !== undefined ? values[index] : '';
    });

    // Smart mapping for coordinate and location fields
    const latField = headers.find(h => /^(lat|latitude|lintang|y)$/i.test(h));
    const lngField = headers.find(h => /^(lng|lon|longitude|bujur|x)$/i.test(h));
    const locField = headers.find(h => /^(lokasi|nama|nama_lokasi|station|stasiun|location|site|titik)$/i.test(h));

    rowObj.lat = latField && !isNaN(Number(rowObj[latField])) ? Number(rowObj[latField]) : -6.2000;
    rowObj.lng = lngField && !isNaN(Number(rowObj[lngField])) ? Number(rowObj[lngField]) : 106.8166;
    rowObj.lokasi = locField ? rowObj[locField] : `Titik Pengamatan #${i}`;

    rows.push(rowObj as CustomUploadedRow);
  }

  return rows;
}

export function parseExcelFile(arrayBuffer: ArrayBuffer): CustomUploadedRow[] {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  return jsonData.map((row, index) => {
    const keys = Object.keys(row);
    const latField = keys.find(h => /^(lat|latitude|lintang|y)$/i.test(h));
    const lngField = keys.find(h => /^(lng|lon|longitude|bujur|x)$/i.test(h));
    const locField = keys.find(h => /^(lokasi|nama|nama_lokasi|station|stasiun|location|site|titik)$/i.test(h));

    const latVal = latField ? Number(row[latField]) : -6.2000;
    const lngVal = lngField ? Number(row[lngField]) : 106.8166;
    const locVal = locField ? String(row[locField]) : `Titik Observasi ${index + 1}`;

    return {
      id: `excel-${Date.now()}-${index}`,
      lokasi: locVal,
      lat: isNaN(latVal) ? -6.2000 : latVal,
      lng: isNaN(lngVal) ? 106.8166 : lngVal,
      ...row
    } as CustomUploadedRow;
  });
}

export function exportRowsToCSV(rows: any[], filename = 'Data_Maritim_Nusantara.csv') {
  if (!rows || rows.length === 0) return;
  const keys = Object.keys(rows[0]).filter(k => k !== 'id');
  const csvRows: string[] = [];
  csvRows.push(keys.join(','));

  rows.forEach(row => {
    const values = keys.map(k => {
      const val = row[k] ?? '';
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    });
    csvRows.push(values.join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
