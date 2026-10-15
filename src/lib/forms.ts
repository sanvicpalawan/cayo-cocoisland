/**
 * Form delivery.
 *
 * The previous site used the Hostinger/Zyro form backend, which cannot be called from outside
 * that platform. Configure a form endpoint at build time to deliver submissions directly
 * (e.g. Formspree, a Web3Forms public form URL, or your own API):
 *
 *   VITE_INQUIRY_ENDPOINT=…    booking inquiries   (falls back to VITE_FORM_ENDPOINT)
 *   VITE_CONTACT_ENDPOINT=…    contact form        (falls back to VITE_FORM_ENDPOINT)
 *   VITE_NEWSLETTER_ENDPOINT=… newsletter sign-ups
 *
 * Without an endpoint we never fake success: the visitor's email app is opened with the message
 * pre-filled to the enquiries address (Admin → Contact) and the UI says so honestly.
 * Never place secret API keys in VITE_* variables — they are public in the bundle.
 */
export type FormKind = "inquiry" | "contact" | "newsletter";

export type SubmitOutcome = { type: "sent" } | { type: "handoff"; mailto: string } | { type: "error"; message: string; mailto: string };

const env = import.meta.env;
const ENDPOINTS: Record<FormKind, string | undefined> = {
  inquiry: env.VITE_INQUIRY_ENDPOINT || env.VITE_FORM_ENDPOINT,
  contact: env.VITE_CONTACT_ENDPOINT || env.VITE_FORM_ENDPOINT,
  newsletter: env.VITE_NEWSLETTER_ENDPOINT,
};

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type FieldList = [label: string, value: string][];

export function mailtoHref(email: string, subject: string, fields: FieldList) {
  const body = fields
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n\n");
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function submitForm(kind: FormKind, subject: string, fields: FieldList, email: string): Promise<SubmitOutcome> {
  const mailto = mailtoHref(email, subject, fields);
  const endpoint = ENDPOINTS[kind];
  if (!endpoint) {
    window.location.href = mailto;
    return { type: "handoff", mailto };
  }
  try {
    const payload: Record<string, string> = {};
    fields.forEach(([k, v]) => (payload[k] = v));
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...payload, _subject: subject, form: kind, page: window.location.href }),
    });
    if (!res.ok) return { type: "error", message: `Our message service responded with an error (${res.status}).`, mailto };
    return { type: "sent" };
  } catch {
    return { type: "error", message: "We couldn't reach our message service — please check your connection.", mailto };
  }
}
