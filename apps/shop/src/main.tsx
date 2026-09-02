import React from "react";
import ReactDOM from "react-dom/client";
import "@prolife/ui/tokens.css";
import "./App.css";
import { PasswordGate } from "@prolife/ui/components/PasswordGate";
import App from "./App";

const ACCESS_CODE = import.meta.env.VITE_SHOP_ACCESS_CODE ?? "changeme";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PasswordGate
      password={ACCESS_CODE}
      storageKey="shop-unlocked"
      title="Prolife Shop App"
      description="Enter the code your Retinah contact gave you to continue."
    >
      <App />
    </PasswordGate>
  </React.StrictMode>
);
