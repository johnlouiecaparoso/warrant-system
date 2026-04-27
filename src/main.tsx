
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { SystemProvider } from "./app/context/SystemContext.tsx";
import "./styles/index.css";

async function clearStaleServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;

  const cleanupKey = "warrant-system-sw-cleanup-checked";
  if (sessionStorage.getItem(cleanupKey)) return;
  sessionStorage.setItem(cleanupKey, "1");

  // This project does not use a service worker. Clear stale ones that may
  // have been left by other localhost apps and can break Vite module loading.
  const registrations = await navigator.serviceWorker.getRegistrations();
  if (registrations.length === 0) return;

  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ("caches" in window) {
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map((key) => caches.delete(key)));
  }

  const reloadKey = "warrant-system-sw-reset";
  if (!sessionStorage.getItem(reloadKey)) {
    sessionStorage.setItem(reloadKey, "1");
    window.location.reload();
  }
}

if (window.location.hostname === "localhost") {
  void clearStaleServiceWorkers();
}

createRoot(document.getElementById("root")!).render(
  <SystemProvider>
    <App />
  </SystemProvider>,
);
  
