import { parsePhoneNumberFromString } from "libphonenumber-js/max";

export type RsvpLocale = "ru" | "he";
export type RsvpStatus = "yes" | "no" | "maybe";

export type RsvpEventInput = {
  locale: RsvpLocale;
  organizerName: string;
  organizerPhone: string;
  childName: string;
  childAge: number;
  startsAt: string;
  city: string;
  address: string;
  message: string;
  contactEnabled: boolean;
};

export type PublicRsvpEvent = RsvpEventInput & {
  slug: string;
  contactPhone?: string;
};

export type RsvpResponseInput = {
  eventSlug: string;
  respondentName: string;
  respondentKey: string;
  status: RsvpStatus;
  adults: number;
  children: number;
  comment: string;
};

export type RsvpResponse = Omit<RsvpResponseInput, "eventSlug" | "respondentKey"> & {
  id: string;
  updatedAt: string;
};

export type ManagedRsvpEvent = {
  event: PublicRsvpEvent;
  responses: RsvpResponse[];
};

export type CreatedRsvpEvent = {
  event: PublicRsvpEvent;
  publicUrl: string;
  manageUrl: string;
  manageToken: string;
};

type LocalEventRecord = {
  id: string;
  slug: string;
  manageToken: string;
  createdAt: string;
  data: RsvpEventInput;
};

type LocalResponseRecord = RsvpResponse & {
  eventId: string;
  respondentKey: string;
};

type LocalRsvpStore = {
  events: LocalEventRecord[];
  responses: LocalResponseRecord[];
};

const STORAGE_KEY = "mishanya-rsvp:v1";
const RESPONDENT_KEY_PREFIX = "mishanya-rsvp:respondent:v1";
const LOCAL_PREVIEW_MANAGE_TOKEN = "local_preview_mishanya_rsvp_2026_0001";
const LOCAL_PREVIEW_SLUG = "localpreview1";

function isLocalMode() {
  if (typeof window === "undefined") return false;
  return ["localhost", "127.0.0.1"].includes(window.location.hostname);
}

function randomToken(bytes = 18) {
  const values = crypto.getRandomValues(new Uint8Array(bytes));
  let binary = "";
  for (const value of values) binary += String.fromCharCode(value);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function getRsvpRespondentKey(eventSlug: string) {
  const storageKey = `${RESPONDENT_KEY_PREFIX}:${eventSlug}`;
  try {
    const existing = window.localStorage.getItem(storageKey) || "";
    if (/^[A-Za-z0-9_-]{20,128}$/.test(existing)) return existing;
    const created = randomToken(18);
    window.localStorage.setItem(storageKey, created);
    return created;
  } catch {
    return randomToken(18);
  }
}

function loadStore(): LocalRsvpStore {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { events: [], responses: [] };
    const parsed = JSON.parse(raw) as Partial<LocalRsvpStore>;
    return {
      events: Array.isArray(parsed.events) ? parsed.events : [],
      responses: Array.isArray(parsed.responses) ? parsed.responses : [],
    };
  } catch {
    return { events: [], responses: [] };
  }
}

function saveStore(store: LocalRsvpStore) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function ensureLocalPreviewEvent(store: LocalRsvpStore, manageToken: string) {
  if (manageToken !== LOCAL_PREVIEW_MANAGE_TOKEN) return;
  if (store.events.some((event) => event.manageToken === manageToken)) return;

  const startsAt = new Date();
  startsAt.setDate(startsAt.getDate() + 30);
  startsAt.setHours(17, 0, 0, 0);
  store.events.push({
    id: "local-preview-event",
    slug: LOCAL_PREVIEW_SLUG,
    manageToken,
    createdAt: new Date().toISOString(),
    data: {
      locale: "ru",
      organizerName: "Анна",
      organizerPhone: "+972541234567",
      childName: "Роберт",
      childAge: 4,
      startsAt: startsAt.toISOString(),
      city: "Petah Tikva",
      address: "Community Garden, Petah Tikva",
      message: "Будем рады разделить этот день вместе!",
      contactEnabled: true,
    },
  });
  saveStore(store);
}

function publicEvent(record: LocalEventRecord): PublicRsvpEvent {
  return {
    ...record.data,
    slug: record.slug,
    contactPhone: record.data.contactEnabled ? record.data.organizerPhone : undefined,
  };
}

function normalizedPhone(phone: string) {
  const parsed = parsePhoneNumberFromString(phone, "IL");
  if (!parsed?.isValid()) throw new Error("invalid_phone");
  return String(parsed.number);
}

async function responseJson<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "request_failed");
  return data;
}

export async function createRsvpEvent(input: RsvpEventInput, turnstileToken = ""): Promise<CreatedRsvpEvent> {
  const normalizedInput = { ...input, organizerPhone: normalizedPhone(input.organizerPhone) };
  if (isLocalMode()) {
    const store = loadStore();
    const slug = randomToken(9);
    const manageToken = randomToken(32);
    const record: LocalEventRecord = {
      id: crypto.randomUUID(),
      slug,
      manageToken,
      createdAt: new Date().toISOString(),
      data: normalizedInput,
    };
    store.events.push(record);
    saveStore(store);
    const origin = window.location.origin;
    return {
      event: publicEvent(record),
      manageToken,
      publicUrl: `${origin}/invite?event=${encodeURIComponent(slug)}`,
      manageUrl: `${origin}/my-event#token=${encodeURIComponent(manageToken)}`,
    };
  }

  const result = await responseJson<{ slug: string; manageToken: string }>(
    await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", ...normalizedInput, turnstileToken }),
    }),
  );
  const origin = window.location.origin;
  return {
    event: { ...normalizedInput, slug: result.slug, contactPhone: normalizedInput.contactEnabled ? normalizedInput.organizerPhone : undefined },
    manageToken: result.manageToken,
    publicUrl: `${origin}/invite?event=${encodeURIComponent(result.slug)}`,
    manageUrl: `${origin}/my-event#token=${encodeURIComponent(result.manageToken)}`,
  };
}

export async function getPublicRsvpEvent(slug: string): Promise<PublicRsvpEvent> {
  if (isLocalMode()) {
    const record = loadStore().events.find((event) => event.slug === slug);
    if (!record) throw new Error("event_not_found");
    return publicEvent(record);
  }
  return responseJson<PublicRsvpEvent>(
    await fetch(`/api/rsvp?event=${encodeURIComponent(slug)}`, { cache: "no-store" }),
  );
}

export async function submitRsvpResponse(input: RsvpResponseInput, turnstileToken = ""): Promise<void> {
  if (input.status === "yes" && input.adults + input.children < 1) throw new Error("invalid_headcount");
  const normalizedInput = {
    ...input,
    adults: input.status === "yes" ? input.adults : 0,
    children: input.status === "yes" ? input.children : 0,
  };
  if (isLocalMode()) {
    const store = loadStore();
    const event = store.events.find((item) => item.slug === normalizedInput.eventSlug);
    if (!event) throw new Error("event_not_found");
    const existing = store.responses.find(
      (item) => item.eventId === event.id && item.respondentKey === normalizedInput.respondentKey,
    );
    const updatedAt = new Date().toISOString();
    if (existing) {
      Object.assign(existing, normalizedInput, { updatedAt });
    } else {
      store.responses.push({
        id: crypto.randomUUID(),
        eventId: event.id,
        ...normalizedInput,
        updatedAt,
      });
    }
    saveStore(store);
    return;
  }

  await responseJson(
    await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "respond", ...normalizedInput, turnstileToken }),
    }),
  );
}

export async function getManagedRsvpEvent(token: string): Promise<ManagedRsvpEvent> {
  if (isLocalMode()) {
    const store = loadStore();
    ensureLocalPreviewEvent(store, token);
    const record = store.events.find((event) => event.manageToken === token);
    if (!record) throw new Error("event_not_found");
    return {
      event: publicEvent(record),
      responses: store.responses
        .filter((response) => response.eventId === record.id)
        .map((response) => ({
          id: response.id,
          respondentName: response.respondentName,
          status: response.status,
          adults: response.adults,
          children: response.children,
          comment: response.comment,
          updatedAt: response.updatedAt,
        }))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    };
  }

  return responseJson<ManagedRsvpEvent>(
    await fetch("/api/rsvp?manage=1", {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}
