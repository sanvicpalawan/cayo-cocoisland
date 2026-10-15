import type { MouseEvent, ReactNode } from "react";
import { resolveUrl } from "@/cms/links";
import { useSite } from "@/cms/store";
import { scrollToSection, useRoute } from "@/lib/router";

export function useResolvedUrl(url?: string) {
  const site = useSite();
  const { path } = useRoute();
  return resolveUrl(url, site, path);
}

/** Renders any content URL (#/page, {booking}, {whatsapp:…}, https://…) as the right kind of link. */
export function SmartLink({
  url,
  className,
  children,
  newTab,
  ariaLabel,
  ariaCurrent,
  onClick,
}: {
  url?: string;
  className?: string;
  children: ReactNode;
  newTab?: boolean;
  ariaLabel?: string;
  ariaCurrent?: "page";
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const r = useResolvedUrl(url);
  const tab = newTab ?? r.external;
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || !r.internal || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const current = window.location.hash || "#/";
    if (current === r.href) {
      e.preventDefault();
      const s = new URLSearchParams(r.href.split("?")[1] ?? "").get("s");
      if (s) scrollToSection(s);
      else window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  return (
    <a
      href={r.href}
      className={className}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      onClick={handle}
      {...(tab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
      {tab && !ariaLabel ? <span className="sr-only"> (opens in a new tab)</span> : null}
    </a>
  );
}
