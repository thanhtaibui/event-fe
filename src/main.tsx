import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import "./styles/system/ui-polish.css";
import "./styles/system/premium-foundation.css";
import "./styles/responsive/user.responsive.css";
import "./styles/responsive/admin.responsive.css";
import "./styles/responsive/auth.responsive.css";
import "./styles/shared/form.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
