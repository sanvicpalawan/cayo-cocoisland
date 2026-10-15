import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCheck, RotateCcw, SendHorizontal, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { useCms } from "@/cms/store";
import { Icon } from "@/cms/icons";
import { whatsappLink } from "@/cms/links";
import { useImageSrc } from "@/cms/idb";
import { cdn, isCdnPath } from "@/lib/media";
import { useRoute } from "@/lib/router";
import { useAgentChat, type AgentChat } from "@/agent/useAgentChat";

const time = (at: number) => new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** WhatsApp-like rendering: *bold*, **bold**, links and line breaks. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s)]+|\*\*[^*]+\*\*|\*[^*\n]+\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => {
        if (/^https?:\/\//.test(p))
          return (
            <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="break-all text-[#027eb5] underline">
              {p}
            </a>
          );
        if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={i}>{p.slice(2, -2)}</strong>;
        if (/^\*[^*]+\*$/.test(p)) return <strong key={i}>{p.slice(1, -1)}</strong>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

function Bubble({ mine, children, at }: { mine?: boolean; children: ReactNode; at?: number }) {
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div className={cn("relative max-w-[85%] whitespace-pre-wrap rounded-lg px-3 pb-1.5 pt-2 text-[0.9375rem] leading-snug text-[#111b21] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]", mine ? "rounded-tr-none bg-[#d9fdd3]" : "rounded-tl-none bg-white")}>
        {children}
        {at ? (
          <span className="ml-3 inline-flex translate-y-1 items-center gap-1 float-right text-[0.6875rem] text-[#667781]">
            {time(at)}
            {mine ? <CheckCheck className="size-3.5 text-[#53bdeb]" aria-label="Read" /> : null}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function ChatWindow({ chat, onClose, embedded }: { chat: AgentChat; onClose?: () => void; embedded?: boolean }) {
  const { content } = useCms();
  const { agent, site, header } = content;
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logo = useImageSrc(header.logo?.src);
  const avatar = header.logo && isCdnPath(header.logo.src) ? cdn(header.logo.src, 96) : logo;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.messages.length, chat.streaming, chat.error]);
  useEffect(() => {
    if (!embedded) inputRef.current?.focus();
  }, [embedded]);

  const lastQuestion = [...chat.messages].reverse().find((m) => m.role === "user")?.content;
  const handoff = whatsappLink(site, `Hi ${site.name}! I was chatting with ${agent.name} on your website.${lastQuestion ? ` My question: ${lastQuestion}` : ""}`);
  const submit = () => {
    if (!input.trim()) return;
    chat.send(input);
    setInput("");
  };

  return (
    <div className={cn("admin-ui flex flex-col overflow-hidden bg-white", embedded ? "h-[560px] rounded-xl border border-zinc-200" : "h-full")} role="dialog" aria-label={`Chat with ${agent.name}`}>
      <div className="flex items-center gap-3 bg-[#075e54] px-3 py-2.5 text-white">
        {avatar ? <img src={avatar} alt="" className="size-10 rounded-full bg-white object-cover" /> : <span className="grid size-10 place-items-center rounded-full bg-white/20 font-semibold">{agent.name.slice(0, 1)}</span>}
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[15px] font-semibold">{agent.name}</p>
          <p className="truncate text-xs text-white/80">{chat.busy ? "typing…" : agent.subtitle}</p>
        </div>
        {chat.messages.length ? (
          <button type="button" onClick={chat.reset} className="grid size-9 place-items-center rounded-full hover:bg-white/10" aria-label="Start a new conversation" title="New conversation">
            <RotateCcw className="size-[18px]" />
          </button>
        ) : null}
        {onClose ? (
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-white/10" aria-label="Close chat">
            <X className="size-5" />
          </button>
        ) : null}
      </div>

      <div ref={listRef} className="wa-bg min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-4" aria-live="polite">
        <p className="mx-auto w-fit rounded-md bg-[#fff5c4] px-3 py-1.5 text-center text-[11.5px] leading-snug text-[#54656f] shadow-sm">
          AI assistant — answers come from our website. Bookings are confirmed by our team.
        </p>
        <Bubble>{agent.greeting}</Bubble>
        {chat.messages.length === 0 && agent.quickReplies.length ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {agent.quickReplies.filter(Boolean).map((q) => (
              <button key={q} type="button" onClick={() => chat.send(q)} className="rounded-full border border-[#00a884]/40 bg-white px-3 py-1.5 text-[13px] text-[#008069] shadow-sm transition-colors hover:bg-[#e7f8f3]">
                {q}
              </button>
            ))}
          </div>
        ) : null}
        {chat.messages.map((m, i) => (
          <Bubble key={i} mine={m.role === "user"} at={m.at}>
            {m.role === "assistant" ? <RichText text={m.content} /> : m.content}
          </Bubble>
        ))}
        {chat.busy ? (
          <Bubble>
            {chat.streaming ? (
              <RichText text={chat.streaming} />
            ) : (
              <span className="flex gap-1 py-1" aria-label="Typing">
                <span className="typing-dot size-2 rounded-full bg-[#8696a0]" />
                <span className="typing-dot size-2 rounded-full bg-[#8696a0] [animation-delay:.15s]" />
                <span className="typing-dot size-2 rounded-full bg-[#8696a0] [animation-delay:.3s]" />
              </span>
            )}
          </Bubble>
        ) : null}
        {chat.error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
            Sorry, I couldn't answer just now.{" "}
            <a href={handoff} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
              Message our team on WhatsApp
            </a>
            .<span className="mt-1 block text-[11px] text-red-700/80">{chat.error}</span>
          </div>
        ) : null}
      </div>

      {agent.handoff ? (
        <a href={handoff} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 border-t border-zinc-200 bg-[#f0f2f5] py-2 text-[13px] font-medium text-[#008069] hover:bg-[#e9edef]">
          <Icon name="brand:whatsapp" className="size-4" /> {agent.handoffLabel || "Continue on WhatsApp"}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-end gap-2 bg-[#f0f2f5] px-2.5 py-2"
      >
        <label htmlFor={embedded ? "agent-test-input" : "agent-input"} className="sr-only">
          Message
        </label>
        <textarea
          id={embedded ? "agent-test-input" : "agent-input"}
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Type a message"
          className="max-h-28 min-h-10 flex-1 resize-none rounded-3xl border-0 bg-white px-4 py-2.5 text-[15px] text-[#111b21] outline-none placeholder:text-[#8696a0] focus:ring-2 focus:ring-[#00a884]/40"
        />
        <button type="submit" disabled={!input.trim() || chat.busy} className="grid size-10 shrink-0 place-items-center rounded-full bg-[#00a884] text-white transition-opacity disabled:opacity-50" aria-label="Send message">
          <SendHorizontal className="size-5" />
        </button>
      </form>
    </div>
  );
}

/**
 * Guest-facing launcher. With the AI agent configured it opens the WhatsApp-style concierge;
 * otherwise it links straight to WhatsApp, exactly as before. It steps aside over forms.
 */
export function AgentWidget() {
  const { content } = useCms();
  const { site, agent } = content;
  const { path } = useRoute();
  const chat = useAgentChat({ persistKey: "cc-guest-chat" });
  const aiReady = agent.enabled && chat.mode !== "none";
  const [open, setOpen] = useState(false);
  const [overForm, setOverForm] = useState(false);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const visible = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
        setOverForm(visible.size > 0);
      },
      { threshold: 0, rootMargin: "0px 0px -18% 0px" },
    );
    const t = window.setTimeout(() => document.querySelectorAll("[data-fab-hide]").forEach((el) => io.observe(el)), 50);
    return () => {
      window.clearTimeout(t);
      io.disconnect();
    };
  }, [path, content.pages]);

  useEffect(() => {
    const isField = (t: EventTarget | null) => t instanceof HTMLElement && t.matches("input, textarea, select") && !t.closest("[data-agent]");
    const onIn = (e: FocusEvent) => isField(e.target) && setTyping(true);
    const onOut = () => setTyping(false);
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const hide = !open && (overForm || typing);
  const pos = { right: "calc(var(--admin-w, 0px) + 1rem)", bottom: "calc(1rem + env(safe-area-inset-bottom))" };
  const fabCls = cn(
    "fixed z-40 flex h-12 items-center gap-2 rounded-full bg-forest px-3 text-ivory shadow-[0_12px_28px_-10px_rgba(42,32,25,0.6)] transition-all duration-300 hover:bg-forest-deep sm:h-[52px] sm:px-4 sm:pr-5",
    hide ? "pointer-events-none translate-y-3 opacity-0" : "opacity-100",
  );

  if (!aiReady) {
    return (
      <a href={whatsappLink(site, site.whatsappMessage)} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp (opens in a new tab)" aria-hidden={hide || undefined} tabIndex={hide ? -1 : undefined} style={pos} className={fabCls}>
        <Icon name="brand:whatsapp" className="size-6" />
        <span className="hidden text-sm font-semibold sm:inline">WhatsApp</span>
      </a>
    );
  }

  return (
    <div data-agent>
      {open ? (
        <div className="fixed inset-0 z-[55] sm:inset-auto sm:bottom-[calc(1rem+env(safe-area-inset-bottom))] sm:h-[min(640px,calc(100dvh-6rem))] sm:w-[380px] sm:overflow-hidden sm:rounded-2xl sm:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]" style={{ right: "var(--admin-w, 0px)", marginRight: "max(0px, min(1rem, 100vw - 380px))" }}>
          <ChatWindow chat={chat} onClose={() => setOpen(false)} />
        </div>
      ) : null}
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} aria-hidden={hide || undefined} tabIndex={hide ? -1 : undefined} style={pos} className={fabCls} aria-label={`${agent.launcherLabel || "Chat with us"} — opens our concierge chat`}>
          <Icon name="brand:whatsapp" className="size-6" />
          <span className="hidden text-sm font-semibold sm:inline">{agent.launcherLabel || "Chat with us"}</span>
        </button>
      ) : null}
    </div>
  );
}
