import { useEffect } from "react";
import { Plus } from "lucide-react";
import { AdminProvider, useAdmin } from "@/admin/context";
import { AdminLayer, SectionFrame } from "@/admin/AdminLayer";
import { CmsProvider, useCms, type ContentSource } from "@/cms/store";
import { addSection } from "@/cms/ops";
import { applyTheme } from "@/cms/theme";
import type { Page, SiteContent } from "@/cms/types";
import { AgentWidget } from "@/components/AgentWidget";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SectionView } from "@/components/sections";
import { Buttons, Container, Eyebrow } from "@/components/ui";
import { RouterProvider, useRoute, useRouteEffects } from "@/lib/router";
import { useMeta } from "@/lib/useMeta";

function ThemeApplier() {
  const { content } = useCms();
  useEffect(() => applyTheme(content.theme), [content.theme]);
  return null;
}

function EmptyPage({ page }: { page: Page }) {
  const admin = useAdmin();
  const { update } = useCms();
  return (
    <section className="admin-ui grid min-h-[60vh] place-items-center bg-zinc-50 px-5 pt-24">
      <div className="text-center">
        <p className="text-sm text-zinc-600">This page has no sections yet.</p>
        <button
          type="button"
          onClick={() => admin.pickSectionType((type) => update((d) => void addSection(d, page.id, type)))}
          className="mt-3 inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          <Plus className="size-4" /> Add the first section
        </button>
      </div>
    </section>
  );
}

function PageView({ page }: { page: Page }) {
  const admin = useAdmin();
  const firstVisible = page.sections.find((s) => !s.hidden)?.id;
  return (
    <>
      {page.sections.map((s, i) => (
        <SectionFrame key={s.id} page={page} section={s} index={i} count={page.sections.length}>
          <SectionView section={s} page={page} isFirst={s.id === firstVisible} />
        </SectionFrame>
      ))}
      {admin.isAdmin && !page.sections.length ? <EmptyPage page={page} /> : null}
    </>
  );
}

function NotFound() {
  return (
    <section className="border-b border-line bg-shell pb-14 pt-32 md:pb-20 md:pt-40">
      <Container>
        <div className="max-w-3xl">
          <Eyebrow>404</Eyebrow>
          <h1 className="mt-4 text-h1">This page drifted out to sea</h1>
          <p className="mt-5 max-w-2xl text-lead text-muted">The page you were looking for doesn't exist or has moved. Here are a few good places to start.</p>
          <Buttons
            className="mt-8"
            buttons={[
              { label: "The Experience", url: "#/", variant: "primary" },
              { label: "Accommodation", url: "#/accommodations", variant: "outline" },
              { label: "Contact & Travel", url: "#/contact-and-travel", variant: "outline" },
            ]}
          />
        </div>
      </Container>
    </section>
  );
}

function Shell() {
  const { content } = useCms();
  const route = useRoute();
  useRouteEffects();
  const page = content.pages.find((p) => p.slug === route.path) ?? (route.fromPathname ? content.pages.find((p) => p.slug === "/") : undefined);
  useMeta(
    page
      ? { title: page.seoTitle || page.title, description: page.seoDescription, suffix: content.site.fullName }
      : { title: "Page not found", description: "The page you were looking for could not be found.", suffix: content.site.fullName },
  );
  const first = page?.sections.find((s) => !s.hidden);
  const overlay = !!first && (first.type === "hero" || first.type === "banner") && content.header.transparentOnHero;
  return (
    <>
      <ThemeApplier />
      <Header overlay={overlay} />
      <main id="main" tabIndex={-1} className="outline-none">
        {page ? <PageView key={page.id} page={page} /> : <NotFound />}
      </main>
      <Footer />
      <AgentWidget />
      <AdminLayer />
    </>
  );
}

export default function App({ initial, source }: { initial: SiteContent; source: ContentSource }) {
  return (
    <CmsProvider initial={initial} source={source}>
      <RouterProvider>
        <AdminProvider>
          <Shell />
        </AdminProvider>
      </RouterProvider>
    </CmsProvider>
  );
}
