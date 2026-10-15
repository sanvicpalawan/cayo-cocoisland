import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Check, CircleAlert } from "lucide-react";
import { cn } from "@/utils/cn";
import { useSite } from "@/cms/store";
import { whatsappLink } from "@/cms/links";
import { EMAIL_RE, submitForm, type SubmitOutcome } from "@/lib/forms";
import { Link, useRoute } from "@/lib/router";
import { buttonClass } from "./ui";

type Errors = Partial<Record<string, string>>;

const inputBase = "block w-full min-h-12 rounded-[2px] border px-4 py-3 text-base leading-snug transition-colors focus:outline-none focus:ring-2";
const inputTone = {
  light: "border-stone bg-white/80 text-ink placeholder:text-muted/70 focus:border-forest focus:bg-white focus:ring-forest/25 aria-[invalid=true]:border-clay",
  dark: "border-ivory/25 bg-ivory/[0.06] text-ivory placeholder:text-ivory/45 focus:border-sand focus:ring-sand/30 aria-[invalid=true]:border-[#f2b49b] [color-scheme:dark]",
};

function Field({ id, label, required, error, hint, dark, hideOptional, children }: { id: string; label: string; required?: boolean; error?: string; hint?: string; dark?: boolean; hideOptional?: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={cn("text-[0.9375rem] font-medium", dark ? "text-ivory" : "text-ink")}>
        {label}
        {required ? (
          <span className={cn("ml-0.5", dark ? "text-[#f2b49b]" : "text-clay")} aria-hidden>
            *
          </span>
        ) : hideOptional ? null : (
          <span className={cn("ml-1.5 text-sm font-normal", dark ? "text-ivory/60" : "text-muted")}>(optional)</span>
        )}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className={cn("text-sm", dark ? "text-ivory/65" : "text-muted")}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className={cn("flex items-start gap-1.5 text-sm font-medium", dark ? "text-[#f2b49b]" : "text-clay")}>
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
}

const describedBy = (id: string, error?: string, hint?: string) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

function Honeypot() {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Leave this field empty
        <input type="text" name="company" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

function RequiredNote({ dark }: { dark?: boolean }) {
  return (
    <p className={cn("text-sm", dark ? "text-ivory/65" : "text-muted")}>
      Fields marked <span className={dark ? "text-[#f2b49b]" : "text-clay"}>*</span> are required.
    </p>
  );
}

/* Honest status messages — never a false success. */
export function FormStatus({ outcome, dark, sentText }: { outcome: SubmitOutcome | null; dark?: boolean; sentText: string }) {
  const site = useSite();
  if (!outcome) return null;
  const link = cn("font-semibold underline underline-offset-4", dark ? "text-ivory" : "text-ink");
  const box = "flex gap-3 rounded-[2px] border p-4 text-[0.9375rem] leading-relaxed";
  if (outcome.type === "sent")
    return (
      <div role="status" className={cn(box, dark ? "border-sand/40 bg-ivory/10 text-ivory" : "border-forest/30 bg-forest/[0.07] text-ink")}>
        <Check className={cn("mt-0.5 size-5 shrink-0", dark ? "text-sand" : "text-forest")} aria-hidden />
        <p>{sentText}</p>
      </div>
    );
  if (outcome.type === "handoff")
    return (
      <div role="status" className={cn(box, dark ? "border-sand/40 bg-ivory/10 text-ivory" : "border-stone bg-sand/40 text-ink")}>
        <CircleAlert className={cn("mt-0.5 size-5 shrink-0", dark ? "text-sand" : "text-bark")} aria-hidden />
        <p>
          <strong className="font-semibold">One last step:</strong> your email app should now be open with your message to {site.email}. Please press <em>Send</em> there to complete it. Nothing opened?{" "}
          <a className={link} href={outcome.mailto}>
            Try again
          </a>
          , write to{" "}
          <a className={link} href={`mailto:${site.email}`}>
            {site.email}
          </a>{" "}
          or{" "}
          <a className={link} href={whatsappLink(site)} target="_blank" rel="noopener noreferrer">
            message us on WhatsApp
          </a>
          .
        </p>
      </div>
    );
  return (
    <div role="alert" className={cn(box, dark ? "border-[#f2b49b]/50 bg-[#f2b49b]/10 text-ivory" : "border-clay/40 bg-clay/[0.06] text-ink")}>
      <CircleAlert className={cn("mt-0.5 size-5 shrink-0", dark ? "text-[#f2b49b]" : "text-clay")} aria-hidden />
      <p>
        <strong className="font-semibold">Sorry — your message was not sent.</strong> {outcome.message} Please try again,{" "}
        <a className={link} href={outcome.mailto}>
          send it by email
        </a>{" "}
        or{" "}
        <a className={link} href={whatsappLink(site)} target="_blank" rel="noopener noreferrer">
          contact us on WhatsApp
        </a>
        .
      </p>
    </div>
  );
}

function useFormController<T extends Record<string, string>>(opts: { initial: T; validate: (v: T) => Errors; order: (keyof T & string)[]; idPrefix: string }) {
  const [values, setValues] = useState<T>(opts.initial);
  const [errors, setErrors] = useState<Errors>({});
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<SubmitOutcome | null>(null);

  const set = (key: keyof T & string, value: string) => {
    const next = { ...values, [key]: value } as T;
    setValues(next);
    if (attempted) setErrors(opts.validate(next));
  };
  const bind = (key: keyof T & string) => ({
    id: `${opts.idPrefix}-${key}`,
    name: key,
    value: values[key],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(key, e.target.value),
    "aria-invalid": errors[key] ? true : undefined,
  });
  const submit = (run: (v: T) => Promise<SubmitOutcome>) => async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const hp = ev.currentTarget.elements.namedItem("company") as HTMLInputElement | null;
    if (hp?.value) return;
    setAttempted(true);
    const e = opts.validate(values);
    setErrors(e);
    const first = opts.order.find((k) => e[k]);
    if (first) {
      setOutcome(null);
      document.getElementById(`${opts.idPrefix}-${first}`)?.focus();
      return;
    }
    setBusy(true);
    setOutcome(null);
    const result = await run(values);
    setBusy(false);
    setOutcome(result);
    if (result.type === "sent") {
      setValues(opts.initial);
      setAttempted(false);
    }
  };
  return { values, set, bind, errors, busy, outcome, submit };
}

function SubmitButton({ busy, label, variant = "primary", className }: { busy: boolean; label: string; variant?: "primary" | "light" | "dark"; className?: string }) {
  return (
    <button type="submit" disabled={busy} aria-busy={busy} className={buttonClass(variant, cn("w-full disabled:cursor-wait disabled:opacity-70 sm:w-auto", className))}>
      {busy ? (
        <>
          <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />
          Sending…
        </>
      ) : (
        label
      )}
    </button>
  );
}

function PrivacyNote({ dark }: { dark?: boolean }) {
  return (
    <p className={cn("text-sm", dark ? "text-ivory/65" : "text-muted")}>
      We only use your details to reply to you. See our{" "}
      <Link to="/privacy-policy-and-terms-and-conditions" className="underline underline-offset-4 hover:no-underline">
        privacy policy
      </Link>
      .
    </p>
  );
}

const emailError = (v: string) => (!v.trim() ? "Please enter your email address." : !EMAIL_RE.test(v.trim()) ? "Please enter a valid email address, e.g. name@example.com." : undefined);

const TOPICS: Record<string, string> = {
  "beach-dinner": "Hello! We would love to arrange a private dinner on the beach during our stay.",
  dining: "Hello! I have a question about dining at the Kingfisher Restaurant.",
};

const today = () => new Date().toISOString().slice(0, 10);

/* ───────────── Booking inquiry ───────────── */

export function InquiryForm({ idPrefix = "inquiry" }: { idPrefix?: string }) {
  const site = useSite();
  const { params } = useRoute();
  const topic = params.get("topic") ?? "";
  const [rooms, setRooms] = useState<string[]>([]);
  const preset = useRef(TOPICS[topic] ?? "");
  const f = useFormController({
    idPrefix,
    initial: { name: "", arrival: "", departure: "", email: "", message: TOPICS[topic] ?? "" },
    order: ["name", "departure", "email", "message"],
    validate: (v) => ({
      name: v.name.trim() ? undefined : "Please enter your name.",
      departure: v.arrival && v.departure && v.departure <= v.arrival ? "Your departure date must be after your arrival date." : undefined,
      email: emailError(v.email),
      message: v.message.trim() ? undefined : "Please write a short message so we can help.",
    }),
  });

  useEffect(() => {
    const next = TOPICS[topic];
    if (next && (f.values.message === "" || f.values.message === preset.current)) {
      f.set("message", next);
      preset.current = next;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  const toggleRoom = (room: string) => setRooms((r) => (r.includes(room) ? r.filter((x) => x !== room) : [...r, room]));
  const onSubmit = f.submit(async (v) => {
    const result = await submitForm(
      "inquiry",
      `Booking inquiry – ${v.name.trim()}`,
      [
        ["Name", v.name.trim()],
        ["Email", v.email.trim()],
        ["Arrival", v.arrival],
        ["Departure", v.departure],
        ["Type of accommodation", rooms.join("; ")],
        ["Message", v.message.trim()],
      ],
      site.email,
    );
    if (result.type === "sent") setRooms([]);
    return result;
  });
  const e = f.errors;
  const roomOptions = (site.inquiryRooms ?? []).filter(Boolean);
  return (
    <form onSubmit={onSubmit} noValidate className="relative flex flex-col gap-6" aria-describedby={`${idPrefix}-required`}>
      <Honeypot />
      <div id={`${idPrefix}-required`}>
        <RequiredNote />
      </div>
      <Field id={`${idPrefix}-name`} label="Name and surname" required error={e.name}>
        <input {...f.bind("name")} type="text" autoComplete="name" required aria-describedby={describedBy(`${idPrefix}-name`, e.name)} className={cn(inputBase, inputTone.light)} />
      </Field>
      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-3 text-[0.9375rem] font-medium text-ink">
          Dates of travel <span className="ml-1.5 text-sm font-normal text-muted">(optional)</span>
        </legend>
        <Field id={`${idPrefix}-arrival`} label="Arrival" hideOptional>
          <input {...f.bind("arrival")} type="date" min={today()} className={cn(inputBase, inputTone.light)} />
        </Field>
        <Field id={`${idPrefix}-departure`} label="Departure" hideOptional error={e.departure}>
          <input {...f.bind("departure")} type="date" min={f.values.arrival || today()} aria-describedby={describedBy(`${idPrefix}-departure`, e.departure)} className={cn(inputBase, inputTone.light)} />
        </Field>
      </fieldset>
      {roomOptions.length ? (
        <fieldset>
          <legend className="mb-3 text-[0.9375rem] font-medium text-ink">
            Type of accommodation <span className="ml-1.5 text-sm font-normal text-muted">(optional — choose any)</span>
          </legend>
          <div className="grid gap-2.5">
            {roomOptions.map((room, i) => {
              const id = `${idPrefix}-room-${i}`;
              const checked = rooms.includes(room);
              return (
                <label key={room} htmlFor={id} className={cn("flex min-h-12 cursor-pointer items-center gap-3 rounded-[2px] border px-4 py-3 text-[0.9375rem] transition-colors", checked ? "border-forest bg-forest/[0.06]" : "border-stone bg-white/60 hover:border-ink/40")}>
                  <input id={id} type="checkbox" checked={checked} onChange={() => toggleRoom(room)} className="size-4 shrink-0 accent-forest" />
                  {room}
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}
      <Field id={`${idPrefix}-email`} label="Your email" required error={e.email}>
        <input {...f.bind("email")} type="email" inputMode="email" autoComplete="email" required aria-describedby={describedBy(`${idPrefix}-email`, e.email)} className={cn(inputBase, inputTone.light)} />
      </Field>
      <Field id={`${idPrefix}-message`} label="Message" required error={e.message} hint="Write us a message or send a booking inquiry — we will make sure to find availability for you.">
        <textarea {...f.bind("message")} rows={5} required aria-describedby={describedBy(`${idPrefix}-message`, e.message, "hint")} className={cn(inputBase, inputTone.light, "min-h-36 resize-y")} />
      </Field>
      <FormStatus outcome={f.outcome} sentText="Thank you — your inquiry has been sent. We'll reply by email as soon as we can." />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SubmitButton busy={f.busy} label="Send inquiry" />
        <PrivacyNote />
      </div>
    </form>
  );
}

/* ───────────── Contact form ───────────── */

export function ContactForm({ idPrefix = "contact", dark }: { idPrefix?: string; dark?: boolean }) {
  const site = useSite();
  const tone = dark ? inputTone.dark : inputTone.light;
  const f = useFormController({
    idPrefix,
    initial: { name: "", email: "", message: "" },
    order: ["name", "email", "message"],
    validate: (v) => ({
      name: v.name.trim() ? undefined : "Please enter your full name.",
      email: emailError(v.email),
      message: v.message.trim() ? undefined : "Please enter your message.",
    }),
  });
  const onSubmit = f.submit((v) =>
    submitForm(
      "contact",
      `Website enquiry – ${v.name.trim()}`,
      [
        ["Name", v.name.trim()],
        ["Email", v.email.trim()],
        ["Message", v.message.trim()],
      ],
      site.email,
    ),
  );
  const e = f.errors;
  return (
    <form onSubmit={onSubmit} noValidate className="relative flex flex-col gap-5">
      <Honeypot />
      <RequiredNote dark={dark} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={`${idPrefix}-name`} label="Name" required error={e.name} dark={dark}>
          <input {...f.bind("name")} type="text" autoComplete="name" placeholder="Your full name" required aria-describedby={describedBy(`${idPrefix}-name`, e.name)} className={cn(inputBase, tone)} />
        </Field>
        <Field id={`${idPrefix}-email`} label="Your email" required error={e.email} dark={dark}>
          <input {...f.bind("email")} type="email" inputMode="email" autoComplete="email" placeholder="Your email address" required aria-describedby={describedBy(`${idPrefix}-email`, e.email)} className={cn(inputBase, tone)} />
        </Field>
      </div>
      <Field id={`${idPrefix}-message`} label="Message" required error={e.message} dark={dark}>
        <textarea {...f.bind("message")} rows={4} placeholder="Enter your message" required aria-describedby={describedBy(`${idPrefix}-message`, e.message)} className={cn(inputBase, tone, "min-h-32 resize-y")} />
      </Field>
      <FormStatus outcome={f.outcome} dark={dark} sentText="Thank you — your message has been sent. We'll get back to you by email." />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SubmitButton busy={f.busy} label="Send message" variant={dark ? "light" : "primary"} />
        <PrivacyNote dark={dark} />
      </div>
    </form>
  );
}

/* ───────────── Newsletter ───────────── */

export function NewsletterForm({ idPrefix = "newsletter", dark }: { idPrefix?: string; dark?: boolean }) {
  const site = useSite();
  const f = useFormController({ idPrefix, initial: { email: "" }, order: ["email"], validate: (v) => ({ email: emailError(v.email) }) });
  const onSubmit = f.submit((v) =>
    submitForm(
      "newsletter",
      "Newsletter subscription",
      [
        ["Email", v.email.trim()],
        ["Request", `Please add this email address to the ${site.name} newsletter.`],
      ],
      site.email,
    ),
  );
  return (
    <form onSubmit={onSubmit} noValidate className="relative flex flex-col gap-4">
      <Honeypot />
      <Field id={`${idPrefix}-email`} label="Email" required error={f.errors.email} dark={dark}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input {...f.bind("email")} type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" required aria-describedby={describedBy(`${idPrefix}-email`, f.errors.email)} className={cn(inputBase, dark ? inputTone.dark : inputTone.light, "sm:flex-1")} />
          <SubmitButton busy={f.busy} label="Subscribe" variant={dark ? "light" : "dark"} className="sm:w-auto" />
        </div>
      </Field>
      <FormStatus outcome={f.outcome} dark={dark} sentText="Thank you! You're subscribed to our newsletter." />
    </form>
  );
}
