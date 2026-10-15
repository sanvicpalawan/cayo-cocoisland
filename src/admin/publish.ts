import { blobToDataUrl, mediaDb, onMediaChange, uid } from "@/cms/idb";
import { migrate } from "@/cms/store";
import type { SiteContent } from "@/cms/types";

/** Self-contained export: uploaded images are embedded so the file works on any host. */
export async function exportContent(content: SiteContent) {
  let json = JSON.stringify({ ...content, updatedAt: new Date().toISOString() }, null, 1);
  const ids = Array.from(new Set(Array.from(json.matchAll(/idb:([a-z0-9]+)/g)).map((m) => m[1])));
  for (const id of ids) {
    const rec = await mediaDb.get(id);
    if (rec) json = json.split(`idb:${id}`).join(await blobToDataUrl(rec.blob));
  }
  return new Blob([json], { type: "application/json" });
}

/** Imports a site-content.json; embedded images are moved back into this browser's media library. */
export async function importContent(text: string): Promise<SiteContent> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  if (!migrate(raw)) throw new Error("This file doesn't look like Cayo Coco site content.");
  let json = JSON.stringify(raw);
  const dataUrls = Array.from(new Set(Array.from(json.matchAll(/"(data:image\/[a-z+.-]+;base64,[A-Za-z0-9+/=]+)"/g)).map((m) => m[1])));
  for (const dataUrl of dataUrls) {
    const blob = await (await fetch(dataUrl)).blob();
    const dims = await new Promise<{ w: number; h: number }>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 0, h: 0 });
      img.src = dataUrl;
    });
    const id = uid();
    await mediaDb.put({ id, name: "imported image", type: blob.type, size: blob.size, w: dims.w, h: dims.h, created: Date.now(), blob });
    json = json.split(dataUrl).join(`idb:${id}`);
  }
  // notify media listeners
  onMediaChange(() => undefined)();
  return migrate(JSON.parse(json))!;
}
