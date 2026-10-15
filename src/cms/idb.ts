import { useEffect, useState } from "react";

/* ───────────── Tiny IndexedDB wrapper (content drafts + uploaded images) ───────────── */

const DB_NAME = "cayo-coco-cms";
let dbPromise: Promise<IDBDatabase> | null = null;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB unavailable"));
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
        if (!db.objectStoreNames.contains("media")) db.createObjectStore("media", { keyPath: "id" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function run<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = fn(db.transaction(store, mode).objectStore(store));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
      }),
  );
}

export const kv = {
  get: <T,>(key: string) => run<T | undefined>("kv", "readonly", (s) => s.get(key)).catch(() => undefined),
  set: (key: string, value: unknown) => run<IDBValidKey>("kv", "readwrite", (s) => s.put(value, key)),
  del: (key: string) => run<undefined>("kv", "readwrite", (s) => s.delete(key)),
};

export type MediaRecord = { id: string; name: string; type: string; size: number; w: number; h: number; created: number; blob: Blob };

export const mediaDb = {
  all: () => run<MediaRecord[]>("media", "readonly", (s) => s.getAll()).catch(() => [] as MediaRecord[]),
  get: (id: string) => run<MediaRecord | undefined>("media", "readonly", (s) => s.get(id)).catch(() => undefined),
  put: (rec: MediaRecord) => run<IDBValidKey>("media", "readwrite", (s) => s.put(rec)),
  del: (id: string) => run<undefined>("media", "readwrite", (s) => s.delete(id)),
};

/* ───────────── Media library ───────────── */

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

const urlCache = new Map<string, string>();
const listeners = new Set<() => void>();
export function onMediaChange(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
const emit = () => listeners.forEach((fn) => fn());

export async function idbUrl(id: string) {
  const cached = urlCache.get(id);
  if (cached) return cached;
  const rec = await mediaDb.get(id);
  if (!rec) return undefined;
  const url = URL.createObjectURL(rec.blob);
  urlCache.set(id, url);
  return url;
}

/** Resolves "idb:<id>" to an object URL; other sources pass through. */
export function useImageSrc(src?: string) {
  const isIdb = !!src && src.startsWith("idb:");
  const [url, setUrl] = useState<string | undefined>(() => (isIdb ? urlCache.get(src!.slice(4)) : src));
  useEffect(() => {
    if (!src || !src.startsWith("idb:")) return;
    let live = true;
    const id = src.slice(4);
    const load = () => idbUrl(id).then((u) => live && setUrl(u));
    load();
    const off = onMediaChange(load);
    return () => {
      live = false;
      off();
    };
  }, [src]);
  return isIdb ? url : src;
}

export function useMediaList() {
  const [items, setItems] = useState<MediaRecord[]>([]);
  useEffect(() => {
    let live = true;
    const load = () => mediaDb.all().then((all) => live && setItems(all.sort((a, b) => b.created - a.created)));
    load();
    const off = onMediaChange(load);
    return () => {
      live = false;
      off();
    };
  }, []);
  return items;
}

const MAX_EDGE = 2400;

async function decode(file: Blob): Promise<{ img: CanvasImageSource; w: number; h: number; close?: () => void }> {
  if ("createImageBitmap" in window) {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { img: bmp, w: bmp.width, h: bmp.height, close: () => bmp.close() };
    } catch {
      /* fall back to <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const el = new Image();
    el.src = url;
    await el.decode();
    return { img: el, w: el.naturalWidth, h: el.naturalHeight };
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

const toBlob = (c: HTMLCanvasElement, type: string, q: number) => new Promise<Blob | null>((r) => c.toBlob(r, type, q));

/** Resizes (max 2400px) and compresses photos to WebP before storing them on this device. */
export async function processImage(file: File): Promise<MediaRecord> {
  const base = { id: uid(), name: file.name.replace(/\.[^.]+$/, "") || "image", created: Date.now() };
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image`);
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    const d = await decode(file).catch(() => ({ w: 0, h: 0, img: null as never }));
    return { ...base, type: file.type, size: file.size, w: d.w, h: d.h, blob: file };
  }
  const d = await decode(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(d.w, d.h));
  const w = Math.max(1, Math.round(d.w * scale));
  const h = Math.max(1, Math.round(d.h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(d.img, 0, 0, w, h);
  d.close?.();
  let blob = await toBlob(canvas, "image/webp", 0.84);
  if (!blob || blob.type !== "image/webp") blob = file.type === "image/png" ? file : await toBlob(canvas, "image/jpeg", 0.86);
  if (!blob) throw new Error(`Could not process ${file.name}`);
  if (scale === 1 && file.size < blob.size) blob = file;
  return { ...base, type: blob.type || file.type, size: blob.size, w, h, blob };
}

export async function uploadFiles(files: File[], onProgress?: (done: number, total: number) => void) {
  const out: MediaRecord[] = [];
  const errors: string[] = [];
  for (let i = 0; i < files.length; i++) {
    try {
      const rec = await processImage(files[i]);
      await mediaDb.put(rec);
      out.push(rec);
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
    onProgress?.(i + 1, files.length);
  }
  emit();
  if (!out.length && errors.length) throw new Error(errors.join(", "));
  return out;
}

export async function renameMedia(id: string, name: string) {
  const rec = await mediaDb.get(id);
  if (!rec) return;
  await mediaDb.put({ ...rec, name });
  emit();
}

export async function deleteMedia(id: string) {
  await mediaDb.del(id);
  const url = urlCache.get(id);
  if (url) URL.revokeObjectURL(url);
  urlCache.delete(id);
  emit();
}

export const blobToDataUrl = (b: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(b);
  });

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export const formatBytes = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
