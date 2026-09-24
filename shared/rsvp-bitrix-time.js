export const BITRIX_RSVP_TIME_FIELD = "UF_CRM_1645710833434";
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const israelClock = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jerusalem",
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});

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
  return { instant: wall - offset * MINUTE, offset };
}

function israelWallTime(instant) {
  const parts = Object.fromEntries(israelClock.formatToParts(instant).map(({ type, value }) => [type, value]));
  return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour), Number(parts.minute), Number(parts.second), new Date(instant).getUTCMilliseconds());
}

/**
 * USE_TIMEZONE=N fields represent the wall clock shown in the deal, not an
 * appointment instant. Bitrix still serializes them with a user's UTC offset.
 * Recover the server wall clock first, then interpret it on the event's date
 * in Israel. server.time supplies the portal's storage offset; never use the
 * browser's/current Israel offset or add one hour to every imported event.
 */
export function normalizeBitrixRsvpStartsAt(value, context) {
  const parsed = parseTimestamp(value);
  if (!parsed) return { error: "invalid_date_timezone" };
  if (typeof context?.useTimeZone !== "boolean") return { error: "missing_event_time_context" };
  if (context.useTimeZone) return { value: new Date(parsed.instant).toISOString() };

  const server = parseTimestamp(context.serverTime);
  if (!server) return { error: "invalid_bitrix_server_time" };
  const wall = parsed.instant + server.offset * MINUTE;

  // Check both sides of a clock transition. A nonexistent/repeated local hour
  // needs an explicit decision, rather than silently choosing another time.
  const offsets = new Set([-DAY, 0, DAY].map((delta) => {
    const probe = wall + delta;
    return israelWallTime(probe) - probe;
  }));
  const matches = [...offsets].map((offset) => wall - offset)
    .filter((instant) => israelWallTime(instant) === wall);
  if (!matches.length) return { error: "nonexistent_event_time" };
  if (matches.length > 1) return { error: "ambiguous_event_time" };
  return { value: new Date(matches[0]).toISOString() };
}
