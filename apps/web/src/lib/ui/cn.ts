import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility for merging class names with Tailwind conflict resolution.
 * Combines clsx for conditional classes with tailwind-merge for deduplication.
 *
 * @example
 * cn("px-4 py-2", "px-6") // Returns "py-2 px-6" (px-6 wins)
 * cn("text-red-500", condition && "text-blue-500") // Conditional classes
 * cn(baseClasses, variantClasses, className) // CVA pattern
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
