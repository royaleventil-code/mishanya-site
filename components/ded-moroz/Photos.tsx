"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, ImagePlus, Replace } from "lucide-react";
import { cropFrame, photoLimit, preparedPhotoLimit } from "@/shared/ded-moroz";
import { copy } from "./copy";
import type { Photo } from "./draft";

export async function apiIssue(response: Response) {
  const json = await response.json().catch(() => null);
  return json?.error || "Сервис заказов временно недоступен. Повторите попытку.";
}
export function isLocalPreview() {
  return ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
}

async function withImage<T>(blob: Blob, read: (img: HTMLImageElement) => T | Promise<T>): Promise<T> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return await read(img);
  } finally { URL.revokeObjectURL(url); }
}

async function readPhoto(file: File): Promise<Photo> {
  if (file.size > photoLimit) throw new Error("Размер фото больше 15 МБ.");
  let blob: Blob = file;
  if (isLocalPreview()) {
    const reply = await fetch("/api/ded-moroz/decode", { method: "POST", body: file });
    if (!reply.ok) throw new Error(await apiIssue(reply));
    blob = await reply.blob();
  }
  return withImage(blob, img => ({ blob, width: img.naturalWidth, height: img.naturalHeight, position: 50 }))
    .catch(() => { throw new Error("Браузер не смог открыть этот снимок. Выберите версию в JPG или PNG."); });
}

export async function prepareOrderPhoto(photo: Photo, slot: number): Promise<Blob> {
  return withImage(photo.blob, async img => {
    const bounds = cropFrame(img.naturalWidth, img.naturalHeight, slot, photo.position);
    const scale = Math.min(1, 2560 / Math.max(bounds.width, bounds.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bounds.width * scale));
    canvas.height = Math.max(1, Math.round(bounds.height * scale));
    const draw = canvas.getContext("2d");
    if (!draw) throw new Error("Не удалось подготовить фотографию.");
    draw.fillStyle = "#fff";
    draw.fillRect(0, 0, canvas.width, canvas.height);
    draw.drawImage(img, bounds.left, bounds.top, bounds.width, bounds.height, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.9, 0.78, 0.66]) {
      const jpeg = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
      if (jpeg && jpeg.size <= preparedPhotoLimit) return jpeg;
    }
    throw new Error("Не удалось подготовить фотографию. Попробуйте другой снимок.");
  });
}
export function PhotoSlot({ index, value, error, onChange, onBusy }: {
  index: number; value: Photo | null; error?: string;
  onChange: (p: Photo) => void; onBusy: (delta: number) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const preview = useRef<HTMLImageElement>(null);
  const [issue, setIssue] = useState(""), [busy, setBusy] = useState(false);
  const blob = value?.blob;
  useEffect(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    if (preview.current) preview.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  const description = copy.photos[index];
  const frame = value && cropFrame(value.width, value.height, index, value.position);
  const select = async (file?: File) => {
    if (!file) return;
    setBusy(true); onBusy(1); setIssue("");
    try { onChange(await readPhoto(file)); }
    catch (e) { setIssue(e instanceof Error ? e.message : "Не удалось открыть фото."); }
    finally { setBusy(false); onBusy(-1); if (input.current) input.current.value = ""; }
  };
  return <div className="dm-photo-slot" id={`photo-${index}`} data-issue={!!(error || issue)}>
    <div className="dm-slot-heading"><span><Camera size={17} />Фото {index + 1}</span>{value && <Check size={19} aria-label="Добавлено" />}</div>
    <h4>{description.name}</h4><p>{description.hint}</p>
    {value && frame && <div className="dm-crop-space"><div className="dm-crop" style={{ aspectRatio: frame.ratio }}>
      {/* Blob URLs hold only the family's locally selected files. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={preview} alt={description.name} style={{ objectPosition: `${value.position}% ${value.position}%` }} />
    </div></div>}
    {value && frame?.cropped && <label className="dm-range">Положение в кадре
      <input type="range" min="0" max="100" value={value.position} onChange={e => onChange({ ...value, position: Number(e.target.value) })} />
    </label>}
    {value && Math.min(value.width, value.height) < 1200 && <span className="dm-small-note">Фото маленькое, в видео может быть размыто.</span>}
    <input type="file" ref={input} aria-label={description.name} accept=".jpg,.jpeg,.png,.heic,.heif,image/jpeg,image/png,image/heic,image/heif" hidden onChange={e => void select(e.target.files?.[0])} />
    <button type="button" id={`photo-button-${index}`} disabled={busy} className="dm-upload" onClick={() => input.current?.click()}>
      {value ? <Replace size={17} /> : <ImagePlus size={19} />}{busy ? "Открываем фото…" : value ? "Заменить" : "Выбрать фото"}
    </button>
    {(issue || error) && <span role="alert" className="dm-error">{issue || error}</span>}
  </div>;
}
