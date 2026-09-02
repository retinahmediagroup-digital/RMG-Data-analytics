import React from "react";
import ReactDOM from "react-dom/client";
import "@prolife/ui/tokens.css";
import "./App.css";
import { PasswordGate } from "@prolife/ui/components/PasswordGate";
import App from "./App";

const ACCESS_CODE = import.meta.env.VITE_PRODAIRY_ACCESS_CODE ?? "changeme";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PasswordGate password={ACCESS_CODE} storageKey="prodairy-unlocked" title="ProDairy Dashboard">
      <App />
    </PasswordGate>
  </React.StrictMode>
);
