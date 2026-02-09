import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const formatYear = (year: any) => {
  if (year === null || year === undefined || year === '') return 'Unknown';

  const cleaned = String(year)
    .replace(/[^\d,.-]/g, '')  // Remove non-numeric chars
    .replace(/,/g, '.');         // Commas to dots

  const numericYear = parseFloat(cleaned);
  if (isNaN(numericYear)) return 'Unknown';

  const roundedYear = Math.round(numericYear);
  const formatted = new Intl.NumberFormat('en-US').format(Math.abs(roundedYear));

  if (roundedYear < 0) return `${formatted} BCE`;
  if (roundedYear === 0) return '0';
  return `${formatted} CE`;
};