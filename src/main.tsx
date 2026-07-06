import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign Vite HMR websocket connection errors in development sandbox
if (typeof window !== "undefined") {
  const isWsError = (str: string) => {
    if (!str) return false;
    return (
      str.toLowerCase().includes("websocket") ||
      str.toLowerCase().includes("web socket") ||
      str.toLowerCase().includes("hmr")
    );
  };

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason?.message || String(event.reason || "");
    if (isWsError(reason)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener("error", (event) => {
    const msg = event.message || "";
    if (isWsError(msg)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

