"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, ImagePlus, Replace } from "lucide-react";
import { photoIssue, photoLimit, preparedPhotoLimit, type PhotoSlotInfo } from "@/shared/ded-moroz";
import type { Photo } from "./draft";

export async function apiIssue(response: Response) {
  const json = await response.json().catch(() => null);
  return json?.error || "Сервис заказов временно недоступен. Попробуйте ещё раз.";
}
export function isLocalPreview() {
  return ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
}
async function preparePhoto(file: File, slot: PhotoSlotInfo): Promise<Photo> {
  if (!file.size || file.size > photoLimit) throw new Error("Выберите фото размером до 15 МБ.");
  let url = URL.createObjectURL(file);
  const image = new Image();
  try {
    image.src = url;
    try { await image.decode(); }
    catch {
      if (!isLocalPreview()) throw new Error("Браузер не смог открыть снимок. Выберите JPG или PNG.");
      const res = await fetch("/api/ded-moroz/decode", { method: "POST", body: file });
      if (!res.ok) throw new Error(await apiIssue(res));
      URL.revokeObjectURL(url);
      url = URL.createObjectURL(await res.blob());
      image.src = url;
      await image.decode();
    }
    const { naturalWidth: w, naturalHeight: h } = image;
    const issue = photoIssue(w, h, slot.kind);
    if (issue) throw new Error(issue);
    const scale = Math.min(1, Math.max(2560 / Math.max(w, h), 800 / Math.min(w, h)));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Не удалось подготовить фото.");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.9, 0.8, 0.67, 0.55]) {
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob && blob.size <= preparedPhotoLimit) return { blob, width: canvas.width, height: canvas.height };
    }
    throw new Error("Не удалось подготовить фото. Попробуйте другой снимок.");
  } finally { URL.revokeObjectURL(url); }
}
export function PhotoSlot({ slot, value, error, onChange, onBusy }: {
  slot: PhotoSlotInfo; value?: Photo; error?: string; onChange: (p: Photo) => void; onBusy: (delta: number) => void;
}) {
  const input = useRef<HTMLInputElement>(null), preview = useRef<HTMLImageElement>(null);
  const [issue, setIssue] = useState(""), [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!value) return;
    const image = URL.createObjectURL(value.blob);
    if (preview.current) preview.current.src = image;
    return () => URL.revokeObjectURL(image);
  }, [value]);
  async function select(file?: File) {
    if (!file) return;
    setBusy(true); onBusy(1); setIssue("");
    try { onChange(await preparePhoto(file, slot)); }
    catch (e) { setIssue(e instanceof Error ? e.message : "Не удалось открыть снимок."); }
    finally { setBusy(false); onBusy(-1); if (input.current) input.current.value = ""; }
  }
  return <div className="dm-photo-slot" data-kind={slot.kind} data-issue={!!(issue || error)}>
    <h3 className="dm-slot-heading"><Camera size={17} aria-hidden />{slot.label} {value && <Check size={18} aria-label="Добавлено" />}</h3>
    <p>{slot.hint}</p>
    {value && <div className="dm-crop-space"><div className="dm-crop" style={{ aspectRatio: value.width / value.height, maxHeight: 200 }}>
      {/* The preview is a browser-local object URL. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={preview} alt={slot.label} style={{ objectFit: "contain" }} />
    </div></div>}
    <input type="file" ref={input} aria-label={slot.label} accept=".jpg,.jpeg,.png,.heic,.heif,image/jpeg,image/png,image/heic,image/heif" hidden onChange={e => void select(e.target.files?.[0])} />
    <button type="button" id={"photo-" + slot.file} className="dm-upload" disabled={busy} aria-label={(value ? "Заменить фото · " : "Выбрать фото · ") + slot.label} onClick={() => input.current?.click()}>
      {value ? <Replace size={16} aria-hidden /> : <ImagePlus size={16} aria-hidden />}{busy ? "Готовим фото…" : value ? "Заменить фото" : "Выбрать фото"}
    </button>
    {(issue || error) && <span role="alert" className="dm-error">{issue || error}</span>}
  </div>;
}
