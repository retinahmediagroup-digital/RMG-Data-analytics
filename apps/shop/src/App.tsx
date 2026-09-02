import { useState } from "react";
import logo from "@prolife/ui/assets/logo-life.jpeg";
import { StockPanel } from "./StockPanel";
import { ContactPanel } from "./ContactPanel";

type Tab = "stock" | "contacts";

export default function App() {
  const [tab, setTab] = useState<Tab>("stock");

  return (
    <div className="wrap">
      <header>
        <img src={logo} alt="Prolife logo" style={{ height: 40, width: "auto", display: "block" }} />
        <div>
          <p className="eyebrow">PROLIFE · SHOPS DATA ENTRY</p>
          <h1>Weekly data entry</h1>
        </div>
      </header>
      <p className="sub">
        Submit this week's stock and sales, or register a customer. Entries go straight to Retinah for processing,
        and you'll only ever see this screen.
      </p>

      <div className="tabs">
        <button className={`tab${tab === "stock" ? " active" : ""}`} onClick={() => setTab("stock")}>
          Weekly Stock &amp; Sales
        </button>
        <button className={`tab${tab === "contacts" ? " active" : ""}`} onClick={() => setTab("contacts")}>
          Customer Contacts &amp; Consent
        </button>
      </div>

      <div className={`panel${tab === "stock" ? " active" : ""}`}>
        <StockPanel />
      </div>
      <div className={`panel${tab === "contacts" ? " active" : ""}`}>
        <ContactPanel />
      </div>

      <footer>ProDairy Shops Data Entry. Nothing leaves this browser tab until it's submitted to Retinah.</footer>
    </div>
  );
}
