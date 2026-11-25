import { newChild, newDraft, type Draft } from "@/shared/ded-moroz";

export const draftKey = "mishanya-ded-moroz-v1";
export type Photo = { blob: Blob; width: number; height: number; position: number };
export type Saved = { data: Draft; step: number; key: string; restorePhotos: boolean };
export function loadText(): Saved {
  const fresh = { data: newDraft(), step: 0, key: crypto.randomUUID(), restorePhotos: false };
  try {
    const value = JSON.parse(localStorage.getItem(draftKey) || "null");
    if (!Array.isArray(value?.data?.children) || !value.data.children.length || value.savedAt < Date.now() - 60 * 86400000) return fresh;
    const data = { ...fresh.data, ...value.data, children: value.data.children.map((c: object) => ({ ...newChild(), ...c })) };
    return { data, key: value.key || fresh.key, step: [0, 1, 2].includes(value.step) ? value.step : 0, restorePhotos: true };
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
export async function storedPhotos(): Promise<(Photo | null)[]> {
  const database = await db();
  try {
    const store = database.transaction("photos").objectStore("photos");
    return await Promise.all([0, 1, 2, 3].map(index => new Promise<Photo | null>((resolve, reject) => {
      const req = store.get(index); req.onsuccess = () => resolve(req.result || null); req.onerror = () => reject(req.error);
    })));
  } finally { database.close(); }
}
export async function persistPhoto(index: number | null, value?: Photo) {
  const database = await db();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction("photos", "readwrite"), store = tx.objectStore("photos");
      if (index === null) store.clear(); else if (value) store.put(value, index);
      tx.oncomplete = () => resolve(); tx.onabort = tx.onerror = () => reject(tx.error);
    });
  } finally { database.close(); }
}
