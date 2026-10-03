/**
 * CareFlow Data Export & Import Utilities
 * Handles CSV encoding (with UTF-8 BOM for Excel), JSON backups, and CSV file parsing.
 */

// Export data to CSV file with Excel-compatible UTF-8 BOM
export const exportToCsv = (filename, columns, data) => {
  if (!data || !data.length) {
    alert('Aucune donnée à exporter.');
    return;
  }

  const headerRow = columns.map(c => `"${(c.label || c.key).replace(/"/g, '""')}"`).join(';');
  const contentRows = data.map(item => {
    return columns.map(c => {
      let val = item[c.key];
      if (val === null || val === undefined) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(';');
  });

  const csvString = '\uFEFF' + [headerRow, ...contentRows].join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
};

// Export raw JSON backup
export const exportToJson = (filename, data) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  triggerDownload(blob, filename.endsWith('.json') ? filename : `${filename}.json`);
};

// Helper to trigger browser download
const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Parse CSV text into headers and array of row objects
export const parseCsvText = (text) => {
  const cleanText = text.replace(/^\uFEFF/, '').trim();
  const lines = cleanText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('Le fichier CSV doit contenir au moins une ligne d\'en-tête et une ligne de données.');
  }

  // Detect delimiter: semicolon or comma
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';

  // Parse header
  const rawHeaders = splitCsvLine(firstLine, delimiter).map(h => h.trim().toLowerCase());

  // Parse rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i], delimiter);
    const rowObj = {};
    rawHeaders.forEach((header, index) => {
      rowObj[header] = (values[index] || '').trim();
    });
    rows.push(rowObj);
  }

  return { headers: rawHeaders, rows };
};

// Split CSV line respecting quotes
const splitCsvLine = (line, delimiter) => {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.replace(/^["']|["']$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.replace(/^["']|["']$/g, ''));
  return result;
};

// Download sample CSV template for importing patients
export const downloadPatientSampleCsv = () => {
  const headers = ['firstName', 'lastName', 'cin', 'phone', 'dateOfBirth', 'gender', 'address', 'email'];
  const sampleRows = [
    ['Karim', 'Alaoui', 'BK48120', '+212612345678', '1990-05-14', 'MALE', '12 Rue Hassan II, Casablanca', 'karim.alaoui@example.com'],
    ['Fatima', 'Zahra', 'CD98451', '+212687654321', '1995-11-20', 'FEMALE', '45 Bd Zerktouni, Rabat', 'fatima.zahra@example.com'],
    ['Youssef', 'Bennani', 'AB33412', '+212699887766', '1982-03-08', 'MALE', '8 Ave Mohammed V, Marrakech', 'youssef.b@example.com']
  ];

  const content = '\uFEFF' + [
    headers.join(';'),
    ...sampleRows.map(r => r.map(val => `"${val}"`).join(';'))
  ].join('\r\n');

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, 'modele_import_patients_careflow.csv');
};
