import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { loadInitialContent } from "./cms/store";
import { applyTheme } from "./cms/theme";

// Load the admin draft (this browser) → published site-content.json → built-in content, then render.
loadInitialContent().then(({ content, source }) => {
  applyTheme(content.theme);
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App initial={content} source={source} />
    </StrictMode>,
  );
});
