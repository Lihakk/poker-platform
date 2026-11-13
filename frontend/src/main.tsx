import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/newsreader/wght.css";
import "@fontsource-variable/newsreader/wght-italic.css";
import "./design-system.css";
import "./poker-table.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
