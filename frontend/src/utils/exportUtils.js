/**
 * Utility functions for exporting data
 */
import * as XLSX from 'xlsx';

/**
 * Export data to CSV file
 * @param {Array} data - Array of objects to export
 * @param {String} filename - Name of the file to download
 */
export const exportToCSV = (data, filename) => {
  // Convert data to CSV format
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Handle strings with commas by wrapping in quotes
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
    });
    csvRows.push(values.join(','));
  }
  
  // Create CSV content
  const csvContent = csvRows.join('\n');
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Filter leaderboard data by time period
 * @param {Array} data - Array of leaderboard data
 * @param {String} period - Time period (day, week, month, year)
 * @returns {Array} - Filtered data
 */
export const filterByPeriod = (data, period) => {
  const now = new Date();
  let startDate;
  
  switch (period) {
    case 'day':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
      startDate = new Date(now.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      return data; // Return all data if period is invalid
  }
  
  // For demo purposes, we'll just return all data since we don't have timestamp in our data
  // In a real application, you would filter based on a timestamp field
  return data;
};

/**
 * Format leaderboard data for export
 * @param {Array} lecturers - Array of lecturer objects
 * @returns {Array} - Formatted data for export
 */
export const formatLeaderboardForExport = (lecturers) => {
  return lecturers.map((lecturer) => ({
    Peringkat: lecturer.rank,
    NIDN: lecturer.nidn,
    'Nama Dosen': lecturer.name,
    'Skor Rata-rata': lecturer.averageScore !== null ? `${Math.round(lecturer.averageScore)}%` : 'Belum ada skor',
    'Jumlah Voters': lecturer.votersCount || 0
  }));
};

/**
 * Export data to XLSX file
 * @param {Array} data - Array of objects to export
 * @param {String} filename - Name of the file to download
 * @param {String} sheetName - Name of the sheet in Excel file
 */
export const exportToXLSX = (data, filename, sheetName = 'Leaderboard') => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Convert data to worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Generate XLSX file and trigger download
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

/**
 * Get date range for custom period
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {String} - Formatted date range string
 */
export const getDateRangeString = (startDate, endDate) => {
  const formatDate = (date) => {
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  return `${formatDate(startDate)}_${formatDate(endDate)}`;
};
