import { PanelBottom } from "lucide-react";
import { useAdmin } from "@/admin/context";
import { useCms } from "@/cms/store";
import { Icon } from "@/cms/icons";
import { whatsappLink } from "@/cms/links";
import { ContactForm, NewsletterForm } from "./Forms";
import { SmartLink } from "./SmartLink";
import { Container, Logo, PassportStamp, WaveDivider, usePalawanClock } from "./ui";

const socialCls = "grid size-11 place-items-center rounded-full border border-ivory/25 text-ivory transition-colors hover:border-forest hover:bg-forest hover:text-[var(--btn-primary-fg)]";

export function Footer() {
  const { content } = useCms();
  const { footer, site, social } = content;
  const admin = useAdmin();
  const columns = footer.columns.filter((c) => c.title || c.links.length);
  const copyright = footer.copyright.split("{year}").join(String(new Date().getFullYear()));
  const clock = usePalawanClock();
  return (
    <footer data-fab-hide className="on-dark relative bg-espresso-deep text-ivory" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Contact {site.name} and site information
      </h2>
      {admin.isAdmin ? (
        <button type="button" onClick={() => admin.openTab("footer")} className="admin-ui absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-md bg-white/95 px-2.5 py-1.5 text-xs font-medium text-zinc-900 shadow-lg hover:bg-white">
          <PanelBottom className="size-3.5" /> Edit footer
        </button>
      ) : null}
      <WaveDivider className="text-ivory/25" />
      <Container className="pt-14 md:pt-16">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-ivory/10 pb-6">
          <PassportStamp label="BARANGONAN · LINAPACAN" sub="11°29′N · 119°52′E" />
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-ivory/60">Palawan · <span className="tnum text-sand">{clock.time}</span> · {clock.phase}</p>
        </div>
        <div className="grid gap-12 border-b border-ivory/10 pb-14 lg:grid-cols-12 lg:gap-10">
          <div className={footer.contactForm.show ? "lg:col-span-4" : "lg:col-span-12"}>
            <Logo light />
            {footer.about ? <p className="mt-6 max-w-sm whitespace-pre-line text-ivory/75">{footer.about}</p> : null}
            {footer.showContactDetails ? (
              <dl className="mt-8 grid gap-5 text-[0.9375rem]">
                {site.email ? (
                  <div>
                    <dt className="text-eyebrow font-semibold uppercase text-sand">Enquiries</dt>
                    <dd className="mt-1.5">
                      <a href={`mailto:${site.email}`} className="border-b border-ivory/30 pb-0.5 transition-colors hover:border-forest hover:text-sand">
                        {site.email}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {site.whatsappNumber ? (
                  <div>
                    <dt className="text-eyebrow font-semibold uppercase text-sand">WhatsApp</dt>
                    <dd className="mt-1.5">
                      <a href={whatsappLink(site)} className="border-b border-ivory/30 pb-0.5 transition-colors hover:border-forest hover:text-sand">
                        {site.whatsappDisplay || site.whatsappNumber}
                      </a>
                      <span className="mt-1 block text-sm text-ivory/60">There is no phone signal on the island — WhatsApp is the best way to reach us.</span>
                    </dd>
                  </div>
                ) : null}
                {site.address ? (
                  <div>
                    <dt className="text-eyebrow font-semibold uppercase text-sand">Address</dt>
                    <dd className="mt-1.5 whitespace-pre-line text-ivory/85">{site.address}</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
            {footer.showSocial && social.length ? (
              <ul className="mt-8 flex flex-wrap gap-3" aria-label="Social media">
                {social.map((so, i) => (
                  <li key={i}>
                    <SmartLink url={so.url} ariaLabel={`${so.label} (opens in a new tab)`} className={socialCls}>
                      <Icon name={so.icon} className="size-5" />
                    </SmartLink>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {footer.contactForm.show ? (
            <div className="lg:col-span-7 lg:col-start-6">
              {footer.contactForm.title ? <h3 className="font-serif text-h3">{footer.contactForm.title}</h3> : null}
              {footer.contactForm.text ? <p className="mt-3 max-w-xl text-ivory/75">{footer.contactForm.text}</p> : null}
              <div className="mt-8">
                <ContactForm dark idPrefix="footer-contact" />
              </div>
            </div>
          ) : null}
        </div>
        <div className="grid gap-12 py-14 lg:grid-cols-12 lg:gap-10">
          {footer.newsletter.show ? (
            <div className="lg:col-span-4">
              {footer.newsletter.title ? <h3 className="font-serif text-h3">{footer.newsletter.title}</h3> : null}
              {footer.newsletter.text ? <p className="mt-3 text-ivory/75">{footer.newsletter.text}</p> : null}
              <div className="mt-6">
                <NewsletterForm dark idPrefix="footer-newsletter" />
              </div>
            </div>
          ) : null}
          {columns.length ? (
            <nav aria-label="Footer" className={footer.newsletter.show ? "grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7 lg:col-start-6" : "grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-12 lg:grid-cols-4"}>
              {columns.map((col, i) => (
                <div key={i}>
                  {col.title ? <h3 className="text-eyebrow font-semibold uppercase text-sand">{col.title}</h3> : null}
                  <ul className="mt-4 grid gap-1">
                    {col.links
                      .filter((l) => l.label)
                      .map((l, j) => (
                        <li key={j}>
                          <SmartLink url={l.url} className="inline-flex min-h-10 items-center text-ivory/85 underline-offset-4 hover:text-ivory hover:underline">
                            {l.label}
                          </SmartLink>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </nav>
          ) : null}
        </div>
      </Container>
      <div aria-hidden className="overflow-hidden px-2 pt-4"><p className="whitespace-nowrap text-center font-serif leading-[0.8] tracking-[-0.03em] text-ivory/[0.13]" style={{fontSize:"clamp(4rem,14.5vw,13rem)"}}>CAYO COCO</p></div>
      <div className="border-t border-ivory/10">
        <Container className="flex flex-col gap-3 py-6 pb-24 text-sm text-ivory/60 sm:pb-6 md:flex-row md:items-center md:justify-between">
          <p>{copyright}</p>
          {footer.bottomLink.label ? (
            <SmartLink url={footer.bottomLink.url} className="font-semibold text-ivory underline-offset-4 hover:underline">
              {footer.bottomLink.label}
            </SmartLink>
          ) : null}
        </Container>
      </div>
    </footer>
  );
}
