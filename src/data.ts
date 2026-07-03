// Legacy data file — no longer used for active data.
// All data is now fetched from Supabase.
// Retained only for the getDriverColor utility used by orphan DriverPickerModal.

export const INITIAL_DRIVERS: string[] = [];

// Aesthetic distinct colors for each driver (fallback hash-based)
export function getDriverColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "#3ea0ff", "#b58cff", "#ff7fac", "#4ade80", "#f59e0b",
    "#2dd4bf", "#f87171", "#c084fc", "#fbbf24", "#60a5fa",
  ];
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
