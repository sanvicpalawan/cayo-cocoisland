import { Fragment, type ReactNode } from "react";
import { SmartLink } from "@/components/SmartLink";

/** Minimal, safe markdown: **bold**, *italic*, [text](url), paragraphs and "- " lists. No HTML is ever injected. */
const INLINE = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|\[[^\]]+\]\([^)]+\))/g;

function inline(text: string, linkClass: string): ReactNode[] {
  return text
    .split(INLINE)
    .filter(Boolean)
    .map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
      const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (m) return <SmartLink key={i} url={m[2].trim()} className={linkClass}>{m[1]}</SmartLink>;
      return <Fragment key={i}>{part}</Fragment>;
    });
}

export function Md({ text, className, linkClass = "font-semibold underline underline-offset-4 hover:no-underline" }: { text?: string; className?: string; linkClass?: string }) {
  if (!text || !text.trim()) return null;
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className={className}>
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter((l) => l.trim());
        if (lines.length && lines.every((l) => /^\s*[-•]\s+/.test(l))) {
          return (
            <ul key={i} className="list-disc space-y-2 pl-5 marker:text-stone">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*[-•]\s+/, ""), linkClass)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 ? <br /> : null}
                {inline(l, linkClass)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
