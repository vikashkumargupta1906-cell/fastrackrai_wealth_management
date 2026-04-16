const XLSX = require('xlsx');

// Column normalizer function
const normalizeColumnName = (columnName) => {
  if (!columnName || typeof columnName !== 'string') return '';
  
  return columnName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_') // Replace non-alphanumeric with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
};

// Apply column normalizer to row keys
const normalizeRowKeys = (row) => {
  if (!row || typeof row !== 'object') return row;
  
  const normalizedRow = {};
  Object.keys(row).forEach(key => {
    const normalizedKey = normalizeColumnName(key);
    normalizedRow[normalizedKey] = row[key];
  });
  return normalizedRow;
};

// Sheet type detection based on normalized column names
const detectSheetType = (normalizedRows) => {
  if (!normalizedRows || normalizedRows.length === 0) return 'unknown';
  
  // Get all normalized column names from the first few rows
  const sampleRows = normalizedRows.slice(0, 5);
  const allColumns = new Set();
  
  sampleRows.forEach(row => {
    Object.keys(row).forEach(key => allColumns.add(key));
  });
  
  const columns = Array.from(allColumns);
  
  // Define sheet type patterns based on expected columns
  const sheetPatterns = {
    household: ['household_id', 'household_name', 'address', 'phone', 'email'],
    member: ['member_id', 'household_id', 'first_name', 'last_name', 'date_of_birth', 'relationship'],
    account: ['account_id', 'member_id', 'account_type', 'account_number', 'balance', 'open_date'],
    bank: ['bank_id', 'bank_name', 'branch_code', 'address', 'phone', 'ifsc_code']
  };
  
  // Check each pattern against available columns
  for (const [sheetType, requiredColumns] of Object.entries(sheetPatterns)) {
    const matchCount = requiredColumns.filter(col => columns.includes(col)).length;
    const matchPercentage = matchCount / requiredColumns.length;
    
    // If at least 60% of required columns match, consider it this type
    if (matchPercentage >= 0.6) {
      return sheetType;
    }
  }
  
  return 'unknown';
};

// Main parser function
const parseExcelFile = (filePath) => {
  try {
    // Read the workbook
    const workbook = XLSX.readFile(filePath);
    
    const results = [];
    
    // Loop through all sheet names
    workbook.SheetNames.forEach(sheetName => {
      // Get the worksheet
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert sheet to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // Apply column normalizer to each row
      const normalizedData = jsonData.map(row => normalizeRowKeys(row));
      
      // Detect sheet type
      const sheetType = detectSheetType(normalizedData);
      
      results.push({
        sheetName,
        sheetType,
        data: normalizedData,
        rowCount: normalizedData.length
      });
    });
    
    return {
      success: true,
      sheets: results,
      totalSheets: results.length
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      sheets: []
    };
  }
};

module.exports = {
  parseExcelFile,
  normalizeColumnName,
  normalizeRowKeys,
  detectSheetType
};
