import dayjs from 'dayjs';

export default function useFormattedDate(
  date?: string | Date | null,
  format: string = 'DD MMM YYYY',
  placeholder: string = 'Date not set'
): string {
  if (!date) return placeholder;

  const parsed = dayjs(date);
  if (!parsed.isValid()) return placeholder;

  return parsed.format(format);
}
