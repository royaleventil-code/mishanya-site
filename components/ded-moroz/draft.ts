import { counts, newChild, newDraft, normalizeSelectedCity, readSecondVideoReference, type Child, type Draft } from "@/shared/ded-moroz";

export const draftKey = "mishanya-ded-moroz-v1";
export type Photo = { blob: Blob; width: number; height: number };
export type Photos = Record<string, Photo>;
export type Saved = { data: Draft; step: number; key: string; legacy: boolean; repeatKey?: string };
export function loadText(): Saved {
  const fresh = { data: newDraft(), step: 0, key: crypto.randomUUID(), legacy: false };
  try {
    const saved = JSON.parse(localStorage.getItem(draftKey) || "null");
    if (!saved || !Array.isArray(saved.data?.children) || saved.savedAt < Date.now() - 60 * 86400000) return fresh;
    const old = saved.data;
    const children: Child[] = old.children.slice(0, 5).map((c: Partial<Child>) => ({ ...newChild(), ...c }));
    const legacy = saved.version !== 2;
    const data: Draft = {
      ...fresh.data, children, children_count: counts.includes(children.length) ? children.length : 0,
      city: normalizeSelectedCity(old.city || ""), otherCity: old.otherCity || "", shared_fact: old.shared_fact || "",
      parentName: old.parentName || "", whatsapp: old.whatsapp || "", email: old.email || "", consent: old.consent === true,
    };
    const repeatKey = legacy ? undefined : readSecondVideoReference(saved.repeatKey);
    return { data, step: !legacy && [0,1,2,3,4].includes(saved.step) ? saved.step : 0, key: saved.key || fresh.key, legacy, repeatKey };
  } catch { return fresh; }
}
function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(draftKey, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("photos");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function keysFor(id: string) { return IDBKeyRange.bound(id + "/", id + "/\uffff"); }
export async function storedPhotos(id: string): Promise<Photos> {
  const database = await db();
  try {
    return await new Promise<Photos>((resolve, reject) => {
      const photos: Photos = {};
      const cursor = database.transaction("photos").objectStore("photos").openCursor(keysFor(id));
      cursor.onerror = () => reject(cursor.error);
      cursor.onsuccess = () => {
        const row = cursor.result;
        if (!row) { resolve(photos); return; }
        photos[String(row.key).slice(id.length + 1)] = row.value;
        row.continue();
      };
    });
  } finally { database.close(); }
}
export async function persistPhoto(id: string, file?: string, photo?: Photo) {
  const database = await db();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction("photos", "readwrite");
      const store = tx.objectStore("photos");
      if (!file) store.delete(keysFor(id));
      else if (photo) store.put(photo, id + "/" + file);
      else store.delete(id + "/" + file);
      tx.oncomplete = () => resolve();
      tx.onabort = tx.onerror = () => reject(tx.error);
    });
  } finally { database.close(); }
}
