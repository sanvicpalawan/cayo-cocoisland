import { useEffect, useRef, useState } from "react";
import { Download, FileUp, KeyRound, Lock, RotateCcw, Trash2 } from "lucide-react";
import { useAdmin } from "@/admin/context";
import { exportContent, importContent } from "@/admin/publish";
import { isDefaultPasskey, setPasskey, verifyPasskey } from "@/admin/passkey";
import { PUBLISHED_FILE, useCms } from "@/cms/store";
import { defaultContent } from "@/cms/defaults";
import { downloadBlob, formatBytes, useMediaList } from "@/cms/idb";
import { FOOTER_FIELDS, HEADER_FIELDS, SITE_FIELDS, SOCIAL_FIELD } from "@/cms/schema";
import type { FooterSettings, HeaderSettings, SiteSettings, SocialLink } from "@/cms/types";
import { MediaManager } from "../MediaLibrary";
import { Card, FieldsEditor, Label, btnCls, dangerBtn, inputCls, primaryBtn } from "../fields";

export function HeaderTab() {
  const { content, update } = useCms();
  return (
    <div className="p-4">
      <FieldsEditor fields={HEADER_FIELDS} value={content.header} onChange={(v: HeaderSettings) => update((d) => void (d.header = v))} />
    </div>
  );
}

export function FooterTab() {
  const { content, update } = useCms();
  return (
    <div className="space-y-3 p-4">
      <p className="rounded-md bg-zinc-50 p-3 text-xs text-zinc-600">Email, WhatsApp, address and social icons come from the Contact & social tab.</p>
      <FieldsEditor fields={FOOTER_FIELDS} value={content.footer} onChange={(v: FooterSettings) => update((d) => void (d.footer = v))} />
    </div>
  );
}

export function ContactTab() {
  const { content, update } = useCms();
  return (
    <div className="space-y-5 p-4">
      <FieldsEditor fields={SITE_FIELDS} value={content.site} onChange={(v: SiteSettings) => update((d) => void (d.site = v))} />
      <div className="border-t border-zinc-200 pt-4">
        <FieldsEditor fields={[SOCIAL_FIELD]} value={{ social: content.social }} onChange={(v: { social: SocialLink[] }) => update((d) => void (d.social = v.social))} />
        <p className="mt-2 text-[11px] text-zinc-500">Shown in the footer and on the Contact page. Use {"{whatsapp}"} as the link for your WhatsApp chat.</p>
      </div>
    </div>
  );
}

export function MediaTab() {
  return (
    <div className="p-4">
      <MediaManager />
    </div>
  );
}

const SOURCE_LABEL = {
  draft: "You are viewing your local draft (saved in this browser only).",
  published: `Visitors see the published ${PUBLISHED_FILE}. You have no unpublished changes.`,
  default: "Visitors see the built-in content. Nothing has been published yet.",
};

export function SettingsTab() {
  const { content, source, replace, discardDraft } = useCms();
  const admin = useAdmin();
  const uploads = useMediaList();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [storage, setStorage] = useState("");
  const [pass, setPass] = useState({ current: "", next: "", confirm: "" });
  const [passMsg, setPassMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    navigator.storage?.estimate?.().then((e) => e.usage !== undefined && setStorage(`${formatBytes(e.usage)} used of ${formatBytes(e.quota ?? 0)} available`));
  }, [uploads.length]);

  const doExport = async () => {
    setBusy("export");
    try {
      downloadBlob(await exportContent(content), PUBLISHED_FILE);
      setMsg(`Downloaded ${PUBLISHED_FILE}. Upload it next to index.html on your web host to publish.`);
    } finally {
      setBusy("");
    }
  };
  const doImport = async (file?: File) => {
    if (!file) return;
    setBusy("import");
    try {
      replace(await importContent(await file.text()));
      setMsg("Imported. Review the site, then download & upload the file again to publish.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  };
  const changePass = () => {
    if (!verifyPasskey(pass.current)) return setPassMsg({ ok: false, text: "The current passkey is incorrect." });
    if (!/^\S{4,32}$/.test(pass.next)) return setPassMsg({ ok: false, text: "Use 4–32 characters without spaces." });
    if (pass.next !== pass.confirm) return setPassMsg({ ok: false, text: "The new passkeys don't match." });
    setPasskey(pass.next);
    setPass({ current: "", next: "", confirm: "" });
    setPassMsg({ ok: true, text: "Passkey changed for this browser." });
  };

  return (
    <div className="space-y-4 p-4">
      <Card title="Publish" help={SOURCE_LABEL[source]}>
        <ol className="mb-3 list-decimal space-y-1 pl-5 text-[13px] text-zinc-700">
          <li>Edit anything — changes save automatically in this browser.</li>
          <li>
            Download <code className="rounded bg-zinc-100 px-1">{PUBLISHED_FILE}</code> (uploaded photos are included).
          </li>
          <li>Upload it to your web host, in the same folder as index.html. Every visitor then sees it.</li>
        </ol>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={primaryBtn} onClick={doExport} disabled={!!busy}>
            <Download className="size-4" /> {busy === "export" ? "Preparing…" : `Download ${PUBLISHED_FILE}`}
          </button>
          <button type="button" className={btnCls} onClick={() => fileRef.current?.click()} disabled={!!busy}>
            <FileUp className="size-3.5" /> Import
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => doImport(e.target.files?.[0])} />
        </div>
        {msg ? (
          <p role="status" className="mt-3 rounded-md bg-emerald-50 p-2 text-xs text-emerald-900">
            {msg}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-3">
          {source === "draft" ? (
            <button type="button" className={btnCls} onClick={() => confirm("Discard all unpublished changes in this browser?") && discardDraft()}>
              <RotateCcw className="size-3.5" /> Discard local changes
            </button>
          ) : null}
          <button type="button" className={dangerBtn} onClick={() => confirm("Replace everything with the original website content? (You can undo.)") && replace(defaultContent())}>
            <Trash2 className="size-3.5" /> Reset all content
          </button>
        </div>
      </Card>

      <Card title="Admin passkey" help={isDefaultPasskey() ? "You're using the default passkey. Change it for this browser below." : "A custom passkey is set for this browser."}>
        <div className="space-y-2">
          {(["current", "next", "confirm"] as const).map((k) => (
            <div key={k}>
              <Label htmlFor={`pk-${k}`}>{k === "current" ? "Current passkey" : k === "next" ? "New passkey" : "Repeat new passkey"}</Label>
              <input id={`pk-${k}`} type="password" autoComplete="off" className={inputCls} value={pass[k]} onChange={(e) => setPass({ ...pass, [k]: e.target.value })} />
            </div>
          ))}
          <button type="button" className={btnCls} onClick={changePass}>
            <KeyRound className="size-3.5" /> Change passkey
          </button>
          {passMsg ? <p className={passMsg.ok ? "text-xs text-emerald-700" : "text-xs text-red-600"}>{passMsg.text}</p> : null}
        </div>
      </Card>

      <Card title="Storage" help="Drafts and uploaded photos are stored in this browser (IndexedDB).">
        <p className="text-[13px] text-zinc-700">
          {uploads.length} uploaded images{storage ? ` · ${storage}` : ""}
        </p>
      </Card>

      <button type="button" className={btnCls} onClick={admin.lock}>
        <Lock className="size-3.5" /> Lock admin
      </button>
    </div>
  );
}
