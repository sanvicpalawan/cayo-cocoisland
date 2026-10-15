import { RotateCcw } from "lucide-react";
import { cn } from "@/utils/cn";
import { useCms } from "@/cms/store";
import { DEFAULT_THEME } from "@/cms/defaults";
import { BODY_FONTS, COLOR_LABELS, HEADING_FONTS, PRESETS } from "@/cms/theme";
import type { Theme } from "@/cms/types";
import { buttonClass } from "@/components/ui";
import { Card, ColorInput, Label, Toggle, btnCls, inputCls } from "../fields";

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="grid gap-1 rounded-md bg-zinc-100 p-0.5" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }} role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)} className={cn("rounded px-2 py-1.5 text-[12px]", value === o.value ? "bg-white font-semibold text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900")}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, format }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-xs tabular-nums text-zinc-500">{format ? format(value) : value}</span>
      </div>
      <input type="range" aria-label={label} className="w-full accent-emerald-700" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

export function ThemeTab() {
  const { content, update } = useCms();
  const t = content.theme;
  const set = (fn: (th: Theme) => void) => update((d) => fn(d.theme));
  const swatches: { value: string; label: string; color: string }[] = [
    { value: "", label: "Accent", color: t.colors.forest },
    { value: t.colors.espresso, label: "Espresso", color: t.colors.espresso },
    { value: t.colors.clay, label: "Clay", color: t.colors.clay },
    { value: t.colors.bark, label: "Bark", color: t.colors.bark },
    { value: t.colors.ink, label: "Ink", color: t.colors.ink },
  ];
  return (
    <div className="space-y-4 p-4">
      <Card title="Colour presets" help="A starting point — every colour can be fine-tuned below.">
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => {
            const active = Object.entries(p.colors).every(([k, v]) => t.colors[k as keyof Theme["colors"]]?.toLowerCase() === v.toLowerCase());
            return (
              <button
                key={p.name}
                type="button"
                onClick={() =>
                  set((th) => {
                    th.colors = { ...p.colors };
                  })
                }
                className={cn("rounded-lg border p-2 text-left transition", active ? "border-emerald-600 ring-2 ring-emerald-600/20" : "border-zinc-200 hover:border-zinc-300")}
              >
                <span className="flex h-6 overflow-hidden rounded">
                  {(["ivory", "shell", "forest", "espresso", "espresso-deep"] as const).map((k) => (
                    <span key={k} className="flex-1" style={{ background: p.colors[k] }} />
                  ))}
                </span>
                <span className="mt-1.5 block text-xs font-medium text-zinc-800">{p.name}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card title="Colour palette">
        <div className="space-y-2.5">
          {COLOR_LABELS.map((c) => (
            <ColorInput
              key={c.key}
              label={c.label}
              help={c.help}
              value={t.colors[c.key]}
              onChange={(v) =>
                set((th) => {
                  th.colors[c.key] = v;
                })
              }
            />
          ))}
        </div>
      </Card>

      <Card title="Typography">
        <div className="space-y-3">
          <div>
            <Label htmlFor="font-h">Heading font</Label>
            <select id="font-h" className={inputCls} value={t.fonts.heading} onChange={(e) => set((th) => void (th.fonts.heading = e.target.value))}>
              {HEADING_FONTS.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>
            <p className="mt-2 truncate rounded-md bg-zinc-50 px-3 py-2 text-2xl text-zinc-900" style={{ fontFamily: "var(--font-serif)", fontWeight: t.fonts.headingWeight }}>
              The Kingfisher Restaurant
            </p>
          </div>
          <div>
            <Label htmlFor="font-b">Body font</Label>
            <select id="font-b" className={inputCls} value={t.fonts.body} onChange={(e) => set((th) => void (th.fonts.body = e.target.value))}>
              {BODY_FONTS.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>
            <p className="mt-2 rounded-md bg-zinc-50 px-3 py-2 text-[15px] leading-relaxed text-zinc-700" style={{ fontFamily: "var(--font-sans)" }}>
              A retreat from the crowds and a place for nature lovers.
            </p>
          </div>
          <Segmented label="Heading weight" value={String(t.fonts.headingWeight)} options={["300", "400", "500", "600"].map((w) => ({ value: w, label: w }))} onChange={(v) => set((th) => void (th.fonts.headingWeight = Number(v)))} />
          <Slider label="Heading size" value={t.fonts.headingScale} min={0.8} max={1.25} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => set((th) => void (th.fonts.headingScale = v))} />
          <Slider label="Body text size" value={t.fonts.bodyScale} min={0.9} max={1.15} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => set((th) => void (th.fonts.bodyScale = v))} />
          <Toggle label="Uppercase headings" checked={t.fonts.headingUppercase} onChange={(v) => set((th) => void (th.fonts.headingUppercase = v))} />
        </div>
      </Card>

      <Card title="Buttons">
        <div className="space-y-3">
          <Segmented label="Shape" value={t.buttons.shape} options={[{ value: "square", label: "Square" }, { value: "soft", label: "Soft" }, { value: "rounded", label: "Rounded" }, { value: "pill", label: "Pill" }]} onChange={(v) => set((th) => void (th.buttons.shape = v))} />
          <Segmented label="Size" value={t.buttons.size} options={[{ value: "sm", label: "Small" }, { value: "md", label: "Medium" }, { value: "lg", label: "Large" }]} onChange={(v) => set((th) => void (th.buttons.size = v))} />
          <Segmented label="Weight" value={String(t.buttons.weight)} options={["500", "600", "700"].map((w) => ({ value: w, label: w }))} onChange={(v) => set((th) => void (th.buttons.weight = Number(v)))} />
          <Toggle label="Uppercase labels" checked={t.buttons.uppercase} onChange={(v) => set((th) => void (th.buttons.uppercase = v))} />
          {t.buttons.uppercase ? <Slider label="Letter spacing" value={t.buttons.tracking} min={0} max={0.3} step={0.01} format={(v) => `${v.toFixed(2)}em`} onChange={(v) => set((th) => void (th.buttons.tracking = v))} /> : null}
          <div>
            <Label>Primary button colour</Label>
            <div className="flex flex-wrap gap-1.5">
              {swatches.map((s) => (
                <button key={s.label} type="button" onClick={() => set((th) => void (th.buttons.primary = s.value))} className={cn("flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs", t.buttons.primary === s.value ? "border-emerald-600 ring-2 ring-emerald-600/20" : "border-zinc-200")}>
                  <span className="size-4 rounded-full border border-black/10" style={{ background: s.color }} />
                  {s.label}
                </button>
              ))}
            </div>
            <div className="mt-2">
              <ColorInput label="Custom colour" value={t.buttons.primary} onChange={(v) => set((th) => void (th.buttons.primary = v))} />
            </div>
          </div>
          <Segmented label="Primary text colour" value={t.buttons.primaryText ? (t.buttons.primaryText === t.colors.ink ? "dark" : "custom") : "light"} options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} onChange={(v) => set((th) => void (th.buttons.primaryText = v === "dark" ? th.colors.ink : ""))} />
          <Toggle label="Soft shadow" checked={t.buttons.shadow} onChange={(v) => set((th) => void (th.buttons.shadow = v))} />
          <div className="space-y-2 rounded-lg border border-zinc-200 p-3" aria-label="Button preview">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Preview</p>
            <div className="flex flex-wrap gap-2 bg-ivory p-3">
              <span className={buttonClass("primary")}>Book Now</span>
              <span className={buttonClass("outline")}>Make an inquiry</span>
              <span className={buttonClass("dark")}>Dark</span>
            </div>
            <div className="flex flex-wrap gap-2 bg-espresso-deep p-3">
              <span className={buttonClass("light")}>Book Now</span>
              <span className={buttonClass("outlineLight")}>Explore</span>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Layout & motion">
        <div className="space-y-3">
          <Segmented label="Content width" value={String(t.layout.container)} options={["1140", "1240", "1320", "1440", "1600"].map((w) => ({ value: w, label: w }))} onChange={(v) => set((th) => void (th.layout.container = Number(v)))} />
          <Slider label="Section spacing" value={t.layout.spacing} min={0.6} max={1.4} step={0.05} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => set((th) => void (th.layout.spacing = v))} />
          <Slider label="Image corners" value={t.layout.imageRadius} min={0} max={32} step={1} format={(v) => `${v}px`} onChange={(v) => set((th) => void (th.layout.imageRadius = v))} />
          <Toggle label="Subtle scroll & hero animations" checked={t.layout.animations} onChange={(v) => set((th) => void (th.layout.animations = v))} help="Visitors who prefer reduced motion never see animations." />
        </div>
      </Card>

      <button type="button" className={btnCls} onClick={() => confirm("Reset colours, fonts, buttons and layout to the original Cayo Coco theme?") && update((d) => void (d.theme = structuredClone(DEFAULT_THEME)))}>
        <RotateCcw className="size-3.5" /> Reset theme to original
      </button>
    </div>
  );
}
