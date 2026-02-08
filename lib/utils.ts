import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const formatYear = (year: number) => {
  const absYear = Math.abs(year);
  // Use 'de-DE' for space separators (20 000) or 'en-US' for commas (20,000)
  const formatted = new Intl.NumberFormat('en-US').format(absYear);

  if (year < 0) return `${formatted} BCE`;
  if (year === 0) return `0`;
  return `${formatted} CE`;
};