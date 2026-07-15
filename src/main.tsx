import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign Vite HMR websocket connection errors in development sandbox
if (typeof window !== "undefined") {
  const isWsError = (str: string) => {
    if (!str) return false;
    const s = str.toLowerCase();
    return (
      s.includes("websocket") ||
      s.includes("web socket") ||
      s.includes("hmr") ||
      s.includes("closed without opened")
    );
  };

  // Intercept console.error to prevent platform logging overlays for benign WebSocket failures
  const originalConsoleError = console.error;
  console.error = function(...args: any[]) {
    const msg = args.map((arg) => {
      try {
        if (!arg) return "";
        return arg.message || arg.stack || String(arg);
      } catch (e) {
        return "";
      }
    }).join(" ");
    if (isWsError(msg)) {
      return;
    }
    originalConsoleError.apply(console, args);
  };

  // Intercept console.warn to prevent platform logging overlays for benign WebSocket warnings
  const originalConsoleWarn = console.warn;
  console.warn = function(...args: any[]) {
    const msg = args.map((arg) => {
      try {
        if (!arg) return "";
        return arg.message || String(arg);
      } catch (e) {
        return "";
      }
    }).join(" ");
    if (isWsError(msg)) {
      return;
    }
    originalConsoleWarn.apply(console, args);
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

