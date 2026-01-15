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

/**
 * Formats a date into YYYY-MM-DD format using local timezone
 * This avoids timezone conversion issues that occur with toISOString()
 * @param date - Date object, string, or number (timestamp)
 * @returns Formatted date string in YYYY-MM-DD format, or empty string if invalid
 *
 * @example
 * formatDateYYYYMMDD(new Date('2026-01-15')) // returns '2026-01-15' (always the selected date)
 * formatDateYYYYMMDD(null) // returns ''
 */
export const formatDateYYYYMMDD = (date: Date | string | number | null | undefined): string => {
  if (!date) return '';

  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return '';
  }

  // Use local date methods to avoid timezone conversion
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};
