import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a FORGE token amount (decimal 18) to human-readable string with up to 2 decimal places */
export function formatForge(value: number | bigint | string): string {
  const num = typeof value === "bigint"
    ? Number(value) / 1e18
    : Number(value);
  if (isNaN(num)) return "0";
  // If already a small human-readable number (< 1e15), don't divide
  // Values from on-chain are typically > 1e15 (wei scale)
  const humanValue = num > 1e15 ? num / 1e18 : num;
  return humanValue.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
