// Business logic for attendance calculations and formatting

export type AttendanceStatus = "excellent" | "good" | "needs-attention";

export interface AttendanceBadgeInfo {
  variant: "success" | "warning" | "error";
  label: string;
  status: AttendanceStatus;
}

/**
 * Determines the badge variant and label based on attendance rate
 */
export function getAttendanceBadge(rate: number): AttendanceBadgeInfo {
  if (rate >= 90) {
    return { variant: "success", label: "Excellent", status: "excellent" };
  }
  if (rate >= 75) {
    return { variant: "warning", label: "Good", status: "good" };
  }
  return {
    variant: "error",
    label: "Needs Attention",
    status: "needs-attention",
  };
}

/**
 * Calculates attendance rate as a percentage
 */
export function calculateAttendanceRate(
  present: number,
  total: number,
): number {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
}

/**
 * Formats attendance as a fraction string (e.g., "12/15")
 */
export function formatAttendance(present: number, total: number): string {
  return `${present}/${total}`;
}

/**
 * Determines if a session is upcoming based on status
 */
export function isUpcoming(status: string): boolean {
  return status === "upcoming";
}
