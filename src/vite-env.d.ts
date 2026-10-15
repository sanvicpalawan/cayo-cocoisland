/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FORM_ENDPOINT?: string;
  readonly VITE_INQUIRY_ENDPOINT?: string;
  readonly VITE_CONTACT_ENDPOINT?: string;
  readonly VITE_NEWSLETTER_ENDPOINT?: string;
  readonly VITE_INSTAGRAM_FEED_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
