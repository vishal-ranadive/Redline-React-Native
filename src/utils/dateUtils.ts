/**
 * Date utility functions for consistent date formatting across the app
 */

/**
 * Formats a date into MM/DD/YYYY format
 * @param date - Date object, string, or number (timestamp)
 * @returns Formatted date string in MM/DD/YYYY format, or empty string if invalid
 * 
 * @example
 * formatDateMMDDYYYY('2026-01-09') // returns '01/09/2026'
 * formatDateMMDDYYYY(new Date()) // returns current date as 'MM/DD/YYYY'
 * formatDateMMDDYYYY(null) // returns ''
 */
export const formatDateMMDDYYYY = (date: Date | string | number | null | undefined): string => {
  if (!date) return '';
  
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return '';
  }
  
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${month}/${day}/${year}`;
};
