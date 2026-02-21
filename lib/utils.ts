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

/** BP (years before present) to CE year for display */
export function bpToYearCE(bp: string | number | null | undefined): number | null {
  if (bp === null || bp === undefined || bp === '') return null;
  const num = parseFloat(String(bp).replace(',', '.'));
  if (isNaN(num)) return null;
  return Math.round(1950 - num);
}

/**
 * User-friendly label for a sample: "Place, Year" e.g. "England, 300 BCE".
 * By default uses location or country or culture for place.
 * With countryOnly: true, uses only country (and year) for compact labels.
 */
export function getSampleFriendlyLabel(
  sample: {
    location?: string | null;
    country?: string | null;
    culture?: string | null;
    object_id?: string | null;
    mean_bp?: string | number | null;
  },
  opts?: { countryOnly?: boolean }
): string {
  const place = opts?.countryOnly
    ? (sample.country && String(sample.country).trim()) || null
    : [sample.location, sample.country, sample.culture].find((v) => v && String(v).trim()) || null;
  const yearCE = bpToYearCE(sample.mean_bp ?? null);
  const yearStr = yearCE !== null ? formatYear(yearCE) : null;

  if (place && yearStr) return `${place.trim()}, ${yearStr}`;
  if (place) return place.trim();
  if (yearStr) return yearStr;
  if (!opts?.countryOnly) {
    if (sample.culture && sample.object_id) return `${sample.culture} (${sample.object_id})`;
    if (sample.culture) return sample.culture;
    if (sample.object_id) return sample.object_id;
  }
  return 'Unknown';
}