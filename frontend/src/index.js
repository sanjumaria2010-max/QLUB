import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Guard against unhandled promise rejections (e.g. blocked Clipboard API in iframe preview)
// so they don't trigger the CRA dev error-overlay and block subsequent clicks.
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (e) => {
    const msg = (e.reason && e.reason.message) || String(e.reason || "");
    // Silence known benign ones; still log for diagnostics.
    if (/clipboard|permission denied|NotAllowedError/i.test(msg)) {
      e.preventDefault();
      // eslint-disable-next-line no-console
      console.warn("[qlub] suppressed unhandled rejection:", msg);
    }
  });
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
