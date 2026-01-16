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
 * This ensures the exact date selected by user is preserved regardless of timezone
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

  // Use local date methods to preserve the exact date selected by user
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Formats a date into YYYY-MM-DDTHH:mm:ss format using local timezone
 * This ensures the backend receives the exact date selected by user with local time
 * @param date - Date object, string, or number (timestamp)
 * @returns Formatted date string in YYYY-MM-DDTHH:mm:ss format, or empty string if invalid
 *
 * @example
 * formatDateForAPI(new Date('2026-01-15')) // returns '2026-01-15T12:00:00' (noon local time)
 * formatDateForAPI(null) // returns ''
 */
export const formatDateForAPI = (date: Date | string | number | null | undefined): string => {
  if (!date) return '';

  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return '';
  }

  // Set time to noon local time to avoid timezone boundary issues
  d.setHours(12, 0, 0, 0);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};
