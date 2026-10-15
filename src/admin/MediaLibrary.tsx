import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Download, Link2, Trash2, Upload, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { useCms } from "@/cms/store";
import { deleteMedia, downloadBlob, formatBytes, renameMedia, uploadFiles, useMediaList, type MediaRecord } from "@/cms/idb";
import type { ImageRef } from "@/cms/types";
import { cdn, LIBRARY } from "@/lib/media";
import { Thumb, btnCls, inputCls, primaryBtn } from "./fields";

const fromRecord = (r: MediaRecord): ImageRef => ({ src: `idb:${r.id}`, alt: r.name, w: r.w, h: r.h });

export function UploadZone({ onUploaded }: { onUploaded?: (recs: MediaRecord[]) => void }) {
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const handle = async (files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) {
      setError("Please choose image files (JPG, PNG, WebP, GIF or SVG).");
      return;
    }
    setError("");
    setProgress(`Optimising 0/${imgs.length}…`);
    try {
      const recs = await uploadFiles(imgs, (d, t) => setProgress(`Optimising ${d}/${t}…`));
      setProgress(`${recs.length} image${recs.length === 1 ? "" : "s"} added to your library`);
      onUploaded?.(recs);
      setTimeout(() => setProgress(""), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setProgress("");
    }
  };
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handle(Array.from(e.dataTransfer.files));
      }}
      className={cn("rounded-lg border-2 border-dashed p-4 text-center transition-colors", drag ? "border-emerald-500 bg-emerald-50" : "border-zinc-300 bg-zinc-50")}
    >
      <Upload className="mx-auto size-6 text-zinc-400" />
      <p className="mt-2 text-[13px] text-zinc-700">
        <button type="button" onClick={() => inputRef.current?.click()} className="font-semibold text-emerald-700 underline underline-offset-2">
          Choose images from your device
        </button>{" "}
        or drag them here
      </p>
      <p className="mt-1 text-[11px] text-zinc-500">Select several at once · photos are resized to 2400px and compressed to WebP</p>
      {progress ? (
        <p role="status" className="mt-2 text-xs font-medium text-emerald-700">
          {progress}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        data-testid="media-upload"
        onChange={(e) => {
          handle(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function ImagePicker({ onClose, onSelect, multiple }: { onClose: () => void; onSelect: (imgs: ImageRef[]) => void; multiple?: boolean }) {
  const uploads = useMediaList();
  const [tab, setTab] = useState<"uploads" | "library" | "link">("uploads");
  const [selected, setSelected] = useState<ImageRef[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkAlt, setLinkAlt] = useState("");
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  const toggle = (img: ImageRef) =>
    setSelected((s) => {
      const has = s.some((x) => x.src === img.src);
      if (!multiple) return has ? [] : [img];
      return has ? s.filter((x) => x.src !== img.src) : [...s, img];
    });
  const isSel = (src: string) => selected.some((x) => x.src === src);
  const tile = (img: ImageRef, label: string) => (
    <li key={img.src}>
      <button type="button" onClick={() => toggle(img)} className={cn("group relative block aspect-square w-full overflow-hidden rounded-md border-2", isSel(img.src) ? "border-emerald-600" : "border-transparent hover:border-zinc-300")} aria-pressed={isSel(img.src)} title={label}>
        <Thumb src={img.src} />
        {isSel(img.src) ? (
          <span className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-emerald-600 text-white shadow">
            <Check className="size-4" />
          </span>
        ) : null}
      </button>
    </li>
  );
  return (
    <div className="admin-ui fixed inset-0 z-[95] grid place-items-center bg-black/50 p-3" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Choose images" className="flex h-[min(720px,92vh)] w-[min(920px,96vw)] flex-col overflow-hidden rounded-xl bg-white text-zinc-900 shadow-2xl">
        <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3">
          <h2 className="text-sm font-semibold">{multiple ? "Choose images" : "Choose an image"}</h2>
          <div className="ml-4 flex rounded-md bg-zinc-100 p-0.5 text-[13px]">
            {[
              ["uploads", `Your uploads (${uploads.length})`],
              ["library", `Resort photos (${LIBRARY.length})`],
              ["link", "From a link"],
            ].map(([id, label]) => (
              <button key={id} type="button" onClick={() => setTab(id as typeof tab)} className={cn("rounded px-2.5 py-1", tab === id ? "bg-white font-medium shadow-sm" : "text-zinc-600")}>
                {label}
              </button>
            ))}
          </div>
          <button type="button" onClick={onClose} className="ml-auto grid size-8 place-items-center rounded-md hover:bg-zinc-100" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tab === "uploads" ? (
            <>
              <UploadZone onUploaded={(recs) => setSelected((s) => (multiple ? [...s, ...recs.map(fromRecord)] : recs.slice(0, 1).map(fromRecord)))} />
              {uploads.length ? (
                <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">{uploads.map((r) => tile(fromRecord(r), r.name))}</ul>
              ) : (
                <p className="mt-6 text-center text-[13px] text-zinc-500">Nothing uploaded yet — your photos will appear here.</p>
              )}
            </>
          ) : null}
          {tab === "library" ? <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">{LIBRARY.map((img) => tile(img, img.alt))}</ul> : null}
          {tab === "link" ? (
            <div className="max-w-lg space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600" htmlFor="img-link">
                  Image address (https://…)
                </label>
                <input id="img-link" className={inputCls} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com/photo.jpg" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600" htmlFor="img-alt">
                  Alt text
                </label>
                <input id="img-alt" className={inputCls} value={linkAlt} onChange={(e) => setLinkAlt(e.target.value)} placeholder="Describe the photo" />
              </div>
              {/^https?:\/\//.test(linkUrl) ? <img src={linkUrl} alt="" className="max-h-48 rounded-md border border-zinc-200" /> : null}
              <button type="button" className={primaryBtn} disabled={!/^https?:\/\//.test(linkUrl)} onClick={() => onSelect([{ src: linkUrl.trim(), alt: linkAlt.trim() }])}>
                <Link2 className="size-4" /> Use this image
              </button>
            </div>
          ) : null}
        </div>
        {tab !== "link" ? (
          <div className="flex items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3">
            <span className="text-[13px] text-zinc-600">{selected.length ? `${selected.length} selected` : multiple ? "Select one or more images" : "Select an image"}</span>
            <div className="flex gap-2">
              <button type="button" className={btnCls} onClick={onClose}>
                Cancel
              </button>
              <button type="button" className={primaryBtn} disabled={!selected.length} onClick={() => onSelect(selected)}>
                {multiple ? `Add ${selected.length || ""} image${selected.length === 1 ? "" : "s"}` : "Use image"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function MediaManager() {
  const uploads = useMediaList();
  const { content } = useCms();
  const json = useMemo(() => JSON.stringify(content), [content]);
  const total = uploads.reduce((n, r) => n + r.size, 0);
  return (
    <div className="space-y-5">
      <UploadZone />
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="text-[13px] font-semibold text-zinc-900">Your uploads</h3>
          <span className="text-xs text-zinc-500">
            {uploads.length} images · {formatBytes(total)}
          </span>
        </div>
        {uploads.length ? (
          <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
            {uploads.map((r) => {
              const used = json.includes(`idb:${r.id}`);
              return (
                <li key={r.id} className="flex items-center gap-3 p-2">
                  <span className="size-12 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                    <Thumb src={`idb:${r.id}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <input className={cn(inputCls, "h-7 py-0.5")} defaultValue={r.name} aria-label="Image name" onBlur={(e) => e.target.value.trim() && e.target.value !== r.name && renameMedia(r.id, e.target.value.trim())} />
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                      {r.w}×{r.h} · {formatBytes(r.size)} · {r.type.replace("image/", "").toUpperCase()}
                      {used ? <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-px font-medium text-emerald-800">In use</span> : null}
                    </p>
                  </div>
                  <button type="button" className={btnCls} title="Download" aria-label={`Download ${r.name}`} onClick={() => downloadBlob(r.blob, `${r.name}.${(r.type.split("/")[1] || "img").replace("jpeg", "jpg")}`)}>
                    <Download className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className={cn(btnCls, "hover:border-red-200 hover:bg-red-50 hover:text-red-700")}
                    title="Delete"
                    aria-label={`Delete ${r.name}`}
                    onClick={() => {
                      if (confirm(used ? `“${r.name}” is used on the site. Delete it anyway? It will disappear from those sections.` : `Delete “${r.name}”?`)) deleteMedia(r.id);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-center text-[13px] text-zinc-500">No uploads yet.</p>
        )}
      </section>
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="text-[13px] font-semibold text-zinc-900">Resort photos</h3>
          <span className="text-xs text-zinc-500">Served from your image CDN</span>
        </div>
        <ul className="grid grid-cols-4 gap-1.5">
          {LIBRARY.map((img) => (
            <li key={img.src} className="aspect-square overflow-hidden rounded-md bg-zinc-100" title={img.alt}>
              <a href={cdn(img.src, 2400)} target="_blank" rel="noopener noreferrer" aria-label={`Open full size: ${img.alt}`}>
                <Thumb src={img.src} />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
