import scheduleData from "../../schedule.json";

export interface Match {
  id: number;
  group: string;
  matchday: number;
  home: string;
  away: string;
  date: string; // YYYY-MM-DD
  time_pt: string; // e.g. "12:00 PM"
  venue: string;
}

const matches: Match[] = scheduleData as Match[];

/** All 72 group stage matches */
export function getAllMatches(): Match[] {
  return matches;
}

/** Matches for a specific group (A-L) */
export function getMatchesByGroup(group: string): Match[] {
  return matches.filter((m) => m.group === group);
}

/** Matches for a specific matchday (1-3) */
export function getMatchesByMatchday(matchday: number): Match[] {
  return matches.filter((m) => m.matchday === matchday);
}

/**
 * Upcoming matches: next 72 hours from now.
 * Returns matches whose kickoff time hasn't passed yet, sorted by date/time ascending.
 */
export function getUpcomingMatches(): Match[] {
  const now = new Date();
  return matches
    .filter((m) => {
      const kickoff = parseKickoff(m.date, m.time_pt);
      return kickoff > now;
    })
    .sort((a, b) => {
      const da = parseKickoff(a.date, a.time_pt);
      const db = parseKickoff(b.date, b.time_pt);
      return da.getTime() - db.getTime();
    });
}

/** All unique groups */
export function getAllGroups(): string[] {
  const groups = Array.from(new Set(matches.map((m) => m.group)));
  groups.sort();
  return groups;
}

/** 
 * Parse a date + PT time string into a Date object (Pacific Time).
 * The schedule times are in Pacific Time; we parse them as-is since
 * the schedule is a static JSON — DST is already baked in.
 */
export function parseKickoff(dateStr: string, timeStr: string): Date {
  // dateStr: "2026-06-11", timeStr: "12:00 PM"
  // Manual parse: date + time → assume PDT (UTC-7)
  const [year, month, day] = dateStr.split("-").map(Number);
  const [timePart, period] = timeStr.split(" ");
  const parts = timePart.split(":").map(Number);
  let hours = parts[0];
  const minutes = parts[1];
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  // Build as UTC then subtract 7 hours (PDT)
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours + 7, minutes, 0));
  return utcDate;
}

/** Check if a match is locked (5 min before kickoff) */
export function isMatchLocked(dateStr: string, timeStr: string): boolean {
  const kickoff = parseKickoff(dateStr, timeStr);
  const lockTime = new Date(kickoff.getTime() - 5 * 60 * 1000);
  return new Date() >= lockTime;
}

/** Get time until kickoff in ms */
export function getTimeUntilKickoff(dateStr: string, timeStr: string): number {
  const kickoff = parseKickoff(dateStr, timeStr);
  return kickoff.getTime() - Date.now();
}

/** Format remaining time as "2d 5h", "2h 15m", "45m", or "Started" */
export function formatCountdown(dateStr: string, timeStr: string): string {
  const remaining = getTimeUntilKickoff(dateStr, timeStr);
  if (remaining <= 0) return "Started";

  const totalMinutes = Math.floor(remaining / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/** Format kickoff for display: "Thursday, Jun 11 · 12:00 PM PT" */
export function formatKickoff(dateStr: string, timeStr: string): string {
  const [, month, day] = dateStr.split("-").map(Number);
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const [year] = dateStr.split("-").map(Number);
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  const dayName = dayNames[dateObj.getUTCDay()];
  return `${dayName}, ${monthNames[month - 1]} ${day} · ${timeStr} PT`;
}
