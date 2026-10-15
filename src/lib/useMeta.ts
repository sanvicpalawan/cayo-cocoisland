import { useEffect } from "react";

function setMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Per-page title, description and social tags (edited in Admin → Pages → Page settings & SEO). */
export function useMeta({ title, description, suffix }: { title: string; description: string; suffix: string }) {
  useEffect(() => {
    const brand = suffix.split(" ").slice(0, 2).join(" ");
    const full = title.includes(brand) ? title : `${title} | ${suffix}`;
    document.title = full;
    if (description) {
      setMeta('meta[name="description"]', "name", "description", description);
      setMeta('meta[property="og:description"]', "property", "og:description", description);
    }
    setMeta('meta[property="og:title"]', "property", "og:title", full);
  }, [title, description, suffix]);
}
