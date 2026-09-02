import React from "react";
import ReactDOM from "react-dom/client";
import "@prolife/ui/tokens.css";
import "./App.css";
import { PasswordGate } from "@prolife/ui/components/PasswordGate";
import logo from "@prolife/ui/assets/logo-life.jpeg";
import App from "./App";

const ACCESS_CODE = import.meta.env.VITE_RETINAH_ACCESS_CODE ?? "changeme";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PasswordGate
      password={ACCESS_CODE}
      storageKey="retinah-unlocked"
      title="RMG Workspace"
      description="Internal only. Enter the access code to continue."
      logo={logo}
    >
      <App />
    </PasswordGate>
  </React.StrictMode>
);
