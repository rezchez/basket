// Role definitions for the basketball management app
export const Roles = {
  // Highest privilege – Senior Manager (رضا چگینی)
  MANAGER_SUPER: 'مدیر ارشد',
  // Board Chair
  BOARD_CHAIR: 'رییس هیئت',
  // Committee Chair
  COMMITTEE_CHAIR: 'رییس کمیته',
  // Team Manager (Dynamic team name)
  TEAM_MANAGER: 'مدیر تیم',
  // Registered Athlete (Default for all regular users)
  ATHLETE: 'ورزشکار',
} as const;

export type RoleKey = keyof typeof Roles;
export type RoleValue = typeof Roles[RoleKey];

export const ALL_ROLES: RoleValue[] = [
  Roles.MANAGER_SUPER,
  Roles.BOARD_CHAIR,
  Roles.COMMITTEE_CHAIR,
  Roles.TEAM_MANAGER,
  Roles.ATHLETE,
];

/**
 * Returns formatted role display label.
 * For TEAM_MANAGER, if a team name is provided, formats as: مدیر تیم (نام تیم)
 */
export function formatRoleLabel(role?: string | null, teamName?: string | null): string {
  const currentRole = role || Roles.ATHLETE;
  if (currentRole === Roles.TEAM_MANAGER) {
    return teamName ? `مدیر تیم (${teamName})` : 'مدیر تیم';
  }
  return currentRole;
}

/**
 * Role badge styling based on role type
 */
export function getRoleBadgeStyle(role?: string | null): {
  bg: string;
  text: string;
  border: string;
  badgeClass: string;
} {
  switch (role) {
    case Roles.MANAGER_SUPER:
      return {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        border: 'border-purple-300',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-500/20',
      };
    case Roles.BOARD_CHAIR:
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-300',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/20',
      };
    case Roles.COMMITTEE_CHAIR:
      return {
        bg: 'bg-teal-100',
        text: 'text-teal-800',
        border: 'border-teal-300',
        badgeClass: 'bg-teal-50 text-teal-700 border-teal-200 ring-1 ring-teal-500/20',
      };
    case Roles.TEAM_MANAGER:
      return {
        bg: 'bg-amber-100',
        text: 'text-amber-800',
        border: 'border-amber-300',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/20',
      };
    case Roles.ATHLETE:
    default:
      return {
        bg: 'bg-emerald-100',
        text: 'text-emerald-800',
        border: 'border-emerald-300',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20',
      };
  }
}

/**
 * Role hierarchy for privilege comparison
 */
export const RoleHierarchy: RoleValue[] = [
  Roles.ATHLETE,
  Roles.TEAM_MANAGER,
  Roles.COMMITTEE_CHAIR,
  Roles.BOARD_CHAIR,
  Roles.MANAGER_SUPER,
];

/**
 * Returns true if the user is senior manager (مدیر ارشد)
 */
export function isSeniorManager(user: any): boolean {
  if (!user) return false;
  return (
    user.role === Roles.MANAGER_SUPER ||
    (user.first_name_fa === 'رضا' && user.last_name_fa === 'چگینی') ||
    user.email === 'rezach91@gmail.com'
  );
}

/**
 * Returns true if `userRole` has at least the privileges of `requiredRole`.
 */
export function hasAtLeastRole(userRole: string, requiredRole: RoleValue): boolean {
  const userIndex = RoleHierarchy.indexOf(userRole as RoleValue);
  const requiredIndex = RoleHierarchy.indexOf(requiredRole);
  return userIndex >= requiredIndex && userIndex !== -1;
}
