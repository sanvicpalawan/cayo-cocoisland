import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronRight, Copy, Image as ImageIcon, Plus, Search, Trash2, Upload, X, type LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";
import { useCms } from "@/cms/store";
import { Icon, ICON_GROUPS, iconLabel } from "@/cms/icons";
import { resolveUrl, URL_KIND_LABEL } from "@/cms/links";
import { uploadFiles, useImageSrc } from "@/cms/idb";
import type { Field } from "@/cms/schema";
import type { ImageRef } from "@/cms/types";
import { cdn, isCdnPath } from "@/lib/media";
import { ImagePicker } from "./MediaLibrary";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export const inputCls =
  "w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-[13px] text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20";
export const btnCls =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2.5 text-[13px] font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50";
export const primaryBtn =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:pointer-events-none disabled:opacity-50";
export const dangerBtn =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 text-[13px] font-medium text-red-700 transition hover:bg-red-50";

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-zinc-600">
      {children}
    </label>
  );
}

export function Help({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-[11px] leading-snug text-zinc-500">{children}</p>;
}

export function IconBtn({ icon: I, label, onClick, disabled, danger, className }: { icon: LucideIcon; label: string; onClick: () => void; disabled?: boolean; danger?: boolean; className?: string }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn("grid size-7 shrink-0 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-30", danger && "hover:bg-red-50 hover:text-red-600", className)}
    >
      <I className="size-4" />
    </button>
  );
}

export function Toggle({ checked, onChange, label, help }: { checked: boolean; onChange: (v: boolean) => void; label: string; help?: string }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <label htmlFor={id} className="text-[13px] font-medium text-zinc-800">
          {label}
        </label>
        {help ? <Help>{help}</Help> : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors", checked ? "bg-emerald-600" : "bg-zinc-300")}
      >
        <span className={cn("absolute top-0.5 size-4 rounded-full bg-white shadow transition-all", checked ? "left-[18px]" : "left-0.5")} />
      </button>
    </div>
  );
}

export function Thumb({ src, className }: { src?: string; className?: string }) {
  const resolved = useImageSrc(src);
  const url = src && isCdnPath(src) ? cdn(src, 320) : resolved;
  return url ? (
    <img src={url} alt="" loading="lazy" className={cn("h-full w-full object-cover", className)} />
  ) : (
    <span className="grid h-full w-full place-items-center text-zinc-400">
      <ImageIcon className="size-5" />
    </span>
  );
}

export function Card({ title, children, actions, help }: { title: string; children: ReactNode; actions?: ReactNode; help?: ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[13px] font-semibold text-zinc-900">{title}</h3>
          {help ? <div className="mt-0.5 text-xs leading-snug text-zinc-500">{help}</div> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

/* ───────────── Schema-driven editor ───────────── */

export function FieldsEditor({ fields, value, onChange }: { fields: Field[]; value: Any; onChange: (v: Any) => void }) {
  const v = value ?? {};
  return (
    <div className="space-y-4">
      {fields.map((f) => {
        if (f.when && !f.when(v)) return null;
        if (f.kind === "heading") {
          return (
            <p key={f.key} className="border-b border-zinc-200 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              {f.label}
            </p>
          );
        }
        return <FieldControl key={f.key} field={f} value={v[f.key]} onChange={(next) => onChange({ ...v, [f.key]: next })} />;
      })}
    </div>
  );
}

function FieldControl({ field: f, value, onChange }: { field: Field; value: Any; onChange: (v: Any) => void }) {
  const id = useId();
  switch (f.kind) {
    case "text":
      return (
        <div>
          <Label htmlFor={id}>{f.label}</Label>
          <input id={id} className={inputCls} value={value ?? ""} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />
          {f.help ? <Help>{f.help}</Help> : null}
        </div>
      );
    case "textarea":
      return (
        <div>
          <Label htmlFor={id}>{f.label}</Label>
          <textarea id={id} className={cn(inputCls, "resize-y leading-relaxed")} rows={f.rows ?? 3} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
          {f.help ? <Help>{f.help}</Help> : null}
        </div>
      );
    case "select":
      return (
        <div>
          <Label htmlFor={id}>{f.label}</Label>
          <select id={id} className={inputCls} value={value === undefined || value === null ? "" : String(value)} onChange={(e) => onChange(f.num ? Number(e.target.value) : e.target.value)}>
            {(f.options ?? []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {f.help ? <Help>{f.help}</Help> : null}
        </div>
      );
    case "toggle":
      return <Toggle checked={!!value} onChange={onChange} label={f.label} help={f.help} />;
    case "number":
      return (
        <div>
          <Label htmlFor={id}>{f.label}</Label>
          <input id={id} type="number" className={inputCls} min={f.min} max={f.max} step={f.step} value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))} />
          {f.help ? <Help>{f.help}</Help> : null}
        </div>
      );
    case "range":
      return (
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor={id}>{f.label}</Label>
            <span className="text-xs tabular-nums text-zinc-500">
              {value ?? f.min}
              {f.unit}
            </span>
          </div>
          <input id={id} type="range" className="w-full accent-emerald-700" min={f.min} max={f.max} step={f.step} value={value ?? f.min} onChange={(e) => onChange(Number(e.target.value))} />
        </div>
      );
    case "color":
      return <ColorInput label={f.label} value={value ?? ""} onChange={onChange} help={f.help} />;
    case "image":
      return <ImageField label={f.label} value={value} onChange={onChange} help={f.help} />;
    case "images":
      return <ImagesField label={f.label} value={value} onChange={onChange} captions={f.captions} help={f.help} />;
    case "url":
      return <UrlField label={f.label} value={value ?? ""} onChange={onChange} help={f.help} />;
    case "icon":
      return <IconField label={f.label} value={value ?? ""} onChange={onChange} />;
    case "strings":
      return <StringsField field={f} value={value} onChange={onChange} />;
    case "list":
      return <ListField field={f} value={value} onChange={onChange} />;
    case "group":
      return (
        <fieldset className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-3">
          <legend className="px-1 text-xs font-semibold text-zinc-700">{f.label}</legend>
          <FieldsEditor fields={f.fields ?? []} value={value ?? {}} onChange={onChange} />
        </fieldset>
      );
    default:
      return null;
  }
}

export function ColorInput({ label, value, onChange, help }: { label: string; value: string; onChange: (v: string) => void; help?: string }) {
  const id = useId();
  const valid = /^#[0-9a-f]{6}$/i.test(value);
  return (
    <div className="flex items-center gap-3">
      <input type="color" aria-label={`${label} colour picker`} value={valid ? value : "#000000"} onChange={(e) => onChange(e.target.value)} className="h-9 w-11 shrink-0 cursor-pointer rounded-md border border-zinc-300 bg-white p-1" />
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block text-xs font-medium text-zinc-700">
          {label}
        </label>
        {help ? <p className="truncate text-[11px] text-zinc-500">{help}</p> : null}
      </div>
      <input id={id} className={cn(inputCls, "w-24 font-mono text-xs")} value={value} placeholder="#000000" onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/* ───────────── Images ───────────── */

const FOCAL = [
  { value: "", label: "Focus: centre" },
  { value: "50% 20%", label: "Focus: top" },
  { value: "50% 80%", label: "Focus: bottom" },
  { value: "25% 50%", label: "Focus: left" },
  { value: "75% 50%", label: "Focus: right" },
];

function UploadButton({ multiple, onFiles, label = "Upload" }: { multiple?: boolean; onFiles: (files: File[]) => Promise<void>; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button type="button" className={btnCls} disabled={busy} onClick={() => ref.current?.click()}>
        <Upload className="size-3.5" /> {busy ? "Uploading…" : label}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (!files.length) return;
          setBusy(true);
          try {
            await onFiles(files);
          } catch (err) {
            alert(err instanceof Error ? err.message : String(err));
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}

function ImageField({ label, value, onChange, help }: { label: string; value?: ImageRef; onChange: (v?: ImageRef) => void; help?: string }) {
  const [open, setOpen] = useState(false);
  const has = !!value?.src;
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-3">
        <button type="button" onClick={() => setOpen(true)} className="relative size-20 shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100" aria-label="Choose image">
          <Thumb src={value?.src} />
        </button>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className={btnCls} onClick={() => setOpen(true)}>
              <ImageIcon className="size-3.5" /> {has ? "Change" : "Choose"}
            </button>
            <UploadButton
              onFiles={async (files) => {
                const [rec] = await uploadFiles(files.slice(0, 1));
                if (rec) onChange({ src: `idb:${rec.id}`, alt: value?.alt || rec.name, w: rec.w, h: rec.h });
              }}
            />
            {has ? <IconBtn icon={Trash2} label="Remove image" danger onClick={() => onChange(undefined)} /> : null}
          </div>
          {has ? (
            <>
              <input className={inputCls} aria-label="Alt text" placeholder="Alt text — describe the photo" value={value!.alt ?? ""} onChange={(e) => onChange({ ...value!, alt: e.target.value })} />
              <select className={inputCls} aria-label="Focal point" value={value!.pos ?? ""} onChange={(e) => onChange({ ...value!, pos: e.target.value || undefined })}>
                {FOCAL.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </>
          ) : null}
        </div>
      </div>
      {help ? <Help>{help}</Help> : null}
      {open ? (
        <ImagePicker
          onClose={() => setOpen(false)}
          onSelect={(imgs) => {
            if (imgs[0]) onChange(imgs[0]);
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function ImagesField({ label, value, onChange, captions, help }: { label: string; value?: ImageRef[]; onChange: (v: ImageRef[]) => void; captions?: boolean; help?: string }) {
  const list = Array.isArray(value) ? value.filter(Boolean) : [];
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<number | null>(null);
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = list.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setSel(j);
  };
  const current = sel !== null ? list[sel] : undefined;
  return (
    <div>
      <Label>
        {label} <span className="font-normal text-zinc-400">({list.length})</span>
      </Label>
      {list.length ? (
        <ul className="grid grid-cols-4 gap-1.5">
          {list.map((img, i) => (
            <li key={`${img.src}-${i}`} className="group relative">
              <button type="button" onClick={() => setSel(sel === i ? null : i)} className={cn("block aspect-square w-full overflow-hidden rounded-md border-2", sel === i ? "border-emerald-600" : "border-transparent")} aria-label={`Edit image ${i + 1}`}>
                <Thumb src={img.src} />
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange(list.filter((_, j) => j !== i));
                  setSel(null);
                }}
                className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                aria-label={`Remove image ${i + 1}`}
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-md border border-dashed border-zinc-300 p-3 text-center text-xs text-zinc-500">No images yet</p>
      )}
      {current ? (
        <div className="mt-2 space-y-1.5 rounded-md border border-zinc-200 bg-zinc-50 p-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-600">Image {sel! + 1}</span>
            <div className="flex">
              <IconBtn icon={ArrowLeft} label="Move earlier" disabled={sel === 0} onClick={() => move(sel!, -1)} />
              <IconBtn icon={ArrowRight} label="Move later" disabled={sel === list.length - 1} onClick={() => move(sel!, 1)} />
            </div>
          </div>
          <input className={inputCls} aria-label="Alt text" placeholder="Alt text — describe the photo" value={current.alt ?? ""} onChange={(e) => onChange(list.map((x, j) => (j === sel ? { ...x, alt: e.target.value } : x)))} />
          {captions ? <input className={inputCls} aria-label="Caption" placeholder="Caption" value={current.caption ?? ""} onChange={(e) => onChange(list.map((x, j) => (j === sel ? { ...x, caption: e.target.value } : x)))} /> : null}
          <select className={inputCls} aria-label="Focal point" value={current.pos ?? ""} onChange={(e) => onChange(list.map((x, j) => (j === sel ? { ...x, pos: e.target.value || undefined } : x)))}>
            {FOCAL.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button type="button" className={btnCls} onClick={() => setOpen(true)}>
          <Plus className="size-3.5" /> Add from library
        </button>
        <UploadButton
          multiple
          label="Upload images"
          onFiles={async (files) => {
            const recs = await uploadFiles(files);
            onChange([...list, ...recs.map((r) => ({ src: `idb:${r.id}`, alt: r.name, w: r.w, h: r.h }))]);
          }}
        />
      </div>
      {help ? <Help>{help}</Help> : null}
      {open ? (
        <ImagePicker
          multiple
          onClose={() => setOpen(false)}
          onSelect={(imgs) => {
            onChange([...list, ...imgs]);
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

/* ───────────── Links ───────────── */

function UrlField({ label, value, onChange, help }: { label: string; value: string; onChange: (v: string) => void; help?: string }) {
  const id = useId();
  const { content } = useCms();
  const options = useMemo(() => {
    const pages = content.pages.map((p) => ({ value: `#${p.slug}`, label: `${p.title}` }));
    const sections: { value: string; label: string }[] = [];
    content.pages.forEach((p) =>
      p.sections.forEach((s) => {
        if (s.anchor) sections.push({ value: `#${p.slug}?s=${s.anchor}`, label: `${p.title} › ${String(s.data.title || s.anchor).split("\n")[0].slice(0, 40)}` });
      }),
    );
    return { pages, sections };
  }, [content.pages]);
  const r = resolveUrl(value, content.site);
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-1.5">
        <input id={id} className={cn(inputCls, "min-w-0 flex-1")} value={value} placeholder="#/page, https://… or {booking}" onChange={(e) => onChange(e.target.value)} />
        <select
          aria-label="Quick link"
          className={cn(inputCls, "w-28 shrink-0")}
          value=""
          onChange={(e) => {
            if (e.target.value) onChange(e.target.value);
          }}
        >
          <option value="">Link to…</option>
          <optgroup label="Actions">
            <option value="{booking}">Booking engine</option>
            <option value="{whatsapp}">WhatsApp chat</option>
            <option value="{email}">Email us</option>
          </optgroup>
          <optgroup label="Pages">
            {options.pages.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
          {options.sections.length ? (
            <optgroup label="Sections">
              {options.sections.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ) : null}
        </select>
      </div>
      <Help>{value ? URL_KIND_LABEL[r.kind] : help ?? "Choose a page, an action or paste any web address."}</Help>
    </div>
  );
}

/* ───────────── Icons ───────────── */

function IconField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);
  const groups = ICON_GROUPS.map((g) => ({ ...g, names: g.names.filter((n) => iconLabel(n).toLowerCase().includes(q.toLowerCase())) })).filter((g) => g.names.length);
  return (
    <div ref={ref} className="relative">
      <Label>{label}</Label>
      <button type="button" onClick={() => setOpen((o) => !o)} className={cn(inputCls, "flex items-center gap-2 text-left")} aria-expanded={open}>
        {value ? <Icon name={value} className="size-4 text-zinc-700" /> : <span className="size-4 rounded border border-dashed border-zinc-300" />}
        <span className="flex-1 truncate">{value ? iconLabel(value) : "No icon"}</span>
        <ChevronRight className={cn("size-4 text-zinc-400 transition", open && "rotate-90")} />
      </button>
      {open ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-2 shadow-xl">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
            <input autoFocus className={cn(inputCls, "pl-7")} placeholder="Search icons" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <button
            type="button"
            className="mb-2 w-full rounded-md border border-dashed border-zinc-300 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            No icon
          </button>
          {groups.map((g) => (
            <div key={g.label} className="mb-2">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{g.label}</p>
              <div className="grid grid-cols-8 gap-1">
                {g.names.map((n) => (
                  <button
                    key={n}
                    type="button"
                    title={iconLabel(n)}
                    aria-label={iconLabel(n)}
                    onClick={() => {
                      onChange(n);
                      setOpen(false);
                    }}
                    className={cn("grid aspect-square place-items-center rounded-md text-zinc-700 hover:bg-emerald-50 hover:text-emerald-800", value === n && "bg-emerald-100 text-emerald-800")}
                  >
                    <Icon name={n} className="size-4" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ───────────── Lists ───────────── */

function StringsField({ field: f, value, onChange }: { field: Field; value: Any; onChange: (v: string[]) => void }) {
  const list: string[] = Array.isArray(value) ? value : [];
  const set = (i: number, v: string) => onChange(list.map((x, j) => (j === i ? v : x)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = list.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div>
      <Label>
        {f.label} <span className="font-normal text-zinc-400">({list.length})</span>
      </Label>
      <ul className="space-y-1.5">
        {list.map((s, i) => (
          <li key={i} className="flex items-center gap-1">
            <input className={cn(inputCls, "min-w-0 flex-1")} aria-label={`${f.label} ${i + 1}`} value={s} onChange={(e) => set(i, e.target.value)} />
            <IconBtn icon={ArrowUp} label="Move up" disabled={i === 0} onClick={() => move(i, -1)} />
            <IconBtn icon={ArrowDown} label="Move down" disabled={i === list.length - 1} onClick={() => move(i, 1)} />
            <IconBtn icon={Trash2} label="Remove" danger onClick={() => onChange(list.filter((_, j) => j !== i))} />
          </li>
        ))}
      </ul>
      <button type="button" className={cn(btnCls, "mt-1.5")} onClick={() => onChange([...list, ""])}>
        <Plus className="size-3.5" /> {f.addLabel ?? "Add"}
      </button>
      {f.help ? <Help>{f.help}</Help> : null}
    </div>
  );
}

function ListField({ field: f, value, onChange }: { field: Field; value: Any; onChange: (v: Any[]) => void }) {
  const items: Any[] = Array.isArray(value) ? value : [];
  const [open, setOpen] = useState<number | null>(null);
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setOpen(open === i ? j : open);
  };
  const title = (it: Any, i: number) => {
    const raw = f.itemTitle ? it?.[f.itemTitle] : undefined;
    const t = Array.isArray(raw) ? raw.filter(Boolean).join(" · ") : raw;
    return (typeof t === "string" && t.trim() ? t : `Item ${i + 1}`).split("\n")[0];
  };
  return (
    <div>
      <Label>
        {f.label} <span className="font-normal text-zinc-400">({items.length})</span>
      </Label>
      <div className="space-y-1.5">
        {items.map((it, i) => (
          <div key={i} className={cn("rounded-lg border bg-white", open === i ? "border-emerald-600/40" : "border-zinc-200")}>
            <div className="flex items-center gap-0.5 py-1 pl-1 pr-1">
              <button type="button" onClick={() => setOpen(open === i ? null : i)} className="flex min-w-0 flex-1 items-center gap-1.5 rounded px-1 py-1 text-left" aria-expanded={open === i}>
                <ChevronRight className={cn("size-3.5 shrink-0 text-zinc-400 transition", open === i && "rotate-90")} />
                {it?.icon ? <Icon name={it.icon} className="size-3.5 shrink-0 text-zinc-500" /> : null}
                <span className="truncate text-[13px] text-zinc-800">{title(it, i)}</span>
              </button>
              <IconBtn icon={ArrowUp} label="Move up" disabled={i === 0} onClick={() => move(i, -1)} />
              <IconBtn icon={ArrowDown} label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)} />
              <IconBtn icon={Copy} label="Duplicate" onClick={() => onChange([...items.slice(0, i + 1), structuredClone(it), ...items.slice(i + 1)])} />
              <IconBtn
                icon={Trash2}
                label="Delete"
                danger
                onClick={() => {
                  onChange(items.filter((_, j) => j !== i));
                  setOpen(null);
                }}
              />
            </div>
            {open === i ? (
              <div className="border-t border-zinc-100 p-3">
                <FieldsEditor fields={f.fields ?? []} value={it} onChange={(v) => onChange(items.map((x, j) => (j === i ? v : x)))} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <button
        type="button"
        className={cn(btnCls, "mt-1.5")}
        onClick={() => {
          onChange([...items, f.newItem ? f.newItem() : {}]);
          setOpen(items.length);
        }}
      >
        <Plus className="size-3.5" /> {f.addLabel ?? "Add item"}
      </button>
      {f.help ? <Help>{f.help}</Help> : null}
    </div>
  );
}
