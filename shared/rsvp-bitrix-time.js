export const BITRIX_RSVP_TIME_FIELD = "UF_CRM_1645710833434";
const MINUTE = 60_000;

function parseTimestamp(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})$/i.exec(String(value || "").trim());
  if (!match) return null;
  const [, year, month, day, hour, minute, second = "0", fraction = "", zone] = match;
  const offset = zone.toUpperCase() === "Z"
    ? 0
    : (zone[0] === "-" ? -1 : 1) * (Number(zone.slice(1, 3)) * 60 + Number(zone.slice(4)));
  if (Math.abs(offset) > 14 * 60 || (zone.length > 1 && Number(zone.slice(4)) > 59)) return null;
  const wall = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second), Number(fraction.padEnd(3, "0")));
  const date = new Date(wall);
  if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() + 1 !== Number(month)
    || date.getUTCDate() !== Number(day) || date.getUTCHours() !== Number(hour)
    || date.getUTCMinutes() !== Number(minute) || date.getUTCSeconds() !== Number(second)) return null;
  return { instant: wall - offset * MINUTE };
}

/**
 * The offset in the fresh REST timestamp already identifies the event instant.
 * Preserve it, just as automation/deal_event_time.py does for Calendar. Field
 * USE_TIMEZONE and today's server.time offset must not reinterpret that instant:
 * doing so moves winter invitations by an hour. The invitation formatter alone
 * converts this UTC value to Asia/Jerusalem on the event's date.
 */
export function normalizeBitrixRsvpStartsAt(value) {
  const parsed = parseTimestamp(value);
  if (!parsed) return { error: "invalid_date_timezone" };
  return { value: new Date(parsed.instant).toISOString() };
}
